import { userService } from '../../services/user.service.js';

interface CreateUserInput {
  name: string;
  service: string;
  serviceId: string;
  activate?: boolean;
}

export async function createUser(input: CreateUserInput) {
  const { name, service, serviceId, activate = true } = input;

  // Check username availability
  const available = await userService.checkUsernameAvailable(name);
  if (!available) {
    throw new Error('Username is already taken');
  }

  const user = activate
    ? await userService.createUser(name)
    : await userService.createUserPending(name);

  await userService.addLogin(user.id, service, serviceId);

  return user;
}
