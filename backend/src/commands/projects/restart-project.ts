import { execAsync, projectDir } from '../../lib/helpers.js';
import { env } from '../../lib/env.js';
import { projectService } from '../../services/project.service.js';
import { updateCaddyRoute } from '../../services/caddy.service.js';

interface RestartProjectInput {
  projectId: number;
}

async function ensureNetwork() {
  try {
    await execAsync(`docker network inspect ${env.DOCKER_NETWORK}`);
  } catch {
    await execAsync(`docker network create ${env.DOCKER_NETWORK}`);
  }
}

let nextPort = 4100;

async function allocatePort(): Promise<number> {
  const port = nextPort++;
  return port;
}

export async function restartProject(input: RestartProjectInput) {
  const project = await projectService.findById(input.projectId);
  if (!project) throw new Error('Project not found');

  const containerName = `pixelate-${project.slug}`;

  try {
    await ensureNetwork();

    // Stop existing container
    await execAsync(`docker stop ${containerName}`).catch(() => {});
    await execAsync(`docker rm ${containerName}`).catch(() => {});

    // Allocate a port for this project
    const port = await allocatePort();

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
        `-p ${port}:${port} ` +
        `-e PORT=${port} ` +
        `${envVars} ` +
        `node:20-alpine sh -c "${runScript}"`
    );

    // Register port binding so health check can return it
    await updateCaddyRoute(project.slug, port);

    return { success: true, container: containerName, port };
  } catch (err) {
    throw new Error(`Failed to restart container: ${err}`);
  }
}
