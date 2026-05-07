import type { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { getSession, createSession, SESSION_COOKIE, SESSION_MAX_AGE } from '../auth/session.js';
import { userService } from '../services/user.service.js';

// Extend Hono context variables
declare module 'hono' {
  interface ContextVariableMap {
    sessionId: string | null;
    userId: number | null;
    userName: string | null;
    isAdmin: boolean;
    sessionData: Record<string, unknown> | null;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const sessionId = getCookie(c, SESSION_COOKIE) ?? null;
  let userId: number | null = null;
  let userName: string | null = null;
  let isAdmin = false;
  let sessionData: Record<string, unknown> | null = null;

  if (sessionId) {
    const session = getSession(sessionId);
    if (session) {
      sessionData = session;
      if (session.userId) {
        userId = session.userId;
        userName = session.username ?? null;
        isAdmin = session.isAdmin ?? false;
      }
    }
  }

  c.set('sessionId', sessionId);
  c.set('userId', userId);
  c.set('userName', userName);
  c.set('isAdmin', isAdmin);
  c.set('sessionData', sessionData);

  await next();
}

export function ensureSession(c: Context): string {
  let sessionId = getCookie(c, SESSION_COOKIE) ?? null;
  if (!sessionId || !getSession(sessionId)) {
    const created = createSession();
    sessionId = created.sessionId;
    setCookie(c, SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: c.req.url.startsWith('https'),
      sameSite: 'Lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
  }
  return sessionId;
}
