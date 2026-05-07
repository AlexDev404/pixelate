import { Hono } from 'hono';
import { verifyAdmin } from '../middleware/access.js';
import { userService } from '../services/user.service.js';
import { projectService } from '../services/project.service.js';
import { suspendUser, unsuspendUser } from '../commands/users/suspend-user.js';
import { execAsync } from '../lib/helpers.js';
import { db } from '../db/index.js';
import { suspendedUsers, suspendedProjects } from '../db/schema.js';
import { isNull } from 'drizzle-orm';

const adminRoutes = new Hono();

// All admin routes require admin access
adminRoutes.use('*', verifyAdmin());

// Get admin dashboard data
adminRoutes.get('/', async (c) => {
  const users = await userService.listAllUsers();
  const allProjects = await projectService.listProjects();

  const activeSuspensions = await db.query.suspendedUsers.findMany({
    where: isNull(suspendedUsers.invalidated_at),
    with: { user: true },
  });

  const projectSuspensions = await db.query.suspendedProjects.findMany({
    where: isNull(suspendedProjects.invalidated_at),
    with: { project: true },
  });

  // Get running containers
  let containers: string[] = [];
  try {
    const { stdout } = await execAsync('docker ps --format "{{.Names}}" --filter name=pixelate-');
    containers = stdout.trim().split('\n').filter(Boolean);
  } catch {
    // Docker may not be available
  }

  return c.json({
    users,
    projects: allProjects,
    suspendedUsers: activeSuspensions,
    suspendedProjects: projectSuspensions,
    containers,
  });
});

// Delete user
adminRoutes.post('/user/delete/:uid', async (c) => {
  const uid = parseInt(c.req.param('uid'), 10);
  if (isNaN(uid)) return c.json({ error: 'Invalid user ID' }, 400);

  await userService.deleteUser(uid);
  return c.json({ success: true });
});

// Disable user
adminRoutes.post('/user/disable/:uid', async (c) => {
  const uid = parseInt(c.req.param('uid'), 10);
  if (isNaN(uid)) return c.json({ error: 'Invalid user ID' }, 400);

  await userService.disableUser(uid);
  return c.json({ success: true });
});

// Enable user
adminRoutes.post('/user/enable/:uid', async (c) => {
  const uid = parseInt(c.req.param('uid'), 10);
  if (isNaN(uid)) return c.json({ error: 'Invalid user ID' }, 400);

  await userService.enableUser(uid);
  return c.json({ success: true });
});

// Suspend user
adminRoutes.post('/user/suspend/:uid', async (c) => {
  const uid = parseInt(c.req.param('uid'), 10);
  if (isNaN(uid)) return c.json({ error: 'Invalid user ID' }, 400);

  const body = await c.req.json<{ reason?: string; notes?: string }>().catch(() => ({}));

  try {
    const suspension = await suspendUser({ userId: uid, ...body });
    return c.json(suspension);
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

// Unsuspend user
adminRoutes.post('/user/unsuspend/:sid', async (c) => {
  const sid = parseInt(c.req.param('sid'), 10);
  if (isNaN(sid)) return c.json({ error: 'Invalid suspension ID' }, 400);

  await unsuspendUser({ suspensionId: sid });
  return c.json({ success: true });
});

// Delete project
adminRoutes.post('/project/delete/:pid', async (c) => {
  const pid = parseInt(c.req.param('pid'), 10);
  if (isNaN(pid)) return c.json({ error: 'Invalid project ID' }, 400);

  await projectService.deleteProject(pid);
  return c.json({ success: true });
});

// Suspend project
adminRoutes.post('/project/suspend/:pid', async (c) => {
  const pid = parseInt(c.req.param('pid'), 10);
  if (isNaN(pid)) return c.json({ error: 'Invalid project ID' }, 400);

  const body = await c.req.json<{ reason?: string; notes?: string }>().catch(() => ({}));
  const suspension = await projectService.suspendProject(pid, body.reason, body.notes);
  return c.json(suspension);
});

// Unsuspend project
adminRoutes.post('/project/unsuspend/:sid', async (c) => {
  const sid = parseInt(c.req.param('sid'), 10);
  if (isNaN(sid)) return c.json({ error: 'Invalid suspension ID' }, 400);

  await projectService.unsuspendProject(sid);
  return c.json({ success: true });
});

// Stop container
adminRoutes.post('/container/stop/:image', async (c) => {
  const image = c.req.param('image');

  try {
    await execAsync(`docker stop ${image}`);
    await execAsync(`docker rm ${image}`).catch(() => {});
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// Stop server (named process)
adminRoutes.post('/server/stop/:name', async (c) => {
  const name = c.req.param('name');

  try {
    await execAsync(`docker stop pixelate-${name}`);
    await execAsync(`docker rm pixelate-${name}`).catch(() => {});
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

export default adminRoutes;
