// Minimal physics core for single-vessel simulation
// Exports are kept for compatibility with the current JS bridge, but many are simplified.

const WATER_DENSITY: f64 = 1025.0;
const DRAG_COEFFICIENT: f64 = 0.8;
// Tuned for visible yaw response without blowing up.
const RUDDER_FORCE_COEFFICIENT: f64 = 200000.0;
const RUDDER_STALL_ANGLE: f64 = 0.5; // rad (~28 deg)
const RUDDER_MAX_ANGLE: f64 = 0.6; // radians (~34 deg)
const MAX_THRUST: f64 = 8.0e5;
const DEFAULT_MASS: f64 = 5.0e6;
const DEFAULT_LENGTH: f64 = 120.0;
const DEFAULT_BEAM: f64 = 20.0;
const DEFAULT_DRAFT: f64 = 6.0;
const DEFAULT_BLOCK_COEFFICIENT: f64 = 0.75;
const GRAVITY: f64 = 9.81;
const YAW_DAMPING: f64 = 0.5;
const YAW_DAMPING_QUAD: f64 = 1.2;
const SWAY_DAMPING: f64 = 0.6;
const MAX_YAW_RATE: f64 = 0.8; // rad/s cap
const MAX_SPEED: f64 = 15.0; // m/s cap (≈29 kts)
const PIVOT_AFT_RATIO: f64 = 0.25; // fraction of length aft of midship for yaw pivot
const HEAVE_STIFFNESS: f64 = 2.0; // spring toward target draft (tunable)
const HEAVE_DAMPING: f64 = 1.6; // damping on heave velocity
const WAVE_HEIGHT_PER_WIND: f64 = 0.05; // m of wave per m/s wind (rough)
const MAX_WAVE_HEIGHT: f64 = 3.0;
const ROLL_DAMPING: f64 = 0.8;
const PITCH_DAMPING: f64 = 0.6;

class VesselState {
  x: f64;
  y: f64;
  z: f64;
  rollAngle: f64;
  pitchAngle: f64;
  psi: f64; // heading
  u: f64; // surge
  v: f64; // sway
  w: f64; // heave (unused)
  r: f64; // yaw rate
  p: f64; // roll rate
  q: f64; // pitch rate
  throttle: f64;
  rudderAngle: f64;
  mass: f64;
  length: f64;
  beam: f64;
  draft: f64;
  ballast: f64;
  blockCoefficient: f64;
  waveHeight: f64;
  wavePhase: f64;
  fuelLevel: f64;

  constructor(
    x: f64,
    y: f64,
    z: f64,
    psi: f64,
    roll: f64,
    pitch: f64,
    u: f64,
    v: f64,
    w: f64,
    r: f64,
    p: f64,
    q: f64,
    throttle: f64,
    rudderAngle: f64,
    mass: f64,
    length: f64,
    beam: f64,
    draft: f64,
    blockCoefficient: f64 = DEFAULT_BLOCK_COEFFICIENT,
  ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.psi = psi;
    this.rollAngle = roll;
    this.pitchAngle = pitch;
    this.u = u;
    this.v = v;
    this.w = w;
    this.r = r;
    this.p = p;
    this.q = q;
    this.throttle = throttle;
    this.rudderAngle = rudderAngle;
    this.mass = mass > 0 ? mass : DEFAULT_MASS;
    this.length = length > 0 ? length : DEFAULT_LENGTH;
    this.beam = beam > 0 ? beam : DEFAULT_BEAM;
    this.draft = draft > 0 ? draft : DEFAULT_DRAFT;
    this.ballast = 0.5;
    this.blockCoefficient =
      blockCoefficient > 0 ? blockCoefficient : DEFAULT_BLOCK_COEFFICIENT;
    this.waveHeight = 0.0;
    this.wavePhase = 0.0;
    this.fuelLevel = 1.0;
  }
}

let globalVessel: VesselState | null = null;

function clamp01(value: f64): f64 {
  if (value < 0.0) return 0.0;
  if (value > 1.0) return 1.0;
  return value;
}

function clampSigned(value: f64, limit: f64): f64 {
  if (value > limit) return limit;
  if (value < -limit) return -limit;
  return value;
}

function normalizeAngle(angle: f64): f64 {
  let a = angle % (2.0 * Math.PI);
  if (a < 0.0) a += 2.0 * Math.PI;
  return a;
}

function ensureVessel(vesselPtr: usize): VesselState {
  if (vesselPtr === 0) throw new Error('Vessel pointer is null');
  return changetype<VesselState>(vesselPtr);
}

// === Core API ===

export function createVessel(
  x: f64,
  y: f64,
  z: f64,
  psi: f64,
  _phi: f64,
  _theta: f64,
  u: f64,
  v: f64,
  w: f64,
  r: f64,
  _p: f64,
  _q: f64,
  throttle: f64,
  rudderAngle: f64,
  mass: f64,
  length: f64,
  beam: f64,
  draft: f64,
  blockCoefficient: f64 = DEFAULT_BLOCK_COEFFICIENT,
): usize {
  if (globalVessel === null) {
    globalVessel = new VesselState(
      x,
      y,
      z,
      psi,
      _phi,
      _theta,
      u,
      v,
      w,
      r,
      _p,
      _q,
      clamp01(throttle),
      rudderAngle,
      mass,
      length,
      beam,
      draft,
      blockCoefficient,
    );
  }
  return changetype<usize>(globalVessel);
}

export function updateVesselState(
  vesselPtr: usize,
  dt: f64,
  windSpeed: f64,
  windDirection: f64,
  currentSpeed: f64,
  currentDirection: f64,
): usize {
  const vessel = ensureVessel(vesselPtr);
  const safeDt = dt < 0.0 ? 0.0 : dt > 0.25 ? 0.25 : dt;

  // Simple ballast effect: heavier ship accelerates and turns slower
  const ballastFactor = clamp01(vessel.ballast);
  const effectiveMass = vessel.mass * (0.9 + ballastFactor * 0.4); // 0.9x .. 1.3x

  // Engine thrust and drag
  const throttle =
    clampSigned(vessel.throttle, 1.0) * (vessel.fuelLevel > 0.0 ? 1.0 : 0.0);
  const thrust = MAX_THRUST * throttle;
  const dragSurge = DRAG_COEFFICIENT * vessel.u * Math.abs(vessel.u);
  const dragSway = DRAG_COEFFICIENT * vessel.v * Math.abs(vessel.v);

  // Simple current force resolved into body frame
  const relCurrentDir = currentDirection - vessel.psi;
  const currentSurge =
    currentSpeed * Math.cos(relCurrentDir) * vessel.mass * 0.01;
  const currentSway =
    currentSpeed * Math.sin(relCurrentDir) * vessel.mass * 0.01;

  // Rudder force proportional to speed^2 and angle
  const speedMag = Math.sqrt(vessel.u * vessel.u + vessel.v * vessel.v);
  // Rudder force with simple stall curve and lever arm toward stern
  const stallFactor = 1.0 - Math.min(
    1.0,
    Math.abs(vessel.rudderAngle) / RUDDER_STALL_ANGLE,
  ) ** 2;
  const rudderForce =
    RUDDER_FORCE_COEFFICIENT *
    vessel.rudderAngle *
    speedMag *
    speedMag *
    Math.max(0.0, stallFactor);
  const leverArm = vessel.length * (0.5 + PIVOT_AFT_RATIO); // distance from pivot toward stern
  const rudderMoment = rudderForce * leverArm;

  // Very simple wind yaw damping
  const windYaw =
    windSpeed * windSpeed * 0.01 * Math.sin(windDirection - vessel.psi);

  // Inertia approximations
  const mass = effectiveMass;
  const Izz = mass * vessel.length * vessel.length * 0.1;
  const Ixx = mass * vessel.beam * vessel.beam * 0.08;
  const Iyy = mass * vessel.length * vessel.length * 0.08;

  // Accelerations
  const uDot = (thrust - dragSurge + currentSurge) / mass;
  const vDot =
    (-dragSway - SWAY_DAMPING * vessel.v + currentSway + rudderForce) / mass;
  const rDot =
    (rudderMoment - windYaw - YAW_DAMPING * vessel.r -
      YAW_DAMPING_QUAD * vessel.r * Math.abs(vessel.r)) /
    Izz;

  // Wave height as a crude function of wind
  const targetWave = Math.min(MAX_WAVE_HEIGHT, windSpeed * WAVE_HEIGHT_PER_WIND);
  vessel.waveHeight = targetWave;
  vessel.wavePhase += safeDt * 2.0; // arbitrary speed for phase change
  const waveSample = targetWave * Math.sin(vessel.wavePhase);

  // Buoyancy / heave toward target draft (includes ballast and wave surface)
  const neutralDraft =
    effectiveMass / (WATER_DENSITY * vessel.length * vessel.beam * vessel.blockCoefficient + 1e-6);
  const targetDraft = neutralDraft * (0.7 + ballastFactor * 0.5);
  const targetZ = -(targetDraft + waveSample);
  const heaveAccel =
    (targetZ - vessel.z) * HEAVE_STIFFNESS - HEAVE_DAMPING * vessel.w;
  vessel.w += heaveAccel * safeDt;
  vessel.z += vessel.w * safeDt;

  // Roll/pitch restoring toward calm-water and wave slopes
  const waveSlopeRoll = targetWave * 0.02 * Math.sin(vessel.wavePhase + 1.0);
  const waveSlopePitch = targetWave * 0.02 * Math.cos(vessel.wavePhase);
  const gmRoll =
    vessel.beam * vessel.beam * vessel.blockCoefficient /
    (12.0 * (vessel.draft + 0.1));
  const gmPitch =
    vessel.length * vessel.blockCoefficient /
    (12.0 * (vessel.draft + 0.1));

  const rollRestoring =
    -GRAVITY * gmRoll * mass * (vessel.rollAngle - waveSlopeRoll);
  const pitchRestoring =
    -GRAVITY * gmPitch * mass * (vessel.pitchAngle - waveSlopePitch);

  const pDot = (rollRestoring - ROLL_DAMPING * vessel.p) / Ixx;
  const qDot = (pitchRestoring - PITCH_DAMPING * vessel.q) / Iyy;
  vessel.p += pDot * safeDt;
  vessel.q += qDot * safeDt;

  vessel.rollAngle += vessel.p * safeDt;
  vessel.pitchAngle += vessel.q * safeDt;

  // Integrate velocities
  vessel.u += uDot * safeDt;
  vessel.v += vDot * safeDt;
  vessel.r += rDot * safeDt;

  vessel.u = clampSigned(vessel.u, MAX_SPEED);
  vessel.v = clampSigned(vessel.v, MAX_SPEED * 0.6); // sway a bit lower
  vessel.r = clampSigned(vessel.r, MAX_YAW_RATE);

  // Integrate heading
  vessel.psi = normalizeAngle(vessel.psi + vessel.r * safeDt);

  // World-frame position
  const cosPsi = Math.cos(vessel.psi);
  const sinPsi = Math.sin(vessel.psi);
  const worldU = vessel.u * cosPsi - vessel.v * sinPsi;
  const worldV = vessel.u * sinPsi + vessel.v * cosPsi;
  vessel.x += worldU * safeDt;
  vessel.y += worldV * safeDt;

  // Simple heave offset from ballast (no wave model yet)
  vessel.z = -vessel.draft * (0.4 + 0.4 * vessel.ballast);

  return vesselPtr;
}

// === Setters ===

export function setThrottle(vesselPtr: usize, throttle: f64): void {
  const vessel = ensureVessel(vesselPtr);
  vessel.throttle = clampSigned(throttle, 1.0);
}

export function setRudderAngle(vesselPtr: usize, angle: f64): void {
  const vessel = ensureVessel(vesselPtr);
  if (!isFinite(angle)) return;
  let clamped = angle;
  if (clamped > RUDDER_MAX_ANGLE) clamped = RUDDER_MAX_ANGLE;
  if (clamped < -RUDDER_MAX_ANGLE) clamped = -RUDDER_MAX_ANGLE;
  vessel.rudderAngle = clamped;
}

export function setBallast(vesselPtr: usize, _level: f64): void {
  const vessel = ensureVessel(vesselPtr);
  vessel.ballast = clamp01(_level);
}

// === Getters ===

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
export function getVesselRollAngle(_vesselPtr: usize): f64 {
  return ensureVessel(_vesselPtr).rollAngle;
}
export function getVesselPitchAngle(_vesselPtr: usize): f64 {
  return ensureVessel(_vesselPtr).pitchAngle;
}
export function getVesselRudderAngle(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).rudderAngle;
}
export function getVesselEngineRPM(vesselPtr: usize): f64 {
  return Math.abs(ensureVessel(vesselPtr).throttle) * 1200.0;
}
export function getVesselFuelLevel(_vesselPtr: usize): f64 {
  return 1.0;
}
export function getVesselFuelConsumption(_vesselPtr: usize): f64 {
  return 0.0;
}
export function getVesselGM(_vesselPtr: usize): f64 {
  return 1.0;
}
export function getVesselCenterOfGravityY(_vesselPtr: usize): f64 {
  return 0.0;
}
export function getVesselBallastLevel(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).ballast;
}
export function getVesselRollRate(_vesselPtr: usize): f64 {
  return ensureVessel(_vesselPtr).p;
}
export function getVesselPitchRate(_vesselPtr: usize): f64 {
  return ensureVessel(_vesselPtr).q;
}
export function getVesselYawRate(vesselPtr: usize): f64 {
  return ensureVessel(vesselPtr).r;
}

// === Waves / sea state ===

export function calculateSeaState(windSpeed: f64): f64 {
  const beaufort = windSpeed / 1.5;
  if (beaufort < 0.0) return 0.0;
  if (beaufort > 12.0) return 12.0;
  return beaufort;
}

export function getWaveHeightForSeaState(seaState: f64): f64 {
  return seaState * 0.5;
}

// === Utilities ===

export function resetGlobalVessel(): void {
  globalVessel = null;
}
