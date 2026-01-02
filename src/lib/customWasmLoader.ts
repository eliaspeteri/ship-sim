import { WasmModule } from '../types/wasm';

let wasmInstance: WasmModule | null = null;

function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

function getWasmPath(): string {
  return isDevelopmentMode() ? '/wasm/debug.wasm' : '/wasm/ship_sim.wasm';
}

export async function loadWasmModule(): Promise<WasmModule> {
  if (wasmInstance) return wasmInstance;

  const wasmPath = getWasmPath();
  const response = await fetch(wasmPath);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch WASM module from ${wasmPath}: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = await response.arrayBuffer();
  const memory = new WebAssembly.Memory({ initial: 16, maximum: 100 });
  const imports = {
    env: {
      memory,
      abort: (line: number, column: number) => {
        throw new Error(`AssemblyScript abort: ${line}:${column}`);
      },
    },
  };

  const module = await WebAssembly.compile(buffer);
  const instance = await WebAssembly.instantiate(module, imports);
  const exports = instance.exports as WebAssembly.Exports;

  const wrapper: WasmModule = {
    updateVesselState: exports.updateVesselState as (
      vesselPtr: number,
      dt: number,
      windSpeed: number,
      windDirection: number,
      currentSpeed: number,
      currentDirection: number,
    ) => number,
    createVessel: exports.createVessel as (
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
    ) => number,
    setThrottle: exports.setThrottle as (
      vesselPtr: number,
      throttle: number,
    ) => void,
    setRudderAngle: exports.setRudderAngle as (
      vesselPtr: number,
      angle: number,
    ) => void,
    setBallast: exports.setBallast as (
      vesselPtr: number,
      level: number,
    ) => void,
    getVesselX: exports.getVesselX as (vesselPtr: number) => number,
    getVesselY: exports.getVesselY as (vesselPtr: number) => number,
    getVesselZ: exports.getVesselZ as (vesselPtr: number) => number,
    getVesselHeading: exports.getVesselHeading as (vesselPtr: number) => number,
    getVesselSpeed: exports.getVesselSpeed as (vesselPtr: number) => number,
    getVesselEngineRPM: exports.getVesselEngineRPM as (
      vesselPtr: number,
    ) => number,
    getVesselFuelLevel: exports.getVesselFuelLevel as (
      vesselPtr: number,
    ) => number,
    getVesselFuelConsumption: exports.getVesselFuelConsumption as (
      vesselPtr: number,
    ) => number,
    getVesselGM: exports.getVesselGM as (vesselPtr: number) => number,
    getVesselCenterOfGravityY: exports.getVesselCenterOfGravityY as (
      vesselPtr: number,
    ) => number,
    getVesselRollAngle: exports.getVesselRollAngle as (
      vesselPtr: number,
    ) => number,
    getVesselPitchAngle: exports.getVesselPitchAngle as (
      vesselPtr: number,
    ) => number,
    getVesselRudderAngle: exports.getVesselRudderAngle as (
      vesselPtr: number,
    ) => number,
    getVesselBallastLevel: exports.getVesselBallastLevel as (
      vesselPtr: number,
    ) => number,
    getVesselSurgeVelocity: exports.getVesselSurgeVelocity as (
      vesselPtr: number,
    ) => number,
    getVesselSwayVelocity: exports.getVesselSwayVelocity as (
      vesselPtr: number,
    ) => number,
    getVesselHeaveVelocity: exports.getVesselHeaveVelocity as (
      vesselPtr: number,
    ) => number,
    getVesselRollRate: exports.getVesselRollRate as (
      vesselPtr: number,
    ) => number,
    getVesselPitchRate: exports.getVesselPitchRate as (
      vesselPtr: number,
    ) => number,
    getVesselYawRate: exports.getVesselYawRate as (vesselPtr: number) => number,
    calculateSeaState: exports.calculateSeaState as (
      windSpeed: number,
    ) => number,
    getWaveHeightForSeaState: exports.getWaveHeightForSeaState as (
      seaState: number,
    ) => number,
    resetGlobalVessel: exports.resetGlobalVessel as () => void,
  };

  wasmInstance = wrapper;
  return wasmInstance;
}
