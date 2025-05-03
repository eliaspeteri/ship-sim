// Diagnostic test: Mimics the sim's vessel creation and update path

import {
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly';
import {
  createVessel,
  setThrottle,
  setRudderAngle,
  setBallast,
  setVesselVelocity,
  updateVesselState,
  getVesselX,
  getVesselY,
  getVesselSurgeVelocity,
  getVesselSwayVelocity,
  getVesselSpeed,
  resetGlobalVessel,
} from './index';

/**
 * Diagnostic test to compare sim and test physics paths.
 * Uses a realistic initial state and logs values at each step.
 */
test('diagnostic: vessel state matches sim path', (): void => {
  resetGlobalVessel();

  // Example initial state (replace with actual sim/store values if needed)
  const x: f64 = -10809.362730354407;
  const y: f64 = -7233.690905870101;
  const z: f64 = 152.76909855581178;
  const psi: f64 = 0.0004797616588942766; // heading
  const phi: f64 = -5.8676764707158884e-8; // roll
  const theta: f64 = -0.00007201675064302649; // pitch
  const u: f64 = -10858.530935259716; // surge
  const v: f64 = -7265.50008113779; // sway
  const w: f64 = 3.5361799991905807; // heave
  const r: f64 = 0; // yaw rate
  const p: f64 = 0; // roll rate
  const q: f64 = 0; // pitch rate
  const throttle: f64 = 0;
  const rudderAngle: f64 = 0;
  const mass: f64 = 14950000;
  const length: f64 = 212;
  const beam: f64 = 28;
  const draft: f64 = 9.1;

  // Create vessel as in sim
  const ptr = createVessel(
    x,
    y,
    z,
    psi,
    phi,
    theta,
    u,
    v,
    w,
    r,
    p,
    q,
    throttle,
    rudderAngle,
    mass,
    length,
    beam,
    draft,
  );

  // Set initial controls and velocity (if needed)
  setThrottle(ptr, throttle);
  setRudderAngle(ptr, rudderAngle);
  setBallast(ptr, 0.5);
  setVesselVelocity(ptr, u, v, w);

  // Simulate N steps with dt = 1/60, no environment
  const N: i32 = 600;
  const dt: f64 = 1.0 / 60.0;
  for (let i = 0; i < N; i++) {
    updateVesselState(ptr, dt, 0, 0, 0, 0);

    // Log or assert at intervals
    if (i % 100 == 0 || i == N - 1) {
      const currentX = getVesselX(ptr);
      const currentY = getVesselY(ptr);
      const surge = getVesselSurgeVelocity(ptr);
      const sway = getVesselSwayVelocity(ptr);
      const speed = getVesselSpeed(ptr);

      // These logs will show up in as-pect output
      // They help compare with sim logs
      trace('Step: ' + i.toString());
      trace('X: ' + currentX.toString() + ', Y: ' + currentY.toString());
      trace('Surge: ' + surge.toString() + ', Sway: ' + sway.toString());
      trace('Speed: ' + speed.toString());
    }
  }

  // Final assertions: vessel should not move with zero throttle and no environment
  expect<f64>(getVesselSurgeVelocity(ptr)).closeTo(0, 0.01);
  expect<f64>(getVesselSwayVelocity(ptr)).closeTo(0, 0.01);
  expect<f64>(getVesselSpeed(ptr)).closeTo(0, 0.01);
});

endTest();
