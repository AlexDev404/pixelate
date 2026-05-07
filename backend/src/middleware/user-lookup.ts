import type { Context, Next } from 'hono';
import { userService } from '../services/user.service.js';

declare module 'hono' {
  interface ContextVariableMap {
    targetUser: {
      id: number;
      name: string;
      created_at: Date;
      enabled_at: Date | null;
    } | null;
  }
}

export function userLookup(paramName = 'user') {
  return async (c: Context, next: Next) => {
    const identifier = c.req.param(paramName);
    if (!identifier) {
      return c.json({ error: 'User identifier required' }, 400);
    }

    // Try by name first, then by id
    let user = await userService.findByName(identifier);
    if (!user) {
      const id = parseInt(identifier, 10);
      if (!isNaN(id)) {
        user = await userService.findById(id);
      }
    }

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    c.set('targetUser', user);
    await next();
  };
}
