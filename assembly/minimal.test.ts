import {
  getVesselX,
  setThrottle,
  updateVesselState,
  calculateBeaufortScale,
} from '../assembly/index';

import {
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly';
import { createTestVessel, resetGlobalVessel } from './util/test-vessel.util';

// Test environment calculation
test('calculateBeaufortScale maps wind speeds correctly', () => {
  resetGlobalVessel();
  expect<i32>(calculateBeaufortScale(0.0)).equal(0);
  expect<i32>(calculateBeaufortScale(15.0)).equal(7);
});

// Test vessel creation
test('createVessel returns valid pointer', () => {
  resetGlobalVessel();
  const ptr = createTestVessel();
  expect<boolean>(ptr > 0).equal(true);
});

// Test vessel movement
test('vessel moves when throttle applied', () => {
  resetGlobalVessel();
  const ptr = createTestVessel();
  setThrottle(ptr, 0.5);
  const x1 = getVesselX(ptr);

  updateVesselState(ptr, 1.0, 0, 0, 0, 0);

  const x2 = getVesselX(ptr);
  expect<f64>(x2).greaterThan(x1);
});

// End all tests
endTest();
