// Shared constants, state models, buffers, and runtime lifecycle helpers.

export const WATER_DENSITY: f64 = 1025.0;
export const DEFAULT_DRAG_COEFFICIENT: f64 = 0.8;
export const DEFAULT_RUDDER_FORCE_COEFFICIENT: f64 = 200000.0;
export const DEFAULT_RUDDER_STALL_ANGLE: f64 = 0.5;
export const DEFAULT_RUDDER_MAX_ANGLE: f64 = 0.6;
export const DEFAULT_MAX_THRUST: f64 = 8.0e5;
export const DEFAULT_MASS: f64 = 5.0e6;
export const DEFAULT_LENGTH: f64 = 120.0;
export const DEFAULT_BEAM: f64 = 20.0;
export const DEFAULT_DRAFT: f64 = 6.0;
export const DEFAULT_BLOCK_COEFFICIENT: f64 = 0.75;
export const GRAVITY: f64 = 9.81;
export const DEFAULT_YAW_DAMPING: f64 = 0.5;
export const DEFAULT_YAW_DAMPING_QUAD: f64 = 1.2;
export const DEFAULT_SWAY_DAMPING: f64 = 0.6;
export const MAX_YAW_RATE: f64 = 0.8;
export const DEFAULT_MAX_SPEED: f64 = 15.0;
export const DEFAULT_HEAVE_STIFFNESS: f64 = 2.0;
export const DEFAULT_HEAVE_DAMPING: f64 = 1.6;
export const WAVE_HEIGHT_PER_WIND: f64 = 0.05;
export const MAX_WAVE_HEIGHT: f64 = 3.0;
export const DEFAULT_ROLL_DAMPING: f64 = 0.8;
export const DEFAULT_PITCH_DAMPING: f64 = 0.6;
export const DEFAULT_FUEL_CONSUMPTION_RATE: f64 = 0.000015;
export const DEFAULT_RUDDER_AREA_RATIO: f64 = 0.02;
export const DEFAULT_RUDDER_ARM_RATIO: f64 = 0.45;
export const DEFAULT_RUDDER_LIFT_SLOPE: f64 = 6.0;
export const DEFAULT_PROP_WASH: f64 = 0.6;
export const DEFAULT_ENGINE_TIME_CONSTANT: f64 = 2.5;
export const DEFAULT_RUDDER_RATE: f64 = 0.25;
export const DEFAULT_ADDED_MASS_X_COEFF: f64 = 0.05;
export const DEFAULT_ADDED_MASS_Y_COEFF: f64 = 0.2;
export const DEFAULT_ADDED_MASS_YAW_COEFF: f64 = 0.02;
export const DEFAULT_HULL_YV: f64 = 0.0;
export const DEFAULT_HULL_YR: f64 = 0.0;
export const DEFAULT_HULL_NV: f64 = 0.0;
export const DEFAULT_HULL_NR: f64 = 0.0;
export const DEFAULT_CD_SURGE: f64 = 0.7;
export const DEFAULT_CD_SWAY: f64 = 1.1;
export const DEFAULT_CD_YAW: f64 = 0.2;
export const DEFAULT_SHALLOW_WATER_FACTOR: f64 = 1.5;
export const DEFAULT_SHALLOW_WATER_YAW_FACTOR: f64 = 1.4;
export const DEFAULT_SHALLOW_WATER_RUDDER_FACTOR: f64 = 0.7;
export const SHALLOW_WATER_MIN_RATIO: f64 = 1.1;
export const SHALLOW_WATER_MAX_RATIO: f64 = 3.0;
export const MAX_SPEED_MULTIPLIER: f64 = 1.2;
export const MAX_YAW_MULTIPLIER: f64 = 1.5;
export const MODEL_DISPLACEMENT: i32 = 0;
export const VESSEL_PARAM_BUFFER_CAPACITY: i32 = 64;
export const ENVIRONMENT_BUFFER_CAPACITY: i32 = 16;

// Vessel param ABI indices.
export const PARAM_MASS: i32 = 0;
export const PARAM_LENGTH: i32 = 1;
export const PARAM_BEAM: i32 = 2;
export const PARAM_DRAFT: i32 = 3;
export const PARAM_BLOCK_COEFFICIENT: i32 = 4;
export const PARAM_RUDDER_FORCE_COEFFICIENT: i32 = 5;
export const PARAM_RUDDER_STALL_ANGLE: i32 = 6;
export const PARAM_RUDDER_MAX_ANGLE: i32 = 7;
export const PARAM_DRAG_COEFFICIENT: i32 = 8;
export const PARAM_YAW_DAMPING: i32 = 9;
export const PARAM_YAW_DAMPING_QUAD: i32 = 10;
export const PARAM_SWAY_DAMPING: i32 = 11;
export const PARAM_MAX_THRUST: i32 = 12;
export const PARAM_MAX_SPEED: i32 = 13;
export const PARAM_ROLL_DAMPING: i32 = 14;
export const PARAM_PITCH_DAMPING: i32 = 15;
export const PARAM_HEAVE_STIFFNESS: i32 = 16;
export const PARAM_HEAVE_DAMPING: i32 = 17;
export const PARAM_RUDDER_AREA: i32 = 18;
export const PARAM_RUDDER_ARM: i32 = 19;
export const PARAM_RUDDER_LIFT_SLOPE: i32 = 20;
export const PARAM_PROP_WASH: i32 = 21;
export const PARAM_ENGINE_TIME_CONSTANT: i32 = 22;
export const PARAM_RUDDER_RATE: i32 = 23;
export const PARAM_ADDED_MASS_X: i32 = 24;
export const PARAM_ADDED_MASS_Y: i32 = 25;
export const PARAM_ADDED_MASS_YAW: i32 = 26;
export const PARAM_HULL_YV: i32 = 27;
export const PARAM_HULL_YR: i32 = 28;
export const PARAM_HULL_NV: i32 = 29;
export const PARAM_HULL_NR: i32 = 30;
export const PARAM_CD_SURGE: i32 = 31;
export const PARAM_CD_SWAY: i32 = 32;
export const PARAM_CD_YAW: i32 = 33;
export const PARAM_SHALLOW_WATER_FACTOR: i32 = 34;
export const PARAM_SHALLOW_WATER_YAW_FACTOR: i32 = 35;
export const PARAM_SHALLOW_WATER_RUDDER_FACTOR: i32 = 36;

// Environment param ABI indices.
export const ENV_WIND_SPEED: i32 = 0;
export const ENV_WIND_DIRECTION: i32 = 1;
export const ENV_CURRENT_SPEED: i32 = 2;
export const ENV_CURRENT_DIRECTION: i32 = 3;
export const ENV_WAVE_HEIGHT: i32 = 4;
export const ENV_WAVE_LENGTH: i32 = 5;
export const ENV_WAVE_DIRECTION: i32 = 6;
export const ENV_WAVE_STEEPNESS: i32 = 7;
export const ENV_WATER_DEPTH: i32 = 8;

export class VesselState {
  x: f64;
  y: f64;
  z: f64;
  rollAngle: f64;
  pitchAngle: f64;
  psi: f64;
  u: f64;
  v: f64;
  w: f64;
  r: f64;
  p: f64;
  q: f64;
  throttle: f64;
  throttleCommand: f64;
  rudderAngle: f64;
  rudderCommand: f64;
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
  rudderArea: f64;
  rudderArm: f64;
  rudderLiftSlope: f64;
  propWashFactor: f64;
  engineTimeConstant: f64;
  rudderRateLimit: f64;
  addedMassX: f64;
  addedMassY: f64;
  addedMassYaw: f64;
  hullYv: f64;
  hullYr: f64;
  hullNv: f64;
  hullNr: f64;
  cdSurge: f64;
  cdSway: f64;
  cdYaw: f64;
  shallowWaterFactor: f64;
  shallowWaterYawFactor: f64;
  shallowWaterRudderFactor: f64;
  waveAmplitude: f64;
  waveLength: f64;
  waveDirection: f64;
  waveSteepness: f64;
  waveTime: f64;
  fuelLevel: f64;
  fuelConsumptionRate: f64;
  lastFuelConsumption: f64;
  modelId: i32;

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
    const initialThrottle = clampSigned(throttle, 1.0);
    this.throttle = initialThrottle;
    this.throttleCommand = initialThrottle;
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
    this.rudderCommand = clampSigned(rudderAngle, this.rudderMaxAngle);
    this.rudderAngle = this.rudderCommand;
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
    this.rudderArea = Math.max(
      0.1,
      DEFAULT_RUDDER_AREA_RATIO * this.length * this.draft,
    );
    this.rudderArm = DEFAULT_RUDDER_ARM_RATIO * this.length;
    this.rudderLiftSlope = DEFAULT_RUDDER_LIFT_SLOPE;
    this.propWashFactor = DEFAULT_PROP_WASH;
    this.engineTimeConstant = DEFAULT_ENGINE_TIME_CONSTANT;
    this.rudderRateLimit = DEFAULT_RUDDER_RATE;
    this.addedMassX = this.mass * DEFAULT_ADDED_MASS_X_COEFF;
    this.addedMassY = this.mass * DEFAULT_ADDED_MASS_Y_COEFF;
    this.addedMassYaw =
      this.mass *
      this.length *
      this.length *
      0.1 *
      DEFAULT_ADDED_MASS_YAW_COEFF;
    this.hullYv = DEFAULT_HULL_YV;
    this.hullYr = DEFAULT_HULL_YR;
    this.hullNv = DEFAULT_HULL_NV;
    this.hullNr = DEFAULT_HULL_NR;
    const baseCd =
      this.dragCoefficient > 0
        ? this.dragCoefficient
        : DEFAULT_DRAG_COEFFICIENT;
    this.cdSurge = baseCd > 0 ? baseCd : DEFAULT_CD_SURGE;
    this.cdSway = baseCd > 0 ? baseCd * 1.2 : DEFAULT_CD_SWAY;
    this.cdYaw = baseCd > 0 ? baseCd * 0.3 : DEFAULT_CD_YAW;
    this.shallowWaterFactor = DEFAULT_SHALLOW_WATER_FACTOR;
    this.shallowWaterYawFactor = DEFAULT_SHALLOW_WATER_YAW_FACTOR;
    this.shallowWaterRudderFactor = DEFAULT_SHALLOW_WATER_RUDDER_FACTOR;
    this.waveAmplitude = 0.0;
    this.waveLength = 0.0;
    this.waveDirection = 0.0;
    this.waveSteepness = 0.0;
    this.waveTime = 0.0;
    this.fuelLevel = 1.0;
    this.fuelConsumptionRate = DEFAULT_FUEL_CONSUMPTION_RATE;
    this.lastFuelConsumption = 0.0;
    this.modelId = MODEL_DISPLACEMENT;
  }
}

export class EnvironmentState {
  windSpeed: f64 = 0.0;
  windDirection: f64 = 0.0;
  currentSpeed: f64 = 0.0;
  currentDirection: f64 = 0.0;
  waveHeight: f64 = 0.0;
  waveLength: f64 = 0.0;
  waveDirection: f64 = 0.0;
  waveSteepness: f64 = 0.0;
  waterDepth: f64 = 0.0;
}

let globalVessel: VesselState | null = null;
let globalEnvironment = new EnvironmentState();
let vesselParamsBuffer = new StaticArray<f64>(VESSEL_PARAM_BUFFER_CAPACITY);
let environmentBuffer = new StaticArray<f64>(ENVIRONMENT_BUFFER_CAPACITY);

export function clamp01(value: f64): f64 {
  if (value < 0.0) return 0.0;
  if (value > 1.0) return 1.0;
  return value;
}

export function clampSigned(value: f64, limit: f64): f64 {
  if (value > limit) return limit;
  if (value < -limit) return -limit;
  return value;
}

export function normalizeAngle(angle: f64): f64 {
  let normalized = angle % (2.0 * Math.PI);
  if (normalized < 0.0) normalized += 2.0 * Math.PI;
  return normalized;
}

export function ensureVessel(vesselPtr: usize): VesselState {
  if (vesselPtr === 0) throw new Error('Vessel pointer is null');
  return changetype<VesselState>(vesselPtr);
}

export function readParam(
  params: StaticArray<f64>,
  len: i32,
  index: i32,
  fallback: f64,
): f64 {
  if (index < 0 || index >= len) return fallback;
  const value = unchecked(params[index]);
  return value == value ? value : fallback;
}

export function getGlobalVessel(): VesselState | null {
  return globalVessel;
}

export function setGlobalVessel(next: VesselState | null): void {
  globalVessel = next;
}

export function getGlobalEnvironment(): EnvironmentState {
  return globalEnvironment;
}

export function resetEnvironmentState(): void {
  globalEnvironment = new EnvironmentState();
}

export function getVesselParamsBufferPtr(): usize {
  return changetype<usize>(vesselParamsBuffer);
}

export function getVesselParamsBufferCapacity(): i32 {
  return VESSEL_PARAM_BUFFER_CAPACITY;
}

export function getEnvironmentBufferPtr(): usize {
  return changetype<usize>(environmentBuffer);
}

export function getEnvironmentBufferCapacity(): i32 {
  return ENVIRONMENT_BUFFER_CAPACITY;
}

function clearBuffer(buffer: StaticArray<f64>, capacity: i32): void {
  for (let i = 0; i < capacity; i++) {
    unchecked((buffer[i] = 0.0));
  }
}

export function resetSimulationRuntime(): void {
  globalVessel = null;
  resetEnvironmentState();
  clearBuffer(vesselParamsBuffer, VESSEL_PARAM_BUFFER_CAPACITY);
  clearBuffer(environmentBuffer, ENVIRONMENT_BUFFER_CAPACITY);
}

export function resetGlobalVessel(): void {
  globalVessel = null;
}

export function resetGlobalEnvironment(): void {
  resetEnvironmentState();
}
