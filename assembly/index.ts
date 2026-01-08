// Minimal physics core for single-vessel simulation
// Exports are kept for compatibility with the current JS bridge, but many are simplified.

const WATER_DENSITY: f64 = 1025.0;
const DEFAULT_DRAG_COEFFICIENT: f64 = 0.8;
// Tuned for visible yaw response without blowing up.
const DEFAULT_RUDDER_FORCE_COEFFICIENT: f64 = 200000.0;
const DEFAULT_RUDDER_STALL_ANGLE: f64 = 0.5; // rad (~28 deg)
const DEFAULT_RUDDER_MAX_ANGLE: f64 = 0.6; // radians (~34 deg)
const DEFAULT_MAX_THRUST: f64 = 8.0e5;
const DEFAULT_MASS: f64 = 5.0e6;
const DEFAULT_LENGTH: f64 = 120.0;
const DEFAULT_BEAM: f64 = 20.0;
const DEFAULT_DRAFT: f64 = 6.0;
const DEFAULT_BLOCK_COEFFICIENT: f64 = 0.75;
const GRAVITY: f64 = 9.81;
const DEFAULT_YAW_DAMPING: f64 = 0.5;
const DEFAULT_YAW_DAMPING_QUAD: f64 = 1.2;
const DEFAULT_SWAY_DAMPING: f64 = 0.6;
const MAX_YAW_RATE: f64 = 0.8; // rad/s cap
const DEFAULT_MAX_SPEED: f64 = 15.0; // m/s cap (≈29 kts)
const PIVOT_AFT_RATIO: f64 = 0.25; // fraction of length aft of midship for yaw pivot
const DEFAULT_HEAVE_STIFFNESS: f64 = 2.0; // spring toward target draft (tunable)
const DEFAULT_HEAVE_DAMPING: f64 = 1.6; // damping on heave velocity
const WAVE_HEIGHT_PER_WIND: f64 = 0.05; // m of wave per m/s wind (rough)
const MAX_WAVE_HEIGHT: f64 = 3.0;
const DEFAULT_ROLL_DAMPING: f64 = 0.8;
const DEFAULT_PITCH_DAMPING: f64 = 0.6;
const DEFAULT_FUEL_CONSUMPTION_RATE: f64 = 0.000015;

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
  rudderForceCoefficient: f64;
  rudderStallAngle: f64;
  rudderMaxAngle: f64;
  dragCoefficient: f64;
  yawDamping: f64;
  yawDampingQuad: f64;
  swayDamping: f64;
  maxThrust: f64;
  maxSpeed: f64;
  rollDamping: f64;
  pitchDamping: f64;
  heaveStiffness: f64;
  heaveDamping: f64;
  waveAmplitude: f64;
  waveLength: f64;
  waveDirection: f64;
  waveSteepness: f64;
  waveTime: f64;
  fuelLevel: f64;
  fuelConsumptionRate: f64;
  lastFuelConsumption: f64;

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
    rudderForceCoefficient: f64 = DEFAULT_RUDDER_FORCE_COEFFICIENT,
    rudderStallAngle: f64 = DEFAULT_RUDDER_STALL_ANGLE,
    rudderMaxAngle: f64 = DEFAULT_RUDDER_MAX_ANGLE,
    dragCoefficient: f64 = DEFAULT_DRAG_COEFFICIENT,
    yawDamping: f64 = DEFAULT_YAW_DAMPING,
    yawDampingQuad: f64 = DEFAULT_YAW_DAMPING_QUAD,
    swayDamping: f64 = DEFAULT_SWAY_DAMPING,
    maxThrust: f64 = DEFAULT_MAX_THRUST,
    maxSpeed: f64 = DEFAULT_MAX_SPEED,
    rollDamping: f64 = DEFAULT_ROLL_DAMPING,
    pitchDamping: f64 = DEFAULT_PITCH_DAMPING,
    heaveStiffness: f64 = DEFAULT_HEAVE_STIFFNESS,
    heaveDamping: f64 = DEFAULT_HEAVE_DAMPING,
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
    this.mass = mass > 0 ? mass : DEFAULT_MASS;
    this.length = length > 0 ? length : DEFAULT_LENGTH;
    this.beam = beam > 0 ? beam : DEFAULT_BEAM;
    this.draft = draft > 0 ? draft : DEFAULT_DRAFT;
    this.ballast = 0.5;
    this.blockCoefficient =
      blockCoefficient > 0 ? blockCoefficient : DEFAULT_BLOCK_COEFFICIENT;
    this.rudderForceCoefficient =
      rudderForceCoefficient > 0
        ? rudderForceCoefficient
        : DEFAULT_RUDDER_FORCE_COEFFICIENT;
    this.rudderStallAngle =
      rudderStallAngle > 0 ? rudderStallAngle : DEFAULT_RUDDER_STALL_ANGLE;
    this.rudderMaxAngle =
      rudderMaxAngle > 0 ? rudderMaxAngle : DEFAULT_RUDDER_MAX_ANGLE;
    this.rudderAngle = clampSigned(rudderAngle, this.rudderMaxAngle);
    this.dragCoefficient =
      dragCoefficient > 0 ? dragCoefficient : DEFAULT_DRAG_COEFFICIENT;
    this.yawDamping = yawDamping > 0 ? yawDamping : DEFAULT_YAW_DAMPING;
    this.yawDampingQuad =
      yawDampingQuad > 0 ? yawDampingQuad : DEFAULT_YAW_DAMPING_QUAD;
    this.swayDamping = swayDamping > 0 ? swayDamping : DEFAULT_SWAY_DAMPING;
    this.maxThrust = maxThrust > 0 ? maxThrust : DEFAULT_MAX_THRUST;
    this.maxSpeed = maxSpeed > 0 ? maxSpeed : DEFAULT_MAX_SPEED;
    this.rollDamping = rollDamping > 0 ? rollDamping : DEFAULT_ROLL_DAMPING;
    this.pitchDamping = pitchDamping > 0 ? pitchDamping : DEFAULT_PITCH_DAMPING;
    this.heaveStiffness =
      heaveStiffness > 0 ? heaveStiffness : DEFAULT_HEAVE_STIFFNESS;
    this.heaveDamping = heaveDamping > 0 ? heaveDamping : DEFAULT_HEAVE_DAMPING;
    this.waveAmplitude = 0.0;
    this.waveLength = 0.0;
    this.waveDirection = 0.0;
    this.waveSteepness = 0.0;
    this.waveTime = 0.0;
    this.fuelLevel = 1.0;
    this.fuelConsumptionRate = DEFAULT_FUEL_CONSUMPTION_RATE;
    this.lastFuelConsumption = 0.0;
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
  rudderForceCoefficient: f64 = DEFAULT_RUDDER_FORCE_COEFFICIENT,
  rudderStallAngle: f64 = DEFAULT_RUDDER_STALL_ANGLE,
  rudderMaxAngle: f64 = DEFAULT_RUDDER_MAX_ANGLE,
  dragCoefficient: f64 = DEFAULT_DRAG_COEFFICIENT,
  yawDamping: f64 = DEFAULT_YAW_DAMPING,
  yawDampingQuad: f64 = DEFAULT_YAW_DAMPING_QUAD,
  swayDamping: f64 = DEFAULT_SWAY_DAMPING,
  maxThrust: f64 = DEFAULT_MAX_THRUST,
  maxSpeed: f64 = DEFAULT_MAX_SPEED,
  rollDamping: f64 = DEFAULT_ROLL_DAMPING,
  pitchDamping: f64 = DEFAULT_PITCH_DAMPING,
  heaveStiffness: f64 = DEFAULT_HEAVE_STIFFNESS,
  heaveDamping: f64 = DEFAULT_HEAVE_DAMPING,
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
      rudderForceCoefficient,
      rudderStallAngle,
      rudderMaxAngle,
      dragCoefficient,
      yawDamping,
      yawDampingQuad,
      swayDamping,
      maxThrust,
      maxSpeed,
      rollDamping,
      pitchDamping,
      heaveStiffness,
      heaveDamping,
    );
  }
  return changetype<usize>(globalVessel);
}

export function destroyVessel(_vesselPtr: usize): void {
  globalVessel = null;
}

export function updateVesselState(
  vesselPtr: usize,
  dt: f64,
  windSpeed: f64,
  windDirection: f64,
  currentSpeed: f64,
  currentDirection: f64,
  waveHeight: f64,
  waveLength: f64,
  waveDirection: f64,
  waveSteepness: f64,
): usize {
  const vessel = ensureVessel(vesselPtr);
  const safeDt = dt < 0.0 ? 0.0 : dt > 0.25 ? 0.25 : dt;

  // Simple ballast effect: heavier ship accelerates and turns slower
  const ballastFactor = clamp01(vessel.ballast);
  const effectiveMass = vessel.mass * (0.9 + ballastFactor * 0.4); // 0.9x .. 1.3x

  // Engine thrust, fuel burn, and drag
  const throttleCommand = clampSigned(vessel.throttle, 1.0);
  const hasFuel = vessel.fuelLevel > 0.0;
  const throttle = hasFuel ? throttleCommand : 0.0;
  const thrust = vessel.maxThrust * throttle;
  const hullFactor = 0.8 + vessel.blockCoefficient * 0.6;
  const draftFactor =
    vessel.draft > 0.0 ? vessel.draft / (vessel.beam + 0.01) : 0.3;
  const dragSurge =
    vessel.dragCoefficient * hullFactor * vessel.u * Math.abs(vessel.u);
  const dragSway =
    vessel.dragCoefficient *
    (0.6 + draftFactor) *
    vessel.v *
    Math.abs(vessel.v);
  const fuelBurn =
    Math.abs(throttleCommand) * vessel.fuelConsumptionRate * safeDt;
  vessel.fuelLevel = clamp01(vessel.fuelLevel - fuelBurn);
  vessel.lastFuelConsumption =
    safeDt > 0.0 ? (fuelBurn / safeDt) * 3600.0 : 0.0;

  // Simple current force resolved into body frame
  const relCurrentDir = currentDirection - vessel.psi;
  const currentSurge =
    currentSpeed * Math.cos(relCurrentDir) * vessel.mass * 0.01;
  const currentSway =
    currentSpeed * Math.sin(relCurrentDir) * vessel.mass * 0.01;

  // Rudder force proportional to speed^2 and angle
  const speedMag = Math.sqrt(vessel.u * vessel.u + vessel.v * vessel.v);
  // Rudder force with simple stall curve and lever arm toward stern
  const stallFactor =
    1.0 -
    Math.min(1.0, Math.abs(vessel.rudderAngle) / vessel.rudderStallAngle) ** 2;
  const rudderForce =
    vessel.rudderForceCoefficient *
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
    (-dragSway - vessel.swayDamping * vessel.v + currentSway + rudderForce) /
    mass;
  const rDot =
    (rudderMoment -
      windYaw -
      vessel.yawDamping * vessel.r -
      vessel.yawDampingQuad * vessel.r * Math.abs(vessel.r)) /
    Izz;

  // Gerstner-style wave sampling (fallback to wind-derived if missing)
  const fallbackWaveHeight = Math.min(
    MAX_WAVE_HEIGHT,
    windSpeed * WAVE_HEIGHT_PER_WIND,
  );
  const waveH = waveHeight > 0.0 ? waveHeight : fallbackWaveHeight;
  const waveAmp = waveH * 0.5;
  const waveLen =
    waveLength > 1.0 ? waveLength : Math.max(20.0, vessel.length * 2.0);
  const waveDir =
    waveDirection == waveDirection ? waveDirection : windDirection;
  const k = (2.0 * Math.PI) / waveLen;
  const omega = Math.sqrt(GRAVITY * k);
  const steep =
    waveSteepness > 0.0 ? waveSteepness : Math.min(0.7, waveAmp * k);
  vessel.waveAmplitude = waveAmp;
  vessel.waveLength = waveLen;
  vessel.waveDirection = waveDir;
  vessel.waveSteepness = steep;
  vessel.waveTime += safeDt;

  const dirX = Math.cos(waveDir);
  const dirY = Math.sin(waveDir);
  const phase =
    k * (dirX * vessel.x + dirY * vessel.y) - omega * vessel.waveTime;
  const sinPhase = Math.sin(phase);
  const cosPhase = Math.cos(phase);
  const waveElevation = waveAmp * sinPhase;
  const slope = steep * cosPhase;
  const waveSlopeX = slope * dirX;
  const waveSlopeY = slope * dirY;

  // Buoyancy / heave toward target draft (includes ballast and wave surface)
  const neutralDraft =
    effectiveMass /
    (WATER_DENSITY * vessel.length * vessel.beam * vessel.blockCoefficient +
      1e-6);
  const targetDraft = neutralDraft * (0.7 + ballastFactor * 0.5);
  const targetZ = -(targetDraft + waveElevation);
  const heaveAccel =
    (targetZ - vessel.z) * vessel.heaveStiffness -
    vessel.heaveDamping * vessel.w;
  vessel.w += heaveAccel * safeDt;
  vessel.z += vessel.w * safeDt;

  // Roll/pitch restoring toward calm-water and wave slopes
  const waveSlopeRoll = waveSlopeY;
  const waveSlopePitch = waveSlopeX;
  const gmRoll =
    (vessel.beam * vessel.beam * vessel.blockCoefficient) /
    (12.0 * (vessel.draft + 0.1));
  const gmPitch =
    (vessel.length * vessel.blockCoefficient) / (12.0 * (vessel.draft + 0.1));

  const rollRestoring =
    -GRAVITY * gmRoll * mass * (vessel.rollAngle - waveSlopeRoll);
  const pitchRestoring =
    -GRAVITY * gmPitch * mass * (vessel.pitchAngle - waveSlopePitch);

  const pDot = (rollRestoring - vessel.rollDamping * vessel.p) / Ixx;
  const qDot = (pitchRestoring - vessel.pitchDamping * vessel.q) / Iyy;
  vessel.p += pDot * safeDt;
  vessel.q += qDot * safeDt;

  vessel.rollAngle += vessel.p * safeDt;
  vessel.pitchAngle += vessel.q * safeDt;

  // Integrate velocities
  vessel.u += uDot * safeDt;
  vessel.v += vDot * safeDt;
  vessel.r += rDot * safeDt;

  vessel.u = clampSigned(vessel.u, vessel.maxSpeed);
  vessel.v = clampSigned(vessel.v, vessel.maxSpeed * 0.6); // sway a bit lower
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
  if (clamped > vessel.rudderMaxAngle) clamped = vessel.rudderMaxAngle;
  if (clamped < -vessel.rudderMaxAngle) clamped = -vessel.rudderMaxAngle;
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
  return ensureVessel(_vesselPtr).fuelLevel;
}
export function getVesselFuelConsumption(_vesselPtr: usize): f64 {
  return ensureVessel(_vesselPtr).lastFuelConsumption;
}
export function getVesselGM(_vesselPtr: usize): f64 {
  const vessel = ensureVessel(_vesselPtr);
  return (vessel.beam * vessel.blockCoefficient) / (vessel.draft + 0.1);
}
export function getVesselCenterOfGravityY(_vesselPtr: usize): f64 {
  const vessel = ensureVessel(_vesselPtr);
  return vessel.draft * (0.4 + vessel.ballast * 0.2);
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
