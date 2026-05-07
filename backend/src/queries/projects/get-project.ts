import { projectService } from '../../services/project.service.js';

export async function getProject(idOrSlug: string | number) {
  if (typeof idOrSlug === 'number') {
    return projectService.findById(idOrSlug);
  }
  const id = parseInt(idOrSlug, 10);
  if (!isNaN(id)) {
    return projectService.findById(id);
  }
  return projectService.findBySlug(idOrSlug);
}
