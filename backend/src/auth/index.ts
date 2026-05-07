export {
  createSession,
  getSession,
  destroySession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from './session.js';

export {
  getOAuthConfig,
  getAvailableProviders,
  createMagicLink,
  consumeMagicLink,
} from './strategies.js';
