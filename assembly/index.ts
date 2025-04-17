// This file contains the main entry point for the AssemblyScript module.
// It exports functions and types that will be compiled to WebAssembly.

export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

// Add more functions and types as needed for the simulation logic.

class VesselState {
  x: f64;
  y: f64;
  psi: f64;
  u: f64;
  v: f64;
  r: f64;
  throttle: f64;
  rudderAngle: f64;

  constructor(
    x: f64 = 0,
    y: f64 = 0,
    psi: f64 = 0,
    u: f64 = 0,
    v: f64 = 0,
    r: f64 = 0,
    throttle: f64 = 0,
    rudderAngle: f64 = 0,
  ) {
    this.x = x;
    this.y = y;
    this.psi = psi;
    this.u = u;
    this.v = v;
    this.r = r;
    this.throttle = throttle;
    this.rudderAngle = rudderAngle;
  }
}

function calculatePropellerThrust(throttle: number): number {
  const maxThrust = 100000; // N, example value
  return throttle * maxThrust;
}

function calculateHullResistance(u: number): number {
  const rho = 1025; // seawater density (kg/m^3)
  const Cd = 0.8; // drag coefficient (example)
  const A = 200; // wetted area (m^2, example)
  return 0.5 * rho * Cd * A * u * u;
}

function calculateRudderForce(rudderAngle: number, u: number): number {
  const rudderCoeff = 50000; // N/rad, example
  return rudderCoeff * rudderAngle * u;
}

export function updateVesselState(state: VesselState, dt: f64): VesselState {
  const m = 50000; // vessel mass (kg)
  const Iz = 1e7; // yaw inertia (kg*m^2)
  const F_prop = calculatePropellerThrust(state.throttle);
  const R_hull = calculateHullResistance(state.u);
  const F_rudder = calculateRudderForce(state.rudderAngle, state.u);
  const M_rudder = F_rudder * 20; // lever arm (m, example)

  // Equations of motion (Euler integration)
  const du = ((F_prop - R_hull) / m) * dt;
  const dv = (F_rudder / m) * dt;
  const dr = (M_rudder / Iz) * dt;

  // Update state
  const u = state.u + du;
  const v = state.v + dv;
  const r = state.r + dr;
  const psi = state.psi + r * dt;
  const x = state.x + (u * Math.cos(psi) - v * Math.sin(psi)) * dt;
  const y = state.y + (u * Math.sin(psi) + v * Math.cos(psi)) * dt;

  return new VesselState(x, y, psi, u, v, r, state.throttle, state.rudderAngle);
}
