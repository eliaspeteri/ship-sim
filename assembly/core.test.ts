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
  resetGlobalVessel,
  setBallast,
} from './index';
import {
  describe,
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly/index';

describe('Physics core (lean)', () => {
  test('vessel moves forward with throttle', () => {
    resetGlobalVessel();
    const ptr = createVessel(
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0.0,
      0.0,
      5_000_000,
      120,
      20,
      6,
    );
    setThrottle(ptr, 0.5);
    const initialX = getVesselX(ptr);
    updateVesselState(ptr, 0.1, 0, 0, 0, 0);
    const finalX = getVesselX(ptr);
    expect(finalX).greaterThan(initialX);
    expect<f64>(getVesselSurgeVelocity(ptr)).greaterThan(0);
  });

  test('rudder creates heading change when moving', () => {
    resetGlobalVessel();
    const ptr = createVessel(
      0,
      0,
      0,
      0,
      0,
      0,
      1.0,
      0,
      0,
      0,
      0,
      0,
      0.5,
      0.0,
      5_000_000,
      120,
      20,
      6,
    );
    setRudderAngle(ptr, 0.3);
    const initialHeading = getVesselHeading(ptr);
    updateVesselState(ptr, 0.2, 0, 0, 0, 0);
    const finalHeading = getVesselHeading(ptr);
    expect(finalHeading).greaterThan(initialHeading);
  });

  test('time step is clamped to avoid instability', () => {
    resetGlobalVessel();
    const ptr = createVessel(
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1.0,
      0.0,
      5_000_000,
      120,
      20,
      6,
    );
    const before = getVesselX(ptr);
    updateVesselState(ptr, 10.0, 0, 0, 0, 0); // dt will be clamped internally
    const after = getVesselX(ptr);
    expect(after).greaterThan(before);
  });

  test('throttle is clamped and RPM reflects clamp', () => {
    resetGlobalVessel();
    const ptr = createVessel(
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0.0,
      0.0,
      5_000_000,
      120,
      20,
      6,
    );
    setThrottle(ptr, 2.0); // beyond allowed
    updateVesselState(ptr, 0.1, 0, 0, 0, 0);
    expect<f64>(getVesselEngineRPM(ptr)).lessThanOrEqual(1200.0);
  });

  test('rudder angle is clamped', () => {
    resetGlobalVessel();
    const ptr = createVessel(
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0.0,
      0.0,
      5_000_000,
      120,
      20,
      6,
    );
    setRudderAngle(ptr, 1.5);
    expect<f64>(getVesselRudderAngle(ptr)).lessThanOrEqual(0.6);
  });

  test('current pushes vessel in heading direction', () => {
    resetGlobalVessel();
    const ptr = createVessel(
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0.0,
      0.0,
      5_000_000,
      120,
      20,
      6,
    );
    const before = getVesselX(ptr);
    updateVesselState(ptr, 0.2, 0, 0, 1.0, 0.0);
    const after = getVesselX(ptr);
    expect(after).greaterThan(before);
  });

  test('cross-wind induces heading change', () => {
    resetGlobalVessel();
    const ptr = createVessel(
      0,
      0,
      0,
      0,
      0,
      0,
      0.5,
      0,
      0,
      0,
      0,
      0,
      0.2,
      0.0,
      5_000_000,
      120,
      20,
      6,
    );
    const beforeHeading = getVesselHeading(ptr);
    updateVesselState(ptr, 0.2, 5.0, Math.PI / 2.0, 0, 0);
    const afterHeading = getVesselHeading(ptr);
    expect<f64>(afterHeading).notEqual(beforeHeading);
  });

  test('ballast changes acceleration response', () => {
    resetGlobalVessel();
    const heavy = createVessel(
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0.5,
      0.0,
      5_000_000,
      120,
      20,
      6,
    );
    setBallast(heavy, 1.0);
    setThrottle(heavy, 0.5);
    updateVesselState(heavy, 0.5, 0, 0, 0, 0);

    resetGlobalVessel();
    const light = createVessel(
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0.5,
      0.0,
      5_000_000,
      120,
      20,
      6,
    );
    setBallast(light, 0.0);
    setThrottle(light, 0.5);
    updateVesselState(light, 0.5, 0, 0, 0, 0);

    expect<f64>(getVesselX(light)).greaterThan(getVesselX(heavy));
    expect<f64>(getVesselBallastLevel(light)).equal(0.0);
    expect<f64>(getVesselBallastLevel(heavy)).equal(1.0);
  });

  test('buoyancy pulls vessel toward target draft with ballast', () => {
    resetGlobalVessel();
    const ptr = createVessel(
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0.0,
      0.0,
      5_000_000,
      120,
      20,
      6,
    );
    setBallast(ptr, 1.0);
    // run several steps to settle heave
    for (let i = 0; i < 20; i++) {
      updateVesselState(ptr, 0.1, 5.0, 0, 0, 0);
    }
    const sunk = getVesselZ(ptr);
    resetGlobalVessel();
    const ptr2 = createVessel(
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0.0,
      0.0,
      5_000_000,
      120,
      20,
      6,
    );
    setBallast(ptr2, 0.0);
    for (let i = 0; i < 20; i++) {
      updateVesselState(ptr2, 0.1, 5.0, 0, 0, 0);
    }
    const floated = getVesselZ(ptr2);
    expect<f64>(sunk).lessThan(floated); // heavier ballast sits lower (more negative z)
    expect<f64>(floated).lessThan(0.0); // displaced below waterline
  });

  test('roll and pitch persist and respond to waves', () => {
    resetGlobalVessel();
    const ptr = createVessel(
      0,
      0,
      0,
      0,
      0.1,
      -0.2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0.5,
      0.0,
      5_000_000,
      120,
      20,
      6,
    );
    const initialRoll = getVesselRollAngle(ptr);
    const initialPitch = getVesselPitchAngle(ptr);
    updateVesselState(ptr, 0.2, 10.0, 0, 0, 0); // wind drives wave coupling
    const nextRoll = getVesselRollAngle(ptr);
    const nextPitch = getVesselPitchAngle(ptr);
    expect<f64>(initialRoll).equal(0.1);
    expect<f64>(initialPitch).equal(-0.2);
    expect<f64>(nextRoll).notEqual(initialRoll);
    expect<f64>(nextPitch).notEqual(initialPitch);
  });

  test('getter surfaces return values without throwing', () => {
    resetGlobalVessel();
    const ptr = createVessel(
      1,
      2,
      3,
      0.5,
      0,
      0,
      0.1,
      0.2,
      0.0,
      0.01,
      0,
      0,
      0.3,
      0.1,
      5_000_000,
      120,
      20,
      6,
    );
    // Positions and heading
    expect<f64>(getVesselX(ptr)).equal(1);
    expect<f64>(getVesselY(ptr)).equal(2);
    expect<f64>(getVesselZ(ptr)).equal(3);
    expect<f64>(getVesselHeading(ptr)).equal(0.5);
    // Velocities
    expect<f64>(getVesselSurgeVelocity(ptr)).equal(0.1);
    expect<f64>(getVesselSwayVelocity(ptr)).equal(0.2);
    expect<f64>(getVesselHeaveVelocity(ptr)).equal(0.0);
    // Rates and controls (stubs are fine)
    expect<f64>(getVesselRollRate(ptr)).equal(0.0);
    expect<f64>(getVesselPitchRate(ptr)).equal(0.0);
    expect<f64>(getVesselYawRate(ptr)).equal(0.01);
    expect<f64>(getVesselRudderAngle(ptr)).equal(0.1);
    // Stability/fuel stubs
    expect<f64>(getVesselGM(ptr)).equal(1.0);
    expect<f64>(getVesselCenterOfGravityY(ptr)).equal(0.0);
    expect<f64>(getVesselFuelLevel(ptr)).equal(1.0);
    expect<f64>(getVesselFuelConsumption(ptr)).equal(0.0);
    expect<f64>(getVesselBallastLevel(ptr)).equal(0.5);
    // Derived getters
    expect<f64>(getVesselSpeed(ptr)).greaterThanOrEqual(0.0);
    expect<f64>(getVesselRollAngle(ptr)).equal(0.0);
    expect<f64>(getVesselPitchAngle(ptr)).equal(0.0);
    expect<f64>(getVesselEngineRPM(ptr)).equal(0.3 * 1200.0);
  });
});

endTest();
