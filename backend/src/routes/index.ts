import { Hono } from 'hono';
import authRoutes from './auth.js';
import projectRoutes from './projects.js';
import fileRoutes from './files.js';
import userRoutes from './users.js';
import adminRoutes from './admin.js';
import mainRoute from './main.js';

export function mountRoutes(app: Hono) {
  app.route('/auth', authRoutes);
  app.route('/api/v1/projects', projectRoutes);
  app.route('/api/v1/files', fileRoutes);
  app.route('/api/v1/users', userRoutes);
  app.route('/api/v1/admin', adminRoutes);
  app.route('/api/v1/main', mainRoute);
}
