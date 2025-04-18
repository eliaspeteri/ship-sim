// Ship simulator physics core - Simplified for stable WebAssembly execution

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

// ULTRA-SIMPLIFIED UPDATE FUNCTION:
// This version minimizes stack usage and complexity to avoid WebAssembly errors
export function updateVesselState(
  vesselPtr: usize,
  dt: f64,
  windSpeed: f64 = 0,
  windDirection: f64 = 0,
): usize {
  // Cast pointer to vessel object
  const vessel = changetype<VesselState>(vesselPtr);

  // Apply basic physics with minimal calculation steps

  // 1. Calculate propeller thrust (simplified)
  const propThrust =
    vessel.throttle *
    200000 *
    (vessel.u <= 0 ? 1.0 : Math.max(0, 1.0 - vessel.u / 20.0));

  // 2. Calculate hull resistance (simplified)
  const resistance =
    0.05 * vessel.u * Math.abs(vessel.u) * vessel.length * vessel.beam;

  // 3. Calculate rudder force (simplified)
  const rudderForce = 50000 * vessel.rudderAngle * Math.abs(vessel.u);

  // 4. Calculate accelerations
  const accelSurge = (propThrust - resistance) / vessel.mass;
  const accelSway = rudderForce / vessel.mass;
  const accelYaw = (rudderForce * vessel.length * -0.5) / (vessel.mass * 10);

  // 5. Update velocities
  vessel.u += accelSurge * dt;
  vessel.v += accelSway * dt;
  vessel.r += accelYaw * dt;

  // 6. Update position and orientation
  const cosPsi = Math.cos(vessel.psi);
  const sinPsi = Math.sin(vessel.psi);
  vessel.x += (vessel.u * cosPsi - vessel.v * sinPsi) * dt;
  vessel.y += (vessel.u * sinPsi + vessel.v * cosPsi) * dt;
  vessel.psi += vessel.r * dt;

  // Keep reference and return
  globalVessel = vessel;
  return vesselPtr;
}

// Helper functions for JavaScript interface
export function createVessel(): usize {
  if (globalVessel === null) {
    globalVessel = new VesselState(
      0,
      0,
      0, // position
      0,
      0,
      0, // orientation
      1.0,
      0,
      0, // initial speed
      0,
      0,
      0, // angular velocity
      0.2,
      0, // throttle and rudder
      50000,
      50,
      10,
      3, // vessel properties
    );
  }
  return changetype<usize>(globalVessel);
}

// Control functions - keep these simple
export function setThrottle(vesselPtr: usize, throttle: f64): void {
  const vessel = changetype<VesselState>(vesselPtr);
  vessel.throttle = throttle > 1.0 ? 1.0 : throttle < 0.0 ? 0.0 : throttle;
  globalVessel = vessel;
}

export function setRudderAngle(vesselPtr: usize, angle: f64): void {
  const vessel = changetype<VesselState>(vesselPtr);
  vessel.rudderAngle = angle > 0.6 ? 0.6 : angle < -0.6 ? -0.6 : angle;
  globalVessel = vessel;
}

// State access - keep these minimal
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
