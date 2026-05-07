import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { env } from './env.js';

export const execAsync = promisify(execCb);

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function projectDir(slug: string): string {
  return path.join(env.PROJECT_DIR, slug);
}

export function filePath(slug: string, filename: string): string {
  const resolved = path.resolve(projectDir(slug), filename);
  const base = path.resolve(projectDir(slug));
  if (!resolved.startsWith(base)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

export function randomId(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function timestamp(): string {
  return new Date().toISOString();
}

export function parseIntParam(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}
