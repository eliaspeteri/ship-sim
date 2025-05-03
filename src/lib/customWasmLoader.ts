/**
 * Custom WebAssembly loader for the ship simulator
 * This file provides a browser-compatible way to load WebAssembly modules
 * without relying on the auto-generated loader that uses Node.js imports
 */

import { WasmModule } from '../types/wasm';

// Error tracking state
let lastErrorTime = 0;
let errorCount = 0;
let vesselStateErrored = false;

// Keep a cached instance of the module
let wasmInstance: WasmModule | null = null;

/**
 * Determine if we're running in development mode
 */
function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get the appropriate WASM file path based on the current environment
 */
function getWasmPath(): string {
  // In development mode, use the debug build
  if (isDevelopmentMode()) {
    console.info('Loading debug WASM build for development');
    return '/wasm/debug.wasm';
  }

  // In production, use the optimized build
  return '/wasm/ship_sim.wasm';
}

/**
 * Load the WebAssembly module directly
 */
export async function loadWasmModule(): Promise<WasmModule> {
  if (wasmInstance) {
    return wasmInstance;
  }

  try {
    console.info('Loading WASM physics engine...');

    // Fetch the WebAssembly binary from the appropriate location
    const wasmPath = getWasmPath();
    console.info(`Using WASM from: ${wasmPath}`);

    const response = await fetch(wasmPath);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch WASM module from ${wasmPath}: ${response.status} ${response.statusText}`,
      );
    }

    const buffer = await response.arrayBuffer();

    // Create WebAssembly memory with sizes matching asconfig.json
    const memory = new WebAssembly.Memory({
      initial: 16, // 16 pages = 1MB
      maximum: 100, // 100 pages = 6.25MB
    });

    // Create imports object with environment
    const imports = {
      env: {
        memory: memory,
        abort: (line: number, column: number) => {
          console.error(`AssemblyScript abort: at line ${line}:${column}`);
          throw new Error('WebAssembly module aborted execution');
        },
      },
    };

    // Compile and instantiate the module
    const module = await WebAssembly.compile(buffer);
    const instance = await WebAssembly.instantiate(module, imports);

    // Get the raw exports
    const exports = instance.exports as WebAssembly.Exports;

    // Create a wrapper object with proper type casting
    const wrapper: WasmModule = {
      // Wrap updateVesselState to handle arguments
      updateVesselState: (
        vesselPtr: number,
        dt: number,
        windSpeed: number,
        windDirection: number,
        currentSpeed: number,
        currentDirection: number,
      ) => {
        // Check if we've had too many errors - temporarily disable function
        const now = Date.now();
        if (vesselStateErrored) {
          // Reset error state after 5 seconds to try again
          if (now - lastErrorTime > 5000) {
            vesselStateErrored = false;
            errorCount = 0;
          } else {
            // While in error state, just return the pointer without calling WASM
            return vesselPtr;
          }
        }

        try {
          // Validate function exists in exports
          const updateFn = exports.updateVesselState;
          if (typeof updateFn !== 'function') {
            console.error(
              'updateVesselState function not found in WASM exports',
            );
            return vesselPtr;
          }

          // Ensure parameters are within reasonable bounds to avoid WASM errors
          // Pointer must be positive integer
          if (!Number.isInteger(vesselPtr) || vesselPtr <= 0) {
            console.warn('Invalid vessel pointer:', vesselPtr);
            return vesselPtr;
          }

          // Delta time must be positive and reasonable
          if (dt <= 0 || dt > 1.0 || !isFinite(dt)) {
            console.warn('Invalid delta time:', dt);
            return vesselPtr;
          }

          // Ensure all parameters have valid values and normalize to avoid edge cases
          const safeWindSpeed =
            typeof windSpeed === 'number' && isFinite(windSpeed)
              ? Math.max(0, Math.min(50, windSpeed)) // Clamp between 0-50 m/s
              : 0.0;

          const safeWindDirection =
            typeof windDirection === 'number' && isFinite(windDirection)
              ? windDirection % (2 * Math.PI) // Normalize to [0, 2π)
              : 0.0;

          const safeCurrentSpeed =
            typeof currentSpeed === 'number' && isFinite(currentSpeed)
              ? Math.max(0, Math.min(10, currentSpeed)) // Clamp between 0-10 m/s for currents
              : 0.0;

          const safeCurrentDirection =
            typeof currentDirection === 'number' && isFinite(currentDirection)
              ? currentDirection % (2 * Math.PI) // Normalize to [0, 2π)
              : 0.0;

          // Call the function with properly sanitized parameters
          return updateFn(
            vesselPtr,
            dt,
            safeWindSpeed,
            safeWindDirection,
            safeCurrentSpeed,
            safeCurrentDirection,
          );
        } catch (error) {
          // Update error tracking
          errorCount++;
          lastErrorTime = now;

          // If we've had multiple errors in succession, enter error state
          if (errorCount > 3) {
            vesselStateErrored = true;
            console.warn(
              'Disabling vessel state updates temporarily due to repeated errors',
            );
          }

          // Only log once per second to avoid flooding console
          if (now - lastErrorTime > 1000 || errorCount <= 3) {
            console.error('Error in WASM updateVesselState:', error);
          }

          // Return the vessel pointer as fallback to prevent simulation crash
          return vesselPtr;
        }
      },

      // Vessel management
      createVessel: exports.createVessel as () => number,

      // Control functions
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
      setWaveData: exports.setWaveData as (
        vesselPtr: number,
        height: number,
        phase: number,
      ) => void,

      // State access
      getVesselX: exports.getVesselX as (vesselPtr: number) => number,
      getVesselY: exports.getVesselY as (vesselPtr: number) => number,
      getVesselZ: exports.getVesselZ as (vesselPtr: number) => number,
      getVesselHeading: exports.getVesselHeading as (
        vesselPtr: number,
      ) => number,
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
      getVesselRudderAngle: exports.getVesselRudderAngle as (
        vesselPtr: number,
      ) => number,
      getVesselBallastLevel: exports.getVesselBallastLevel as (
        vesselPtr: number,
      ) => number,
      getVesselPitchAngle: exports.getVesselPitchAngle as (
        vesselPtr: number,
      ) => number,
      getWaveHeightForSeaState: exports.getWaveHeightForSeaState as (
        seaState: number,
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

      // Wave physics
      calculateWaveHeightAtPosition: exports.calculateWaveHeightAtPosition as (
        x: number,
        y: number,
        time: number,
        waveHeight: number,
        waveLength: number,
        waveFrequency: number,
        waveDirection: number,
        seaState: number,
      ) => number,
      calculateWaveLength: exports.calculateWaveLength as (
        seaState: number,
      ) => number,
      calculateWaveFrequency: exports.calculateWaveFrequency as (
        seaState: number,
      ) => number,
      calculateBeaufortScale: exports.calculateBeaufortScale as (
        windSpeed: number,
      ) => number,
      __pin: exports.__pin as (ptr: number) => number,
      __unpin: exports.__unpin as (ptr: number) => void,
      __collect: exports.__collect as () => void,
      __allocArray: exports.__allocArray as (
        id: number,
        values: number[],
      ) => number,
      __getArray: exports.__getArray as (ptr: number) => number[],
      __getArrayBuffer: exports.__getArrayBuffer as (
        ptr: number,
      ) => ArrayBuffer,
      __getArrayView: exports.__getArrayView as (
        ptr: number,
      ) => Float32Array | Uint8Array | Uint16Array | Uint32Array,
    };

    // Store the wrapper
    wasmInstance = wrapper;

    console.info('WASM physics engine loaded successfully');
    return wasmInstance;
  } catch (error) {
    console.error('Failed to load WASM physics engine:', error);
    throw error;
  }
}
