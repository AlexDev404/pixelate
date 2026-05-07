import { execAsync, projectDir } from '../lib/helpers.js';
import type { ProjectHistoryEntry, FileHistoryEntry } from '@pixelate/types';
import fs from 'fs/promises';
import path from 'path';

export class GitService {
  async init(slug: string): Promise<void> {
    const dir = projectDir(slug);
    try {
      await execAsync(`git init "${dir}"`);
      await execAsync(`git -C "${dir}" add -A`);
      await execAsync(`git -C "${dir}" commit -m "Initial commit" --allow-empty`);
    } catch {
      // git may not be available or dir issues
    }
  }

  async commit(slug: string, message: string): Promise<void> {
    const dir = projectDir(slug);
    try {
      await execAsync(`git -C "${dir}" add -A`);
      await execAsync(`git -C "${dir}" commit -m "${message.replace(/"/g, '\\"')}" --allow-empty`);
    } catch {
      // nothing to commit or git error
    }
  }

  async getHistory(slug: string, limit = 50): Promise<ProjectHistoryEntry[]> {
    const dir = projectDir(slug);
    try {
      const { stdout } = await execAsync(
        `git -C "${dir}" log --pretty=format:"%H|%s|%ai" -n ${limit}`
      );
      if (!stdout.trim()) return [];
      return stdout
        .trim()
        .split('\n')
        .map((line) => {
          const [hash, message, date] = line.split('|');
          return { hash, message, date };
        });
    } catch {
      return [];
    }
  }

  async getFileHistory(slug: string, filename: string, limit = 20): Promise<FileHistoryEntry[]> {
    const dir = projectDir(slug);
    try {
      const { stdout } = await execAsync(
        `git -C "${dir}" log --pretty=format:"%H|%s|%ai" -n ${limit} -- "${filename}"`
      );
      if (!stdout.trim()) return [];
      return stdout
        .trim()
        .split('\n')
        .map((line) => {
          const [hash, message, date] = line.split('|');
          return { hash, message, date };
        });
    } catch {
      return [];
    }
  }

  async getCommitDiff(slug: string, hash: string): Promise<string> {
    const dir = projectDir(slug);
    try {
      const { stdout } = await execAsync(`git -C "${dir}" show --stat ${hash}`);
      return stdout;
    } catch {
      return '';
    }
  }

  async rewindTo(slug: string, hash: string): Promise<void> {
    const dir = projectDir(slug);
    await execAsync(`git -C "${dir}" checkout ${hash} -- .`);
    await this.commit(slug, `Reverted to ${hash}`);
  }

  async getFileAtCommit(slug: string, filename: string, hash: string): Promise<string> {
    const dir = projectDir(slug);
    try {
      const { stdout } = await execAsync(`git -C "${dir}" show ${hash}:"${filename}"`);
      return stdout;
    } catch {
      return '';
    }
  }
}

export const gitService = new GitService();
