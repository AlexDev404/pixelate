import { projectService } from '../../services/project.service.js';

export async function getProjectSettings(projectId: number) {
  return projectService.getSettings(projectId);
}
