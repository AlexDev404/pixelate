import { userService } from '../../services/user.service.js';

export async function listUsers() {
  return userService.listAllUsers();
}
