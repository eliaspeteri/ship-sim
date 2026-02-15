import { resolvePortForPosition } from '../economy';
import type { SocketHandlerContext } from './context';

export function registerVesselStorageHandler({
  io,
  socket,
  spaceId,
  effectiveUserId,
  globalState,
  getVesselIdForUser,
  hasAdminRole,
  persistVesselToDb,
  toSimpleVesselState,
  defaultSpaceId,
}: SocketHandlerContext) {
  socket.on('vessel:storage', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    if (!currentUserId) return;
    const vesselId =
      data.vesselId ||
      getVesselIdForUser(currentUserId, spaceId) ||
      currentUserId;
    const vessel = globalState.vessels.get(vesselId);
    if (!vessel || (vessel.spaceId || defaultSpaceId) !== spaceId) {
      socket.emit('error', 'Vessel not found');
      return;
    }
    const isOperator =
      vessel.ownerId === currentUserId ||
      vessel.chartererId === currentUserId ||
      vessel.leaseeId === currentUserId;
    if (!isOperator && !hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to store this vessel');
      return;
    }
    const action = data.action === 'activate' ? 'activate' : 'store';
    if (action === 'store') {
      const port = resolvePortForPosition(vessel.position);
      if (!port) {
        socket.emit('error', 'Vessel must be in port to store');
        return;
      }
      const speed = Math.hypot(vessel.velocity.surge, vessel.velocity.sway);
      if (speed > 0.2) {
        socket.emit('error', 'Stop the vessel before storing');
        return;
      }
      vessel.status = 'stored';
      vessel.storagePortId = port.id;
      vessel.storedAt = Date.now();
      vessel.mode = 'ai';
      vessel.desiredMode = 'ai';
      vessel.controls.throttle = 0;
      vessel.controls.rudderAngle = 0;
      vessel.controls.bowThruster = 0;
      vessel.crewIds.clear();
      vessel.crewNames.clear();
      vessel.helmUserId = null;
      vessel.helmUsername = null;
      vessel.engineUserId = null;
      vessel.engineUsername = null;
      vessel.radioUserId = null;
      vessel.radioUsername = null;
    } else {
      vessel.status = 'active';
      vessel.storagePortId = null;
      vessel.storedAt = null;
      vessel.desiredMode = 'player';
    }
    vessel.lastUpdate = Date.now();
    void persistVesselToDb(vessel, { force: true });
    io.to(`space:${spaceId}`).emit('simulation:update', {
      vessels: { [vessel.id]: toSimpleVesselState(vessel) },
      partial: true,
      timestamp: Date.now(),
    });
  });
}
