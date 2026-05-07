import { userService } from '../../services/user.service.js';

export async function getUserSettings(userId: number) {
  const user = await userService.findById(userId);
  if (!user) return null;

  const logins = await userService.getLogins(userId);
  const isAdmin = await userService.isAdmin(userId);

  return {
    user: {
      id: user.id,
      name: user.name,
      created_at: user.created_at.toISOString(),
      enabled_at: user.enabled_at?.toISOString() ?? null,
    },
    services: logins.map((l) => ({ service: l.service, service_id: l.service_id })),
    isAdmin,
  };
}
