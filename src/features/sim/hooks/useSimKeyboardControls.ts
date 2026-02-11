import React from 'react';
import useStore from '../../../store';
import {
  THROTTLE_MAX,
  THROTTLE_MIN,
  THROTTLE_STEP,
  RUDDER_STEP,
} from '../constants';
import { RUDDER_MAX_ANGLE_RAD } from '../../../constants/vessel';

export function useSimKeyboardControls(): void {
  React.useEffect(() => {
    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const active = document.activeElement as globalThis.HTMLElement | null;
      if (
        active &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
      ) {
        return;
      }

      const state = useStore.getState();
      if (state.mode === 'spectator') return;

      const controls = state.vessel.controls;
      if (!controls) return;

      let throttle = controls.throttle ?? 0;
      let rudder = controls.rudderAngle ?? 0;
      let changed = false;

      const sessionUserId = state.sessionUserId;
      const helmStation = state.vessel.stations?.helm || state.vessel.helm;
      const engineStation = state.vessel.stations?.engine;
      const isHelm =
        sessionUserId && (helmStation?.userId || null) === sessionUserId;
      const isEngine =
        sessionUserId && (engineStation?.userId || null) === sessionUserId;
      const canAdjustThrottle = isEngine || (!engineStation?.userId && isHelm);
      const canAdjustRudder = isHelm;

      switch (event.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
          if (canAdjustThrottle) {
            throttle = clamp(
              throttle + THROTTLE_STEP,
              THROTTLE_MIN,
              THROTTLE_MAX,
            );
            changed = true;
          }
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          if (canAdjustThrottle) {
            throttle = clamp(
              throttle - THROTTLE_STEP,
              THROTTLE_MIN,
              THROTTLE_MAX,
            );
            changed = true;
          }
          break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
          if (canAdjustRudder) {
            rudder = clamp(
              rudder - RUDDER_STEP,
              -RUDDER_MAX_ANGLE_RAD,
              RUDDER_MAX_ANGLE_RAD,
            );
            changed = true;
          }
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          if (canAdjustRudder) {
            rudder = clamp(
              rudder + RUDDER_STEP,
              -RUDDER_MAX_ANGLE_RAD,
              RUDDER_MAX_ANGLE_RAD,
            );
            changed = true;
          }
          break;
        default:
          break;
      }

      if (!changed) return;

      state.updateVessel({
        controls: {
          ...controls,
          throttle: canAdjustThrottle ? throttle : controls.throttle,
          rudderAngle: canAdjustRudder ? rudder : controls.rudderAngle,
        },
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
