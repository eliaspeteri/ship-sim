import {
  createVessel,
  getVesselHeading,
  getVesselPitchAngle,
  getVesselRollAngle,
  getVesselSpeed,
  getVesselX,
  getVesselY,
  getVesselZ,
  setBallast,
  setRudderAngle,
  setThrottle,
  setWaveData,
  updateVesselState,
  getVesselEngineRPM,
  getVesselFuelLevel,
  getVesselFuelConsumption,
  getVesselGM,
} from '../assembly/index';

import {
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly';

// Define usize as u32 for compatibility with AssemblyScript memory model
type usize = u32;

/**
 * Helper function to create a fresh vessel instance for each test
 */
function createFreshVessel(): usize {
  const ptr = createVessel();
  setThrottle(ptr, 0.2);
  setRudderAngle(ptr, 0.0);
  setBallast(ptr, 0.5);
  setWaveData(ptr, 0.0, 0.0);
  updateVesselState(ptr, 0.01, 0, 0, 0, 0, 0);
  return ptr;
}

/**
 * Vessel Creation and Basic State Tests
 */
test('createVessel returns valid vessel pointer', (): void => {
  const ptr = createVessel();
  expect<boolean>(ptr > 0).equal(true);
});

test('createVessel initializes vessel with default values', (): void => {
  const ptr = createFreshVessel();
  expect<f64>(getVesselX(ptr)).closeTo(0.0, 0.02);
  expect<f64>(getVesselY(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselZ(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselHeading(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselRollAngle(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselPitchAngle(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselSpeed(ptr)).closeTo(1.0, 0.02);
  expect<f64>(getVesselEngineRPM(ptr)).closeTo(240.0, 0.001);
  expect<f64>(getVesselFuelLevel(ptr)).closeTo(1.0, 0.001);
  expect<f64>(getVesselFuelConsumption(ptr)).greaterThan(0.0);
  expect<f64>(getVesselGM(ptr)).greaterThan(0.0);
});

test('vessel position updates correctly when moving forward', (): void => {
  const ptr = createFreshVessel();
  setThrottle(ptr, 0.5);
  const initialX = getVesselX(ptr);
  const initialY = getVesselY(ptr);
  updateVesselState(ptr, 1.0, 0, 0, 0, 0, 0);
  expect<f64>(getVesselX(ptr)).greaterThan(initialX);
  expect<f64>(getVesselY(ptr)).closeTo(initialY, 0.001);
});

test('vessel heading stays in valid range when turning', (): void => {
  const ptr = createVessel();
  setThrottle(ptr, 0.5);
  setRudderAngle(ptr, 0.6);
  updateVesselState(ptr, 2.5, 0, 0, 0, 0, 0);
  const heading = getVesselHeading(ptr);
  expect<boolean>(heading >= 0.0 && heading < 2.0 * Math.PI).equal(true);
  expect<boolean>(heading > 0.01).equal(true);
});

/**
 * Key NaN protection tests
 */
test('vessel state remains valid after physics update', (): void => {
  const ptr = createFreshVessel();
  setThrottle(ptr, 0.3);

  // Update with normal parameters
  updateVesselState(ptr, 0.1, 5, 0.5, 1, 0.2, 3);

  // Position should be valid (not NaN)
  const x = getVesselX(ptr);
  const y = getVesselY(ptr);
  expect<bool>(x == x).equal(true); // Not NaN
  expect<bool>(y == y).equal(true); // Not NaN

  // Test with extreme values
  updateVesselState(ptr, 0.1, 1000.0, 1000.0, 1000.0, 1000.0, 1000.0);

  // Position should still be valid
  const x2 = getVesselX(ptr);
  const y2 = getVesselY(ptr);
  expect<bool>(isFinite(x2)).equal(true);
  expect<bool>(isFinite(y2)).equal(true);
});

test('updateVesselState does not update position if dt is NaN', (): void => {
  const ptr = createFreshVessel();
  const initialX = getVesselX(ptr);
  const initialY = getVesselY(ptr);

  // Pass NaN for dt
  updateVesselState(ptr, NaN, 5, 0.5, 1, 0.2, 3);

  // Position should not change
  expect<f64>(getVesselX(ptr)).closeTo(initialX, 0.0001);
  expect<f64>(getVesselY(ptr)).closeTo(initialY, 0.0001);
});

test('updateVesselState handles NaN and Infinity safely', (): void => {
  const ptr = createFreshVessel();

  // Test with various NaN parameters
  updateVesselState(ptr, 0.1, NaN, NaN, NaN, NaN, NaN);

  // Position should remain finite
  expect<bool>(isFinite(getVesselX(ptr))).equal(true);
  expect<bool>(isFinite(getVesselY(ptr))).equal(true);

  // Test with Infinity in parameters
  updateVesselState(ptr, 0.1, Infinity, Infinity, Infinity, Infinity, Infinity);

  // Position should remain finite
  expect<bool>(isFinite(getVesselX(ptr))).equal(true);
  expect<bool>(isFinite(getVesselY(ptr))).equal(true);
});

/**
 * Tests for position update limiting
 */
test('updateVesselState limits extreme position updates', (): void => {
  const ptr = createFreshVessel();

  // Create extreme velocity through multiple updates
  setThrottle(ptr, 1.0);
  for (let i = 0; i < 10; i++) {
    updateVesselState(ptr, 0.1, 0, 0, 0, 0, 0);
  }

  // Record position before extreme update
  const x1 = getVesselX(ptr);

  // Now do a large time step - should get limited
  updateVesselState(ptr, 10.0, 0, 0, 0, 0, 0);

  // Position should change but be limited
  const x2 = getVesselX(ptr);
  expect<bool>(x2 - x1 <= 1000.0).equal(true); // Max delta is 100.0 * dt, and dt is clamped to 1.0
});

/**
 * Tests for heading normalization
 */
test('updateVesselState normalizes heading correctly', (): void => {
  const ptr = createFreshVessel();

  // Create a vessel with high rotation rate
  setRudderAngle(ptr, 0.6);
  setThrottle(ptr, 0.5);

  // Rotate for a while to accumulate heading
  for (let i = 0; i < 20; i++) {
    updateVesselState(ptr, 0.3, 0, 0, 0, 0, 0);
  }

  // Heading should be normalized to [0, 2π)
  const heading = getVesselHeading(ptr);
  expect<bool>(heading >= 0.0 && heading < 2.0 * Math.PI).equal(true);

  // Create another vessel and force negative heading
  // (using multiple updates with reversed rudder)
  const ptr2 = createVessel();
  setRudderAngle(ptr2, -0.6);
  setThrottle(ptr2, 0.5);

  // Rotate for a while to accumulate negative heading
  for (let i = 0; i < 20; i++) {
    updateVesselState(ptr2, 0.3, 0, 0, 0, 0, 0);
  }

  // Heading should be normalized to [0, 2π) even after negative rotations
  const heading2 = getVesselHeading(ptr2);
  expect<bool>(heading2 >= 0.0 && heading2 < 2.0 * Math.PI).equal(true);
});

/**
 * Tests for zero fuel level behavior
 */
test('updateVesselState correctly handles zero fuel level', (): void => {
  const ptr = createVessel();

  // Set vessel throttle and ensure we have engine power
  setThrottle(ptr, 1.0);

  // Get initial RPM and speed
  const initialRPM = getVesselEngineRPM(ptr);

  // Force fuel level to zero by running for a long time
  for (let i = 0; i < 100; i++) {
    updateVesselState(ptr, 1.0, 0, 0, 0, 0, 0);
  }

  // Check that engine is stopped when out of fuel
  expect<f64>(getVesselFuelLevel(ptr)).closeTo(0.0, 0.0001);
  expect<f64>(getVesselEngineRPM(ptr)).closeTo(0.0, 0.0001);
});

/**
 * Tests for roll and pitch limiting
 */
test('updateVesselState limits roll and pitch angles', (): void => {
  const ptr = createFreshVessel();

  // Create extreme wave conditions to generate large roll and pitch forces
  updateVesselState(ptr, 1.0, 40.0, Math.PI / 2, 0, 0, 12.0); // Beam sea

  // Roll should be limited
  expect<bool>(Math.abs(getVesselRollAngle(ptr)) <= 0.6).equal(true);

  // Create another vessel for pitch test
  const ptr2 = createFreshVessel();

  // Create extreme wave conditions for pitch
  updateVesselState(ptr2, 1.0, 40.0, 0.0, 0, 0, 12.0); // Head sea

  // Pitch should be limited
  expect<bool>(Math.abs(getVesselPitchAngle(ptr2)) <= 0.3).equal(true);
});

/**
 * Tests for z position limiting (keeping above water)
 */
test('updateVesselState keeps z position above water', (): void => {
  const ptr = createFreshVessel();

  // Create negative vertical velocity through wave forces
  updateVesselState(ptr, 1.0, 10.0, 0.0, 0, 0, 6.0);

  // Force several more updates to ensure vertical motion
  for (let i = 0; i < 10; i++) {
    updateVesselState(ptr, 0.1, 40.0, Math.PI, 0, 0, 12.0);
  }

  // Z position should never go below zero
  expect<bool>(getVesselZ(ptr) >= 0.0).equal(true);
});

endTest();
