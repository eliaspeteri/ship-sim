/**
 * TypeScript definitions for the AssemblyScript WASM module
 * This provides type safety when interacting with our physics engine
 */

export interface WasmModule {
  memory?: WebAssembly.Memory;
  // AssemblyScript runtime helpers (optional in custom loader)
  __pin?: (ptr: number) => number;
  __unpin?: (ptr: number) => void;
  __collect?: () => void;
  __getArray?: (...args: unknown[]) => unknown[];
  __getArrayView?: (...args: unknown[]) => ArrayBufferView;
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
    blockCoefficient: number,
    rudderForceCoefficient: number,
    rudderStallAngle: number,
    rudderMaxAngle: number,
    dragCoefficient: number,
    yawDamping: number,
    yawDampingQuad: number,
    swayDamping: number,
    maxThrust: number,
    maxSpeed: number,
    rollDamping: number,
    pitchDamping: number,
    heaveStiffness: number,
    heaveDamping: number,
  ) => number;
  destroyVessel?: (vesselPtr: number) => void;

  getVesselParamsBufferPtr?: () => number;
  getVesselParamsBufferCapacity?: () => number;
  setVesselParams?: (
    vesselPtr: number,
    modelId: number,
    paramsPtr: number,
    paramsLen: number,
  ) => void;
  getEnvironmentBufferPtr?: () => number;
  getEnvironmentBufferCapacity?: () => number;
  setEnvironment?: (paramsPtr: number, paramsLen: number) => void;

  // Physics update function with enhanced parameters
  updateVesselState: (
    vesselPtr: number,
    deltaTime: number,
    windSpeed: number,
    windDirection: number,
    currentSpeed: number,
    currentDirection: number,
    waveHeight: number,
    waveLength: number,
    waveDirection: number,
    waveSteepness: number,
  ) => number;

  // Control inputs
  setThrottle: (vesselPtr: number, throttle: number) => void;
  setRudderAngle: (vesselPtr: number, angle: number) => void;
  setBallast: (vesselPtr: number, level: number) => void;
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
  getVesselRollRate: (vesselPtr: number) => number;
  getVesselPitchRate: (vesselPtr: number) => number;
  getVesselYawRate: (vesselPtr: number) => number;

  // Wave physics
  calculateSeaState: (windSpeed: number) => number;
  getWaveHeightForSeaState: (seaState: number) => number;

  // Global vessel management
  resetGlobalVessel?: () => void;
}
