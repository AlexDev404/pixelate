import { env } from '../lib/env.js';
import type { AuthProvider } from '@pixelate/types';

export interface OAuthConfig {
  service: string;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  profileUrl?: string;
}

export function getOAuthConfig(provider: string): OAuthConfig | null {
  switch (provider) {
    case 'github':
      return {
        service: 'github',
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        scope: 'read:user user:email',
        profileUrl: 'https://api.github.com/user',
      };
    case 'google':
      return {
        service: 'google',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        scope: 'openid profile email',
        profileUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      };
    case 'mastodon':
      return {
        service: 'mastodon',
        authUrl: `${env.MASTODON_INSTANCE}/oauth/authorize`,
        tokenUrl: `${env.MASTODON_INSTANCE}/oauth/token`,
        clientId: env.MASTODON_CLIENT_ID,
        clientSecret: env.MASTODON_CLIENT_SECRET,
        scope: 'read:accounts',
        profileUrl: `${env.MASTODON_INSTANCE}/api/v1/accounts/verify_credentials`,
      };
    default:
      return null;
  }
}

export function getAvailableProviders(): AuthProvider[] {
  const providers: AuthProvider[] = [];
  if (env.GITHUB_CLIENT_ID) {
    providers.push({ service: 'github', name: 'GitHub' });
  }
  if (env.GOOGLE_CLIENT_ID) {
    providers.push({ service: 'google', name: 'Google' });
  }
  if (env.MASTODON_CLIENT_ID) {
    providers.push({ service: 'mastodon', name: 'Mastodon' });
  }
  providers.push({ service: 'personal', name: 'Magic Link' });
  return providers;
}

// Magic link tokens (in-memory, use Redis in production)
const magicLinks = new Map<string, { userId: number; expiresAt: number }>();

export function createMagicLink(userId: number): string {
  const uuid = crypto.randomUUID();
  magicLinks.set(uuid, {
    userId,
    expiresAt: Date.now() + 1000 * 60 * 15, // 15 min
  });
  return uuid;
}

export function consumeMagicLink(uuid: string): number | null {
  const entry = magicLinks.get(uuid);
  if (!entry) return null;
  magicLinks.delete(uuid);
  if (Date.now() > entry.expiresAt) return null;
  return entry.userId;
}
