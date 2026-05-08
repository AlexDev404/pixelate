import fs from 'fs/promises';
import path from 'path';
import { env } from '../../lib/env.js';
import { execAsync, projectDir } from '../../lib/helpers.js';
import { updateCaddyRoute } from '../../services/caddy.service.js';
import { projectService } from '../../services/project.service.js';

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

async function getContainerStatus(containerName: string): Promise<'running' | 'stopped' | 'none'> {
  try {
    const { stdout } = await execAsync(
      `docker inspect --format={{.State.Status}} ${containerName}`
    );
    const status = stdout.trim().replace(/'/g, '');
    if (status === 'running') return 'running';
    return 'stopped';
  } catch {
    return 'none';
  }
}

async function getContainerPort(containerName: string): Promise<number | null> {
  try {
    const { stdout } = await execAsync(
      `docker inspect --format={{range .Config.Env}}{{println .}}{{end}} ${containerName}`
    );
    const match = stdout.match(/^PORT=(\d+)$/m);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

export async function restartProject(input: RestartProjectInput) {
  const project = await projectService.findById(input.projectId);
  if (!project) throw new Error('Project not found');

  const containerName = `pixelate-${project.slug}`;

  try {
    await ensureNetwork();

    const status = await getContainerStatus(containerName);

    // Container is already running
    if (status === 'running') {
      const existingPort = await getContainerPort(containerName);
      if (existingPort) {
        await updateCaddyRoute(project.slug, existingPort);
        return { success: true, container: containerName, port: existingPort };
      }
    }

    // Container exists but is stopped — try to start it
    if (status === 'stopped') {
      try {
        await execAsync(`docker start ${containerName}`);
        const existingPort = await getContainerPort(containerName);
        if (existingPort) {
          await updateCaddyRoute(project.slug, existingPort);
          return { success: true, container: containerName, port: existingPort };
        }
      } catch {
        // Start failed, fall through to recreate
      }
    }

    // Container doesn't exist or failed to start — create fresh
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

    // Write a startup script to avoid shell quoting issues
    const entrypoint = [
      '#!/bin/sh',
      'set -e',
      'if [ -f package.json ]; then rm -rf node_modules && npm install; fi',
      runScript,
    ].join('\n');
    const entrypointPath = path.join(dir, '.pixelate-start.sh');
    await fs.writeFile(entrypointPath, entrypoint, { mode: 0o755 });

    await execAsync(
      `docker run -d --name ${containerName} ` +
        `--network ${env.DOCKER_NETWORK} ` +
        `-v "${dir}":/app -w /app ` +
        `-p ${port}:${port} ` +
        `-e PORT=${port} ` +
        `${envVars} ` +
        `node:20-alpine sh /app/.pixelate-start.sh`
    );

    // Register port binding so health check can return it
    await updateCaddyRoute(project.slug, port);

    return { success: true, container: containerName, port };
  } catch (err) {
    throw new Error(`Failed to restart container: ${err}`);
  }
}
