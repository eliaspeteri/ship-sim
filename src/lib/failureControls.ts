import type { VesselState } from '../types/vessel.types';
import type { DamageState } from './damage';

export type FailureState = VesselState['failureState'];

export const applyFailureControlLimits = (
  controls: {
    throttle?: number;
    rudderAngle?: number;
    ballast?: number;
  },
  failureState?: FailureState,
  damageState?: DamageState,
): { throttle?: number; rudderAngle?: number; ballast?: number } => {
  if (!failureState && !damageState) return controls;

  const next = { ...controls };

  if (failureState?.engineFailure) {
    next.throttle = 0;
  }

  if (failureState?.steeringFailure) {
    next.rudderAngle = 0;
  }

  if (failureState?.floodingLevel && failureState.floodingLevel > 0) {
    const cap = Math.max(0, 1 - failureState.floodingLevel * 0.8);
    if (next.throttle !== undefined) {
      next.throttle = Math.min(next.throttle, cap);
    }
    if (next.ballast !== undefined) {
      next.ballast = Math.min(
        1,
        Math.max(next.ballast, 0.5 + failureState.floodingLevel * 0.4),
      );
    }
  }

  if (damageState) {
    if (next.throttle !== undefined) {
      const cap = Math.max(0.2, damageState.engineHealth);
      next.throttle = Math.min(next.throttle, cap);
    }
    if (next.rudderAngle !== undefined) {
      const cap = Math.max(0.2, damageState.steeringHealth);
      next.rudderAngle = next.rudderAngle * cap;
    }
  }

  return next;
};
