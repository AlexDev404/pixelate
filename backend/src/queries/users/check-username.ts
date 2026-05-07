import { userService } from '../../services/user.service.js';

export async function checkUsername(name: string) {
  const available = await userService.checkUsernameAvailable(name);
  return { available, name };
}
