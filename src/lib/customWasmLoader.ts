import type { WasmModule } from '../types/wasm';

let wasmInstance: WasmModule | null = null;
const textDecoder = new globalThis.TextDecoder('utf-16le');

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
      // AssemblyScript abort signature: (msg?: usize, file?: usize, line?: i32, col?: i32)
      abort: (
        msgPtr: number,
        filePtr: number,
        line: number,
        column: number,
      ) => {
        let message = 'abort';
        let file = '';
        try {
          if (msgPtr) {
            const buffer = new Uint16Array(memory.buffer);
            const len = buffer[(msgPtr - 2) >>> 1];
            message = textDecoder.decode(
              new Uint8Array(memory.buffer, msgPtr, len << 1),
            );
          }
          if (filePtr) {
            const buffer = new Uint16Array(memory.buffer);
            const len = buffer[(filePtr - 2) >>> 1];
            file = textDecoder.decode(
              new Uint8Array(memory.buffer, filePtr, len << 1),
            );
          }
        } catch (err) {
          console.warn('Failed to decode abort message', err);
        }
        throw new Error(
          `AssemblyScript abort: ${message} at ${file}:${line}:${column}`,
        );
      },
    },
  };

  const module = await WebAssembly.compile(buffer);
  const instance = await WebAssembly.instantiate(module, imports);
  const exports = instance.exports as WebAssembly.Exports;

  const setArgs = (len: number) => {
    const maybeSetter = (
      exports as {
        __setArgumentsLength?: (len: number) => void;
      }
    ).__setArgumentsLength;
    if (typeof maybeSetter === 'function') {
      maybeSetter(len);
    }
  };

  const wrapper: WasmModule = {
    updateVesselState: (
      vesselPtr: number,
      dt: number,
      windSpeed: number,
      windDirection: number,
      currentSpeed: number,
      currentDirection: number,
      waveHeight: number,
      waveLength: number,
      waveDirection: number,
      waveSteepness: number,
    ) => {
      setArgs(10);
      return (exports.updateVesselState as CallableFunction)(
        vesselPtr,
        dt,
        windSpeed,
        windDirection,
        currentSpeed,
        currentDirection,
        waveHeight,
        waveLength,
        waveDirection,
        waveSteepness,
      ) as number;
    },
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
    ) => {
      setArgs(32);
      return (exports.createVessel as CallableFunction)(
        x,
        y,
        z,
        heading,
        roll,
        pitch,
        surge,
        sway,
        heave,
        yawRate,
        rollRate,
        pitchRate,
        throttle,
        rudderAngle,
        mass,
        length,
        beam,
        draft,
        blockCoefficient,
        rudderForceCoefficient,
        rudderStallAngle,
        rudderMaxAngle,
        dragCoefficient,
        yawDamping,
        yawDampingQuad,
        swayDamping,
        maxThrust,
        maxSpeed,
        rollDamping,
        pitchDamping,
        heaveStiffness,
        heaveDamping,
      ) as number;
    },
    getVesselParamsBufferPtr: exports.getVesselParamsBufferPtr as
      | (() => number)
      | undefined,
    getVesselParamsBufferCapacity: exports.getVesselParamsBufferCapacity as
      | (() => number)
      | undefined,
    setVesselParams: exports.setVesselParams as
      | ((
          vesselPtr: number,
          modelId: number,
          paramsPtr: number,
          paramsLen: number,
        ) => void)
      | undefined,
    getEnvironmentBufferPtr: exports.getEnvironmentBufferPtr as
      | (() => number)
      | undefined,
    getEnvironmentBufferCapacity: exports.getEnvironmentBufferCapacity as
      | (() => number)
      | undefined,
    setEnvironment: exports.setEnvironment as
      | ((paramsPtr: number, paramsLen: number) => void)
      | undefined,
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
    destroyVessel: exports.destroyVessel as
      | ((vesselPtr: number) => void)
      | undefined,
  };

  wrapper.memory = memory;
  wasmInstance = wrapper;
  return wasmInstance;
}
