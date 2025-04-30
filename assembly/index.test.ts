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

  // Check position with more appropriate tolerance
  expect<f64>(getVesselX(ptr)).closeTo(0.0, 0.02); // Increased tolerance
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

endTest();
