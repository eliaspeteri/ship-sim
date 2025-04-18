/**
 * TypeScript definitions for the AssemblyScript WASM module
 * This provides type safety when interacting with our physics engine
 */

declare module 'wasm/ship_sim' {
  export function add(a: number, b: number): number;
  export function multiply(a: number, b: number): number;
  export function updateVesselState(
    state: VesselState,
    dt: number,
  ): VesselState;

  export type VesselState = {
    x: number;
    y: number;
    psi: number;
    u: number;
    v: number;
    r: number;
    throttle: number;
    rudderAngle: number;
  };
}

export interface WasmModule {
  // Memory management
  __pin: (ptr: number) => number;
  __unpin: (ptr: number) => void;
  __collect: () => void;
  __allocArray: (id: number, values: number[]) => number;
  __getArray: (ptr: number) => any;
  __getArrayBuffer: (ptr: number) => ArrayBuffer;
  __getArrayView: (ptr: number) => ArrayBufferView;

  // Vessel creation and management
  createVessel: () => number;
  destroyVessel: (vesselPtr: number) => void;

  // Vessel properties
  setVesselProperties: (
    vesselPtr: number,
    mass: number,
    length: number,
    beam: number,
    draft: number,
  ) => void;

  // Physics update function
  updateVesselState: (
    vesselPtr: number,
    deltaTime: number,
    windSpeed?: number,
    windDirection?: number,
    currentSpeed?: number,
    currentDirection?: number,
  ) => number;

  // Control inputs
  setThrottle: (vesselPtr: number, throttle: number) => void;
  setRudderAngle: (vesselPtr: number, angle: number) => void;

  // State access
  getVesselX: (vesselPtr: number) => number;
  getVesselY: (vesselPtr: number) => number;
  getVesselZ: (vesselPtr: number) => number;
  getVesselHeading: (vesselPtr: number) => number;
  getVesselRoll: (vesselPtr: number) => number;
  getVesselPitch: (vesselPtr: number) => number;
  getVesselSpeed: (vesselPtr: number) => number;
  getVesselYawRate: (vesselPtr: number) => number;

  // Advanced physics
  applyForce: (
    vesselPtr: number,
    forceX: number,
    forceY: number,
    forceZ: number,
  ) => void;
  applyTorque: (
    vesselPtr: number,
    torqueX: number,
    torqueY: number,
    torqueZ: number,
  ) => void;
}

// Simplified vessel state interface for physics updates
export interface VesselPhysicsState {
  position: { x: number; y: number; z: number };
  orientation: { heading: number; roll: number; pitch: number };
  velocity: { surge: number; sway: number; heave: number };
  angularVelocity: { yaw: number; roll: number; pitch: number };
}

// Enumeration for vessel types
export enum VesselType {
  CARGO = 0,
  TANKER = 1,
  CONTAINER = 2,
  FISHING = 3,
  YACHT = 4,
  TUG = 5,
}
