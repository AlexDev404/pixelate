import { userService } from '../../services/user.service.js';

interface SuspendUserInput {
  userId: number;
  reason?: string;
  notes?: string;
}

export async function suspendUser(input: SuspendUserInput) {
  const user = await userService.findById(input.userId);
  if (!user) throw new Error('User not found');

  const existing = await userService.getActiveSuspension(input.userId);
  if (existing) {
    throw new Error('User is already suspended');
  }

  return userService.suspendUser(input.userId, input.reason, input.notes);
}

interface UnsuspendUserInput {
  suspensionId: number;
}

export async function unsuspendUser(input: UnsuspendUserInput) {
  await userService.unsuspendUser(input.suspensionId);
  return { success: true };
}
