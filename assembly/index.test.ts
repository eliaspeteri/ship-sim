import {
  createVessel,
  getVesselHeading,
  getVesselSpeed,
  getVesselX,
  getVesselY,
  getVesselZ,
  setRudderAngle,
  setThrottle,
  updateVesselState,
  getVesselEngineRPM,
  getVesselFuelLevel,
  calculateBeaufortScale,
} from '../assembly/index';

import {
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly';

// --- Core Tests ---

// Test utils
test('calculateBeaufortScale maps wind speed correctly', () => {
  expect<i32>(calculateBeaufortScale(0.0)).equal(0);
  expect<i32>(calculateBeaufortScale(8.0)).equal(5);
  expect<i32>(calculateBeaufortScale(35.0)).equal(12);
});

// Basic vessel creation
test('createVessel returns valid pointer', () => {
  const ptr = createVessel();
  expect<boolean>(ptr > 0).equal(true);
});

// Basic state test
test('vessel has expected initial state', () => {
  const ptr = createVessel();
  // Position
  expect<f64>(getVesselX(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselY(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselZ(ptr)).closeTo(0.0, 0.001);
  // Speed
  expect<f64>(getVesselSpeed(ptr)).closeTo(1.0, 0.001);
  // Fuel
  expect<f64>(getVesselFuelLevel(ptr)).closeTo(1.0, 0.001);
});

// Basic throttle test
test('setThrottle changes engine RPM', () => {
  const ptr = createVessel();

  setThrottle(ptr, 0.0);
  expect<f64>(getVesselEngineRPM(ptr)).closeTo(0.0, 0.001);

  setThrottle(ptr, 0.5);
  expect<f64>(getVesselEngineRPM(ptr)).closeTo(600.0, 0.001);
});

// Movement test
test('vessel moves when throttle applied', () => {
  const ptr = createVessel();

  setThrottle(ptr, 0.5);
  const initialX = getVesselX(ptr);

  updateVesselState(ptr, 1.0, 0, 0, 0, 0, 0);

  expect<f64>(getVesselX(ptr)).greaterThan(initialX);
});

// Basic turning test
test('vessel turns when rudder applied', () => {
  const ptr = createVessel();

  setThrottle(ptr, 0.5);
  setRudderAngle(ptr, 0.3);

  const initialHeading = getVesselHeading(ptr);

  // Just one update to minimize computation
  updateVesselState(ptr, 1.0, 0, 0, 0, 0, 0);

  expect<f64>(getVesselHeading(ptr)).greaterThan(initialHeading);
});

// End test
endTest();
