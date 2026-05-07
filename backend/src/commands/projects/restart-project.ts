import { execAsync, projectDir } from '../../lib/helpers.js';
import { env } from '../../lib/env.js';
import { projectService } from '../../services/project.service.js';

interface RestartProjectInput {
  projectId: number;
}

export async function restartProject(input: RestartProjectInput) {
  const project = await projectService.findById(input.projectId);
  if (!project) throw new Error('Project not found');

  const containerName = `pixelate-${project.slug}`;

  try {
    // Stop existing container
    await execAsync(`docker stop ${containerName}`).catch(() => {});
    await execAsync(`docker rm ${containerName}`).catch(() => {});

    // Start new container
    const settings = await projectService.getSettings(project.id);
    const dir = projectDir(project.slug);
    const runScript = settings?.run_script || 'npm start';
    const envVars = settings?.env_vars
      ? settings.env_vars
          .split('\n')
          .filter(Boolean)
          .map((e) => `-e ${e}`)
          .join(' ')
      : '';

    await execAsync(
      `docker run -d --name ${containerName} ` +
        `--network ${env.DOCKER_NETWORK} ` +
        `-v "${dir}":/app -w /app ` +
        `${envVars} ` +
        `node:20-alpine sh -c "${runScript}"`
    );

    return { success: true, container: containerName };
  } catch (err) {
    throw new Error(`Failed to restart container: ${err}`);
  }
}
