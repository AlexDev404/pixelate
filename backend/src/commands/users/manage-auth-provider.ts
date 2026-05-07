import { userService } from '../../services/user.service.js';

interface ManageAuthProviderInput {
  userId: number;
  service: string;
  action: 'add' | 'remove';
  serviceId?: string;
}

export async function manageAuthProvider(input: ManageAuthProviderInput) {
  const { userId, service, action, serviceId } = input;

  if (action === 'add') {
    if (!serviceId) throw new Error('Service ID required for adding provider');
    await userService.addLogin(userId, service, serviceId);
  } else {
    // Ensure user has at least one other login
    const logins = await userService.getLogins(userId);
    if (logins.length <= 1) {
      throw new Error('Cannot remove last authentication method');
    }
    await userService.removeLogin(userId, service);
  }

  return { success: true };
}
