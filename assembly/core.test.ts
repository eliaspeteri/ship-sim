import {
  createVessel,
  updateVesselState,
  setThrottle,
  setRudderAngle,
  getVesselX,
  getVesselY,
  getVesselZ,
  getVesselSpeed,
  getVesselSurgeVelocity,
  getVesselSwayVelocity,
  getVesselHeaveVelocity,
  getVesselHeading,
  getVesselEngineRPM,
  getVesselRudderAngle,
  getVesselRollRate,
  getVesselPitchRate,
  getVesselYawRate,
  getVesselGM,
  getVesselCenterOfGravityY,
  getVesselFuelLevel,
  getVesselFuelConsumption,
  getVesselBallastLevel,
  getVesselRollAngle,
  getVesselPitchAngle,
  destroyVessel,
  getVesselParamsBufferPtr,
  getVesselParamsBufferCapacity,
  setVesselParams,
  getEnvironmentBufferPtr,
  getEnvironmentBufferCapacity,
  setEnvironment,
  calculateSeaState,
  getWaveHeightForSeaState,
  resetGlobalEnvironment,
  resetSimulationRuntime,
  setBallast,
} from './index';
import {
  describe,
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly/index';

const DEFAULT_BLOCK_COEFFICIENT = 0.75;
const DEFAULT_BEAM = 20.0;
const DEFAULT_DRAFT = 6.0;
const DEFAULT_BALLAST = 0.5;
const DEFAULT_MASS = 5_000_000;
const DEFAULT_LENGTH = 120.0;
const DEFAULT_RUDDER_FORCE_COEFFICIENT = 200_000.0;
const DEFAULT_RUDDER_STALL_ANGLE = 0.5;
const DEFAULT_RUDDER_MAX_ANGLE = 0.6;
const DEFAULT_DRAG_COEFFICIENT = 0.8;
const DEFAULT_YAW_DAMPING = 0.5;
const DEFAULT_YAW_DAMPING_QUAD = 1.2;
const DEFAULT_SWAY_DAMPING = 0.6;
const DEFAULT_MAX_THRUST = 800_000.0;
const DEFAULT_MAX_SPEED = 15.0;
const DEFAULT_ROLL_DAMPING = 0.8;
const DEFAULT_PITCH_DAMPING = 0.6;
const DEFAULT_HEAVE_STIFFNESS = 2.0;
const DEFAULT_HEAVE_DAMPING = 1.6;
const DEFAULT_CD_SURGE = 0.7;
const DEFAULT_CD_SWAY = 1.1;
const DEFAULT_CD_YAW = 0.2;
const DEFAULT_SHALLOW_WATER_FACTOR = 1.5;
const DEFAULT_SHALLOW_WATER_YAW_FACTOR = 1.4;
const DEFAULT_SHALLOW_WATER_RUDDER_FACTOR = 0.7;
const GM_DRAFT_OFFSET = 0.1;
const CGY_BASE = 0.4;
const CGY_BALLAST_SCALE = 0.2;
const ORIGIN_X = 0.0;
const ORIGIN_Y = 0.0;
const ORIGIN_Z = 0.0;
const NO_HEADING = 0.0;
const NO_ROLL = 0.0;
const NO_PITCH = 0.0;
const STILL_SURGE = 0.0;
const STILL_SWAY = 0.0;
const STILL_HEAVE = 0.0;
const ZERO_YAW_RATE = 0.0;
const ZERO_ROLL_RATE = 0.0;
const ZERO_PITCH_RATE = 0.0;
const NO_THROTTLE = 0.0;
const NO_RUDDER = 0.0;
const NO_WIND_SPEED = 0.0;
const NO_WIND_DIRECTION = 0.0;
const NO_CURRENT_SPEED = 0.0;
const NO_CURRENT_DIRECTION = 0.0;
const NO_WAVE_HEIGHT = 0.0;
const NO_WAVE_LENGTH = 0.0;
const NO_WAVE_DIRECTION = 0.0;
const NO_WAVE_STEEPNESS = 0.0;
const DT_SHORT = 0.1;
const DT_MEDIUM = 0.2;
const DT_LONG = 0.5;
const DT_CLAMPED = 10.0;
const THROTTLE_HALF = 0.5;
const THROTTLE_THIRTY_PERCENT = 0.3;
const THROTTLE_OVER_MAX = 2.0;
const RUDDER_TEST_ANGLE = 0.3;
const RUDDER_OVER_MAX = 1.5;
const RUDDER_MAX_ANGLE = 0.6;
const CURRENT_SPEED = 1.0;
const CROSS_WIND_SPEED = 5.0;
const FULL_BALLAST = 1.0;
const EMPTY_BALLAST = 0.0;
const SETTLE_STEPS = 20;
const LOOP_START = 0;
const WATERLINE_Z = 0.0;
const INITIAL_ROLL = 0.1;
const INITIAL_PITCH = -0.2;
const WAVE_COUPLING_WIND = 10.0;
const POSITION_X = 1.0;
const POSITION_Y = 2.0;
const POSITION_Z = 3.0;
const HEADING_SAMPLE = 0.5;
const SURGE_SAMPLE = 0.1;
const SWAY_SAMPLE = 0.2;
const HEAVE_SAMPLE = 0.0;
const YAW_RATE_SAMPLE = 0.01;
const RUDDER_ANGLE_SAMPLE = 0.1;
const MAX_ENGINE_RPM = 1200.0;
const TWO = 2.0;
const HALF_TURN = Math.PI / TWO;
const POSITIVE_SPEED_THRESHOLD = 0.0;
const VESSEL_PARAM_BUFFER_CAPACITY = 64;
const ENVIRONMENT_BUFFER_CAPACITY = 16;
const PARAM_MASS = 0;
const PARAM_LENGTH = 1;
const PARAM_BEAM = 2;
const PARAM_DRAFT = 3;
const PARAM_BLOCK_COEFFICIENT = 4;
const PARAM_RUDDER_FORCE_COEFFICIENT = 5;
const PARAM_RUDDER_STALL_ANGLE = 6;
const PARAM_RUDDER_MAX_ANGLE = 7;
const PARAM_DRAG_COEFFICIENT = 8;
const PARAM_YAW_DAMPING = 9;
const PARAM_YAW_DAMPING_QUAD = 10;
const PARAM_SWAY_DAMPING = 11;
const PARAM_MAX_THRUST = 12;
const PARAM_MAX_SPEED = 13;
const PARAM_ROLL_DAMPING = 14;
const PARAM_PITCH_DAMPING = 15;
const PARAM_HEAVE_STIFFNESS = 16;
const PARAM_HEAVE_DAMPING = 17;
const PARAM_RUDDER_AREA = 18;
const PARAM_RUDDER_ARM = 19;
const PARAM_RUDDER_LIFT_SLOPE = 20;
const PARAM_PROP_WASH = 21;
const PARAM_ENGINE_TIME_CONSTANT = 22;
const PARAM_RUDDER_RATE = 23;
const PARAM_ADDED_MASS_X = 24;
const PARAM_ADDED_MASS_Y = 25;
const PARAM_ADDED_MASS_YAW = 26;
const PARAM_CD_SWAY = 32;
const PARAM_CD_YAW = 33;
const PARAM_CD_SURGE = 31;
const PARAM_SHALLOW_WATER_FACTOR = 34;
const PARAM_SHALLOW_WATER_YAW_FACTOR = 35;
const PARAM_SHALLOW_WATER_RUDDER_FACTOR = 36;
const ENV_WIND_SPEED = 0;
const ENV_WATER_DEPTH = 8;
const RUDDER_TIGHT_MAX = 0.2;
const CUSTOM_MASS = 4_000_000.0;
const CUSTOM_LENGTH = 150.0;
const CUSTOM_DRAFT = 5.5;
const CUSTOM_BLOCK_COEFFICIENT = 0.8;
const CUSTOM_CD_SURGE = 0.9;
const SHALLOW_WATER_DEPTH = 8.0;
const NEGATIVE_WIND = -1.0;
const HIGH_WIND = 30.0;
const MID_WIND = 3.0;
const SEA_STATE_HALF = 2.0;
const EXPECTED_SEA_STATE = 2.0;
const EXPECTED_WAVE_HEIGHT = 1.0;
const NEGATIVE_VALUE = -1.0;
const POSITIVE_MASS = 6_000_000.0;
const POSITIVE_LENGTH = 140.0;
const POSITIVE_BEAM = 25.0;
const POSITIVE_DRAFT = 7.0;
const POSITIVE_BLOCK_COEFFICIENT = 0.7;
const POSITIVE_RUDDER_FORCE_COEFFICIENT = 100_000.0;
const POSITIVE_RUDDER_STALL_ANGLE = 0.4;
const POSITIVE_RUDDER_MAX_ANGLE = 0.4;
const POSITIVE_DRAG_COEFFICIENT = 0.9;
const POSITIVE_YAW_DAMPING = 0.9;
const POSITIVE_YAW_DAMPING_QUAD = 1.8;
const POSITIVE_SWAY_DAMPING = 0.9;
const POSITIVE_MAX_THRUST = 900_000.0;
const POSITIVE_MAX_SPEED = 18.0;
const POSITIVE_ROLL_DAMPING = 1.2;
const POSITIVE_PITCH_DAMPING = 1.1;
const POSITIVE_HEAVE_STIFFNESS = 2.5;
const POSITIVE_HEAVE_DAMPING = 1.9;
const POSITIVE_RUDDER_AREA = 15.0;
const POSITIVE_RUDDER_ARM = 30.0;
const POSITIVE_RUDDER_LIFT_SLOPE = 7.0;
const POSITIVE_PROP_WASH = 0.8;
const POSITIVE_ENGINE_TAU = 3.0;
const POSITIVE_RUDDER_RATE = 0.4;
const POSITIVE_ADDED_MASS_X = 10_000.0;
const POSITIVE_ADDED_MASS_Y = 20_000.0;
const POSITIVE_ADDED_MASS_YAW = 30_000.0;
const POSITIVE_CD_SURGE = 0.8;
const POSITIVE_CD_SWAY = 1.3;
const POSITIVE_CD_YAW = 0.4;
const POSITIVE_SHALLOW_WATER_FACTOR = 1.8;
const POSITIVE_SHALLOW_WATER_YAW_FACTOR = 1.6;
const POSITIVE_SHALLOW_WATER_RUDDER_FACTOR = 0.5;
const NON_DISPLACEMENT_MODEL = 1;
const LARGE_NEGATIVE = -10.0;
const POSITIVE_HEADING = 0.25;

class VesselSetup {
  x: f64 = ORIGIN_X;
  y: f64 = ORIGIN_Y;
  z: f64 = ORIGIN_Z;
  heading: f64 = NO_HEADING;
  roll: f64 = NO_ROLL;
  pitch: f64 = NO_PITCH;
  surge: f64 = STILL_SURGE;
  sway: f64 = STILL_SWAY;
  heave: f64 = STILL_HEAVE;
  yawRate: f64 = ZERO_YAW_RATE;
  throttle: f64 = NO_THROTTLE;
  rudder: f64 = NO_RUDDER;
  mass: f64 = DEFAULT_MASS;
  length: f64 = DEFAULT_LENGTH;
  beam: f64 = DEFAULT_BEAM;
  draft: f64 = DEFAULT_DRAFT;
}

function createTestVessel(setup: VesselSetup = new VesselSetup()): usize {
  return createVessel(
    setup.x,
    setup.y,
    setup.z,
    setup.heading,
    setup.roll,
    setup.pitch,
    setup.surge,
    setup.sway,
    setup.heave,
    setup.yawRate,
    ZERO_ROLL_RATE,
    ZERO_PITCH_RATE,
    setup.throttle,
    setup.rudder,
    setup.mass,
    setup.length,
    setup.beam,
    setup.draft,
  );
}

function updateCalmWater(ptr: usize, dt: f64): void {
  updateVesselState(
    ptr,
    dt,
    NO_WIND_SPEED,
    NO_WIND_DIRECTION,
    NO_CURRENT_SPEED,
    NO_CURRENT_DIRECTION,
    NO_WAVE_HEIGHT,
    NO_WAVE_LENGTH,
    NO_WAVE_DIRECTION,
    NO_WAVE_STEEPNESS,
  );
}

function resetRuntime(): void {
  resetSimulationRuntime();
}

describe('Physics core: actuation and motion', () => {
  test('vessel moves forward with throttle', () => {
    resetRuntime();
    const ptr = createTestVessel();
    setThrottle(ptr, THROTTLE_HALF);
    const initialX = getVesselX(ptr);
    updateCalmWater(ptr, DT_SHORT);
    const finalX = getVesselX(ptr);
    expect(finalX).greaterThan(initialX);
    expect<f64>(getVesselSurgeVelocity(ptr)).greaterThan(
      POSITIVE_SPEED_THRESHOLD,
    );
  });

  test('rudder creates heading change when moving', () => {
    resetRuntime();
    const setup = new VesselSetup();
    setup.surge = CURRENT_SPEED;
    setup.throttle = THROTTLE_HALF;
    const ptr = createTestVessel(setup);
    setRudderAngle(ptr, RUDDER_TEST_ANGLE);
    const initialHeading = getVesselHeading(ptr);
    updateCalmWater(ptr, DT_MEDIUM);
    const finalHeading = getVesselHeading(ptr);
    expect(finalHeading).greaterThan(initialHeading);
  });

  test('time step is clamped to avoid instability', () => {
    resetRuntime();
    const setup = new VesselSetup();
    setup.throttle = CURRENT_SPEED;
    const ptr = createTestVessel(setup);
    const before = getVesselX(ptr);
    updateCalmWater(ptr, DT_CLAMPED); // dt will be clamped internally
    const after = getVesselX(ptr);
    expect(after).greaterThan(before);
  });

  test('throttle is clamped and RPM reflects clamp', () => {
    resetRuntime();
    const ptr = createTestVessel();
    setThrottle(ptr, THROTTLE_OVER_MAX); // beyond allowed
    updateCalmWater(ptr, DT_SHORT);
    expect<f64>(getVesselEngineRPM(ptr)).lessThanOrEqual(MAX_ENGINE_RPM);
  });

  test('rudder angle is clamped', () => {
    resetRuntime();
    const ptr = createTestVessel();
    setRudderAngle(ptr, RUDDER_OVER_MAX);
    expect<f64>(getVesselRudderAngle(ptr)).lessThanOrEqual(RUDDER_MAX_ANGLE);
  });

  test('current pushes vessel in heading direction', () => {
    resetRuntime();
    const ptr = createTestVessel();
    const before = getVesselX(ptr);
    updateVesselState(
      ptr,
      DT_MEDIUM,
      NO_WIND_SPEED,
      NO_WIND_DIRECTION,
      CURRENT_SPEED,
      NO_CURRENT_DIRECTION,
      NO_WAVE_HEIGHT,
      NO_WAVE_LENGTH,
      NO_WAVE_DIRECTION,
      NO_WAVE_STEEPNESS,
    );
    const after = getVesselX(ptr);
    expect(after).greaterThan(before);
  });

  test('cross-wind induces heading change', () => {
    resetRuntime();
    const setup = new VesselSetup();
    setup.surge = THROTTLE_HALF;
    setup.throttle = SURGE_SAMPLE;
    const ptr = createTestVessel(setup);
    const beforeHeading = getVesselHeading(ptr);
    updateVesselState(
      ptr,
      DT_MEDIUM,
      CROSS_WIND_SPEED,
      HALF_TURN,
      NO_CURRENT_SPEED,
      NO_CURRENT_DIRECTION,
      NO_WAVE_HEIGHT,
      NO_WAVE_LENGTH,
      NO_WAVE_DIRECTION,
      NO_WAVE_STEEPNESS,
    );
    const afterHeading = getVesselHeading(ptr);
    expect<f64>(afterHeading).notEqual(beforeHeading);
  });

  test('ballast changes acceleration response', () => {
    resetRuntime();
    const heavySetup = new VesselSetup();
    heavySetup.throttle = THROTTLE_HALF;
    const heavy = createTestVessel(heavySetup);
    setBallast(heavy, FULL_BALLAST);
    setThrottle(heavy, THROTTLE_HALF);
    updateCalmWater(heavy, DT_LONG);

    resetRuntime();
    const lightSetup = new VesselSetup();
    lightSetup.throttle = THROTTLE_HALF;
    const light = createTestVessel(lightSetup);
    setBallast(light, EMPTY_BALLAST);
    setThrottle(light, THROTTLE_HALF);
    updateCalmWater(light, DT_LONG);

    expect<f64>(getVesselX(light)).greaterThan(getVesselX(heavy));
    expect<f64>(getVesselBallastLevel(light)).equal(EMPTY_BALLAST);
    expect<f64>(getVesselBallastLevel(heavy)).equal(FULL_BALLAST);
  });

  test('buoyancy pulls vessel toward target draft with ballast', () => {
    resetRuntime();
    const ptr = createTestVessel();
    setBallast(ptr, FULL_BALLAST);
    // run several steps to settle heave
    for (let i = LOOP_START; i < SETTLE_STEPS; i++) {
      updateVesselState(
        ptr,
        DT_SHORT,
        CROSS_WIND_SPEED,
        NO_WIND_DIRECTION,
        NO_CURRENT_SPEED,
        NO_CURRENT_DIRECTION,
        NO_WAVE_HEIGHT,
        NO_WAVE_LENGTH,
        NO_WAVE_DIRECTION,
        NO_WAVE_STEEPNESS,
      );
    }
    const sunk = getVesselZ(ptr);
    resetRuntime();
    const ptr2 = createTestVessel();
    setBallast(ptr2, EMPTY_BALLAST);
    for (let i = LOOP_START; i < SETTLE_STEPS; i++) {
      updateVesselState(
        ptr2,
        DT_SHORT,
        CROSS_WIND_SPEED,
        NO_WIND_DIRECTION,
        NO_CURRENT_SPEED,
        NO_CURRENT_DIRECTION,
        NO_WAVE_HEIGHT,
        NO_WAVE_LENGTH,
        NO_WAVE_DIRECTION,
        NO_WAVE_STEEPNESS,
      );
    }
    const floated = getVesselZ(ptr2);
    expect<f64>(sunk).lessThan(floated); // heavier ballast sits lower (more negative z)
    expect<f64>(floated).lessThan(WATERLINE_Z); // displaced below waterline
  });

  test('roll and pitch persist and respond to waves', () => {
    resetRuntime();
    const setup = new VesselSetup();
    setup.roll = INITIAL_ROLL;
    setup.pitch = INITIAL_PITCH;
    setup.rudder = THROTTLE_HALF;
    const ptr = createTestVessel(setup);
    const initialRoll = getVesselRollAngle(ptr);
    const initialPitch = getVesselPitchAngle(ptr);
    updateVesselState(
      ptr,
      DT_MEDIUM,
      WAVE_COUPLING_WIND,
      NO_WIND_DIRECTION,
      NO_CURRENT_SPEED,
      NO_CURRENT_DIRECTION,
      NO_WAVE_HEIGHT,
      NO_WAVE_LENGTH,
      NO_WAVE_DIRECTION,
      NO_WAVE_STEEPNESS,
    ); // wind drives wave coupling
    const nextRoll = getVesselRollAngle(ptr);
    const nextPitch = getVesselPitchAngle(ptr);
    expect<f64>(initialRoll).equal(INITIAL_ROLL);
    expect<f64>(initialPitch).equal(INITIAL_PITCH);
    expect<f64>(nextRoll).notEqual(initialRoll);
    expect<f64>(nextPitch).notEqual(initialPitch);
  });

  test('getter surfaces return values without throwing', () => {
    resetRuntime();
    const setup = new VesselSetup();
    setup.x = POSITION_X;
    setup.y = POSITION_Y;
    setup.z = POSITION_Z;
    setup.heading = HEADING_SAMPLE;
    setup.surge = SURGE_SAMPLE;
    setup.sway = SWAY_SAMPLE;
    setup.heave = HEAVE_SAMPLE;
    setup.yawRate = YAW_RATE_SAMPLE;
    setup.throttle = THROTTLE_THIRTY_PERCENT;
    setup.rudder = RUDDER_ANGLE_SAMPLE;
    const ptr = createTestVessel(setup);
    // Positions and heading
    expect<f64>(getVesselX(ptr)).equal(POSITION_X);
    expect<f64>(getVesselY(ptr)).equal(POSITION_Y);
    expect<f64>(getVesselZ(ptr)).equal(POSITION_Z);
    expect<f64>(getVesselHeading(ptr)).equal(HEADING_SAMPLE);
    // Velocities
    expect<f64>(getVesselSurgeVelocity(ptr)).equal(SURGE_SAMPLE);
    expect<f64>(getVesselSwayVelocity(ptr)).equal(SWAY_SAMPLE);
    expect<f64>(getVesselHeaveVelocity(ptr)).equal(HEAVE_SAMPLE);
    // Rates and controls (stubs are fine)
    expect<f64>(getVesselRollRate(ptr)).equal(ZERO_ROLL_RATE);
    expect<f64>(getVesselPitchRate(ptr)).equal(ZERO_PITCH_RATE);
    expect<f64>(getVesselYawRate(ptr)).equal(YAW_RATE_SAMPLE);
    expect<f64>(getVesselRudderAngle(ptr)).equal(RUDDER_ANGLE_SAMPLE);
    // Stability/fuel stubs
    const expectedGM =
      (DEFAULT_BEAM * DEFAULT_BLOCK_COEFFICIENT) /
      (DEFAULT_DRAFT + GM_DRAFT_OFFSET);
    const expectedCgy =
      DEFAULT_DRAFT * (CGY_BASE + DEFAULT_BALLAST * CGY_BALLAST_SCALE);
    expect<f64>(getVesselGM(ptr)).equal(expectedGM);
    expect<f64>(getVesselCenterOfGravityY(ptr)).equal(expectedCgy);
    expect<f64>(getVesselFuelLevel(ptr)).equal(FULL_BALLAST);
    expect<f64>(getVesselFuelConsumption(ptr)).equal(NO_THROTTLE);
    expect<f64>(getVesselBallastLevel(ptr)).equal(DEFAULT_BALLAST);
    // Derived getters
    expect<f64>(getVesselSpeed(ptr)).greaterThanOrEqual(NO_THROTTLE);
    expect<f64>(getVesselRollAngle(ptr)).equal(NO_ROLL);
    expect<f64>(getVesselPitchAngle(ptr)).equal(NO_PITCH);
    expect<f64>(getVesselEngineRPM(ptr)).equal(
      THROTTLE_THIRTY_PERCENT * MAX_ENGINE_RPM,
    );
  });
});

describe('Physics core: params and runtime boundaries', () => {
  test('buffer helpers expose pointers and capacities', () => {
    expect<i32>(getVesselParamsBufferCapacity()).equal(
      VESSEL_PARAM_BUFFER_CAPACITY,
    );
    expect<i32>(getEnvironmentBufferCapacity()).equal(
      ENVIRONMENT_BUFFER_CAPACITY,
    );
    expect<usize>(getVesselParamsBufferPtr()).notEqual(0);
    expect<usize>(getEnvironmentBufferPtr()).notEqual(0);
  });

  test('setVesselParams updates values and clamps rudder', () => {
    resetRuntime();
    const setup = new VesselSetup();
    setup.rudder = RUDDER_TEST_ANGLE;
    const ptr = createTestVessel(setup);
    const params = new StaticArray<f64>(VESSEL_PARAM_BUFFER_CAPACITY);
    unchecked((params[PARAM_MASS] = CUSTOM_MASS));
    unchecked((params[PARAM_LENGTH] = CUSTOM_LENGTH));
    unchecked((params[PARAM_BEAM] = NaN));
    unchecked((params[PARAM_DRAFT] = CUSTOM_DRAFT));
    unchecked((params[PARAM_BLOCK_COEFFICIENT] = CUSTOM_BLOCK_COEFFICIENT));
    unchecked((params[PARAM_RUDDER_MAX_ANGLE] = RUDDER_TIGHT_MAX));
    unchecked((params[PARAM_CD_SURGE] = CUSTOM_CD_SURGE));
    unchecked((params[PARAM_SHALLOW_WATER_FACTOR] = 2.0));
    unchecked((params[PARAM_SHALLOW_WATER_YAW_FACTOR] = 1.3));
    unchecked((params[PARAM_SHALLOW_WATER_RUDDER_FACTOR] = 0.5));

    setVesselParams(
      ptr,
      0,
      changetype<usize>(params),
      VESSEL_PARAM_BUFFER_CAPACITY,
    );

    const expectedGM =
      (DEFAULT_BEAM * CUSTOM_BLOCK_COEFFICIENT) /
      (CUSTOM_DRAFT + GM_DRAFT_OFFSET);
    expect<f64>(getVesselGM(ptr)).equal(expectedGM);
    expect<f64>(getVesselRudderAngle(ptr)).lessThanOrEqual(RUDDER_TIGHT_MAX);
  });

  test('setEnvironment handles shallow water and readParam bounds', () => {
    resetRuntime();
    const setup = new VesselSetup();
    setup.surge = CURRENT_SPEED;
    setup.throttle = THROTTLE_HALF;
    const ptr = createTestVessel(setup);
    const env = new StaticArray<f64>(ENVIRONMENT_BUFFER_CAPACITY);
    unchecked((env[ENV_WIND_SPEED] = NO_WIND_SPEED));
    unchecked((env[ENV_WATER_DEPTH] = SHALLOW_WATER_DEPTH));
    setEnvironment(changetype<usize>(env), 1);
    setEnvironment(changetype<usize>(env), ENV_WATER_DEPTH + 1);
    updateCalmWater(ptr, DT_MEDIUM);
    expect<f64>(getVesselSpeed(ptr)).greaterThanOrEqual(NO_THROTTLE);
  });

  test('sea state helpers clamp and scale', () => {
    expect<f64>(calculateSeaState(NEGATIVE_WIND)).equal(0.0);
    expect<f64>(calculateSeaState(HIGH_WIND)).equal(12.0);
    expect<f64>(calculateSeaState(MID_WIND)).equal(EXPECTED_SEA_STATE);
    expect<f64>(getWaveHeightForSeaState(SEA_STATE_HALF)).equal(
      EXPECTED_WAVE_HEIGHT,
    );
  });

  test('destroying vessel clears global instance', () => {
    resetRuntime();
    const ptr = createTestVessel();
    destroyVessel(ptr);
    const setup = new VesselSetup();
    setup.x = POSITION_X;
    setup.y = POSITION_Y;
    setup.z = POSITION_Z;
    const next = createTestVessel(setup);
    expect<f64>(getVesselX(next)).equal(POSITION_X);
  });

  test('constructor guards fall back to defaults for non-positive values', () => {
    resetRuntime();
    const ptr = createVessel(
      ORIGIN_X,
      ORIGIN_Y,
      ORIGIN_Z,
      POSITIVE_HEADING,
      NO_ROLL,
      NO_PITCH,
      STILL_SURGE,
      STILL_SWAY,
      STILL_HEAVE,
      ZERO_YAW_RATE,
      ZERO_ROLL_RATE,
      ZERO_PITCH_RATE,
      NO_THROTTLE,
      NO_RUDDER,
      NEGATIVE_VALUE,
      NEGATIVE_VALUE,
      NEGATIVE_VALUE,
      NEGATIVE_VALUE,
      NEGATIVE_VALUE,
      NEGATIVE_VALUE,
      NEGATIVE_VALUE,
      NEGATIVE_VALUE,
      NEGATIVE_VALUE,
      NEGATIVE_VALUE,
      NEGATIVE_VALUE,
      NEGATIVE_VALUE,
      NEGATIVE_VALUE,
      NEGATIVE_VALUE,
    );
    const expectedGM =
      (DEFAULT_BEAM * DEFAULT_BLOCK_COEFFICIENT) /
      (DEFAULT_DRAFT + GM_DRAFT_OFFSET);
    expect<f64>(getVesselGM(ptr)).equal(expectedGM);
    expect<f64>(getVesselHeading(ptr)).equal(POSITIVE_HEADING);
  });

  test('setVesselParams applies positive values and ignores negatives', () => {
    resetRuntime();
    const ptr = createTestVessel();
    const params = new StaticArray<f64>(VESSEL_PARAM_BUFFER_CAPACITY);
    unchecked((params[PARAM_MASS] = POSITIVE_MASS));
    unchecked((params[PARAM_LENGTH] = POSITIVE_LENGTH));
    unchecked((params[PARAM_BEAM] = POSITIVE_BEAM));
    unchecked((params[PARAM_DRAFT] = POSITIVE_DRAFT));
    unchecked((params[PARAM_BLOCK_COEFFICIENT] = POSITIVE_BLOCK_COEFFICIENT));
    unchecked(
      (params[PARAM_RUDDER_FORCE_COEFFICIENT] =
        POSITIVE_RUDDER_FORCE_COEFFICIENT),
    );
    unchecked((params[PARAM_RUDDER_STALL_ANGLE] = POSITIVE_RUDDER_STALL_ANGLE));
    unchecked((params[PARAM_RUDDER_MAX_ANGLE] = POSITIVE_RUDDER_MAX_ANGLE));
    unchecked((params[PARAM_DRAG_COEFFICIENT] = POSITIVE_DRAG_COEFFICIENT));
    unchecked((params[PARAM_YAW_DAMPING] = POSITIVE_YAW_DAMPING));
    unchecked((params[PARAM_YAW_DAMPING_QUAD] = POSITIVE_YAW_DAMPING_QUAD));
    unchecked((params[PARAM_SWAY_DAMPING] = POSITIVE_SWAY_DAMPING));
    unchecked((params[PARAM_MAX_THRUST] = POSITIVE_MAX_THRUST));
    unchecked((params[PARAM_MAX_SPEED] = POSITIVE_MAX_SPEED));
    unchecked((params[PARAM_ROLL_DAMPING] = POSITIVE_ROLL_DAMPING));
    unchecked((params[PARAM_PITCH_DAMPING] = POSITIVE_PITCH_DAMPING));
    unchecked((params[PARAM_HEAVE_STIFFNESS] = POSITIVE_HEAVE_STIFFNESS));
    unchecked((params[PARAM_HEAVE_DAMPING] = POSITIVE_HEAVE_DAMPING));
    unchecked((params[PARAM_RUDDER_AREA] = POSITIVE_RUDDER_AREA));
    unchecked((params[PARAM_RUDDER_ARM] = POSITIVE_RUDDER_ARM));
    unchecked((params[PARAM_RUDDER_LIFT_SLOPE] = POSITIVE_RUDDER_LIFT_SLOPE));
    unchecked((params[PARAM_PROP_WASH] = POSITIVE_PROP_WASH));
    unchecked((params[PARAM_ENGINE_TIME_CONSTANT] = POSITIVE_ENGINE_TAU));
    unchecked((params[PARAM_RUDDER_RATE] = POSITIVE_RUDDER_RATE));
    unchecked((params[PARAM_ADDED_MASS_X] = POSITIVE_ADDED_MASS_X));
    unchecked((params[PARAM_ADDED_MASS_Y] = POSITIVE_ADDED_MASS_Y));
    unchecked((params[PARAM_ADDED_MASS_YAW] = POSITIVE_ADDED_MASS_YAW));
    unchecked((params[PARAM_CD_SURGE] = POSITIVE_CD_SURGE));
    unchecked((params[PARAM_CD_SWAY] = POSITIVE_CD_SWAY));
    unchecked((params[PARAM_CD_YAW] = POSITIVE_CD_YAW));
    unchecked(
      (params[PARAM_SHALLOW_WATER_FACTOR] = POSITIVE_SHALLOW_WATER_FACTOR),
    );
    unchecked(
      (params[PARAM_SHALLOW_WATER_YAW_FACTOR] =
        POSITIVE_SHALLOW_WATER_YAW_FACTOR),
    );
    unchecked(
      (params[PARAM_SHALLOW_WATER_RUDDER_FACTOR] =
        POSITIVE_SHALLOW_WATER_RUDDER_FACTOR),
    );

    setVesselParams(
      ptr,
      0,
      changetype<usize>(params),
      VESSEL_PARAM_BUFFER_CAPACITY,
    );

    const expectedGM =
      (POSITIVE_BEAM * POSITIVE_BLOCK_COEFFICIENT) /
      (POSITIVE_DRAFT + GM_DRAFT_OFFSET);
    expect<f64>(getVesselGM(ptr)).equal(expectedGM);

    unchecked((params[PARAM_MASS] = NEGATIVE_VALUE));
    unchecked((params[PARAM_LENGTH] = NEGATIVE_VALUE));
    unchecked((params[PARAM_BEAM] = NEGATIVE_VALUE));
    unchecked((params[PARAM_DRAFT] = NEGATIVE_VALUE));
    unchecked((params[PARAM_BLOCK_COEFFICIENT] = NEGATIVE_VALUE));
    unchecked((params[PARAM_RUDDER_FORCE_COEFFICIENT] = NEGATIVE_VALUE));
    unchecked((params[PARAM_RUDDER_STALL_ANGLE] = NEGATIVE_VALUE));
    unchecked((params[PARAM_RUDDER_MAX_ANGLE] = NEGATIVE_VALUE));
    unchecked((params[PARAM_DRAG_COEFFICIENT] = NEGATIVE_VALUE));
    unchecked((params[PARAM_YAW_DAMPING] = NEGATIVE_VALUE));
    unchecked((params[PARAM_YAW_DAMPING_QUAD] = NEGATIVE_VALUE));
    unchecked((params[PARAM_SWAY_DAMPING] = NEGATIVE_VALUE));
    unchecked((params[PARAM_MAX_THRUST] = NEGATIVE_VALUE));
    unchecked((params[PARAM_MAX_SPEED] = NEGATIVE_VALUE));
    unchecked((params[PARAM_ROLL_DAMPING] = NEGATIVE_VALUE));
    unchecked((params[PARAM_PITCH_DAMPING] = NEGATIVE_VALUE));
    unchecked((params[PARAM_HEAVE_STIFFNESS] = NEGATIVE_VALUE));
    unchecked((params[PARAM_HEAVE_DAMPING] = NEGATIVE_VALUE));
    unchecked((params[PARAM_RUDDER_AREA] = NEGATIVE_VALUE));
    unchecked((params[PARAM_RUDDER_ARM] = NEGATIVE_VALUE));
    unchecked((params[PARAM_RUDDER_LIFT_SLOPE] = NEGATIVE_VALUE));
    unchecked((params[PARAM_PROP_WASH] = NEGATIVE_VALUE));
    unchecked((params[PARAM_ENGINE_TIME_CONSTANT] = NEGATIVE_VALUE));
    unchecked((params[PARAM_RUDDER_RATE] = NEGATIVE_VALUE));
    unchecked((params[PARAM_ADDED_MASS_X] = NEGATIVE_VALUE));
    unchecked((params[PARAM_ADDED_MASS_Y] = NEGATIVE_VALUE));
    unchecked((params[PARAM_ADDED_MASS_YAW] = NEGATIVE_VALUE));
    unchecked((params[PARAM_CD_SURGE] = NEGATIVE_VALUE));
    unchecked((params[PARAM_CD_SWAY] = NEGATIVE_VALUE));
    unchecked((params[PARAM_CD_YAW] = NEGATIVE_VALUE));
    unchecked((params[PARAM_SHALLOW_WATER_FACTOR] = NEGATIVE_VALUE));
    unchecked((params[PARAM_SHALLOW_WATER_YAW_FACTOR] = NEGATIVE_VALUE));
    unchecked((params[PARAM_SHALLOW_WATER_RUDDER_FACTOR] = NEGATIVE_VALUE));

    setVesselParams(
      ptr,
      0,
      changetype<usize>(params),
      VESSEL_PARAM_BUFFER_CAPACITY,
    );

    expect<f64>(getVesselGM(ptr)).equal(expectedGM);
  });

  test('setVesselParams ignores non-displacement model and out-of-range params', () => {
    resetRuntime();
    const ptr = createTestVessel();
    const params = new StaticArray<f64>(VESSEL_PARAM_BUFFER_CAPACITY);
    unchecked((params[PARAM_MASS] = POSITIVE_MASS));
    setVesselParams(
      ptr,
      NON_DISPLACEMENT_MODEL,
      changetype<usize>(params),
      VESSEL_PARAM_BUFFER_CAPACITY,
    );
    const expectedGM =
      (DEFAULT_BEAM * DEFAULT_BLOCK_COEFFICIENT) /
      (DEFAULT_DRAFT + GM_DRAFT_OFFSET);
    expect<f64>(getVesselGM(ptr)).equal(expectedGM);

    setVesselParams(ptr, 0, changetype<usize>(params), 1);
    expect<f64>(getVesselGM(ptr)).equal(expectedGM);
  });

  test('setRudderAngle ignores non-finite input', () => {
    resetRuntime();
    const ptr = createTestVessel();
    setRudderAngle(ptr, NaN);
    expect<f64>(getVesselRudderAngle(ptr)).equal(NO_RUDDER);
  });

  test('ballast clamps to [0,1] and heading normalizes', () => {
    resetRuntime();
    const setup = new VesselSetup();
    setup.heading = LARGE_NEGATIVE;
    const ptr = createTestVessel(setup);
    setBallast(ptr, NEGATIVE_VALUE);
    expect<f64>(getVesselBallastLevel(ptr)).equal(0.0);
    setBallast(ptr, 2.0);
    expect<f64>(getVesselBallastLevel(ptr)).equal(1.0);

    updateCalmWater(ptr, DT_SHORT);
    expect<f64>(getVesselHeading(ptr)).greaterThanOrEqual(0.0);
  });

  test('setVesselParams early returns on invalid pointers and lengths', () => {
    resetRuntime();
    const ptr = createTestVessel();
    setVesselParams(ptr, 0, 0, 0);
    setVesselParams(ptr, 0, 0, -1);
    expect<f64>(getVesselGM(ptr)).equal(
      (DEFAULT_BEAM * DEFAULT_BLOCK_COEFFICIENT) /
        (DEFAULT_DRAFT + GM_DRAFT_OFFSET),
    );
  });

  test('setEnvironment ignores invalid pointers and lengths', () => {
    setEnvironment(0, 0);
    setEnvironment(0, -1);
    const env = new StaticArray<f64>(ENVIRONMENT_BUFFER_CAPACITY);
    unchecked((env[ENV_WIND_SPEED] = NO_WIND_SPEED));
    setEnvironment(changetype<usize>(env), 0);
  });

  test('runtime reset clears environment and creates deterministic vessel state', () => {
    resetRuntime();
    const setup = new VesselSetup();
    setup.surge = CURRENT_SPEED;
    setup.throttle = THROTTLE_HALF;
    const ptr = createTestVessel(setup);
    const env = new StaticArray<f64>(ENVIRONMENT_BUFFER_CAPACITY);
    unchecked((env[ENV_WIND_SPEED] = CROSS_WIND_SPEED));
    unchecked((env[ENV_WATER_DEPTH] = SHALLOW_WATER_DEPTH));
    setEnvironment(changetype<usize>(env), ENV_WATER_DEPTH + 1);
    updateCalmWater(ptr, DT_SHORT);
    const movedBeforeReset = getVesselX(ptr);
    expect<f64>(movedBeforeReset).greaterThanOrEqual(ORIGIN_X);

    resetGlobalEnvironment();
    resetRuntime();
    const next = createTestVessel();
    expect<f64>(getVesselX(next)).equal(ORIGIN_X);
    expect<f64>(getVesselY(next)).equal(ORIGIN_Y);
  });
});

endTest();
