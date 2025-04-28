/**
 * TypeScript definitions for the AssemblyScript WASM module
 * This provides type safety when interacting with our physics engine
 */

declare module 'wasm/ship_sim' {
  // Enhanced physics functions
  export function updateVesselState(
    vesselPtr: number,
    dt: number,
    windSpeed?: number,
    windDirection?: number,
    currentSpeed?: number,
    currentDirection?: number,
    seaState?: number,
  ): number;

  // Create vessel instance
  export function createVessel(): number;

  // Control functions
  export function setThrottle(vesselPtr: number, throttle: number): void;
  export function setRudderAngle(vesselPtr: number, angle: number): void;
  export function setBallast(vesselPtr: number, level: number): void;
  export function setEngineRunning(vesselPtr: number, running: boolean): void;

  // State access functions
  export function getVesselX(vesselPtr: number): number;
  export function getVesselY(vesselPtr: number): number;
  export function getVesselHeading(vesselPtr: number): number;
  export function getVesselSpeed(vesselPtr: number): number;
  export function getVesselEngineRPM(vesselPtr: number): number;
  export function getVesselFuelLevel(vesselPtr: number): number;
  export function getVesselFuelConsumption(vesselPtr: number): number;
  export function getVesselGM(vesselPtr: number): number;
  export function getVesselCenterOfGravityY(vesselPtr: number): number;
  export function isEngineRunning(vesselPtr: number): boolean;
}

export interface WasmModule {
  // Memory management
  __pin: (ptr: number) => number;
  __unpin: (ptr: number) => void;
  __collect: () => void;
  __allocArray: (id: number, values: number[]) => number;
  __getArray: (ptr: number) => number[];
  __getArrayBuffer: (ptr: number) => ArrayBuffer;
  __getArrayView: (ptr: number) => ArrayBufferView;

  // Vessel creation and management
  createVessel: () => number;
  destroyVessel?: (vesselPtr: number) => void;

  // Vessel properties
  setVesselProperties?: (
    vesselPtr: number,
    mass: number,
    length: number,
    beam: number,
    draft: number,
    blockCoefficient: number,
  ) => void;

  // Physics update function with enhanced parameters
  updateVesselState: (
    vesselPtr: number,
    deltaTime: number,
    windSpeed?: number,
    windDirection?: number,
    currentSpeed?: number,
    currentDirection?: number,
    seaState?: number,
  ) => number;

  // Control inputs
  setThrottle: (vesselPtr: number, throttle: number) => void;
  setRudderAngle: (vesselPtr: number, angle: number) => void;
  setBallast: (vesselPtr: number, level: number) => void;
  setEngineRunning: (vesselPtr: number, running: boolean) => void;

  // State access - basic
  getVesselX: (vesselPtr: number) => number;
  getVesselY: (vesselPtr: number) => number;
  getVesselZ: (vesselPtr: number) => number;
  getVesselHeading: (vesselPtr: number) => number;
  getVesselRoll: (vesselPtr: number) => number;
  getVesselPitch: (vesselPtr: number) => number;
  getVesselSpeed: (vesselPtr: number) => number;
  getVesselYawRate: (vesselPtr: number) => number;
  getVesselPitchAngle: (vesselPtr: number) => number;
  getVesselRollRate: (vesselPtr: number) => number;
  getVesselRollAngle: (vesselPtr: number) => number;

  // State access - enhanced
  getVesselEngineRPM: (vesselPtr: number) => number;
  getVesselFuelLevel: (vesselPtr: number) => number;
  getVesselFuelConsumption: (vesselPtr: number) => number;
  getVesselGM: (vesselPtr: number) => number;
  getVesselCenterOfGravityY: (vesselPtr: number) => number;

  // Advanced physics (optional)
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

  // Wave physics
  setWaveData: (
    vesselPtr: number,
    waveHeight: number,
    wavePhase: number,
  ) => void;
  getVesselWaveHeight: (vesselPtr: number) => number;
  getVesselWavePhase: (vesselPtr: number) => number;
  getWaveHeight: (seaState: number) => number;
  getWaveFrequency: (seaState: number) => number;
  calculateWaveHeightAtPosition: (
    x: number,
    y: number,
    time: number,
    waveHeight: number,
    waveLength: number,
    waveFrequency: number,
    waveDirection: number,
    seaState: number,
  ) => number;
}

// Simplified vessel state interface for physics updates
export interface VesselPhysicsState {
  position: { x: number; y: number; z: number };
  orientation: { heading: number; roll: number; pitch: number };
  velocity: { surge: number; sway: number; heave: number };
  angularVelocity: { yaw: number; roll: number; pitch: number };
  engineState?: {
    rpm: number;
    fuelLevel: number;
    fuelConsumption: number;
  };
  stability?: {
    metacentricHeight: number;
    centerOfGravity?: { x: number; y: number; z: number };
    trim?: number;
    list?: number;
  };
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
