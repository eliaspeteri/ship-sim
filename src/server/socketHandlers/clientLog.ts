import { recordLog } from '../observability';
import type { SocketHandlerContext } from './context';

export function registerClientLogHandler({
  socket,
  defaultSpaceId,
}: SocketHandlerContext) {
  socket.on('client:log', data => {
    const meta = data.meta ?? {};

    if (typeof data.message !== 'string') return;
    recordLog({
      level: typeof data.level === 'string' ? data.level : 'info',
      source: typeof data.source === 'string' ? data.source : 'client',
      message: data.message,
      meta: {
        ...meta,
        userId:
          typeof socket.data.userId === 'string'
            ? socket.data.userId
            : 'unknown',
        spaceId:
          typeof socket.data.spaceId === 'string'
            ? socket.data.spaceId
            : defaultSpaceId,
      },
    });
  });
}
