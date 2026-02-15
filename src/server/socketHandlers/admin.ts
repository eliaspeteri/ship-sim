import { mergePosition } from '../../lib/position';
import { prisma } from '../../lib/prisma';
import type { SocketHandlerContext } from './context';

export function registerAdminHandlers({
  io,
  socket,
  hasAdminRole,
  globalState,
  aiControllers,
  economyLedger,
  findVesselInSpace,
  getSpaceIdForSocket,
  toSimpleVesselState,
  persistVesselToDb,
}: SocketHandlerContext) {
  socket.on('admin:vesselMode', data => {
    if (!hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to change vessel mode');
      return;
    }
    const target = globalState.vessels.get(data.vesselId);
    if (!target) return;

    if (data.mode === 'ai') {
      target.desiredMode = 'ai';
      target.mode = 'ai';
      target.crewIds.clear();
    } else {
      target.desiredMode = 'player';
      target.mode = 'player';
    }
    target.lastUpdate = Date.now();
    void persistVesselToDb(target, { force: true });
  });

  socket.on('admin:vessel:stop', data => {
    if (!hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to stop vessels');
      return;
    }
    if (!data.vesselId) {
      socket.emit('error', 'Missing vessel id');
      return;
    }
    const spaceId = getSpaceIdForSocket(socket);
    const target = findVesselInSpace(data.vesselId, spaceId);
    if (!target) {
      socket.emit('error', 'Vessel not found');
      return;
    }
    target.controls = {
      ...target.controls,
      throttle: 0,
      rudderAngle: 0,
      bowThruster: 0,
    };
    target.velocity = { surge: 0, sway: 0, heave: 0 };
    target.yawRate = 0;
    target.lastUpdate = Date.now();
    void persistVesselToDb(target, { force: true });
    io.to(`space:${spaceId}`).emit('simulation:update', {
      vessels: { [target.id]: toSimpleVesselState(target) },
      partial: true,
      timestamp: Date.now(),
    });
  });

  socket.on('admin:kick', async data => {
    if (!hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to kick users');
      return;
    }
    if (!data.userId) {
      socket.emit('error', 'Missing user id for kick');
      return;
    }
    try {
      const sockets = await io.fetchSockets();
      const reason = data.reason || 'Removed by admin';
      sockets.forEach(targetSocket => {
        if (targetSocket.data.userId === data.userId) {
          targetSocket.emit('error', reason);
          targetSocket.disconnect(true);
        }
      });
      console.info(`Admin kick executed for ${data.userId}`);
    } catch (err) {
      console.error('Failed to kick user', err);
      socket.emit('error', 'Failed to kick user');
    }
  });

  socket.on('admin:vessel:remove', async data => {
    if (!hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to remove vessels');
      return;
    }
    if (!data.vesselId) {
      socket.emit('error', 'Missing vessel id');
      return;
    }
    const spaceId = getSpaceIdForSocket(socket);
    const target = findVesselInSpace(data.vesselId, spaceId);
    if (!target) {
      socket.emit('error', 'Vessel not found');
      return;
    }
    aiControllers.delete(target.id);
    economyLedger.delete(target.id);
    globalState.vessels.delete(target.id);
    for (const [key, vesselId] of globalState.userLastVessel.entries()) {
      if (vesselId === target.id) {
        globalState.userLastVessel.delete(key);
      }
    }
    try {
      await prisma.vessel.delete({ where: { id: target.id } });
    } catch (err) {
      console.warn('Failed to delete vessel record', err);
    }
    console.info(`Admin removed vessel ${target.id} from space ${spaceId}`);
  });

  socket.on('admin:vessel:move', data => {
    if (!hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to move vessels');
      return;
    }
    if (!data.vesselId) {
      socket.emit('error', 'Missing vessel id');
      return;
    }
    const spaceId = getSpaceIdForSocket(socket);
    const target = findVesselInSpace(data.vesselId, spaceId);
    if (!target) {
      socket.emit('error', 'Vessel not found');
      return;
    }
    const next = data.position;
    if (
      next.lat === undefined &&
      next.lon === undefined &&
      next.x === undefined &&
      next.y === undefined
    ) {
      socket.emit('error', 'Missing position data');
      return;
    }

    target.position = mergePosition(target.position, next);

    target.velocity = { surge: 0, sway: 0, heave: 0 };
    target.yawRate = 0;
    target.controls = {
      ...target.controls,
      throttle: 0,
      rudderAngle: 0,
      bowThruster: 0,
    };
    target.lastUpdate = Date.now();
    void persistVesselToDb(target, { force: true });
    io.to(`space:${spaceId}`).emit('vessel:teleport', {
      vesselId: target.id,
      position: target.position,
      reset: true,
    });
    io.to(`space:${spaceId}`).emit('simulation:update', {
      vessels: { [target.id]: toSimpleVesselState(target) },
      partial: true,
      timestamp: Date.now(),
    });
  });
}
