import type { Hono } from 'hono';
import type { createNodeWebSocket } from '@hono/node-ws';
import * as pty from 'node-pty';

export function setupTerminalWebSocket(
  app: Hono,
  upgradeWebSocket: ReturnType<typeof createNodeWebSocket>['upgradeWebSocket']
) {
  app.get(
    '/ws/terminal/:project',
    upgradeWebSocket((c) => {
      const projectSlug = c.req.param('project');
      const containerName = `pixelate-${projectSlug}`;
      let ptyProcess: pty.IPty | null = null;

      return {
        onOpen(_evt, ws) {
          try {
            ptyProcess = pty.spawn('docker', ['exec', '-it', containerName, 'sh'], {
              name: 'xterm-256color',
              cols: 80,
              rows: 24,
              cwd: process.cwd(),
            });

            ptyProcess.onData((data) => {
              try {
                ws.send(JSON.stringify({ type: 'output', data }));
              } catch {
                // ws may be closed
              }
            });

            ptyProcess.onExit(({ exitCode }) => {
              try {
                ws.send(JSON.stringify({ type: 'exit', exitCode }));
                ws.close();
              } catch {
                // ws may be closed
              }
            });
          } catch (err) {
            ws.send(JSON.stringify({ type: 'error', data: `Failed to start terminal: ${err}` }));
            ws.close();
          }
        },

        onMessage(evt) {
          if (!ptyProcess) return;
          const raw = typeof evt.data === 'string' ? evt.data : evt.data.toString();
          try {
            const msg = JSON.parse(raw);
            if (msg.type === 'input') {
              ptyProcess.write(msg.data);
            } else if (msg.type === 'resize') {
              ptyProcess.resize(msg.cols, msg.rows);
            }
          } catch {
            // Not JSON, treat as raw input
            ptyProcess.write(raw);
          }
        },

        onClose() {
          if (ptyProcess) {
            ptyProcess.kill();
            ptyProcess = null;
          }
        },

        onError() {
          if (ptyProcess) {
            ptyProcess.kill();
            ptyProcess = null;
          }
        },
      };
    })
  );
}
