import { applyFailureControlLimits } from '../../lib/failureControls';
import {
  ECONOMY_THROTTLE_EPS,
  getEconomyProfile,
  resolvePortForPosition,
} from '../economyAccess';

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
  resolveChargeUserId,
  clamp,
  rudderMaxAngleRad,
  defaultSpaceId,
}: SocketHandlerContext) {
  const logControls = process.env.SIM_CONTROL_LOGS === 'true';
  socket.on('vessel:control', data => {
    const currentUserId = effectiveUserId;
    void (async () => {
      if (!isPlayerOrHigher()) {
        socket.emit('error', 'Not authorized to control a vessel');
        return;
      }

      const vesselKey =
        getVesselIdForUser(currentUserId, spaceId) ?? currentUserId;
      const vesselRecord = globalState.vessels.get(vesselKey);
      if (
        !vesselRecord ||
        (vesselRecord.spaceId ?? defaultSpaceId) !== spaceId
      ) {
        console.warn('No vessel for user, creating on control', currentUserId);
        ensureVesselForUser(currentUserId, effectiveUsername, spaceId);
      }
      let target = globalState.vessels.get(
        getVesselIdForUser(currentUserId, spaceId) ?? currentUserId,
      );
      if (!target || (target.spaceId ?? defaultSpaceId) !== spaceId) {
        target = Array.from(globalState.vessels.values()).find(
          vessel =>
            (vessel.spaceId ?? defaultSpaceId) === spaceId &&
            (((vessel as { crewIds?: Set<string> }).crewIds?.has(
              currentUserId,
            ) ??
              false) ||
              vessel.helmUserId === currentUserId ||
              vessel.engineUserId === currentUserId),
        );
      }
      if (!target || (target.spaceId ?? defaultSpaceId) !== spaceId) return;

      const isHelm = target.helmUserId === currentUserId;
      const isEngine = target.engineUserId === currentUserId;
      const isAdmin = hasAdminRole(socket);
      const isCrew =
        (target as { crewIds?: Set<string> }).crewIds?.has(currentUserId) ??
        false;
      if (!isCrew && !isAdmin && !isHelm && !isEngine) {
        socket.emit('error', 'You are not crew on this vessel');
        return;
      }
      if ((socket.data as { mode?: string }).mode === 'spectator') {
        (socket.data as { mode?: string }).mode = 'player';
      }
      const engineHolder = target.engineUserId;
      const helmHolder = target.helmUserId;
      const engineAvailable =
        engineHolder === null ||
        engineHolder === undefined ||
        engineHolder.length === 0 ||
        isEngine ||
        isAdmin;

      if (data.rudderAngle !== undefined && !isHelm && !isAdmin) {
        socket.emit(
          'error',
          helmHolder !== null &&
            helmHolder !== undefined &&
            helmHolder.length > 0
            ? `Helm held by ${target.helmUsername ?? helmHolder}`
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
          engineHolder.length > 0
            ? `Engine station held by ${target.engineUsername ?? engineHolder}`
            : 'Claim the engine station to adjust throttle/ballast',
        );
        return;
      }

      if (data.throttle !== undefined) {
        const nextThrottle = clamp(data.throttle, -1, 1);
        const departureAttempt =
          Math.abs(target.controls.throttle) <= ECONOMY_THROTTLE_EPS &&
          Math.abs(nextThrottle) > ECONOMY_THROTTLE_EPS;
        const vesselPosition = (target as { position?: typeof target.position })
          .position;
        const departingFromPort =
          departureAttempt &&
          vesselPosition !== undefined &&
          resolvePortForPosition(vesselPosition) !== null;
        if (departingFromPort) {
          const chargeUserId = resolveChargeUserId(target);
          const chargeProfile =
            typeof chargeUserId === 'string' && chargeUserId.length > 0
              ? await getEconomyProfile(chargeUserId)
              : null;
          if (chargeProfile !== null && chargeProfile.credits <= 0) {
            socket.emit(
              'error',
              'Cannot depart from port: vessel operator has no available credits',
            );
            return;
          }
        }
        target.controls.throttle = nextThrottle;
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
    })().catch(err => {
      console.error('Failed to apply vessel control', err);
      socket.emit('error', 'Unable to apply vessel control');
    });
  });
}
