import { Hono } from 'hono';
import { verifyLogin } from '../middleware/access.js';
import { userLookup } from '../middleware/user-lookup.js';
import { getUserProfile } from '../queries/users/get-user-profile.js';
import { getUserSettings } from '../queries/users/get-user-settings.js';
import { checkUsername } from '../queries/users/check-username.js';
import { updateProfile } from '../commands/users/update-profile.js';
import { createUser } from '../commands/users/create-user.js';
import { getOAuthConfig } from '../auth/strategies.js';
import { ensureSession } from '../middleware/auth.js';
import { getSession, SESSION_COOKIE } from '../auth/session.js';
import { getCookie } from 'hono/cookie';
import { userService } from '../services/user.service.js';
import { env } from '../lib/env.js';

const userRoutes = new Hono();

// Get user profile
userRoutes.get('/profile/:user', userLookup(), async (c) => {
  const targetUser = c.get('targetUser')!;
  const userId = c.get('userId');
  const isAdmin = c.get('isAdmin');

  const profile = await getUserProfile(targetUser.id, userId, isAdmin);
  if (!profile) return c.json({ error: 'User not found' }, 404);
  return c.json(profile);
});

// Update user profile
userRoutes.post('/profile/:user', verifyLogin(), userLookup(), async (c) => {
  const targetUser = c.get('targetUser')!;
  const userId = c.get('userId')!;
  const isAdmin = c.get('isAdmin');

  const body = await c.req.json<{ name?: string }>();

  try {
    const result = await updateProfile({
      userId: targetUser.id,
      requesterId: userId,
      isAdmin,
      updates: body,
    });
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

// Add auth provider — redirects to OAuth flow
userRoutes.get('/service/add/:service', verifyLogin(), async (c) => {
  const service = c.req.param('service');
  const config = getOAuthConfig(service);
  if (!config) return c.json({ error: 'Unknown service' }, 400);

  const sessionId = ensureSession(c);
  const session = getSession(sessionId)!;
  session.oauthState = `add-${service}`;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${env.BASE_URL}/auth/${service}/callback`,
    scope: config.scope,
    state: session.oauthState,
    response_type: 'code',
  });

  return c.redirect(`${config.authUrl}?${params}`);
});

// Remove auth provider
userRoutes.get('/service/remove/:service', verifyLogin(), async (c) => {
  const service = c.req.param('service');
  const userId = c.get('userId')!;

  try {
    const { manageAuthProvider } = await import('../commands/users/manage-auth-provider.js');
    await manageAuthProvider({ userId, service, action: 'remove' });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

// Get user settings
userRoutes.get('/settings/:uid', verifyLogin(), async (c) => {
  const uid = parseInt(c.req.param('uid'), 10);
  if (isNaN(uid)) return c.json({ error: 'Invalid user ID' }, 400);

  const userId = c.get('userId')!;
  const isAdmin = c.get('isAdmin');

  if (uid !== userId && !isAdmin) {
    return c.json({ error: 'Access denied' }, 403);
  }

  const settings = await getUserSettings(uid);
  if (!settings) return c.json({ error: 'User not found' }, 404);
  return c.json(settings);
});

// Check username availability
userRoutes.get('/signup/:username', async (c) => {
  const username = c.req.param('username');
  const result = await checkUsername(username);
  return c.json(result);
});

// Reserve username and complete signup
userRoutes.post('/signup/:username/:service', async (c) => {
  const username = c.req.param('username');
  const service = c.req.param('service');

  // Magic link signup: create user and return a login link directly
  if (service === 'personal') {
    try {
      const { createMagicLink } = await import('../auth/strategies.js');

      const user = await createUser({
        name: username,
        service: 'personal',
        serviceId: `personal-${Date.now()}`,
      });

      const uuid = createMagicLink(user.id);
      const link = `/login/${uuid}`;

      // Log the user in immediately via session
      const sessionId = ensureSession(c);
      const session = getSession(sessionId)!;
      session.userId = user.id;
      session.username = user.name;
      session.isAdmin = false;

      // In dev mode return the link; in production it would be emailed
      if (env.NODE_ENV === 'development') {
        return c.json({ success: true, user: { id: user.id, name: user.name }, link });
      }

      return c.json({ success: true, user: { id: user.id, name: user.name } });
    } catch (err) {
      return c.json({ error: String(err) }, 400);
    }
  }

  // OAuth signup: requires a pending signup from OAuth callback
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (!sessionId) return c.json({ error: 'No session' }, 400);

  const session = getSession(sessionId);
  if (!session?.pendingSignup) {
    return c.json({ error: 'No pending signup' }, 400);
  }

  if (session.pendingSignup.service !== service) {
    return c.json({ error: 'Service mismatch' }, 400);
  }

  try {
    const user = await createUser({
      name: username,
      service: session.pendingSignup.service,
      serviceId: session.pendingSignup.serviceId,
    });

    session.userId = user.id;
    session.username = user.name;
    session.isAdmin = false;
    delete session.pendingSignup;

    return c.json({ success: true, user: { id: user.id, name: user.name } });
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

export default userRoutes;
