import { Hono } from 'hono';
import { listProjects } from '../queries/projects/list-projects.js';
import { projectService } from '../services/project.service.js';
import { getAvailableProviders } from '../auth/strategies.js';
import { userService } from '../services/user.service.js';

const mainRoute = new Hono();

mainRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const isAdmin = c.get('isAdmin');

  // Get projects accessible to this user
  const userProjects = userId ? await listProjects(userId) : [];

  // Get starter projects
  const starters = await projectService.listStarterProjects();

  // Get available auth providers
  const providers = getAvailableProviders();

  // Get user info
  let user = null;
  if (userId) {
    const u = await userService.findById(userId);
    if (u) {
      user = {
        id: u.id,
        name: u.name,
        created_at: u.created_at.toISOString(),
        enabled_at: u.enabled_at?.toISOString() ?? null,
        superuser: isAdmin,
      };
    }
  }

  return c.json({
    projects: userProjects,
    starters: starters.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
    })),
    providers,
    user,
  });
});

export default mainRoute;
