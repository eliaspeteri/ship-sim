import { distanceMeters } from '../../lib/position';
import { resolvePortForPosition } from '../economy';
import { RulesetType } from '../../types/rules.types';
import type { SocketHandlerContext } from './context';

const SWITCH_NEARBY_METERS = 1500;

export function registerUserModeHandler({
  io,
  socket,
  spaceId,
  effectiveUserId,
  effectiveUsername,
  isPlayerOrHigher,
  hasAdminRole,
  globalState,
  getVesselIdForUser,
  ensureVesselForUser,
  assignStationsForCrew,
  detachUserFromCurrentVessel,
  updateSocketVesselRoom,
  toSimpleVesselState,
  persistVesselToDb,
  defaultSpaceId,
  aiControllers,
  spaceMeta,
  getRulesForSpace,
}: SocketHandlerContext) {
  socket.on('user:mode', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    const wantsPlayer = data.mode === 'player';
    const rankEligible =
      (socket.data.rank ?? 1) >= (spaceMeta.rankRequired ?? 1);

    if (wantsPlayer && !isPlayerOrHigher()) {
      socket.emit('error', 'Your role does not permit player mode');
      return;
    }
    if (wantsPlayer && !rankEligible) {
      socket.emit(
        'error',
        `Rank ${spaceMeta.rankRequired ?? 1} required for this space`,
      );
      return;
    }

    if (data.mode === 'spectator') {
      const rules = getRulesForSpace(spaceId) as { type?: RulesetType };
      const rulesType = rules.type || RulesetType.CASUAL;
      const switchRestricted =
        rulesType === RulesetType.REALISM || rulesType === RulesetType.EXAM;
      if (switchRestricted && !hasAdminRole(socket)) {
        const currentVesselId = getVesselIdForUser(currentUserId, spaceId);
        const currentVessel = currentVesselId
          ? globalState.vessels.get(currentVesselId)
          : null;
        if (currentVessel) {
          const currentPort = resolvePortForPosition(currentVessel.position);
          let nearby = false;
          if (!currentPort) {
            for (const vessel of globalState.vessels.values()) {
              if (vessel.id === currentVessel.id) continue;
              if ((vessel.spaceId || defaultSpaceId) !== spaceId) continue;
              const distance = distanceMeters(
                currentVessel.position,
                vessel.position,
              );
              if (distance <= SWITCH_NEARBY_METERS) {
                nearby = true;
                break;
              }
            }
            if (!nearby) {
              socket.emit(
                'error',
                'Spectator mode is only allowed in port or near another vessel.',
              );
              return;
            }
          }
        }
      }
      detachUserFromCurrentVessel(currentUserId, spaceId);
      updateSocketVesselRoom(socket, spaceId, null);
      socket.data.mode = 'spectator';
      return;
    }

    const targetId =
      getVesselIdForUser(currentUserId, spaceId) || currentUserId;
    let target = globalState.vessels.get(targetId);
    if (!target && wantsPlayer) {
      target = ensureVesselForUser(currentUserId, effectiveUsername, spaceId);
    }
    if (!target || (target.spaceId || defaultSpaceId) !== spaceId) return;

    target.crewIds.add(currentUserId);
    target.crewNames.set(currentUserId, effectiveUsername);
    assignStationsForCrew(target, currentUserId, effectiveUsername);
    target.desiredMode = 'player';
    target.mode = 'player';
    aiControllers.delete(target.id);
    target.lastCrewAt = Date.now();
    target.lastUpdate = Date.now();
    updateSocketVesselRoom(socket, spaceId, target.id);
    socket.data.mode = 'player';
    void persistVesselToDb(target, { force: true });

    io.to(`space:${spaceId}`).emit('simulation:update', {
      vessels: { [target.id]: toSimpleVesselState(target) },
      partial: true,
      timestamp: Date.now(),
    });
  });
}
