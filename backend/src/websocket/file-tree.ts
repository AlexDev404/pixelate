import { OTHandler } from './ot-handler.js';
import { FILE_TREE_PREFIX, type WSMessageType } from '@pixelate/types';

export function handleFileTreeMessage(handler: OTHandler, raw: string) {
  let parsed: { type?: string; detail?: Record<string, unknown> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return; // Ignore malformed messages
  }

  const { type, detail } = parsed;
  if (!type || !type.startsWith(FILE_TREE_PREFIX)) return;

  const action = type.slice(FILE_TREE_PREFIX.length) as WSMessageType;
  const payload = detail || {};

  switch (action) {
    case 'load':
      handler.handleLoad(payload as { basePath?: string; reconnect?: boolean });
      break;
    case 'sync':
      handler.handleSync(payload as { seqnum?: number });
      break;
    case 'create':
      handler.handleCreate(payload as { path?: string; isFile?: boolean; content?: string });
      break;
    case 'delete':
      handler.handleDelete(payload as { path?: string });
      break;
    case 'move':
      handler.handleMove(payload as { oldPath?: string; newPath?: string; isFile?: boolean });
      break;
    case 'update':
      handler.handleUpdate(payload as { path?: string; type?: string; update?: string });
      break;
    case 'read':
      handler.handleRead(payload as { path?: string });
      break;
    case 'filehistory':
      handler.handleFileHistory(payload as { path?: string });
      break;
    case 'keepalive':
      handler.handleKeepalive();
      break;
  }
}
