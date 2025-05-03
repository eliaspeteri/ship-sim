import {
  createVessel,
  setBallast,
  setRudderAngle,
  setThrottle,
  setWaveData,
  updateVesselState,
  resetGlobalVessel,
} from '..';

type usize = u32;

/**
 * Helper function to create a test vessel with realistic parameters
 */
export function createTestVessel(): usize {
  return createVessel(
    0,
    0,
    0, // x, y, z
    0,
    0,
    0, // psi, phi, theta
    0,
    0,
    0, // u, v, w
    0,
    0,
    0, // r, p, q
    0.2,
    0, // throttle, rudderAngle
    3700000, // mass (kg) ~3700 t
    88, // length (m)
    13.4, // beam (m)
    3.5, // draft (m)
  );
}

/**
 * Helper function to create a fresh vessel instance for each test
 */
export function createFreshVessel(): usize {
  const ptr = createTestVessel();
  setThrottle(ptr, 0.2);
  setRudderAngle(ptr, 0.0);
  setBallast(ptr, 0.5);
  setWaveData(ptr, 0.0, 0.0);
  updateVesselState(ptr, 0.01, 0, 0, 0, 0);
  return ptr;
}

/**
 * Resets the global vessel state for test isolation.
 */
export { resetGlobalVessel };
