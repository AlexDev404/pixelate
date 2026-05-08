import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { createApp } from './app.js';
import { setupWebSocket } from './websocket/index.js';
import { setupTerminalWebSocket } from './websocket/terminal.js';
import { env } from './lib/env.js';

const app = createApp();

// Setup WebSocket
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
setupWebSocket(app, injectWebSocket, upgradeWebSocket);
setupTerminalWebSocket(app, upgradeWebSocket);

console.log(`Starting Pixelate server on port ${env.PORT}...`);

const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
  }
);

injectWebSocket(server);
