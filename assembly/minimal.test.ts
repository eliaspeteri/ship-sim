import {
  createVessel,
  getVesselX,
  getVesselY,
  getVesselHeading,
  setThrottle,
  setRudderAngle,
  updateVesselState,
  calculateBeaufortScale,
} from '../assembly/index';

import {
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly';

// Define usize as u32 for compatibility
type usize = u32;

// Test environment calculation
test('calculateBeaufortScale maps wind speeds correctly', () => {
  expect<i32>(calculateBeaufortScale(0.0)).equal(0);
  expect<i32>(calculateBeaufortScale(15.0)).equal(7);
});

// Test vessel creation
test('createVessel returns valid pointer', () => {
  const ptr = createVessel();
  expect<boolean>(ptr > 0).equal(true);
});

// Test vessel movement
test('vessel moves when throttle applied', () => {
  const ptr = createVessel();
  setThrottle(ptr, 0.5);
  const x1 = getVesselX(ptr);

  updateVesselState(ptr, 1.0, 0, 0, 0, 0);

  const x2 = getVesselX(ptr);
  expect<f64>(x2).greaterThan(x1);
});

// End all tests
endTest();
