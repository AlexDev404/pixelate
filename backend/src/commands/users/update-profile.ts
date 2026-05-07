import { userService } from '../../services/user.service.js';

interface UpdateProfileInput {
  userId: number;
  requesterId: number;
  isAdmin: boolean;
  updates: {
    name?: string;
  };
}

export async function updateProfile(input: UpdateProfileInput) {
  const { userId, requesterId, isAdmin, updates } = input;

  if (userId !== requesterId && !isAdmin) {
    throw new Error('Cannot update another user\'s profile');
  }

  if (updates.name) {
    const available = await userService.checkUsernameAvailable(updates.name);
    if (!available) {
      throw new Error('Username is already taken');
    }
  }

  await userService.updateProfile(userId, updates);
  const user = await userService.findById(userId);
  return user;
}
