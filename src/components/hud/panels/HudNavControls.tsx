import React from 'react';
import { TelegraphLever } from '../../TelegraphLever';
import { HelmControl } from '../../HelmControl';
import RudderAngleIndicator from '../../RudderAngleIndicator';
import styles from '../../HudDrawer.module.css';
import {
  RUDDER_STALL_ANGLE_DEG,
  clampRudderAngle,
} from '../../../constants/vessel';
import {
  DEG_PER_RAD,
  RUDDER_INDICATOR_SIZE_PX,
  TELEGRAPH_SCALE,
  THROTTLE_MAX,
  THROTTLE_MIN,
} from '../constants';

export function HudNavControls({
  throttleLocal,
  setThrottleLocal,
  rudderAngleLocal,
  setRudderAngleLocal,
  canAdjustThrottle,
  canAdjustRudder,
}: {
  throttleLocal: number;
  setThrottleLocal: (value: number) => void;
  rudderAngleLocal: number;
  setRudderAngleLocal: (value: number) => void;
  canAdjustThrottle: boolean;
  canAdjustRudder: boolean;
}) {
  return (
    <div className={styles.navControlsRow}>
      <TelegraphLever
        label="Throttle"
        value={throttleLocal}
        min={THROTTLE_MIN}
        max={THROTTLE_MAX}
        onChange={setThrottleLocal}
        disabled={!canAdjustThrottle}
        scale={TELEGRAPH_SCALE}
      />
      <HelmControl
        value={rudderAngleLocal * DEG_PER_RAD}
        minAngle={-RUDDER_STALL_ANGLE_DEG}
        maxAngle={RUDDER_STALL_ANGLE_DEG}
        onChange={deg =>
          setRudderAngleLocal(clampRudderAngle(deg / DEG_PER_RAD))
        }
        disabled={!canAdjustRudder}
      />
      <RudderAngleIndicator
        angle={rudderAngleLocal * DEG_PER_RAD}
        maxAngle={RUDDER_STALL_ANGLE_DEG}
        size={RUDDER_INDICATOR_SIZE_PX}
      />
    </div>
  );
}
