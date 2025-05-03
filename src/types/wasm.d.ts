/**
 * TypeScript definitions for the AssemblyScript WASM module
 * This provides type safety when interacting with our physics engine
 */

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
  createVessel: (
    x: number,
    y: number,
    z: number,
    heading: number,
    roll: number,
    pitch: number,
    surge: number,
    sway: number,
    heave: number,
    yawRate: number,
    rollRate: number,
    pitchRate: number,
    throttle: number,
    rudderAngle: number,
    mass: number,
    length: number,
    beam: number,
    draft: number,
  ) => number;
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
    windSpeed: number,
    windDirection: number,
    currentSpeed: number,
    currentDirection: number,
  ) => number;

  // Control inputs
  setThrottle: (vesselPtr: number, throttle: number) => void;
  setRudderAngle: (vesselPtr: number, angle: number) => void;
  setBallast: (vesselPtr: number, level: number) => void;
  setVesselVelocity?: (
    vesselPtr: number,
    surge: number,
    sway: number,
    heave: number,
    yawRate: number,
    rollRate: number,
    pitchRate: number,
  ) => void;

  // State access - basic
  getVesselX: (vesselPtr: number) => number;
  getVesselY: (vesselPtr: number) => number;
  getVesselZ: (vesselPtr: number) => number;
  getVesselHeading: (vesselPtr: number) => number;
  getVesselSpeed: (vesselPtr: number) => number;
  getVesselPitchAngle: (vesselPtr: number) => number;
  getVesselRollAngle: (vesselPtr: number) => number;
  getVesselRudderAngle: (vesselPtr: number) => number;
  getVesselBallastLevel: (vesselPtr: number) => number;

  // State access - enhanced
  getVesselEngineRPM: (vesselPtr: number) => number;
  getVesselFuelLevel: (vesselPtr: number) => number;
  getVesselFuelConsumption: (vesselPtr: number) => number;
  getVesselGM: (vesselPtr: number) => number;
  getVesselCenterOfGravityY: (vesselPtr: number) => number;
  getVesselSurgeVelocity: (vesselPtr: number) => number;
  getVesselSwayVelocity: (vesselPtr: number) => number;
  getVesselHeaveVelocity: (vesselPtr: number) => number;

  // Wave physics
  setWaveData: (
    vesselPtr: number,
    waveHeight: number,
    wavePhase: number,
  ) => void;

  /**
   * Calculates the wave frequency for a given sea state.
   * @param seaState - The sea state (0-12, Beaufort scale)
   * @returns The wave frequency in radians per second
   */
  calculateWaveFrequency: (seaState: number) => number;
  calculateWaveLength: (seaState: number) => number;
  calculateBeaufortScale: (windSpeed: number) => number;
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
  getWaveHeightForSeaState: (seaState: number) => number;

  // Global vessel management
  resetGlobalVessel?: () => void;
}
