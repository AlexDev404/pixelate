import { userService } from '../../services/user.service.js';
import type { UserProfile } from '@pixelate/types';

export async function getUserProfile(
  targetUserId: number,
  requesterId: number | null,
  isAdmin: boolean
): Promise<UserProfile | null> {
  const user = await userService.findById(targetUserId);
  if (!user) return null;

  const projects = await userService.getUserProjects(targetUserId);
  const logins = await userService.getLogins(targetUserId);
  const userIsAdmin = await userService.isAdmin(targetUserId);

  const allowEdit = requesterId === targetUserId || isAdmin;

  // Only show services to the user themselves or admins
  const services = allowEdit
    ? logins.map((l) => ({ service: l.service, service_id: l.service_id }))
    : [];

  const availableProviders = ['github', 'google', 'mastodon', 'personal'];
  const userProviders = logins.map((l) => l.service);
  const additionalServices = allowEdit
    ? availableProviders.filter((p) => !userProviders.includes(p))
    : [];

  return {
    user: {
      id: user.id,
      name: user.name,
      created_at: user.created_at.toISOString(),
      enabled_at: user.enabled_at?.toISOString() ?? null,
      superuser: userIsAdmin,
    },
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
    })),
    services,
    additionalServices,
    links: [],
    allowEdit,
  };
}
