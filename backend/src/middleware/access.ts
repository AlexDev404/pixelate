import type { Context, Next } from 'hono';
import { AccessLevel } from '@pixelate/types';

export function verifyLogin() {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    await next();
  };
}

export function verifyAdmin() {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    const isAdmin = c.get('isAdmin');
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    await next();
  };
}

export function verifyEditRights() {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    const project = c.get('project' as never) as { id: number } | undefined;
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const isAdmin = c.get('isAdmin');
    if (isAdmin) {
      await next();
      return;
    }

    const { projectService } = await import('../services/project.service.js');
    const level = await projectService.getAccessLevel(project.id, userId);
    if (!level || level < AccessLevel.EDITOR) {
      return c.json({ error: 'Edit access required' }, 403);
    }
    await next();
  };
}

export function verifyOwner() {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    const project = c.get('project' as never) as { id: number } | undefined;
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const isAdmin = c.get('isAdmin');
    if (isAdmin) {
      await next();
      return;
    }

    const { projectService } = await import('../services/project.service.js');
    const level = await projectService.getAccessLevel(project.id, userId);
    if (!level || level < AccessLevel.OWNER) {
      return c.json({ error: 'Owner access required' }, 403);
    }
    await next();
  };
}
