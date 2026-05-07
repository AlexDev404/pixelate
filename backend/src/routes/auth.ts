import { Hono } from 'hono';
import { env } from '../lib/env.js';
import { randomId } from '../lib/helpers.js';
import {
  getOAuthConfig,
  createMagicLink,
  consumeMagicLink,
  getSession,
  createSession,
  destroySession,
  getAvailableProviders,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from '../auth/index.js';
import { userService } from '../services/user.service.js';
import { ensureSession } from '../middleware/auth.js';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

const auth = new Hono();

// Available auth providers (public)
auth.get('/providers', (c) => {
  return c.json(getAvailableProviders());
});

// Initiate OAuth login
auth.get('/:provider', async (c) => {
  const provider = c.req.param('provider');

  if (provider === 'personal') {
    return c.json({ error: 'Use POST /auth/personal/link for magic links' }, 400);
  }

  const config = getOAuthConfig(provider);
  if (!config) {
    return c.json({ error: 'Unknown provider' }, 400);
  }

  const sessionId = ensureSession(c);
  const session = getSession(sessionId)!;
  const state = randomId(16);
  session.oauthState = state;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${env.BASE_URL}/auth/${provider}/callback`,
    scope: config.scope,
    state,
    response_type: 'code',
  });

  return c.redirect(`${config.authUrl}?${params}`);
});

// OAuth callback
auth.get('/:provider/callback', async (c) => {
  const provider = c.req.param('provider');
  const code = c.req.query('code');
  const state = c.req.query('state');

  if (!code) {
    return c.json({ error: 'Missing authorization code' }, 400);
  }

  const sessionId = getCookie(c, SESSION_COOKIE);
  if (!sessionId) {
    return c.json({ error: 'No session' }, 400);
  }

  const session = getSession(sessionId);
  if (!session || session.oauthState !== state) {
    return c.json({ error: 'Invalid state parameter' }, 400);
  }

  const config = getOAuthConfig(provider);
  if (!config) {
    return c.json({ error: 'Unknown provider' }, 400);
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: `${env.BASE_URL}/auth/${provider}/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = (await tokenRes.json()) as Record<string, string>;
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return c.json({ error: 'Failed to get access token' }, 400);
    }

    // Get user profile
    const profileRes = await fetch(config.profileUrl!, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = (await profileRes.json()) as Record<string, unknown>;

    let serviceId: string;
    switch (provider) {
      case 'github':
        serviceId = String(profile.id);
        break;
      case 'google':
        serviceId = String(profile.id);
        break;
      case 'mastodon':
        serviceId = String(profile.id);
        break;
      default:
        serviceId = String(profile.id || profile.sub);
    }

    // Check if this login exists
    const existingUser = await userService.findByLogin(provider, serviceId);

    if (existingUser) {
      // Log in
      session.userId = existingUser.id;
      session.username = existingUser.name;
      session.isAdmin = await userService.isAdmin(existingUser.id);
      delete session.oauthState;

      // Check if user adding a new provider to existing account
      if (session.userId && session.userId !== existingUser.id) {
        // This is linking a new provider
        await userService.addLogin(session.userId, provider, serviceId);
      }

      return c.redirect('/');
    }

    // New user — store pending signup in session
    session.pendingSignup = { service: provider, serviceId };
    delete session.oauthState;

    return c.redirect('/signup');
  } catch (err) {
    return c.json({ error: 'OAuth callback failed', detail: String(err) }, 500);
  }
});

// Logout
auth.get('/logout', async (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (sessionId) {
    destroySession(sessionId);
  }
  deleteCookie(c, SESSION_COOKIE);
  return c.redirect('/');
});

// Generate magic link
auth.post('/personal/link', async (c) => {
  const body = await c.req.json<{ userId?: number; username?: string }>().catch(() => ({}));

  let user;
  if (body.userId) {
    user = await userService.findById(body.userId);
  } else if (body.username) {
    user = await userService.findByName(body.username);
  } else {
    // Fallback: use the logged-in session user
    const sessionId = getCookie(c, SESSION_COOKIE);
    if (sessionId) {
      const session = getSession(sessionId);
      if (session?.userId) {
        user = await userService.findById(session.userId);
      }
    }
  }

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const uuid = createMagicLink(user.id);
  const link = `/login/${uuid}`;

  // In production, email this link. In dev, return it.
  if (env.NODE_ENV === 'development') {
    return c.json({ link });
  }

  return c.json({ message: 'Login link sent' });
});

// Confirm magic link
auth.post('/personal/confirm/:uuid', async (c) => {
  const uuid = c.req.param('uuid');
  const userId = consumeMagicLink(uuid);

  if (!userId) {
    return c.json({ error: 'Invalid or expired link' }, 400);
  }

  const user = await userService.findById(userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const sessionId = ensureSession(c);
  const session = getSession(sessionId)!;
  session.userId = user.id;
  session.username = user.name;
  session.isAdmin = await userService.isAdmin(user.id);

  return c.json({ success: true, user: { id: user.id, name: user.name } });
});

export default auth;
