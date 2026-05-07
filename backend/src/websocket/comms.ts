import type { WSMessageType } from '@pixelate/types';

interface ChangelogEntry {
  seqnum: number;
  action: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export class Comms {
  private seqnum = 0;
  private changelog: ChangelogEntry[] = [];
  private connections = new Map<string, {
    send: (data: string) => void;
    projectSlug: string;
    userId: number | null;
  }>();

  addConnection(
    id: string,
    send: (data: string) => void,
    projectSlug: string,
    userId: number | null
  ) {
    this.connections.set(id, { send, projectSlug, userId });
  }

  removeConnection(id: string) {
    this.connections.delete(id);
  }

  getNextSeqnum(): number {
    return ++this.seqnum;
  }

  getCurrentSeqnum(): number {
    return this.seqnum;
  }

  addToChangelog(action: string, data: Record<string, unknown>): number {
    const seqnum = this.getNextSeqnum();
    this.changelog.push({
      seqnum,
      action,
      data,
      timestamp: Date.now(),
    });

    // Keep changelog bounded
    if (this.changelog.length > 1000) {
      this.changelog = this.changelog.slice(-500);
    }

    return seqnum;
  }

  getChangesSince(sinceSeqnum: number): ChangelogEntry[] {
    return this.changelog.filter((entry) => entry.seqnum > sinceSeqnum);
  }

  broadcast(
    projectSlug: string,
    action: string,
    data: Record<string, unknown>,
    excludeId?: string
  ) {
    const message = JSON.stringify({
      type: `file-tree:${action}`,
      detail: { ...data, seqnum: this.getCurrentSeqnum() },
    });

    for (const [id, conn] of this.connections) {
      if (conn.projectSlug === projectSlug && id !== excludeId) {
        try {
          conn.send(message);
        } catch {
          this.connections.delete(id);
        }
      }
    }
  }

  broadcastToAll(action: string, data: Record<string, unknown>) {
    const message = JSON.stringify({
      type: `file-tree:${action}`,
      detail: data,
    });

    for (const [id, conn] of this.connections) {
      try {
        conn.send(message);
      } catch {
        this.connections.delete(id);
      }
    }
  }

  getConnectionCount(projectSlug?: string): number {
    if (!projectSlug) return this.connections.size;
    let count = 0;
    for (const conn of this.connections.values()) {
      if (conn.projectSlug === projectSlug) count++;
    }
    return count;
  }
}

export const comms = new Comms();
