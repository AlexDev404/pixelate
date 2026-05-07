import { projectService } from '../../services/project.service.js';
import { AccessLevel } from '@pixelate/types';

interface DeleteProjectInput {
  projectId: number;
  userId: number;
  isAdmin: boolean;
}

export async function deleteProject(input: DeleteProjectInput) {
  const { projectId, userId, isAdmin } = input;

  if (!isAdmin) {
    const level = await projectService.getAccessLevel(projectId, userId);
    if (!level || level < AccessLevel.OWNER) {
      throw new Error('Only the owner can delete a project');
    }
  }

  await projectService.deleteProject(projectId);
  return { success: true };
}
