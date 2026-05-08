// WebSocket message types
export const FILE_TREE_PREFIX = 'file-tree:';

export type WSMessageType =
  | 'load'
  | 'sync'
  | 'create'
  | 'delete'
  | 'move'
  | 'update'
  | 'read'
  | 'filehistory'
  | 'keepalive';

export interface WSMessage {
  type: `${typeof FILE_TREE_PREFIX}${WSMessageType}`;
  detail: Record<string, unknown>;
}

export interface WSLoadPayload {
  basePath: string;
  reconnect?: boolean;
}

export interface WSSyncPayload {
  seqnum: number;
}

export interface WSCreatePayload {
  path: string;
  isFile: boolean;
  content?: string;
}

export interface WSDeletePayload {
  path: string;
}

export interface WSMovePayload {
  isFile: boolean;
  oldPath: string;
  newPath: string;
}

export interface WSUpdatePayload {
  path: string;
  type: 'diff' | 'full';
  update: string;
}

export interface WSReadPayload {
  path: string;
}

export interface WSFileHistoryPayload {
  path: string;
}

// API response types
export interface DirListing {
  dirs: string[];
  files: string[];
}

export interface HealthStatus {
  healthy: boolean;
  message?: string;
  port?: number;
}

export interface ProjectHistoryEntry {
  hash: string;
  message: string;
  date: string;
}

export interface FileHistoryEntry {
  hash: string;
  message: string;
  date: string;
  diff?: string;
}

export interface AuthProvider {
  service: string;
  name: string;
  icon?: string;
}
