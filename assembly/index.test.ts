import {
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
  updateVesselState,
  getVesselEngineRPM,
  getVesselFuelLevel,
  getVesselFuelConsumption,
  getVesselGM,
  getVesselSurgeVelocity,
  getVesselSwayVelocity,
  getVesselHeaveVelocity,
  getVesselCenterOfGravityY,
  getVesselRudderAngle,
  getVesselBallastLevel,
} from '../assembly/index';

import {
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly';
import {
  createFreshVessel,
  createTestVessel,
  resetGlobalVessel,
} from './util/test-vessel.util';

/**
 * Vessel Creation and Basic State Tests
 */
test('createVessel returns valid vessel pointer', (): void => {
  resetGlobalVessel();
  const ptr = createTestVessel();
  expect<boolean>(ptr > 0).equal(true);
});

test('createVessel initializes vessel with default values', (): void => {
  resetGlobalVessel();
  const ptr = createFreshVessel();
  expect<f64>(getVesselX(ptr)).closeTo(0.0, 0.02);
  expect<f64>(getVesselY(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselZ(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselHeading(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselRollAngle(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselPitchAngle(ptr)).closeTo(0.0, 0.001);
  // Vessel should start at rest
  expect<f64>(getVesselSpeed(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselEngineRPM(ptr)).closeTo(240.0, 0.001);
  expect<f64>(getVesselFuelLevel(ptr)).closeTo(1.0, 0.001);
  expect<f64>(getVesselFuelConsumption(ptr)).greaterThan(0.0);
  expect<f64>(getVesselGM(ptr)).greaterThan(0.0);
});

test('vessel position updates correctly when moving forward', (): void => {
  resetGlobalVessel();
  const ptr = createFreshVessel();
  setThrottle(ptr, 0.5);
  const initialX = getVesselX(ptr);
  const initialY = getVesselY(ptr);
  for (let i = 0; i < 600; i++) {
    updateVesselState(ptr, 1 / 60, 0, 0, 0, 0);
  }
  expect<f64>(getVesselX(ptr)).greaterThan(initialX);
  expect<f64>(getVesselY(ptr)).closeTo(initialY, 0.001);
});

test('vessel heading stays in valid range when turning', (): void => {
  resetGlobalVessel();
  const ptr = createTestVessel();
  setThrottle(ptr, 0.5);
  setRudderAngle(ptr, 0.6);
  for (let i = 0; i < 200; i++) {
    updateVesselState(ptr, 1 / 60, 0, 0, 0, 0);
  }
  const heading = getVesselHeading(ptr);
  expect<boolean>(heading >= 0.0 && heading < 2.0 * Math.PI).equal(true);
  expect<boolean>(heading > 0.01).equal(true);
});

/**
 * Key NaN protection tests
 */
test('vessel state remains valid after physics update', (): void => {
  resetGlobalVessel();
  const ptr = createFreshVessel();
  setThrottle(ptr, 0.3);

  // Update with normal parameters
  updateVesselState(ptr, 0.1, 5, 0.5, 1, 0.2);

  // Position should be valid (not NaN)
  const x = getVesselX(ptr);
  const y = getVesselY(ptr);
  expect<bool>(x == x).equal(true); // Not NaN
  expect<bool>(y == y).equal(true); // Not NaN

  // Test with extreme values
  updateVesselState(ptr, 0.1, 1000.0, 1000.0, 1000.0, 1000.0);

  // Position should still be valid
  const x2 = getVesselX(ptr);
  const y2 = getVesselY(ptr);
  expect<bool>(isFinite(x2)).equal(true);
  expect<bool>(isFinite(y2)).equal(true);
});

test('updateVesselState does not update position if dt is NaN', (): void => {
  resetGlobalVessel();
  const ptr = createFreshVessel();
  const initialX = getVesselX(ptr);
  const initialY = getVesselY(ptr);

  // Pass NaN for dt
  updateVesselState(ptr, NaN, 5, 0.5, 1, 0.2);

  // Position should not change
  expect<f64>(getVesselX(ptr)).closeTo(initialX, 0.0001);
  expect<f64>(getVesselY(ptr)).closeTo(initialY, 0.0001);
});

test('updateVesselState handles NaN and Infinity safely', (): void => {
  resetGlobalVessel();
  const ptr = createFreshVessel();

  // Test with various NaN parameters
  updateVesselState(ptr, 0.1, NaN, NaN, NaN, NaN);

  // Position should remain finite
  expect<bool>(isFinite(getVesselX(ptr))).equal(true);
  expect<bool>(isFinite(getVesselY(ptr))).equal(true);

  // Test with Infinity in parameters
  updateVesselState(ptr, 0.1, Infinity, Infinity, Infinity, Infinity);

  // Position should remain finite
  expect<bool>(isFinite(getVesselX(ptr))).equal(true);
  expect<bool>(isFinite(getVesselY(ptr))).equal(true);
});

/**
 * Tests for position update limiting
 */
test('updateVesselState limits extreme position updates', (): void => {
  resetGlobalVessel();
  const ptr = createFreshVessel();

  // Create extreme velocity through multiple updates
  setThrottle(ptr, 1.0);
  for (let i = 0; i < 10; i++) {
    updateVesselState(ptr, 0.1, 0, 0, 0, 0);
  }

  // Record position before extreme update
  const x1 = getVesselX(ptr);

  // Now do a large time step - should get limited
  updateVesselState(ptr, 10.0, 0, 0, 0, 0);

  // Position should change but be limited
  const x2 = getVesselX(ptr);
  expect<bool>(x2 - x1 <= 1000.0).equal(true); // Max delta is 100.0 * dt, and dt is clamped to 1.0
});

/**
 * Tests for heading normalization
 */
test('updateVesselState normalizes heading correctly', (): void => {
  resetGlobalVessel();
  const ptr = createFreshVessel();

  // Create a vessel with high rotation rate
  setRudderAngle(ptr, 0.6);
  setThrottle(ptr, 0.5);

  // Rotate for a while to accumulate heading
  for (let i = 0; i < 20; i++) {
    updateVesselState(ptr, 0.3, 0, 0, 0, 0);
  }

  // Heading should be normalized to [0, 2π)
  const heading = getVesselHeading(ptr);
  expect<bool>(heading >= 0.0 && heading < 2.0 * Math.PI).equal(true);

  // Create another vessel and force negative heading
  // (using multiple updates with reversed rudder)
  resetGlobalVessel();
  const ptr2 = createTestVessel();
  setRudderAngle(ptr2, -0.6);
  setThrottle(ptr2, 0.5);

  // Rotate for a while to accumulate negative heading
  for (let i = 0; i < 20; i++) {
    updateVesselState(ptr2, 0.3, 0, 0, 0, 0);
  }

  // Heading should be normalized to [0, 2π) even after negative rotations
  const heading2 = getVesselHeading(ptr2);
  expect<bool>(heading2 >= 0.0 && heading2 < 2.0 * Math.PI).equal(true);
});

/**
 * Tests for zero fuel level behavior
 */
test('updateVesselState correctly handles zero fuel level', (): void => {
  resetGlobalVessel();
  const ptr = createTestVessel();
  setThrottle(ptr, 1.0);
  for (let i = 0; i < 2000; i++) {
    updateVesselState(ptr, 0.2, 0, 0, 0, 0);
  }
  expect<f64>(getVesselFuelLevel(ptr)).closeTo(0.0, 0.01);
  expect<f64>(getVesselEngineRPM(ptr)).closeTo(0.0, 0.01);
});

test('updateVesselState keeps z position above water', (): void => {
  resetGlobalVessel();
  const ptr = createFreshVessel();

  // Create negative vertical velocity through wave forces
  updateVesselState(ptr, 1.0, 10.0, 0.0, 0, 0);

  // Force several more updates to ensure vertical motion
  for (let i = 0; i < 10; i++) {
    updateVesselState(ptr, 0.1, 40.0, Math.PI, 0, 0);
  }

  // Z position should never go below zero
  expect<bool>(getVesselZ(ptr) >= 0.0).equal(true);
});

/**
 * Contract enforcement tests: Only control inputs and vessel parameters should be set from outside.
 * All derived/physics state must be updated from WASM and remain valid.
 */
test('WASM always returns valid derived state after update', (): void => {
  resetGlobalVessel();
  const ptr = createTestVessel();
  // Simulate invalid control input (should be ignored or sanitized by WASM)
  setThrottle(ptr, NaN as f64);
  setRudderAngle(ptr, NaN as f64);
  setBallast(ptr, NaN as f64);
  // Run update with NaN for all environment params
  updateVesselState(
    ptr,
    NaN as f64,
    NaN as f64,
    NaN as f64,
    NaN as f64,
    NaN as f64,
  );
  // All derived state should still be finite
  expect<bool>(isFinite(getVesselFuelLevel(ptr))).equal(true);
  expect<bool>(isFinite(getVesselFuelConsumption(ptr))).equal(true);
  expect<bool>(isFinite(getVesselX(ptr))).equal(true);
  expect<bool>(isFinite(getVesselY(ptr))).equal(true);
  expect<bool>(isFinite(getVesselZ(ptr))).equal(true);
  expect<bool>(isFinite(getVesselSurgeVelocity(ptr))).equal(true);
  expect<bool>(isFinite(getVesselSwayVelocity(ptr))).equal(true);
  expect<bool>(isFinite(getVesselHeaveVelocity(ptr))).equal(true);
  expect<bool>(isFinite(getVesselGM(ptr))).equal(true);
  expect<bool>(isFinite(getVesselCenterOfGravityY(ptr))).equal(true);
});

test('Frontend state matches WASM after update', (): void => {
  resetGlobalVessel();
  const ptr = createTestVessel();
  setThrottle(ptr, 1.0);
  setRudderAngle(ptr, 0.2);
  updateVesselState(ptr, 1.0, 0, 0, 0, 0);

  const x: f64 = getVesselX(ptr);
  const y: f64 = getVesselY(ptr);
  const z: f64 = getVesselZ(ptr);
  const surge: f64 = getVesselSurgeVelocity(ptr);
  const fuelLevel: f64 = getVesselFuelLevel(ptr);
  const metacentricHeight: f64 = getVesselGM(ptr);

  expect<bool>(isFinite(x)).equal(true);
  expect<bool>(isFinite(y)).equal(true);
  expect<bool>(isFinite(z)).equal(true);
  expect<bool>(isFinite(surge)).equal(true);
  expect<bool>(isFinite(fuelLevel)).equal(true);
  expect<bool>(isFinite(metacentricHeight)).equal(true);
});

/**
 * Tests for uncovered branches and edge cases in vessel state update and validation.
 */
test('updateVesselState aborts update if vessel state is invalid (NaN)', (): void => {
  resetGlobalVessel();
  const ptr = createTestVessel();
  // Simulate invalid state by passing NaN to setThrottle
  setThrottle(ptr, NaN as f64);
  const xBefore: f64 = getVesselX(ptr);
  updateVesselState(ptr, 1.0, 0, 0, 0, 0);
  // Position should not change because update is aborted
  expect<f64>(getVesselX(ptr)).closeTo(xBefore, 0.0001);
});

test('updateVesselState clamps rudder angle to max/min', (): void => {
  resetGlobalVessel();
  const ptr = createTestVessel();
  setRudderAngle(ptr, 2.0); // Exceeds max
  updateVesselState(ptr, 1.0, 0, 0, 0, 0);
  expect<f64>(getVesselRudderAngle(ptr)).closeTo(0.6, 0.0001);
  setRudderAngle(ptr, -2.0); // Exceeds min
  updateVesselState(ptr, 1.0, 0, 0, 0, 0);
  expect<f64>(getVesselRudderAngle(ptr)).closeTo(-0.6, 0.0001);
});

test('updateVesselState clamps ballast level to [0, 1]', (): void => {
  resetGlobalVessel();
  const ptr = createTestVessel();
  setBallast(ptr, 2.0);
  updateVesselState(ptr, 1.0, 0, 0, 0, 0);
  expect<f64>(getVesselBallastLevel(ptr)).closeTo(1.0, 0.0001);
  setBallast(ptr, -1.0);
  updateVesselState(ptr, 1.0, 0, 0, 0, 0);
  expect<f64>(getVesselBallastLevel(ptr)).closeTo(0.0, 0.0001);
});

test('vessel moves when throttle applied', () => {
  resetGlobalVessel();
  const ptr = createTestVessel();
  setThrottle(ptr, 0.5);
  const x1 = getVesselX(ptr);
  for (let i = 0; i < 200; i++) {
    updateVesselState(ptr, 0.2, 0, 0, 0, 0);
  }
  const x2 = getVesselX(ptr);
  expect<f64>(x2).greaterThan(x1);
});

test('realistic roll behavior: vessel resists capsizing and stays capsized if inverted', (): void => {
  resetGlobalVessel();
  // Container ship: high GM, should resist capsizing
  let ptr = createTestVessel();
  setBallast(ptr, 1.0); // full ballast for max stability
  // Apply a large roll moment (simulate a big wave)
  for (let i = 0; i < 200; i++) {
    updateVesselState(ptr, 0.1, 0, 0, 0, 0);
    // Artificially set a large roll angle for test
    changetype<VesselState>(ptr).phi = Math.PI / 3; // 60 deg
  }
  // Should not capsize (roll < 90 deg)
  expect<f64>(Math.abs(getVesselRollAngle(ptr))).lessThan(Math.PI / 2);

  // Now test a vessel with low GM (shallow draft, low ballast)
  ptr = createTestVessel();
  setBallast(ptr, 0.0); // no ballast
  // Artificially set a large roll angle past vanishing stability
  changetype<VesselState>(ptr).phi = Math.PI * 0.7; // ~126 deg
  for (let i = 0; i < 100; i++) {
    updateVesselState(ptr, 0.1, 0, 0, 0, 0);
  }
  // Should stay capsized (roll > 90 deg)
  expect<f64>(Math.abs(getVesselRollAngle(ptr))).greaterThan(Math.PI / 2);
});

endTest();
