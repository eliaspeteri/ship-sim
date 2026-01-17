import type { SocketHandlerContext } from './context';

export function registerSimulationStateHandler({
  socket,
  hasAdminRole,
}: SocketHandlerContext) {
  socket.on('simulation:state', data => {
    if (!hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to control simulation');
      return;
    }
    console.info(`Simulation state update from ${socket.data.username}:`, data);
    // Future: apply global sim changes
  });
}
