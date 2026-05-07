import { env } from '../lib/env.js';
import { randomId } from '../lib/helpers.js';

// In-memory session store. In production, use Redis or similar.
interface SessionData {
  userId?: number;
  username?: string;
  isAdmin?: boolean;
  oauthState?: string;
  pendingSignup?: { service: string; serviceId: string };
  [key: string]: unknown;
}

const sessions = new Map<string, SessionData>();

export function createSession(): { sessionId: string; data: SessionData } {
  const sessionId = randomId(32);
  const data: SessionData = {};
  sessions.set(sessionId, data);
  return { sessionId, data };
}

export function getSession(sessionId: string): SessionData | null {
  return sessions.get(sessionId) ?? null;
}

export function destroySession(sessionId: string): void {
  sessions.delete(sessionId);
}

export const SESSION_COOKIE = 'pixelate_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
