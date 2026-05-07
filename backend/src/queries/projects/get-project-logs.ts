import { execAsync } from '../../lib/helpers.js';
import { projectService } from '../../services/project.service.js';

export async function getProjectLogs(projectId: number, since?: string) {
  const project = await projectService.findById(projectId);
  if (!project) throw new Error('Project not found');

  const containerName = `pixelate-${project.slug}`;
  const sinceArg = since ? `--since ${since}` : '--tail 100';

  try {
    const { stdout } = await execAsync(`docker logs ${containerName} ${sinceArg} 2>&1`);
    return { logs: stdout };
  } catch {
    return { logs: '', error: 'Container not running or not found' };
  }
}
