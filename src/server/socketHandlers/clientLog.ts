import { recordLog } from '../observability';
import type { SocketHandlerContext } from './context';

export function registerClientLogHandler({
  socket,
  defaultSpaceId,
}: SocketHandlerContext) {
  socket.on('client:log', data => {
    if (!data || typeof data.message !== 'string') return;
    recordLog({
      level: data.level || 'info',
      source: data.source || 'client',
      message: data.message,
      meta: {
        ...((data.meta as Record<string, unknown>) || {}),
        userId: socket.data.userId || 'unknown',
        spaceId: socket.data.spaceId || defaultSpaceId,
      },
    });
  });
}
