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
const DEFAULT_RUDDER_AREA_RATIO: f64 = 0.02;
const DEFAULT_RUDDER_ARM_RATIO: f64 = 0.45;
const DEFAULT_RUDDER_LIFT_SLOPE: f64 = 6.0;
const DEFAULT_PROP_WASH: f64 = 0.6;
const DEFAULT_ENGINE_TIME_CONSTANT: f64 = 2.5;
const DEFAULT_RUDDER_RATE: f64 = 0.25;
const DEFAULT_ADDED_MASS_X_COEFF: f64 = 0.05;
const DEFAULT_ADDED_MASS_Y_COEFF: f64 = 0.2;
const DEFAULT_ADDED_MASS_YAW_COEFF: f64 = 0.02;
const DEFAULT_HULL_YV: f64 = 0.0;
const DEFAULT_HULL_YR: f64 = 0.0;
const DEFAULT_HULL_NV: f64 = 0.0;
const DEFAULT_HULL_NR: f64 = 0.0;
const DEFAULT_CD_SURGE: f64 = 0.7;
const DEFAULT_CD_SWAY: f64 = 1.1;
const DEFAULT_CD_YAW: f64 = 0.2;
const DEFAULT_SHALLOW_WATER_FACTOR: f64 = 1.5;
const DEFAULT_SHALLOW_WATER_YAW_FACTOR: f64 = 1.4;
const DEFAULT_SHALLOW_WATER_RUDDER_FACTOR: f64 = 0.7;
const SHALLOW_WATER_MIN_RATIO: f64 = 1.1;
const SHALLOW_WATER_MAX_RATIO: f64 = 3.0;
const MAX_SPEED_MULTIPLIER: f64 = 1.2;
const MAX_YAW_MULTIPLIER: f64 = 1.5;
const MODEL_DISPLACEMENT: i32 = 0;
const VESSEL_PARAM_BUFFER_CAPACITY: i32 = 64;
const ENVIRONMENT_BUFFER_CAPACITY: i32 = 16;

const PARAM_MASS: i32 = 0;
const PARAM_LENGTH: i32 = 1;
const PARAM_BEAM: i32 = 2;
const PARAM_DRAFT: i32 = 3;
const PARAM_BLOCK_COEFFICIENT: i32 = 4;
const PARAM_RUDDER_FORCE_COEFFICIENT: i32 = 5;
const PARAM_RUDDER_STALL_ANGLE: i32 = 6;
const PARAM_RUDDER_MAX_ANGLE: i32 = 7;
const PARAM_DRAG_COEFFICIENT: i32 = 8;
const PARAM_YAW_DAMPING: i32 = 9;
const PARAM_YAW_DAMPING_QUAD: i32 = 10;
const PARAM_SWAY_DAMPING: i32 = 11;
const PARAM_MAX_THRUST: i32 = 12;
const PARAM_MAX_SPEED: i32 = 13;
const PARAM_ROLL_DAMPING: i32 = 14;
const PARAM_PITCH_DAMPING: i32 = 15;
const PARAM_HEAVE_STIFFNESS: i32 = 16;
const PARAM_HEAVE_DAMPING: i32 = 17;
const PARAM_RUDDER_AREA: i32 = 18;
const PARAM_RUDDER_ARM: i32 = 19;
const PARAM_RUDDER_LIFT_SLOPE: i32 = 20;
const PARAM_PROP_WASH: i32 = 21;
const PARAM_ENGINE_TIME_CONSTANT: i32 = 22;
const PARAM_RUDDER_RATE: i32 = 23;
const PARAM_ADDED_MASS_X: i32 = 24;
const PARAM_ADDED_MASS_Y: i32 = 25;
const PARAM_ADDED_MASS_YAW: i32 = 26;
const PARAM_HULL_YV: i32 = 27;
const PARAM_HULL_YR: i32 = 28;
const PARAM_HULL_NV: i32 = 29;
const PARAM_HULL_NR: i32 = 30;
const PARAM_CD_SURGE: i32 = 31;
const PARAM_CD_SWAY: i32 = 32;
const PARAM_CD_YAW: i32 = 33;
const PARAM_SHALLOW_WATER_FACTOR: i32 = 34;
const PARAM_SHALLOW_WATER_YAW_FACTOR: i32 = 35;
const PARAM_SHALLOW_WATER_RUDDER_FACTOR: i32 = 36;

const ENV_WIND_SPEED: i32 = 0;
const ENV_WIND_DIRECTION: i32 = 1;
const ENV_CURRENT_SPEED: i32 = 2;
const ENV_CURRENT_DIRECTION: i32 = 3;
const ENV_WAVE_HEIGHT: i32 = 4;
const ENV_WAVE_LENGTH: i32 = 5;
const ENV_WAVE_DIRECTION: i32 = 6;
const ENV_WAVE_STEEPNESS: i32 = 7;
const ENV_WATER_DEPTH: i32 = 8;

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

class EnvironmentState {
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

function readParam(
  params: StaticArray<f64>,
  len: i32,
  index: i32,
  fallback: f64,
): f64 {
  if (index < 0 || index >= len) return fallback;
  const value = unchecked(params[index]);
  return value == value ? value : fallback;
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

export function getVesselParamsBufferPtr(): usize {
  return changetype<usize>(vesselParamsBuffer);
}

export function getVesselParamsBufferCapacity(): i32 {
  return VESSEL_PARAM_BUFFER_CAPACITY;
}

export function setVesselParams(
  vesselPtr: usize,
  modelId: i32,
  paramsPtr: usize,
  paramsLen: i32,
): void {
  const vessel = ensureVessel(vesselPtr);
  vessel.modelId = modelId;
  if (paramsPtr === 0 || paramsLen <= 0) return;

  const params = changetype<StaticArray<f64>>(paramsPtr);
  const len = paramsLen > 0 ? paramsLen : 0;
  if (modelId !== MODEL_DISPLACEMENT) return;

  const mass = readParam(params, len, PARAM_MASS, vessel.mass);
  if (mass > 0.0) vessel.mass = mass;
  const length = readParam(params, len, PARAM_LENGTH, vessel.length);
  if (length > 0.0) vessel.length = length;
  const beam = readParam(params, len, PARAM_BEAM, vessel.beam);
  if (beam > 0.0) vessel.beam = beam;
  const draft = readParam(params, len, PARAM_DRAFT, vessel.draft);
  if (draft > 0.0) vessel.draft = draft;
  const blockCoefficient = readParam(
    params,
    len,
    PARAM_BLOCK_COEFFICIENT,
    vessel.blockCoefficient,
  );
  if (blockCoefficient > 0.0) vessel.blockCoefficient = blockCoefficient;

  const rudderForceCoefficient = readParam(
    params,
    len,
    PARAM_RUDDER_FORCE_COEFFICIENT,
    vessel.rudderForceCoefficient,
  );
  if (rudderForceCoefficient >= 0.0) {
    vessel.rudderForceCoefficient = rudderForceCoefficient;
  }
  const rudderStallAngle = readParam(
    params,
    len,
    PARAM_RUDDER_STALL_ANGLE,
    vessel.rudderStallAngle,
  );
  if (rudderStallAngle > 0.0) vessel.rudderStallAngle = rudderStallAngle;
  const rudderMaxAngle = readParam(
    params,
    len,
    PARAM_RUDDER_MAX_ANGLE,
    vessel.rudderMaxAngle,
  );
  if (rudderMaxAngle > 0.0) vessel.rudderMaxAngle = rudderMaxAngle;

  const dragCoefficient = readParam(
    params,
    len,
    PARAM_DRAG_COEFFICIENT,
    vessel.dragCoefficient,
  );
  if (dragCoefficient >= 0.0) vessel.dragCoefficient = dragCoefficient;

  const yawDamping = readParam(
    params,
    len,
    PARAM_YAW_DAMPING,
    vessel.yawDamping,
  );
  if (yawDamping >= 0.0) vessel.yawDamping = yawDamping;
  const yawDampingQuad = readParam(
    params,
    len,
    PARAM_YAW_DAMPING_QUAD,
    vessel.yawDampingQuad,
  );
  if (yawDampingQuad >= 0.0) vessel.yawDampingQuad = yawDampingQuad;
  const swayDamping = readParam(
    params,
    len,
    PARAM_SWAY_DAMPING,
    vessel.swayDamping,
  );
  if (swayDamping >= 0.0) vessel.swayDamping = swayDamping;

  const maxThrust = readParam(params, len, PARAM_MAX_THRUST, vessel.maxThrust);
  if (maxThrust >= 0.0) vessel.maxThrust = maxThrust;
  const maxSpeed = readParam(params, len, PARAM_MAX_SPEED, vessel.maxSpeed);
  if (maxSpeed > 0.0) vessel.maxSpeed = maxSpeed;

  const rollDamping = readParam(
    params,
    len,
    PARAM_ROLL_DAMPING,
    vessel.rollDamping,
  );
  if (rollDamping >= 0.0) vessel.rollDamping = rollDamping;
  const pitchDamping = readParam(
    params,
    len,
    PARAM_PITCH_DAMPING,
    vessel.pitchDamping,
  );
  if (pitchDamping >= 0.0) vessel.pitchDamping = pitchDamping;

  const heaveStiffness = readParam(
    params,
    len,
    PARAM_HEAVE_STIFFNESS,
    vessel.heaveStiffness,
  );
  if (heaveStiffness >= 0.0) vessel.heaveStiffness = heaveStiffness;
  const heaveDamping = readParam(
    params,
    len,
    PARAM_HEAVE_DAMPING,
    vessel.heaveDamping,
  );
  if (heaveDamping >= 0.0) vessel.heaveDamping = heaveDamping;

  const rudderArea = readParam(
    params,
    len,
    PARAM_RUDDER_AREA,
    vessel.rudderArea,
  );
  if (rudderArea > 0.0) vessel.rudderArea = rudderArea;
  const rudderArm = readParam(params, len, PARAM_RUDDER_ARM, vessel.rudderArm);
  if (rudderArm > 0.0) vessel.rudderArm = rudderArm;
  const rudderLiftSlope = readParam(
    params,
    len,
    PARAM_RUDDER_LIFT_SLOPE,
    vessel.rudderLiftSlope,
  );
  if (rudderLiftSlope > 0.0) vessel.rudderLiftSlope = rudderLiftSlope;
  const propWashFactor = readParam(
    params,
    len,
    PARAM_PROP_WASH,
    vessel.propWashFactor,
  );
  if (propWashFactor >= 0.0) vessel.propWashFactor = propWashFactor;
  const engineTimeConstant = readParam(
    params,
    len,
    PARAM_ENGINE_TIME_CONSTANT,
    vessel.engineTimeConstant,
  );
  if (engineTimeConstant > 0.0) vessel.engineTimeConstant = engineTimeConstant;
  const rudderRateLimit = readParam(
    params,
    len,
    PARAM_RUDDER_RATE,
    vessel.rudderRateLimit,
  );
  if (rudderRateLimit > 0.0) vessel.rudderRateLimit = rudderRateLimit;
  const addedMassX = readParam(
    params,
    len,
    PARAM_ADDED_MASS_X,
    vessel.addedMassX,
  );
  if (addedMassX >= 0.0) vessel.addedMassX = addedMassX;
  const addedMassY = readParam(
    params,
    len,
    PARAM_ADDED_MASS_Y,
    vessel.addedMassY,
  );
  if (addedMassY >= 0.0) vessel.addedMassY = addedMassY;
  const addedMassYaw = readParam(
    params,
    len,
    PARAM_ADDED_MASS_YAW,
    vessel.addedMassYaw,
  );
  if (addedMassYaw >= 0.0) vessel.addedMassYaw = addedMassYaw;

  vessel.hullYv = readParam(params, len, PARAM_HULL_YV, vessel.hullYv);
  vessel.hullYr = readParam(params, len, PARAM_HULL_YR, vessel.hullYr);
  vessel.hullNv = readParam(params, len, PARAM_HULL_NV, vessel.hullNv);
  vessel.hullNr = readParam(params, len, PARAM_HULL_NR, vessel.hullNr);

  const cdSurge = readParam(params, len, PARAM_CD_SURGE, vessel.cdSurge);
  if (cdSurge > 0.0) vessel.cdSurge = cdSurge;
  const cdSway = readParam(params, len, PARAM_CD_SWAY, vessel.cdSway);
  if (cdSway > 0.0) vessel.cdSway = cdSway;
  const cdYaw = readParam(params, len, PARAM_CD_YAW, vessel.cdYaw);
  if (cdYaw > 0.0) vessel.cdYaw = cdYaw;

  const shallowWaterFactor = readParam(
    params,
    len,
    PARAM_SHALLOW_WATER_FACTOR,
    vessel.shallowWaterFactor,
  );
  if (shallowWaterFactor >= 0.0) vessel.shallowWaterFactor = shallowWaterFactor;
  const shallowWaterYawFactor = readParam(
    params,
    len,
    PARAM_SHALLOW_WATER_YAW_FACTOR,
    vessel.shallowWaterYawFactor,
  );
  if (shallowWaterYawFactor >= 0.0) {
    vessel.shallowWaterYawFactor = shallowWaterYawFactor;
  }
  const shallowWaterRudderFactor = readParam(
    params,
    len,
    PARAM_SHALLOW_WATER_RUDDER_FACTOR,
    vessel.shallowWaterRudderFactor,
  );
  if (shallowWaterRudderFactor >= 0.0) {
    vessel.shallowWaterRudderFactor = shallowWaterRudderFactor;
  }

  vessel.rudderCommand = clampSigned(
    vessel.rudderCommand,
    vessel.rudderMaxAngle,
  );
  vessel.rudderAngle = clampSigned(vessel.rudderAngle, vessel.rudderMaxAngle);
}

export function getEnvironmentBufferPtr(): usize {
  return changetype<usize>(environmentBuffer);
}

export function getEnvironmentBufferCapacity(): i32 {
  return ENVIRONMENT_BUFFER_CAPACITY;
}

export function setEnvironment(paramsPtr: usize, paramsLen: i32): void {
  if (paramsPtr === 0 || paramsLen <= 0) return;
  const params = changetype<StaticArray<f64>>(paramsPtr);
  const len = paramsLen > 0 ? paramsLen : 0;

  globalEnvironment.windSpeed = readParam(
    params,
    len,
    ENV_WIND_SPEED,
    globalEnvironment.windSpeed,
  );
  globalEnvironment.windDirection = readParam(
    params,
    len,
    ENV_WIND_DIRECTION,
    globalEnvironment.windDirection,
  );
  globalEnvironment.currentSpeed = readParam(
    params,
    len,
    ENV_CURRENT_SPEED,
    globalEnvironment.currentSpeed,
  );
  globalEnvironment.currentDirection = readParam(
    params,
    len,
    ENV_CURRENT_DIRECTION,
    globalEnvironment.currentDirection,
  );
  globalEnvironment.waveHeight = readParam(
    params,
    len,
    ENV_WAVE_HEIGHT,
    globalEnvironment.waveHeight,
  );
  globalEnvironment.waveLength = readParam(
    params,
    len,
    ENV_WAVE_LENGTH,
    globalEnvironment.waveLength,
  );
  globalEnvironment.waveDirection = readParam(
    params,
    len,
    ENV_WAVE_DIRECTION,
    globalEnvironment.waveDirection,
  );
  globalEnvironment.waveSteepness = readParam(
    params,
    len,
    ENV_WAVE_STEEPNESS,
    globalEnvironment.waveSteepness,
  );
  globalEnvironment.waterDepth = readParam(
    params,
    len,
    ENV_WATER_DEPTH,
    globalEnvironment.waterDepth,
  );
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

  // Actuation dynamics (engine lag + rudder rate limit)
  const throttleCommand = clampSigned(vessel.throttleCommand, 1.0);
  const engineTau =
    vessel.engineTimeConstant > 0.05 ? vessel.engineTimeConstant : 0.05;
  vessel.throttle += ((throttleCommand - vessel.throttle) / engineTau) * safeDt;
  vessel.throttle = clampSigned(vessel.throttle, 1.0);

  const rudderDelta = vessel.rudderCommand - vessel.rudderAngle;
  const maxRudderStep =
    vessel.rudderRateLimit > 0.0
      ? vessel.rudderRateLimit * safeDt
      : Math.abs(rudderDelta);
  if (Math.abs(rudderDelta) <= maxRudderStep) {
    vessel.rudderAngle = vessel.rudderCommand;
  } else {
    vessel.rudderAngle += rudderDelta > 0.0 ? maxRudderStep : -maxRudderStep;
  }

  // Engine thrust + fuel burn
  const hasFuel = vessel.fuelLevel > 0.0;
  const throttle = hasFuel ? vessel.throttle : 0.0;
  const thrust = vessel.maxThrust * throttle;
  const fuelBurn = Math.abs(throttle) * vessel.fuelConsumptionRate * safeDt;
  vessel.fuelLevel = clamp01(vessel.fuelLevel - fuelBurn);
  vessel.lastFuelConsumption =
    safeDt > 0.0 ? (fuelBurn / safeDt) * 3600.0 : 0.0;

  // Relative current in body frame
  const relCurrentDir = currentDirection - vessel.psi;
  const currentSurge = currentSpeed * Math.cos(relCurrentDir);
  const currentSway = currentSpeed * Math.sin(relCurrentDir);
  const uRel = vessel.u - currentSurge;
  const vRel = vessel.v - currentSway;

  // Shallow water modifiers
  const waterDepth = globalEnvironment.waterDepth;
  const depthRatio =
    waterDepth > 0.0
      ? waterDepth / (vessel.draft + 0.01)
      : SHALLOW_WATER_MAX_RATIO + 1.0;
  let shallowT = 0.0;
  if (depthRatio > 0.0 && depthRatio < SHALLOW_WATER_MAX_RATIO) {
    const clampedRatio =
      depthRatio < SHALLOW_WATER_MIN_RATIO
        ? SHALLOW_WATER_MIN_RATIO
        : depthRatio;
    shallowT =
      (SHALLOW_WATER_MAX_RATIO - clampedRatio) /
      (SHALLOW_WATER_MAX_RATIO - SHALLOW_WATER_MIN_RATIO);
  }
  const shallowFactor = 1.0 + vessel.shallowWaterFactor * shallowT;
  const shallowYawFactor = 1.0 + vessel.shallowWaterYawFactor * shallowT;
  const shallowRudderFactor =
    1.0 - (1.0 - vessel.shallowWaterRudderFactor) * shallowT;

  // Geometry-scaled drag
  const hullFactor = 0.7 + vessel.blockCoefficient * 0.6;
  const areaX = Math.max(1.0, vessel.length * vessel.draft * hullFactor);
  const areaY = Math.max(
    1.0,
    vessel.beam * vessel.draft * (0.7 + vessel.blockCoefficient * 0.3),
  );
  const dragSurge =
    0.5 *
    WATER_DENSITY *
    vessel.cdSurge *
    areaX *
    uRel *
    Math.abs(uRel) *
    shallowFactor;
  const dragSway =
    0.5 *
    WATER_DENSITY *
    vessel.cdSway *
    areaY *
    vRel *
    Math.abs(vRel) *
    shallowFactor;
  const swayLinear = vessel.swayDamping * vRel;

  // Rudder hydrodynamics with prop wash
  const flowSpeed = Math.sqrt(uRel * uRel + vRel * vRel);
  const washSpeed =
    vessel.propWashFactor > 0.0
      ? Math.sqrt(
          Math.abs(thrust) / (0.5 * WATER_DENSITY * vessel.rudderArea + 1e-6),
        ) * vessel.propWashFactor
      : 0.0;
  const inflowSpeed = Math.sqrt(flowSpeed * flowSpeed + washSpeed * washSpeed);
  const inflowAngle = Math.atan2(vRel, Math.max(0.1, uRel));
  const alpha = vessel.rudderAngle - inflowAngle;
  const absAlpha = Math.abs(alpha);
  const stallRatio =
    vessel.rudderStallAngle > 0.0 ? absAlpha / vessel.rudderStallAngle : 1.0;
  const stallFactor = stallRatio >= 1.0 ? 0.0 : 1.0 - stallRatio * stallRatio;
  const liftCoeff = vessel.rudderLiftSlope * alpha * Math.max(0.0, stallFactor);
  const rudderForce =
    0.5 *
    WATER_DENSITY *
    vessel.rudderArea *
    inflowSpeed *
    inflowSpeed *
    liftCoeff;
  const rudderSway = rudderForce * shallowRudderFactor;
  const rudderMoment = rudderSway * vessel.rudderArm;

  // Hull sway/yaw derivatives
  const hullSway = -(vessel.hullYv * vRel + vessel.hullYr * vessel.r);
  const hullYaw = -(vessel.hullNv * vRel + vessel.hullNr * vessel.r);

  // Simple wind yaw moment
  const windYaw =
    windSpeed * windSpeed * 0.01 * Math.sin(windDirection - vessel.psi);

  // Inertia approximations
  const mass = effectiveMass;
  const massX = Math.max(1.0, mass + vessel.addedMassX);
  const massY = Math.max(1.0, mass + vessel.addedMassY);
  const Izz = Math.max(
    1.0,
    mass * vessel.length * vessel.length * 0.1 + vessel.addedMassYaw,
  );
  const Ixx = mass * vessel.beam * vessel.beam * 0.08;
  const Iyy = mass * vessel.length * vessel.length * 0.08;

  const X = thrust - dragSurge;
  const Y = -dragSway - swayLinear + rudderSway + hullSway;
  const N =
    rudderMoment +
    hullYaw -
    windYaw -
    vessel.yawDamping * vessel.r * shallowYawFactor -
    vessel.yawDampingQuad * vessel.r * Math.abs(vessel.r) * shallowYawFactor;

  // Accelerations with basic Coriolis coupling
  const uDot = X / massX + vessel.v * vessel.r;
  const vDot = Y / massY - vessel.u * vessel.r;
  const rDot = N / Izz;

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

  const pDot = rollRestoring / Ixx - vessel.rollDamping * vessel.p;
  const qDot = pitchRestoring / Iyy - vessel.pitchDamping * vessel.q;
  vessel.p += pDot * safeDt;
  vessel.q += qDot * safeDt;

  vessel.rollAngle += vessel.p * safeDt;
  vessel.pitchAngle += vessel.q * safeDt;

  // Integrate velocities
  vessel.u += uDot * safeDt;
  vessel.v += vDot * safeDt;
  vessel.r += rDot * safeDt;

  const speedCap = vessel.maxSpeed * MAX_SPEED_MULTIPLIER;
  vessel.u = clampSigned(vessel.u, speedCap);
  vessel.v = clampSigned(vessel.v, speedCap * 0.6); // sway a bit lower
  vessel.r = clampSigned(vessel.r, MAX_YAW_RATE * MAX_YAW_MULTIPLIER);

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
  vessel.throttleCommand = clampSigned(throttle, 1.0);
}

export function setRudderAngle(vesselPtr: usize, angle: f64): void {
  const vessel = ensureVessel(vesselPtr);
  if (!isFinite(angle)) return;
  let clamped = angle;
  if (clamped > vessel.rudderMaxAngle) clamped = vessel.rudderMaxAngle;
  if (clamped < -vessel.rudderMaxAngle) clamped = -vessel.rudderMaxAngle;
  vessel.rudderCommand = clamped;
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
