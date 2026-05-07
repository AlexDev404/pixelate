import { fileService } from '../services/file.service.js';
import { gitService } from '../services/git.service.js';
import { comms } from './comms.js';

export class OTHandler {
  private connectionId: string;
  private projectSlug: string;
  private userId: number | null;
  private send: (data: string) => void;

  constructor(
    connectionId: string,
    projectSlug: string,
    userId: number | null,
    send: (data: string) => void
  ) {
    this.connectionId = connectionId;
    this.projectSlug = projectSlug;
    this.userId = userId;
    this.send = send;

    comms.addConnection(connectionId, send, projectSlug, userId);
  }

  destroy() {
    comms.removeConnection(this.connectionId);
  }

  private respond(type: string, detail: Record<string, unknown>) {
    this.send(JSON.stringify({ type: `file-tree:${type}`, detail }));
  }

  async handleLoad(detail: { basePath?: string; reconnect?: boolean }) {
    try {
      const listing = await fileService.listDir(this.projectSlug);
      this.respond('load', {
        ...listing,
        seqnum: comms.getCurrentSeqnum(),
        basePath: detail.basePath || '',
      });
    } catch (err) {
      this.respond('load', { error: String(err), dirs: [], files: [] });
    }
  }

  async handleSync(detail: { seqnum?: number }) {
    const clientSeqnum = detail.seqnum || 0;
    const changes = comms.getChangesSince(clientSeqnum);

    this.respond('sync', {
      seqnum: comms.getCurrentSeqnum(),
      changes,
    });
  }

  async handleCreate(detail: { path?: string; isFile?: boolean; content?: string }) {
    if (!detail.path) {
      this.respond('create', { error: 'Path required' });
      return;
    }

    try {
      const isDir = detail.isFile === false;
      await fileService.createFile(
        this.projectSlug,
        detail.path,
        detail.content || '',
        isDir
      );

      const seqnum = comms.addToChangelog('create', {
        path: detail.path,
        isFile: detail.isFile !== false,
      });

      await gitService.commit(this.projectSlug, `Created ${detail.path}`);

      this.respond('create', { success: true, path: detail.path, seqnum });
      comms.broadcast(this.projectSlug, 'create', {
        path: detail.path,
        isFile: detail.isFile !== false,
      }, this.connectionId);
    } catch (err) {
      this.respond('create', { error: String(err) });
    }
  }

  async handleDelete(detail: { path?: string }) {
    if (!detail.path) {
      this.respond('delete', { error: 'Path required' });
      return;
    }

    try {
      await fileService.deleteFile(this.projectSlug, detail.path);

      const seqnum = comms.addToChangelog('delete', { path: detail.path });
      await gitService.commit(this.projectSlug, `Deleted ${detail.path}`);

      this.respond('delete', { success: true, path: detail.path, seqnum });
      comms.broadcast(this.projectSlug, 'delete', {
        path: detail.path,
      }, this.connectionId);
    } catch (err) {
      this.respond('delete', { error: String(err) });
    }
  }

  async handleMove(detail: { oldPath?: string; newPath?: string; isFile?: boolean }) {
    if (!detail.oldPath || !detail.newPath) {
      this.respond('move', { error: 'oldPath and newPath required' });
      return;
    }

    try {
      await fileService.moveFile(this.projectSlug, detail.oldPath, detail.newPath);

      const seqnum = comms.addToChangelog('move', {
        oldPath: detail.oldPath,
        newPath: detail.newPath,
        isFile: detail.isFile,
      });

      await gitService.commit(
        this.projectSlug,
        `Moved ${detail.oldPath} to ${detail.newPath}`
      );

      this.respond('move', {
        success: true,
        oldPath: detail.oldPath,
        newPath: detail.newPath,
        seqnum,
      });
      comms.broadcast(this.projectSlug, 'move', {
        oldPath: detail.oldPath,
        newPath: detail.newPath,
        isFile: detail.isFile,
      }, this.connectionId);
    } catch (err) {
      this.respond('move', { error: String(err) });
    }
  }

  async handleUpdate(detail: { path?: string; type?: string; update?: string }) {
    if (!detail.path || !detail.update) {
      this.respond('update', { error: 'path and update required' });
      return;
    }

    try {
      let content: string;
      if (detail.type === 'diff') {
        content = await fileService.applyPatch(
          this.projectSlug,
          detail.path,
          detail.update
        );
      } else {
        await fileService.writeFile(this.projectSlug, detail.path, detail.update);
        content = detail.update;
      }

      const seqnum = comms.addToChangelog('update', {
        path: detail.path,
        type: detail.type,
      });

      // Don't commit on every update — batch via a debounce in production
      this.respond('update', { success: true, path: detail.path, seqnum });
      comms.broadcast(this.projectSlug, 'update', {
        path: detail.path,
        type: detail.type === 'diff' ? 'full' : detail.type,
        update: content,
      }, this.connectionId);
    } catch (err) {
      this.respond('update', { error: String(err) });
    }
  }

  async handleRead(detail: { path?: string }) {
    if (!detail.path) {
      this.respond('read', { error: 'Path required' });
      return;
    }

    try {
      const { content } = await fileService.readFile(this.projectSlug, detail.path);
      this.respond('read', { path: detail.path, content });
    } catch (err) {
      this.respond('read', { error: String(err), path: detail.path });
    }
  }

  async handleFileHistory(detail: { path?: string }) {
    if (!detail.path) {
      this.respond('filehistory', { error: 'Path required' });
      return;
    }

    try {
      const history = await gitService.getFileHistory(this.projectSlug, detail.path);
      this.respond('filehistory', { path: detail.path, history });
    } catch (err) {
      this.respond('filehistory', { error: String(err), path: detail.path });
    }
  }

  handleKeepalive() {
    this.respond('keepalive', { time: Date.now() });
  }
}
