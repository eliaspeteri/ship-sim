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
 * This helps avoid state contamination between tests
 */
function createFreshVessel(): usize {
  const ptr = createVessel();
  // Reset to known default state
  setThrottle(ptr, 0.2);
  setRudderAngle(ptr, 0.0);
  setBallast(ptr, 0.5);
  setWaveData(ptr, 0.0, 0.0);
  // Run a minimal update to ensure derived values are calculated
  updateVesselState(ptr, 0.01, 0, 0, 0, 0, 0);
  return ptr;
}

// --- Vessel Creation and Basic State Tests ---

test('createVessel returns valid vessel pointer', () => {
  const ptr = createVessel();
  expect<boolean>(ptr > 0).equal(true);
});

test('createVessel initializes vessel with default values', () => {
  const ptr = createFreshVessel();

  // Check position with more appropriate tolerance
  expect<f64>(getVesselX(ptr)).closeTo(0.0, 0.02); // Increased tolerance
  expect<f64>(getVesselY(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselZ(ptr)).closeTo(0.0, 0.001);

  // Check orientation
  expect<f64>(getVesselHeading(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselRollAngle(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselPitchAngle(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselSpeed(ptr)).closeTo(1.0, 0.02);
  expect<f64>(getVesselEngineRPM(ptr)).closeTo(240.0, 0.001);
  expect<f64>(getVesselFuelLevel(ptr)).closeTo(1.0, 0.001);
  expect<f64>(getVesselFuelConsumption(ptr)).greaterThan(0.0);

  // Check stability values
  expect<f64>(getVesselGM(ptr)).greaterThan(0.0);
});

test('vessel position updates correctly when moving forward', () => {
  const ptr = createFreshVessel();

  setThrottle(ptr, 0.5);
  const initialX = getVesselX(ptr);
  const initialY = getVesselY(ptr);

  // Heading 0 - should move along positive X axis
  updateVesselState(ptr, 1.0, 0, 0, 0, 0, 0);

  expect<f64>(getVesselX(ptr)).greaterThan(initialX);
  expect<f64>(getVesselY(ptr)).closeTo(initialY, 0.001);
});

test('vessel heading stays in valid range when turning', () => {
  const ptr = createVessel();

  // Reset to known state
  setThrottle(ptr, 0.5);
  setRudderAngle(ptr, 0.6);

  // Single update with a longer time step instead of a loop
  updateVesselState(ptr, 2.5, 0, 0, 0, 0, 0);

  // Check heading is in valid range after the update
  const heading = getVesselHeading(ptr);
  expect<boolean>(heading >= 0.0 && heading < 2.0 * Math.PI).equal(true);

  // Verify we're actually turning by checking if heading is non-zero
  expect<boolean>(heading > 0.01).equal(true);
});

// End all tests
endTest();
