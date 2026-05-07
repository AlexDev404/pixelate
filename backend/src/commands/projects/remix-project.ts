import { projectService } from '../../services/project.service.js';

interface RemixProjectInput {
  originalId: number;
  newName: string;
  userId: number;
}

export async function remixProject(input: RemixProjectInput) {
  const { originalId, newName, userId } = input;

  // Validate new name doesn't exist
  const { slugify } = await import('../../lib/helpers.js');
  const slug = slugify(newName);
  const existing = await projectService.findBySlug(slug);
  if (existing) {
    throw new Error('A project with this name already exists');
  }

  return projectService.remixProject(originalId, newName, userId);
}
