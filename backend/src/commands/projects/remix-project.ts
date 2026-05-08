import { projectService } from '../../services/project.service.js';
import { restartProject } from './restart-project.js';

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

  const newProject = await projectService.remixProject(originalId, newName, userId);

  // Start the container for the new project
  try {
    await restartProject({ projectId: newProject.id });
  } catch (err) {
    console.warn(`Failed to start container for remixed project ${newProject.slug}:`, err);
  }

  return newProject;
}
