import { setConnectedClients } from '../metrics';
import type { SocketHandlerContext } from './context';

export function registerDisconnectHandler({
  io,
  socket,
  spaceId,
  effectiveUserId,
  effectiveUsername,
  getVesselIdForUser,
  globalState,
  activeUserSockets,
}: SocketHandlerContext) {
  socket.on('disconnect', () => {
    const currentUserId = socket.data.userId || effectiveUserId;
    const currentUsername = socket.data.username || effectiveUsername;
    console.info(`Socket disconnected: ${currentUsername} (${currentUserId})`);
    setConnectedClients(io.engine.clientsCount);

    const activeSocketId =
      currentUserId && activeUserSockets.get(currentUserId);
    if (activeSocketId && activeSocketId !== socket.id) {
      return;
    }

    const roles = socket.data.roles;
    const isGuestNow =
      roles.includes('guest') &&
      !roles.some(
        role => role === 'player' || role === 'spectator' || role === 'admin',
      );

    if (!isGuestNow) {
      const vesselId =
        currentUserId && getVesselIdForUser(currentUserId, spaceId);
      const vesselRecord = vesselId
        ? globalState.vessels.get(vesselId)
        : undefined;
      if (vesselRecord) {
        vesselRecord.crewIds.delete(currentUserId);
        if (vesselRecord.helmUserId === currentUserId) {
          vesselRecord.helmUserId = null;
          vesselRecord.helmUsername = null;
        }
        if (vesselRecord.engineUserId === currentUserId) {
          vesselRecord.engineUserId = null;
          vesselRecord.engineUsername = null;
        }
        if (vesselRecord.radioUserId === currentUserId) {
          vesselRecord.radioUserId = null;
          vesselRecord.radioUsername = null;
        }
        if (vesselRecord.crewIds.size === 0) {
          vesselRecord.mode = vesselRecord.desiredMode;
          vesselRecord.lastCrewAt = Date.now();
        }
      }
    }

    if (currentUserId) {
      socket
        .to(`space:${spaceId}`)
        .emit('vessel:left', { userId: currentUserId });
    }
  });
}
