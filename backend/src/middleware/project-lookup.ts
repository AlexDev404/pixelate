import type { Context, Next } from 'hono';
import { projectService } from '../services/project.service.js';

declare module 'hono' {
  interface ContextVariableMap {
    project: {
      id: number;
      name: string;
      slug: string;
      description: string | null;
      created_at: Date;
      updated_at: Date;
    } | null;
  }
}

export function projectLookup(paramName = 'project') {
  return async (c: Context, next: Next) => {
    const slug = c.req.param(paramName);
    if (!slug) {
      return c.json({ error: 'Project identifier required' }, 400);
    }

    // Try slug first, then by id
    let project = await projectService.findBySlug(slug);
    if (!project) {
      const id = parseInt(slug, 10);
      if (!isNaN(id)) {
        project = await projectService.findById(id);
      }
    }

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if project is suspended
    const suspension = await projectService.getActiveSuspension(project.id);
    if (suspension) {
      const isAdmin = c.get('isAdmin');
      if (!isAdmin) {
        return c.json({ error: 'Project is suspended', reason: suspension.reason }, 403);
      }
    }

    c.set('project', project);
    await next();
  };
}
