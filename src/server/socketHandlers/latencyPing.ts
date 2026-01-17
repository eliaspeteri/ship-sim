import { recordMetric } from '../metrics';
import type { SocketHandlerContext } from './context';

export function registerLatencyPingHandler({ socket }: SocketHandlerContext) {
  socket.on('latency:ping', data => {
    if (!data || typeof data.sentAt !== 'number') return;
    socket.emit('latency:pong', {
      sentAt: data.sentAt,
      serverAt: Date.now(),
    });
    recordMetric('socketLatency', Date.now() - data.sentAt);
  });
}
