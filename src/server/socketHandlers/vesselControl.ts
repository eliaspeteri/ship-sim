import { applyFailureControlLimits } from '../../lib/failureControls';
import type { SocketHandlerContext } from './context';

export function registerVesselControlHandler({
  socket,
  spaceId,
  effectiveUserId,
  effectiveUsername,
  isPlayerOrHigher,
  globalState,
  getVesselIdForUser,
  ensureVesselForUser,
  hasAdminRole,
  clamp,
  rudderMaxAngleRad,
  defaultSpaceId,
}: SocketHandlerContext) {
  const logControls = process.env.SIM_CONTROL_LOGS === 'true';
  socket.on('vessel:control', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    if (!currentUserId) return;
    if (!isPlayerOrHigher()) {
      socket.emit('error', 'Not authorized to control a vessel');
      return;
    }
    if ((socket.data as { mode?: string }).mode === 'spectator') {
      socket.emit('error', 'Spectator mode cannot control vessels');
      return;
    }

    const vesselKey =
      getVesselIdForUser(currentUserId, spaceId) || currentUserId;
    const vesselRecord = globalState.vessels.get(vesselKey);
    if (!vesselRecord || (vesselRecord.spaceId || defaultSpaceId) !== spaceId) {
      console.warn('No vessel for user, creating on control', currentUserId);
      ensureVesselForUser(currentUserId, effectiveUsername, spaceId);
    }
    const target = globalState.vessels.get(
      getVesselIdForUser(currentUserId, spaceId) || currentUserId,
    );
    if (!target || (target.spaceId || defaultSpaceId) !== spaceId) return;

    const isHelm = target.helmUserId === currentUserId;
    const isEngine = target.engineUserId === currentUserId;
    const isAdmin = hasAdminRole(socket);
    const engineAvailable = !target.engineUserId || isEngine || isAdmin;

    if (data.rudderAngle !== undefined && !isHelm && !isAdmin) {
      socket.emit(
        'error',
        target.helmUserId
          ? `Helm held by ${target.helmUsername || target.helmUserId}`
          : 'Claim the helm to steer',
      );
      return;
    }

    if (
      (data.throttle !== undefined || data.ballast !== undefined) &&
      !engineAvailable
    ) {
      if (logControls) {
        console.info('[controls] reject engine control', {
          userId: currentUserId,
          vesselId: target.id,
          engineUserId: target.engineUserId,
          throttle: data.throttle,
          ballast: data.ballast,
        });
      }
      socket.emit(
        'error',
        target.engineUserId
          ? `Engine station held by ${target.engineUsername || target.engineUserId}`
          : 'Claim the engine station to adjust throttle/ballast',
      );
      return;
    }

    if (data.throttle !== undefined) {
      target.controls.throttle = clamp(data.throttle, -1, 1);
    }
    if (data.rudderAngle !== undefined) {
      target.controls.rudderAngle = clamp(
        data.rudderAngle,
        -rudderMaxAngleRad,
        rudderMaxAngleRad,
      );
    }
    if (data.ballast !== undefined) {
      target.controls.ballast = clamp(data.ballast, 0, 1);
    }
    const limitedControls = applyFailureControlLimits(
      target.controls,
      target.failureState,
      target.damageState,
    );
    target.controls = {
      ...target.controls,
      ...limitedControls,
    };
    target.lastUpdate = Date.now();

    if (logControls) {
      console.info('[controls] applied', {
        userId: currentUserId,
        vesselId: target.id,
        incoming: data,
        applied: target.controls,
        failureState: target.failureState,
        damageState: target.damageState,
      });
    }
    console.info(
      `Control applied for ${currentUserId}: throttle=${target.controls.throttle.toFixed(
        2,
      )} rudder=${target.controls.rudderAngle.toFixed(2)}`,
    );
  });
}
