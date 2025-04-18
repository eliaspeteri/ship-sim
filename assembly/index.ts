// Ship simulator physics core

// IMPORTANT: Keep a reference to a single vessel state to avoid memory leaks
let globalVessel: VesselState | null = null;

// Basic math operations (for testing)
export function add(a: f64, b: f64): f64 {
  return a + b;
}

export function multiply(a: f64, b: f64): f64 {
  return a * b;
}

// Vessel state representation
class VesselState {
  // Position and orientation
  x: f64;
  y: f64;
  z: f64;
  psi: f64;
  phi: f64;
  theta: f64;
  // Linear and angular velocities
  u: f64;
  v: f64;
  w: f64;
  r: f64;
  p: f64;
  q: f64;
  // Control inputs
  throttle: f64;
  rudderAngle: f64;
  // Vessel properties
  mass: f64;
  length: f64;
  beam: f64;
  draft: f64;

  constructor(
    x: f64 = 0,
    y: f64 = 0,
    z: f64 = 0,
    psi: f64 = 0,
    phi: f64 = 0,
    theta: f64 = 0,
    u: f64 = 0,
    v: f64 = 0,
    w: f64 = 0,
    r: f64 = 0,
    p: f64 = 0,
    q: f64 = 0,
    throttle: f64 = 0,
    rudderAngle: f64 = 0,
    mass: f64 = 50000,
    length: f64 = 50,
    beam: f64 = 10,
    draft: f64 = 3,
  ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.psi = psi;
    this.phi = phi;
    this.theta = theta;
    this.u = u;
    this.v = v;
    this.w = w;
    this.r = r;
    this.p = p;
    this.q = q;
    this.throttle = throttle;
    this.rudderAngle = rudderAngle;
    this.mass = mass;
    this.length = length;
    this.beam = beam;
    this.draft = draft;
  }
}

// Force calculations
function calculatePropellerThrust(state: VesselState): f64 {
  // Increase thrust effect
  const maxThrust = 200000; // Doubled from 100000
  const thrustCurve =
    state.u <= 0 ? 1.0 : Math.max(0, 1 - Math.pow(state.u / 15, 2));
  return state.throttle * maxThrust * thrustCurve;
}

function calculateHullResistance(state: VesselState): f64 {
  const rho = 1025.0; // Seawater density (kg/m^3)

  // Resistance coefficients
  const Cf =
    0.075 / Math.pow(Math.log10((state.length * state.u) / 1.19e-6) - 2, 2); // Friction coefficient
  const Cr = 0.0004; // Residuary resistance coefficient

  // Wetted surface area estimate
  const Sw = state.length * (2 * state.draft + state.beam) * 0.8;

  // Total resistance: R = 0.5 * rho * V^2 * S * Ct
  const Ct = Cf + Cr; // Total resistance coefficient
  const R = 0.5 * rho * state.u * Math.abs(state.u) * Sw * Ct;

  return R;
}

function calculateRudderForce(state: VesselState): f64 {
  const rho = 1025.0;
  // Increased rudder area for more effect
  const Ar = state.draft * state.draft * 1.5; // Increased from 0.7
  const Cl = 3.0 * Math.PI * state.rudderAngle; // Increased from 2.0

  const flowSpeed = Math.max(0.1, state.u);
  const rudderForce = 0.5 * rho * flowSpeed * flowSpeed * Ar * Cl;

  return rudderForce;
}

// Environmental forces
function calculateWindForce(
  state: VesselState,
  windSpeed: f64,
  windDirection: f64,
): f64 {
  const rho_air = 1.225; // Air density
  const superstructureArea = state.length * 5; // Approximate area above waterline
  const relativeAngle = windDirection - state.psi;
  const Cd =
    0.9 * Math.abs(Math.sin(relativeAngle)) +
    0.5 * Math.abs(Math.cos(relativeAngle));

  return 0.5 * rho_air * windSpeed * windSpeed * superstructureArea * Cd;
}

// MODIFIED: Update vessel state in place rather than creating new objects
export function updateVesselState(
  vesselPtr: usize,
  dt: f64,
  windSpeed: f64 = 0,
  windDirection: f64 = 0,
): usize {
  const state = changetype<VesselState>(vesselPtr);

  // Calculate forces and moments
  const F_prop = calculatePropellerThrust(state);
  const R_hull = calculateHullResistance(state);
  const F_rudder = calculateRudderForce(state);
  const F_wind = calculateWindForce(state, windSpeed, windDirection);

  // Moments
  const M_rudder = F_rudder * (state.length * -0.5); // Increased moment arm
  const M_wind = F_wind * state.length * 0.1; // Wind moment arm

  // Mass and inertia properties
  const Iz =
    (state.mass * (state.length * state.length + state.beam * state.beam)) / 12; // Yaw inertia

  // Added mass and damping (hydrodynamic effects)
  const addedMassX = state.mass * 0.05; // Added mass in surge
  const addedMassY = state.mass * 0.8; // Added mass in sway
  const addedInertiaZ = Iz * 0.7; // Added inertia in yaw

  // Linear damping
  const linearDampingU = state.mass * 0.02;
  const linearDampingV = state.mass * 0.1;
  const linearDampingR = Iz * 0.1;

  // Quadratic damping
  const quadDampingU = state.mass * 0.06;
  const quadDampingV = state.mass * 0.2;
  const quadDampingR = Iz * 0.2;

  // Effective mass and inertia
  const mEff = state.mass + addedMassX;
  const mSway = state.mass + addedMassY;
  const IzEff = Iz + addedInertiaZ;

  // Force and moment summation
  const Fx = F_prop - R_hull + F_wind * Math.cos(windDirection - state.psi);
  const Fy = F_rudder + F_wind * Math.sin(windDirection - state.psi);
  const Mz = M_rudder + M_wind;

  // Damping forces
  const Fx_damp =
    -linearDampingU * state.u - quadDampingU * state.u * Math.abs(state.u);
  const Fy_damp =
    -linearDampingV * state.v - quadDampingV * state.v * Math.abs(state.v);
  const Mz_damp =
    -linearDampingR * state.r - quadDampingR * state.r * Math.abs(state.r);

  // Accelerations
  const ax = (Fx + Fx_damp) / mEff;
  const ay = (Fy + Fy_damp) / mSway;
  const alphaZ = (Mz + Mz_damp) / IzEff;

  // CHANGED: Update state in-place instead of creating a new object
  state.x +=
    (state.u * Math.cos(state.psi) - state.v * Math.sin(state.psi)) * dt;
  state.y +=
    (state.u * Math.sin(state.psi) + state.v * Math.cos(state.psi)) * dt;
  state.psi += state.r * dt;
  state.u += ax * dt;
  state.v += ay * dt;
  state.r += alphaZ * dt;

  // Return the SAME pointer
  return vesselPtr;
}

// Helper functions for JavaScript interface
export function createVessel(): usize {
  if (globalVessel === null) {
    // Start with a small default speed to test rendering
    globalVessel = new VesselState(
      0,
      0,
      0, // position
      0,
      0,
      0, // orientation
      1.0,
      0,
      0, // start with 1 m/s forward speed
      0,
      0,
      0, // angular velocities
      0.2,
      0, // default throttle at 20%
      50000,
      50,
      10,
      3, // vessel properties
    );
  }
  return changetype<usize>(globalVessel);
}

// Make sure these functions properly modify the vessel state
export function setThrottle(vesselPtr: usize, throttle: f64): void {
  const vessel = changetype<VesselState>(vesselPtr);
  vessel.throttle = Math.max(0, Math.min(1, throttle)); // Clamp between 0 and 1

  // Force vessel to persist (important for AssemblyScript memory)
  globalVessel = vessel;
}

export function setRudderAngle(vesselPtr: usize, angle: f64): void {
  const vessel = changetype<VesselState>(vesselPtr);
  vessel.rudderAngle = Math.max(-0.6, Math.min(0.6, angle)); // Clamp to ±0.6 rad (~34°)

  // Force vessel to persist
  globalVessel = vessel;
}

export function getVesselX(vesselPtr: usize): f64 {
  return changetype<VesselState>(vesselPtr).x;
}

export function getVesselY(vesselPtr: usize): f64 {
  return changetype<VesselState>(vesselPtr).y;
}

export function getVesselHeading(vesselPtr: usize): f64 {
  return changetype<VesselState>(vesselPtr).psi;
}

export function getVesselSpeed(vesselPtr: usize): f64 {
  const vessel = changetype<VesselState>(vesselPtr);
  return Math.sqrt(vessel.u * vessel.u + vessel.v * vessel.v);
}
