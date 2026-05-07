import 'dotenv/config';

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/pixelate',
  SESSION_SECRET: process.env.SESSION_SECRET || 'change-me-in-production',
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  PROJECT_DIR: process.env.PROJECT_DIR || './projects',
  CONTAINER_SECRET: process.env.CONTAINER_SECRET || 'container-secret',

  // OAuth
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  MASTODON_INSTANCE: process.env.MASTODON_INSTANCE || 'https://mastodon.social',
  MASTODON_CLIENT_ID: process.env.MASTODON_CLIENT_ID || '',
  MASTODON_CLIENT_SECRET: process.env.MASTODON_CLIENT_SECRET || '',
  MAGIC_LINK_SECRET: process.env.MAGIC_LINK_SECRET || 'magic-link-secret',

  // Caddy / project hosting
  WEB_EDITOR_HOSTNAME: process.env.WEB_EDITOR_HOSTNAME || 'localhost:5173',
  WEB_EDITOR_APPS_HOSTNAME: process.env.WEB_EDITOR_APPS_HOSTNAME || 'apps.localhost',
  WEB_EDITOR_APP_SECRET: process.env.WEB_EDITOR_APP_SECRET || 'change-me',
  CADDY_ADMIN_URL: process.env.CADDY_ADMIN_URL || 'http://localhost:2019',
  BYPASS_CADDY: process.env.BYPASS_CADDY || 'true',
  TLS_DNS_PROVIDER: process.env.TLS_DNS_PROVIDER || '',
  TLS_DNS_API_KEY: process.env.TLS_DNS_API_KEY || '',

  // Content directories
  CONTENT_DIR: process.env.CONTENT_DIR || './content',

  // Docker
  DOCKER_NETWORK: process.env.DOCKER_NETWORK || 'pixelate-net',
  DOCKER_REGISTRY: process.env.DOCKER_REGISTRY || '',

  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;
