import { Hono } from 'hono';
import { projectLookup } from '../middleware/project-lookup.js';
import { verifyLogin, verifyEditRights, verifyOwner } from '../middleware/access.js';
import { deleteProject } from '../commands/projects/delete-project.js';
import { remixProject } from '../commands/projects/remix-project.js';
import { restartProject } from '../commands/projects/restart-project.js';
import { updateProjectSettings } from '../commands/projects/update-project-settings.js';
import { getProjectHistory } from '../queries/projects/get-project-history.js';
import { getProjectLogs } from '../queries/projects/get-project-logs.js';
import { getProjectSettings } from '../queries/projects/get-project-settings.js';
import { checkProjectHealth } from '../queries/projects/check-project-health.js';
import { projectService } from '../services/project.service.js';
import { projectDir } from '../lib/helpers.js';
import archiver from 'archiver';
import { Readable } from 'stream';
import { env } from '../lib/env.js';
import fs from 'fs/promises';
import path from 'path';

const projectRoutes = new Hono();

// Delete project
projectRoutes.post('/delete/:project', verifyLogin(), projectLookup(), verifyOwner(), async (c) => {
  const project = c.get('project')!;
  const userId = c.get('userId')!;
  const isAdmin = c.get('isAdmin');

  try {
    const result = await deleteProject({
      projectId: project.id,
      userId,
      isAdmin,
    });
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

// Download project as zip
projectRoutes.get('/download/:project', projectLookup(), async (c) => {
  const project = c.get('project')!;
  const dir = projectDir(project.slug);

  const archive = archiver('zip', { zlib: { level: 9 } });

  c.header('Content-Type', 'application/zip');
  c.header('Content-Disposition', `attachment; filename="${project.slug}.zip"`);

  archive.directory(dir, project.slug);
  archive.finalize();

  // Convert archive stream to a ReadableStream for Hono
  const readable = Readable.toWeb(archive) as ReadableStream;
  return new Response(readable, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${project.slug}.zip"`,
    },
  });
});

// Check project health
projectRoutes.get('/health/:project', projectLookup(), async (c) => {
  const project = c.get('project')!;
  const health = await checkProjectHealth(project.id);
  return c.json(health);
});

// Get project history
projectRoutes.get('/history/:project/:commit?', projectLookup(), async (c) => {
  const project = c.get('project')!;
  const commit = c.req.param('commit');

  try {
    const result = await getProjectHistory(project.id, commit);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// Get project logs
projectRoutes.get('/logs/:project/:since?', projectLookup(), async (c) => {
  const project = c.get('project')!;
  const since = c.req.param('since');

  const result = await getProjectLogs(project.id, since);
  return c.json(result);
});

// Remix/fork project (DB-based projects)
projectRoutes.get('/remix/:project/:newname?', verifyLogin(), projectLookup(), async (c) => {
  const project = c.get('project')!;
  const userId = c.get('userId')!;
  const newname = c.req.param('newname') || `${project.name}-remix`;

  try {
    const newProject = await remixProject({
      originalId: project.id,
      newName: newname,
      userId,
    });
    return c.json(newProject);
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

// Create project from filesystem starter template
projectRoutes.get('/from-starter/:starter/:newname?', verifyLogin(), async (c) => {
  const starterSlug = c.req.param('starter');
  const userId = c.get('userId')!;
  const newname = c.req.param('newname') || `${starterSlug}-remix`;

  const starterDir = path.join(env.CONTENT_DIR, '__starter_projects', starterSlug);
  try {
    await fs.access(starterDir);
  } catch {
    return c.json({ error: 'Starter template not found' }, 404);
  }

  try {
    // Check if name/slug already exists
    const { slugify } = await import('../lib/helpers.js');
    const slug = slugify(newname);
    const existing = await projectService.findBySlug(slug);
    if (existing) {
      return c.json({ error: 'A project with this name already exists. Please choose a different name.' }, 409);
    }

    // Read starter settings
    let settings: Record<string, any> = {};
    try {
      const raw = await fs.readFile(path.join(starterDir, '.container', 'settings.json'), 'utf-8');
      settings = JSON.parse(raw);
    } catch { /* no settings */ }

    // Create the project in DB
    const newProject = await projectService.createProject(newname, userId, settings.description);

    // Copy starter files (excluding .container)
    const destDir = projectDir(newProject.slug);
    const entries = await fs.readdir(starterDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.container') continue;
      const src = path.join(starterDir, entry.name);
      const dest = path.join(destDir, entry.name);
      await fs.cp(src, dest, { recursive: true });
    }

    // Apply project settings from the starter
    const { description, name, ...projSettings } = settings;
    if (Object.keys(projSettings).length > 0) {
      await projectService.updateSettings(newProject.id, projSettings);
    }

    // Start the container for the new project
    try {
      await restartProject({ projectId: newProject.id });
    } catch (err) {
      console.warn(`Failed to start container for new project ${newProject.slug}:`, err);
    }

    return c.json(newProject);
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

// Restart project container
projectRoutes.post('/restart/:project', verifyLogin(), projectLookup(), verifyEditRights(), async (c) => {
  const project = c.get('project')!;

  try {
    const result = await restartProject({ projectId: project.id });
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// Get project settings
projectRoutes.get('/settings/:pid', async (c) => {
  const pid = parseInt(c.req.param('pid'), 10);
  if (isNaN(pid)) return c.json({ error: 'Invalid project ID' }, 400);

  const settings = await getProjectSettings(pid);
  if (!settings) return c.json({ error: 'Settings not found' }, 404);
  return c.json(settings);
});

// Update project settings
projectRoutes.post('/settings/:pid', verifyLogin(), async (c) => {
  const pid = parseInt(c.req.param('pid'), 10);
  if (isNaN(pid)) return c.json({ error: 'Invalid project ID' }, 400);

  const body = await c.req.json();
  try {
    const result = await updateProjectSettings({
      projectId: pid,
      settings: body,
    });
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

// Start project container (internal)
projectRoutes.get('/start/:project/:secret', projectLookup(), async (c) => {
  const secret = c.req.param('secret');
  if (secret !== env.CONTAINER_SECRET) {
    return c.json({ error: 'Invalid secret' }, 403);
  }

  const project = c.get('project')!;
  try {
    const result = await restartProject({ projectId: project.id });
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

export default projectRoutes;
