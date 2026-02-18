import type { SocketHandlerContext } from './context';

export function registerStationHandlers({
  io,
  socket,
  spaceId,
  effectiveUserId,
  effectiveUsername,
  globalState,
  getVesselIdForUser,
  updateStationAssignment,
  hasAdminRole,
  toSimpleVesselState,
  persistVesselToDb,
  defaultSpaceId,
}: SocketHandlerContext) {
  socket.on('vessel:helm', data => {
    const currentUserId = effectiveUserId;
    const currentUsername = effectiveUsername;
    const vesselKey =
      getVesselIdForUser(currentUserId, spaceId) ?? currentUserId;
    let vessel = globalState.vessels.get(vesselKey);
    if (
      !vessel ||
      (vessel.spaceId ?? defaultSpaceId) !== spaceId ||
      !vessel.crewIds.has(currentUserId)
    ) {
      vessel = Array.from(globalState.vessels.values()).find(
        candidate =>
          (candidate.spaceId ?? defaultSpaceId) === spaceId &&
          candidate.crewIds.has(currentUserId),
      );
    }
    if (!vessel || (vessel.spaceId ?? defaultSpaceId) !== spaceId) return;
    if (!vessel.crewIds.has(currentUserId)) {
      socket.emit('error', 'You are not crew on this vessel');
      return;
    }
    const result = updateStationAssignment(
      vessel,
      'helm',
      data.action,
      currentUserId,
      currentUsername,
      hasAdminRole(socket),
    );
    if (!result.ok) {
      socket.emit(
        'error',
        typeof result.message === 'string' && result.message.length > 0
          ? result.message
          : 'Unable to change helm',
      );
      return;
    }
    vessel.lastUpdate = Date.now();
    void persistVesselToDb(vessel, { force: true });
    io.to(`space:${spaceId}`).emit('simulation:update', {
      vessels: { [vessel.id]: toSimpleVesselState(vessel) },
      partial: true,
      timestamp: Date.now(),
    });
  });

  socket.on('vessel:station', data => {
    const currentUserId = effectiveUserId;
    const currentUsername = effectiveUsername;
    const vesselKey =
      getVesselIdForUser(currentUserId, spaceId) ?? currentUserId;
    let vessel = globalState.vessels.get(vesselKey);
    if (
      !vessel ||
      (vessel.spaceId ?? defaultSpaceId) !== spaceId ||
      !vessel.crewIds.has(currentUserId)
    ) {
      vessel = Array.from(globalState.vessels.values()).find(
        candidate =>
          (candidate.spaceId ?? defaultSpaceId) === spaceId &&
          candidate.crewIds.has(currentUserId),
      );
    }
    if (!vessel || (vessel.spaceId ?? defaultSpaceId) !== spaceId) return;
    if (!vessel.crewIds.has(currentUserId) && !hasAdminRole(socket)) {
      socket.emit('error', 'You are not crew on this vessel');
      return;
    }
    const station =
      data.station === 'engine' || data.station === 'radio'
        ? data.station
        : 'helm';
    const result = updateStationAssignment(
      vessel,
      station,
      data.action,
      currentUserId,
      currentUsername,
      hasAdminRole(socket),
    );
    if (!result.ok) {
      socket.emit(
        'error',
        typeof result.message === 'string' && result.message.length > 0
          ? result.message
          : 'Unable to change station',
      );
      return;
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
