import { ensureVessel } from './runtimeCore';

export function getVesselX(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).x;
}

export function getVesselY(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).y;
}

export function getVesselZ(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).z;
}

export function getVesselHeading(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).psi;
}

export function getVesselSpeed(vesselPtr: usize): f64 {
  const vessel = ensureVessel(vesselPtr);
  return Math.sqrt(vessel.u * vessel.u + vessel.v * vessel.v);
}

export function getVesselSurgeVelocity(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).u;
}

export function getVesselSwayVelocity(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).v;
}

export function getVesselHeaveVelocity(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).w;
}

export function getVesselRollAngle(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).rollAngle;
}

export function getVesselPitchAngle(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).pitchAngle;
}

export function getVesselRudderAngle(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).rudderAngle;
}

export function getVesselEngineRPM(vesselPtr: usize): f64 {
  return Math.abs(ensureVessel(vesselPtr).throttle) * 1200.0;
}

export function getVesselFuelLevel(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).fuelLevel;
}

export function getVesselFuelConsumption(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).lastFuelConsumption;
}

export function getVesselGM(vesselPtr: usize): f64 {
  const vessel = ensureVessel(vesselPtr);
  return (vessel.beam * vessel.blockCoefficient) / (vessel.draft + 0.1);
}

export function getVesselCenterOfGravityY(vesselPtr: usize): f64 {
  const vessel = ensureVessel(vesselPtr);
  return vessel.draft * (0.4 + vessel.ballast * 0.2);
}

export function getVesselBallastLevel(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).ballast;
}

export function getVesselRollRate(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).p;
}

export function getVesselPitchRate(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).q;
}

export function getVesselYawRate(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).r;
}
