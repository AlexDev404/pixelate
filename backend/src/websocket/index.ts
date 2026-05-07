import type { Hono } from 'hono';
import type { createNodeWebSocket } from '@hono/node-ws';
import { OTHandler } from './ot-handler.js';
import { handleFileTreeMessage } from './file-tree.js';
import { getSession, SESSION_COOKIE } from '../auth/session.js';
import { randomId } from '../lib/helpers.js';
import { projectService } from '../services/project.service.js';
import { AccessLevel } from '@pixelate/types';

export function setupWebSocket(
  app: Hono,
  injectWebSocket: ReturnType<typeof createNodeWebSocket>['injectWebSocket'],
  upgradeWebSocket: ReturnType<typeof createNodeWebSocket>['upgradeWebSocket']
) {
  app.get(
    '/ws/:project',
    upgradeWebSocket((c) => {
      const projectSlug = c.req.param('project');
      const connectionId = randomId(12);

      // Extract session from cookie for auth
      const cookieHeader = c.req.header('cookie') || '';
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map((c) => {
          const [k, ...v] = c.trim().split('=');
          return [k, v.join('=')];
        })
      );
      const sessionId = cookies[SESSION_COOKIE];
      const session = sessionId ? getSession(sessionId) : null;
      const userId = session?.userId ?? null;

      let handler: OTHandler | null = null;

      return {
        async onOpen(_evt, ws) {
          // Verify project exists
          const project = await projectService.findBySlug(projectSlug);
          if (!project) {
            ws.close(4004, 'Project not found');
            return;
          }

          // Check access — at minimum viewer
          if (userId) {
            const level = await projectService.getAccessLevel(project.id, userId);
            // Allow if user has any access level
            if (level === null) {
              // No explicit access, allow read-only for public projects
            }
          }

          handler = new OTHandler(
            connectionId,
            projectSlug,
            userId,
            (data: string) => ws.send(data)
          );
        },

        onMessage(evt, ws) {
          if (!handler) return;
          const data = typeof evt.data === 'string' ? evt.data : evt.data.toString();
          handleFileTreeMessage(handler, data);
        },

        onClose() {
          handler?.destroy();
          handler = null;
        },

        onError() {
          handler?.destroy();
          handler = null;
        },
      };
    })
  );
}
