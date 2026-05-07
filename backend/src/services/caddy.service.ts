import { env } from '../lib/env.js';

const CADDY_ADMIN_URL = env.CADDY_ADMIN_URL || 'http://localhost:2019';
const BYPASS_CADDY = env.BYPASS_CADDY === 'true';

export interface PortBinding {
  port: number;
  restarts: number;
  failedRestarts: number;
}

export const portBindings: Record<string, PortBinding> = {};

/**
 * Add or update a Caddy route for a project subdomain.
 * Uses the Caddy admin API to dynamically add reverse proxy routes
 * so that <slug>.<apps-hostname> proxies to the project's local port.
 */
export async function updateCaddyRoute(
  projectSlug: string,
  port: number,
): Promise<PortBinding> {
  const binding: PortBinding = portBindings[projectSlug] ?? {
    port,
    restarts: 0,
    failedRestarts: 0,
  };
  binding.port = port;
  portBindings[projectSlug] = binding;

  if (BYPASS_CADDY) return binding;

  const appsHostname = env.WEB_EDITOR_APPS_HOSTNAME;
  const host = `${projectSlug}.${appsHostname}`;

  const routeConfig = {
    '@id': `project-${projectSlug}`,
    match: [{ host: [host] }],
    handle: [
      {
        handler: 'reverse_proxy',
        upstreams: [{ dial: `host.docker.internal:${port}` }],
      },
    ],
  };

  try {
    // Try to update existing route first
    const patchRes = await fetch(
      `${CADDY_ADMIN_URL}/id/project-${projectSlug}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeConfig),
      },
    );

    if (!patchRes.ok) {
      // Route doesn't exist yet, add it via the config API
      await fetch(
        `${CADDY_ADMIN_URL}/config/apps/http/servers/srv0/routes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(routeConfig),
        },
      );
    }
  } catch (err) {
    console.error(`[caddy] Failed to update route for ${projectSlug}:`, err);
  }

  return binding;
}

/**
 * Remove the Caddy route for a project subdomain.
 */
export async function removeCaddyRoute(projectSlug: string): Promise<void> {
  delete portBindings[projectSlug];

  if (BYPASS_CADDY) return;

  try {
    await fetch(`${CADDY_ADMIN_URL}/id/project-${projectSlug}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.error(`[caddy] Failed to remove route for ${projectSlug}:`, err);
  }
}

/**
 * Check if a project has an active port binding.
 */
export function getPortBinding(projectSlug: string): PortBinding | undefined {
  return portBindings[projectSlug];
}
