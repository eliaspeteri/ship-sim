import {
  getVesselHeading,
  getVesselY,
  setBallast,
  setRudderAngle,
  setThrottle,
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
import { createFreshVessel, resetGlobalVessel } from './util/test-vessel.util';

// --- Control System Tests ---

test('setThrottle changes engine RPM and fuel consumption', () => {
  resetGlobalVessel();
  const ptr = createFreshVessel();

  setThrottle(ptr, 0.0);
  for (let i = 0; i < 10; i++) {
    updateVesselState(ptr, 0.2, 0, 0, 0, 0);
  }
  expect<f64>(getVesselEngineRPM(ptr)).closeTo(0.0, 0.001);
  expect<f64>(getVesselFuelConsumption(ptr)).closeTo(0.0, 0.001);

  setThrottle(ptr, 0.5);
  for (let i = 0; i < 10; i++) {
    updateVesselState(ptr, 0.2, 0, 0, 0, 0);
  }
  expect<f64>(getVesselEngineRPM(ptr)).closeTo(600.0, 0.001);
  expect<f64>(getVesselFuelConsumption(ptr)).greaterThan(5.0);

  setThrottle(ptr, 1.0);
  for (let i = 0; i < 10; i++) {
    updateVesselState(ptr, 0.2, 0, 0, 0, 0);
  }
  expect<f64>(getVesselEngineRPM(ptr)).closeTo(1200.0, 0.001);
  expect<f64>(getVesselFuelConsumption(ptr)).greaterThan(90.0);

  // Test throttle clamping at boundaries
  setThrottle(ptr, 1.5);
  for (let i = 0; i < 10; i++) {
    updateVesselState(ptr, 0.2, 0, 0, 0, 0);
  }
  expect<f64>(getVesselEngineRPM(ptr)).closeTo(1200.0, 0.001);

  setThrottle(ptr, -0.5);
  for (let i = 0; i < 10; i++) {
    updateVesselState(ptr, 0.2, 0, 0, 0, 0);
  }
  expect<f64>(getVesselEngineRPM(ptr)).closeTo(0.0, 0.001);
});

test('setBallast affects vessel stability', () => {
  resetGlobalVessel();
  const ptr = createFreshVessel();

  // Initial GM with default ballast
  const initialGM = getVesselGM(ptr);

  // Empty ballast (raises CG, reduces stability)
  setBallast(ptr, 0.0);
  for (let i = 0; i < 10; i++) {
    updateVesselState(ptr, 0.2, 0, 0, 0, 0);
  }
  const emptyBallastGM = getVesselGM(ptr);
  expect<f64>(emptyBallastGM).lessThan(initialGM);

  // Full ballast (lowers CG, increases stability)
  setBallast(ptr, 1.0);
  for (let i = 0; i < 10; i++) {
    updateVesselState(ptr, 0.2, 0, 0, 0, 0);
  }
  const fullBallastGM = getVesselGM(ptr);
  expect<f64>(fullBallastGM).greaterThan(initialGM);

  // Test ballast level clamping
  setBallast(ptr, 1.5);
  for (let i = 0; i < 10; i++) {
    updateVesselState(ptr, 0.2, 0, 0, 0, 0);
  }
  expect<f64>(getVesselGM(ptr)).closeTo(fullBallastGM, 0.001);

  setBallast(ptr, -0.5);
  for (let i = 0; i < 10; i++) {
    updateVesselState(ptr, 0.2, 0, 0, 0, 0);
  }
  expect<f64>(getVesselGM(ptr)).closeTo(emptyBallastGM, 0.001);
});

test('setRudderAngle affects turning rate', () => {
  resetGlobalVessel();
  const ptr = createFreshVessel();
  setThrottle(ptr, 1.0); // Use max throttle for more effect
  setRudderAngle(ptr, 0.6);
  let initialHeading = getVesselHeading(ptr);
  let turned = false;
  for (let i = 0; i < 1000; i++) {
    updateVesselState(ptr, 0.5, 0, 0, 0, 0);
    const currentHeading = getVesselHeading(ptr);
    if (Math.abs(currentHeading - initialHeading) > 0.01) {
      turned = true;
      break;
    }
  }
  expect<bool>(turned).equal(true);
});

test('fuel consumption reduces fuel level', () => {
  resetGlobalVessel();
  const ptr = createFreshVessel();
  setThrottle(ptr, 1.0);
  const initialFuel = getVesselFuelLevel(ptr);
  for (let i = 0; i < 2000; i++) {
    updateVesselState(ptr, 0.5, 0, 0, 0, 0);
  }
  const finalFuel = getVesselFuelLevel(ptr);
  expect<f64>(finalFuel).lessThan(initialFuel);
});

test('vessel responds to environmental forces', () => {
  resetGlobalVessel();
  const ptr = createFreshVessel();
  setThrottle(ptr, 0.0);
  setRudderAngle(ptr, 0.0);
  const initialY = getVesselY(ptr);
  for (let i = 0; i < 2000; i++) {
    updateVesselState(ptr, 0.5, 50.0, Math.PI / 2, 10.0, Math.PI / 2);
  }
  const finalY = getVesselY(ptr);
  expect<bool>(Math.abs(finalY - initialY) > 0.01).equal(true);
});

// End all tests
endTest();
