import type { SocketHandlerContext } from './context';

export function registerSimulationResyncHandler({
  socket,
  spaceId,
  effectiveUserId,
  effectiveUsername: _effectiveUsername,
  spaceMeta,
  globalState,
  toSimpleVesselState,
  defaultSpaceId,
  getEnvironmentForSpace,
  getRulesForSpace,
}: SocketHandlerContext) {
  socket.on('simulation:resync', () => {
    const currentSpace = socket.data.spaceId ?? spaceId;
    const vesselsInSpace = Object.fromEntries(
      Array.from(globalState.vessels.entries())
        .filter(([, v]) => (v.spaceId ?? defaultSpaceId) === currentSpace)
        .map(([id, v]) => [id, toSimpleVesselState(v)]),
    );
    const roles = socket.data.roles;
    socket.emit('simulation:update', {
      vessels: vesselsInSpace,
      environment: getEnvironmentForSpace(currentSpace),
      timestamp: Date.now(),
      spaceId: currentSpace,
      self: {
        userId: effectiveUserId,
        roles,
        rank: socket.data.rank,
        credits: socket.data.credits,
        experience: socket.data.experience,
        safetyScore: socket.data.safetyScore,
        spaceId: currentSpace,
        mode: socket.data.mode ?? 'spectator',
        vesselId: socket.data.vesselId,
      },
      spaceInfo: {
        id: currentSpace,
        name:
          typeof spaceMeta.name === 'string' && spaceMeta.name.length > 0
            ? spaceMeta.name
            : currentSpace,
        visibility: spaceMeta.visibility,
        kind: spaceMeta.kind,
        rankRequired: spaceMeta.rankRequired,
        rules: getRulesForSpace(currentSpace),
        role: socket.data.spaceRole ?? 'member',
      },
    });
  });
}
