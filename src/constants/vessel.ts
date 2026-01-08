export const RUDDER_STALL_ANGLE_RAD = 0.5; // radians (~28.6°), matches WASM stall curve
export const RUDDER_STALL_ANGLE_DEG = (RUDDER_STALL_ANGLE_RAD * 180) / Math.PI;
export const RUDDER_MAX_ANGLE_RAD = 0.6; // radians (~34°)
export const MAX_CREW = Number(process.env.NEXT_PUBLIC_MAX_CREW || 4);

export const clampRudderAngle = (angleRad: number): number =>
  Math.max(-RUDDER_MAX_ANGLE_RAD, Math.min(RUDDER_MAX_ANGLE_RAD, angleRad));

export const DEFAULT_HYDRO = {
  rudderForceCoefficient: 200000,
  rudderStallAngle: RUDDER_STALL_ANGLE_RAD,
  rudderMaxAngle: RUDDER_MAX_ANGLE_RAD,
  dragCoefficient: 0.8,
  yawDamping: 0.5,
  yawDampingQuad: 1.2,
  swayDamping: 0.6,
  maxThrust: 8.0e5,
  rollDamping: 0.8,
  pitchDamping: 0.6,
  heaveStiffness: 2.0,
  heaveDamping: 1.6,
};
