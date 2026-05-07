import { projectService } from '../../services/project.service.js';
import { slugify } from '../../lib/helpers.js';

interface CreateProjectInput {
  name: string;
  ownerId: number;
  description?: string;
}

export async function createProject(input: CreateProjectInput) {
  const slug = slugify(input.name);

  // Check if slug is taken
  const existing = await projectService.findBySlug(slug);
  if (existing) {
    throw new Error('A project with this name already exists');
  }

  const project = await projectService.createProject(
    input.name,
    input.ownerId,
    input.description
  );

  return project;
}
