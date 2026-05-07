import fs from 'fs/promises';
import path from 'path';
import { filePath, projectDir } from '../lib/helpers.js';
import { execAsync } from '../lib/helpers.js';
import mime from 'mime';

export class FileService {
  async readFile(slug: string, filename: string): Promise<{ content: string; mime: string }> {
    const fp = filePath(slug, filename);
    const content = await fs.readFile(fp, 'utf-8');
    const mimeType = mime.getType(fp) || 'text/plain';
    return { content, mime: mimeType };
  }

  async readFileBinary(slug: string, filename: string): Promise<{ buffer: Buffer; mime: string }> {
    const fp = filePath(slug, filename);
    const buffer = await fs.readFile(fp);
    const mimeType = mime.getType(fp) || 'application/octet-stream';
    return { buffer, mime: mimeType };
  }

  async writeFile(slug: string, filename: string, content: string): Promise<void> {
    const fp = filePath(slug, filename);
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.writeFile(fp, content, 'utf-8');
  }

  async deleteFile(slug: string, filename: string): Promise<void> {
    const fp = filePath(slug, filename);
    const stat = await fs.stat(fp);
    if (stat.isDirectory()) {
      await fs.rm(fp, { recursive: true, force: true });
    } else {
      await fs.unlink(fp);
    }
  }

  async moveFile(slug: string, oldPath: string, newPath: string): Promise<void> {
    const src = filePath(slug, oldPath);
    const dest = filePath(slug, newPath);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.rename(src, dest);
  }

  async createFile(
    slug: string,
    filename: string,
    content: string = '',
    isDirectory: boolean = false
  ): Promise<void> {
    const fp = filePath(slug, filename);
    if (isDirectory) {
      await fs.mkdir(fp, { recursive: true });
    } else {
      await fs.mkdir(path.dirname(fp), { recursive: true });
      await fs.writeFile(fp, content, 'utf-8');
    }
  }

  async listDir(slug: string): Promise<{ dirs: string[]; files: string[] }> {
    const dir = projectDir(slug);
    const dirs: string[] = [];
    const files: string[] = [];

    async function walk(current: string, prefix: string) {
      const entries = await fs.readdir(current, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.git')) continue;
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          dirs.push(rel);
          await walk(path.join(current, entry.name), rel);
        } else {
          files.push(rel);
        }
      }
    }

    try {
      await walk(dir, '');
    } catch {
      // directory may not exist yet
    }
    return { dirs, files };
  }

  async applyPatch(slug: string, filename: string, patch: string): Promise<string> {
    // Simple line-based diff/patch: patch is a JSON array of operations
    // For the OT system, the patch format is: [{op: 'retain'|'insert'|'delete', ...}]
    const fp = filePath(slug, filename);
    let content: string;
    try {
      content = await fs.readFile(fp, 'utf-8');
    } catch {
      content = '';
    }

    try {
      const ops = JSON.parse(patch);
      let result = '';
      let pos = 0;

      for (const op of ops) {
        if (op.op === 'retain' || op.type === 'retain') {
          const count = op.count || op.length || 0;
          result += content.slice(pos, pos + count);
          pos += count;
        } else if (op.op === 'insert' || op.type === 'insert') {
          result += op.text || op.value || '';
        } else if (op.op === 'delete' || op.type === 'delete') {
          const count = op.count || op.length || 0;
          pos += count;
        }
      }

      // Append any remaining content
      if (pos < content.length) {
        result += content.slice(pos);
      }

      await fs.writeFile(fp, result, 'utf-8');
      return result;
    } catch {
      // If patch parsing fails, treat as full replacement
      await fs.writeFile(fp, patch, 'utf-8');
      return patch;
    }
  }

  async formatFile(slug: string, filename: string): Promise<string> {
    const fp = filePath(slug, filename);
    const ext = path.extname(filename);

    // Attempt prettier formatting via npx
    try {
      const { stdout } = await execAsync(`npx prettier --write "${fp}"`, {
        timeout: 10000,
      });
      const content = await fs.readFile(fp, 'utf-8');
      return content;
    } catch {
      // Return file as-is if formatting fails
      const content = await fs.readFile(fp, 'utf-8');
      return content;
    }
  }

  async saveUpload(slug: string, filename: string, data: Buffer): Promise<void> {
    const fp = filePath(slug, filename);
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.writeFile(fp, data);
  }
}

export const fileService = new FileService();
