import {
  bodyVelocityFromWorld,
  mergePosition,
  speedFromWorldVelocity,
} from '../../lib/position';
import type { SocketHandlerContext } from './context';

export function registerVesselUpdateHandler({
  socket,
  spaceId,
  effectiveUserId,
  effectiveUsername,
  isPlayerOrHigher,
  globalState,
  getVesselIdForUser,
  ensureVesselForUser,
  hasAdminRole,
  clampHeading,
  persistVesselToDb,
  toSimpleVesselState,
  defaultSpaceId,
}: SocketHandlerContext) {
  socket.on('vessel:update', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    if (!currentUserId) {
      console.warn('Ignoring vessel:update from unidentified user');

      return;
    }
    if (!isPlayerOrHigher()) {
      console.info('Ignoring vessel:update from non-player');
      return;
    }
    if ((socket.data as { mode?: string }).mode === 'spectator') {
      return;
    }

    const vesselKey =
      getVesselIdForUser(currentUserId, spaceId) || currentUserId;
    const vesselRecord = globalState.vessels.get(vesselKey);
    if (!vesselRecord || (vesselRecord.spaceId || defaultSpaceId) !== spaceId) {
      console.warn('No vessel for user, creating on update', currentUserId);
      ensureVesselForUser(currentUserId, effectiveUsername, spaceId);
    }
    const target = globalState.vessels.get(
      getVesselIdForUser(currentUserId, spaceId) || currentUserId,
    );
    if (!target || (target.spaceId || defaultSpaceId) !== spaceId) return;
    const canSendUpdates =
      hasAdminRole(socket) ||
      target.helmUserId === currentUserId ||
      target.ownerId === currentUserId;
    if (!canSendUpdates) {
      return;
    }

    const prevPosition = mergePosition(target.position);
    const prevUpdate = target.lastUpdate || Date.now();
    target.position = mergePosition(target.position, data.position);
    target.orientation = {
      ...target.orientation,
      ...data.orientation,
      heading: clampHeading(data.orientation.heading),
    };
    target.velocity = data.velocity;
    const dt = (Date.now() - prevUpdate) / 1000;
    if (dt > 0.1) {
      const nextPosition = mergePosition(target.position);
      const dx = (nextPosition.x ?? 0) - (prevPosition.x ?? 0);
      const dy = (nextPosition.y ?? 0) - (prevPosition.y ?? 0);
      const world = { x: dx / dt, y: dy / dt };
      const derivedSpeed = speedFromWorldVelocity(world);
      const reportedSpeed = Math.hypot(data.velocity.surge, data.velocity.sway);
      if (
        Number.isFinite(derivedSpeed) &&
        derivedSpeed > 0.05 &&
        reportedSpeed < 0.01
      ) {
        const derivedBody = bodyVelocityFromWorld(
          target.orientation.heading,
          world,
        );
        target.velocity = {
          ...target.velocity,
          ...derivedBody,
          heave: data.velocity.heave,
        };
      }
    }
    if (data.angularVelocity && typeof data.angularVelocity.yaw === 'number') {
      target.yawRate = data.angularVelocity.yaw;
    }
    target.lastUpdate = Date.now();
    void persistVesselToDb(target);

    socket.to(`space:${spaceId}`).emit('simulation:update', {
      vessels: {
        [target.id]: toSimpleVesselState(target),
      },
      partial: true,
      timestamp: target.lastUpdate,
    });
  });
}
