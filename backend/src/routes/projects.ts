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

// Remix/fork project
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
