export const RUDDER_STALL_ANGLE_RAD = 0.5; // radians (~28.6°), matches WASM stall curve
export const RUDDER_STALL_ANGLE_DEG = (RUDDER_STALL_ANGLE_RAD * 180) / Math.PI;

export const clampRudderAngle = (angleRad: number): number =>
  Math.max(-RUDDER_STALL_ANGLE_RAD, Math.min(RUDDER_STALL_ANGLE_RAD, angleRad));
