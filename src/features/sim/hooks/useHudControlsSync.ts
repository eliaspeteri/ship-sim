import React from 'react';
import { applyFailureControlLimits } from '../../../lib/failureControls';
import type { VesselControls, VesselState } from '../../../types/vessel.types';
import { clampRudderAngle } from '../../../constants/vessel';

export type HudControlUpdate = {
  throttle?: number;
  rudderAngle?: number;
  ballast?: number;
};

type UseHudControlsSyncParams = {
  controls: VesselControls | undefined;
  mode: 'player' | 'spectator';
  canAdjustThrottle: boolean;
  canAdjustRudder: boolean;
  defaultBallast: number;
  minSendIntervalMs: number;
  failureState: VesselState['failureState'];
  damageState: VesselState['damageState'];
  dispatchControlUpdate: (controls: HudControlUpdate) => void;
};

export function useHudControlsSync({
  controls,
  mode,
  canAdjustThrottle,
  canAdjustRudder,
  defaultBallast,
  minSendIntervalMs,
  failureState,
  damageState,
  dispatchControlUpdate,
}: UseHudControlsSyncParams) {
  const [throttleLocal, setThrottleLocal] = React.useState(
    controls?.throttle || 0,
  );
  const [rudderAngleLocal, setRudderAngleLocal] = React.useState(
    controls?.rudderAngle || 0,
  );
  const [ballastLocal, setBallastLocal] = React.useState(
    controls?.ballast ?? defaultBallast,
  );

  const pendingControlRef = React.useRef<HudControlUpdate | null>(null);
  const controlTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastControlSendAtRef = React.useRef(0);

  React.useEffect(() => {
    if (!controls) return;
    setThrottleLocal(controls.throttle ?? 0);
    setRudderAngleLocal(controls.rudderAngle ?? 0);
    setBallastLocal(controls.ballast ?? defaultBallast);
  }, [
    controls,
    controls?.ballast,
    controls?.rudderAngle,
    controls?.throttle,
    defaultBallast,
  ]);

  React.useEffect(() => {
    return () => {
      if (controlTimerRef.current) {
        clearTimeout(controlTimerRef.current);
      }
      controlTimerRef.current = null;
      pendingControlRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (mode === 'spectator' || (!canAdjustThrottle && !canAdjustRudder)) {
      if (controlTimerRef.current) {
        clearTimeout(controlTimerRef.current);
      }
      controlTimerRef.current = null;
      pendingControlRef.current = null;
      return;
    }

    const clampedRudder = clampRudderAngle(rudderAngleLocal);
    const nextControls: HudControlUpdate = {};

    if (canAdjustThrottle) {
      nextControls.throttle = throttleLocal;
      nextControls.ballast = ballastLocal;
    }

    if (canAdjustRudder) {
      nextControls.rudderAngle = clampedRudder;
    }

    const limitedControls = applyFailureControlLimits(
      nextControls,
      failureState,
      damageState,
    );
    pendingControlRef.current = limitedControls;

    const flushPendingControls = () => {
      const queued = pendingControlRef.current;
      if (!queued) return;
      try {
        dispatchControlUpdate(queued);
        lastControlSendAtRef.current = Date.now();
      } catch (error) {
        console.error('Error applying controls from HUD:', error);
      } finally {
        pendingControlRef.current = null;
        controlTimerRef.current = null;
      }
    };

    const now = Date.now();
    const elapsed = now - lastControlSendAtRef.current;
    if (elapsed >= minSendIntervalMs && !controlTimerRef.current) {
      flushPendingControls();
      return;
    }

    if (controlTimerRef.current) return;
    const delay = Math.max(0, minSendIntervalMs - elapsed);
    controlTimerRef.current = setTimeout(flushPendingControls, delay);
  }, [
    ballastLocal,
    canAdjustRudder,
    canAdjustThrottle,
    damageState,
    dispatchControlUpdate,
    failureState,
    minSendIntervalMs,
    mode,
    rudderAngleLocal,
    throttleLocal,
  ]);

  return {
    throttleLocal,
    setThrottleLocal,
    rudderAngleLocal,
    setRudderAngleLocal,
    ballastLocal,
    setBallastLocal,
  };
}
