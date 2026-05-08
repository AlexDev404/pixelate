import { db } from '../db/index.js';
import {
  projects,
  projectSettings,
  projectAccess,
  starterProjects,
  suspendedProjects,
  remix,
} from '../db/schema.js';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { AccessLevel } from '@pixelate/types';
import { slugify, projectDir } from '../lib/helpers.js';
import { gitService } from './git.service.js';
import { env } from '../lib/env.js';
import fs from 'fs/promises';
import path from 'path';

export class ProjectService {
  async findById(id: number) {
    return db.query.projects.findFirst({ where: eq(projects.id, id) }) ?? null;
  }

  async findBySlug(slug: string) {
    return db.query.projects.findFirst({ where: eq(projects.slug, slug) }) ?? null;
  }

  async createProject(
    name: string,
    ownerId: number,
    description?: string
  ): Promise<typeof projects.$inferSelect> {
    const slug = slugify(name);
    const dir = projectDir(slug);

    const [project] = await db
      .insert(projects)
      .values({ name, slug, description: description ?? null })
      .returning();

    // Grant owner access
    await db.insert(projectAccess).values({
      project_id: project.id,
      user_id: ownerId,
      access_level: AccessLevel.OWNER,
    });

    // Create default settings
    await db.insert(projectSettings).values({ project_id: project.id });

    // Create project directory and init git
    await fs.mkdir(dir, { recursive: true });
    await gitService.init(slug);

    return project;
  }

  async deleteProject(id: number) {
    const project = await this.findById(id);
    if (!project) return;

    // Remove project directory
    const dir = projectDir(project.slug);
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      // directory may not exist
    }

    await db.delete(projects).where(eq(projects.id, id));
  }

  async updateProject(id: number, updates: Partial<{ name: string; description: string }>) {
    await db
      .update(projects)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(projects.id, id));
  }

  async getSettings(projectId: number) {
    return db.query.projectSettings.findFirst({
      where: eq(projectSettings.project_id, projectId),
    });
  }

  async updateSettings(
    projectId: number,
    settings: Partial<{
      default_file: string | null;
      default_collapse: string | null;
      run_script: string | null;
      env_vars: string | null;
    }>
  ) {
    const existing = await this.getSettings(projectId);
    if (existing) {
      await db
        .update(projectSettings)
        .set(settings)
        .where(eq(projectSettings.project_id, projectId));
    } else {
      await db
        .insert(projectSettings)
        .values({ project_id: projectId, ...settings });
    }
  }

  async getAccessLevel(projectId: number, userId: number): Promise<number | null> {
    const access = await db.query.projectAccess.findFirst({
      where: and(
        eq(projectAccess.project_id, projectId),
        eq(projectAccess.user_id, userId)
      ),
    });
    return access?.access_level ?? null;
  }

  async listProjects() {
    return db.query.projects.findMany({
      orderBy: [desc(projects.updated_at)],
      with: { access: true },
    });
  }

  async listStarterProjects() {
    // First try the database
    const starters = await db.query.starterProjects.findMany();
    if (starters.length > 0) {
      const result = [];
      for (const s of starters) {
        const p = await this.findById(s.project_id);
        if (p) result.push(p);
      }
      return result;
    }

    // Fall back to scanning the filesystem content/__starter_projects/
    const startersDir = path.join(env.CONTENT_DIR, '__starter_projects');
    try {
      const entries = await fs.readdir(startersDir, { withFileTypes: true });
      const results = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const settingsPath = path.join(startersDir, entry.name, '.container', 'settings.json');
        try {
          const raw = await fs.readFile(settingsPath, 'utf-8');
          const settings = JSON.parse(raw);
          results.push({
            id: 0,
            name: settings.name || entry.name,
            slug: entry.name,
            description: settings.description || null,
            created_at: new Date(),
            updated_at: new Date(),
            _settings: settings,
            _isFilesystemStarter: true,
          });
        } catch {
          // No settings.json, skip
        }
      }
      return results;
    } catch {
      return [];
    }
  }

  async remixProject(
    originalId: number,
    newName: string,
    userId: number
  ): Promise<typeof projects.$inferSelect> {
    const original = await this.findById(originalId);
    if (!original) throw new Error('Original project not found');

    const newSlug = slugify(newName);
    const srcDir = projectDir(original.slug);
    const destDir = projectDir(newSlug);

    // Create new project in DB
    const [newProject] = await db
      .insert(projects)
      .values({ name: newName, slug: newSlug })
      .returning();

    await db.insert(projectAccess).values({
      project_id: newProject.id,
      user_id: userId,
      access_level: AccessLevel.OWNER,
    });

    await db.insert(projectSettings).values({ project_id: newProject.id });

    // Record remix
    await db.insert(remix).values({
      original_id: originalId,
      project_id: newProject.id,
    });

    // Copy files
    await fs.cp(srcDir, destDir, { recursive: true });
    await gitService.init(newSlug);

    return newProject;
  }

  async suspendProject(projectId: number, reason?: string, notes?: string) {
    const [suspension] = await db
      .insert(suspendedProjects)
      .values({
        project_id: projectId,
        reason: reason ?? null,
        notes: notes ?? null,
      })
      .returning();
    return suspension;
  }

  async unsuspendProject(suspensionId: number) {
    await db
      .update(suspendedProjects)
      .set({ invalidated_at: new Date() })
      .where(eq(suspendedProjects.id, suspensionId));
  }

  async getActiveSuspension(projectId: number) {
    return db.query.suspendedProjects.findFirst({
      where: and(
        eq(suspendedProjects.project_id, projectId),
        isNull(suspendedProjects.invalidated_at)
      ),
    });
  }

  async getProjectOwner(projectId: number) {
    const owner = await db.query.projectAccess.findFirst({
      where: and(
        eq(projectAccess.project_id, projectId),
        eq(projectAccess.access_level, AccessLevel.OWNER)
      ),
      with: { user: true },
    });
    return owner?.user ?? null;
  }
}

export const projectService = new ProjectService();
