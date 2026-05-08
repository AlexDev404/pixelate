import { execAsync } from '../../lib/helpers.js';
import { projectService } from '../../services/project.service.js';
import { getPortBinding } from '../../services/caddy.service.js';
import { env } from '../../lib/env.js';
import type { HealthStatus } from '@pixelate/types';

export async function checkProjectHealth(projectId: number): Promise<HealthStatus> {
  const project = await projectService.findById(projectId);
  if (!project) return { healthy: false, message: 'Project not found' };

  const binding = getPortBinding(project.slug);
  const isDev = env.NODE_ENV === 'development';
  const containerName = `pixelate-${project.slug}`;

  try {
    const { stdout } = await execAsync(
      `docker inspect --format='{{.State.Status}}' ${containerName}`
    );
    const status = stdout.trim();
    return {
      healthy: status === 'running',
      message: `Container status: ${status}`,
      ...(isDev && binding ? { port: binding.port } : {}),
    };
  } catch {
    return {
      healthy: false,
      message: 'Container not found',
      ...(isDev && binding ? { port: binding.port } : {}),
    };
  }
}
