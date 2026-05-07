import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authMiddleware } from './middleware/auth.js';
import { mountRoutes } from './routes/index.js';

export function createApp() {
  const app = new Hono();

  // Global middleware
  app.use('*', logger());
  app.use(
    '*',
    cors({
      origin: (origin) => origin || '*',
      credentials: true,
    })
  );
  app.use('*', authMiddleware);

  // Mount all routes
  mountRoutes(app);

  // Health check
  app.get('/health', (c) => c.json({ status: 'ok' }));

  return app;
}
