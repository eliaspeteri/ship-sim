/**
 * Custom WebAssembly loader for the ship simulator
 * This file provides a browser-compatible way to load WebAssembly modules
 * without relying on the auto-generated loader that uses Node.js imports
 */

// Error tracking state
let lastErrorTime = 0;
let errorCount = 0;
let vesselStateErrored = false;

// Define the interface for our WebAssembly exports
export interface ShipSimWasm {
  // Memory
  memory: WebAssembly.Memory;

  // AssemblyScript runtime
  __setArgumentsLength?: (length: number) => void;
  __new?: (size: number, id: number) => number;
  __pin?: (ptr: number) => number;
  __unpin?: (ptr: number) => void;
  __collect?: () => void;
  __getArray?: (ptr: number) => any;

  // Basic math (testing functions)
  add: (a: number, b: number) => number;
  multiply: (a: number, b: number) => number;

  // Vessel management
  createVessel: () => number;
  updateVesselState: (
    vesselPtr: number,
    dt: number,
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

  // State access
  getVesselX: (vesselPtr: number) => number;
  getVesselY: (vesselPtr: number) => number;
  getVesselHeading: (vesselPtr: number) => number;
  getVesselSpeed: (vesselPtr: number) => number;
  getVesselEngineRPM: (vesselPtr: number) => number;
  getVesselFuelLevel: (vesselPtr: number) => number;
  getVesselFuelConsumption: (vesselPtr: number) => number;
  getVesselGM: (vesselPtr: number) => number;
  getVesselCenterOfGravityY: (vesselPtr: number) => number;
}

// Keep a cached instance of the module
let wasmInstance: ShipSimWasm | null = null;

/**
 * Load the WebAssembly module directly
 */
export async function loadWasmModule(): Promise<ShipSimWasm> {
  if (wasmInstance) {
    return wasmInstance;
  }

  try {
    console.info('Loading WASM physics engine...');

    // Fetch the WebAssembly binary
    const response = await fetch('/wasm/ship_sim.wasm');
    const buffer = await response.arrayBuffer();

    // Create imports object with environment
    const imports = {
      env: {
        abort: (
          messagePtr: number,
          fileNamePtr: number,
          line: number,
          column: number,
        ) => {
          console.error(`AssemblyScript abort: at line ${line}:${column}`);
          throw new Error('WebAssembly module aborted execution');
        },
      },
    };

    // Compile and instantiate the module
    const module = await WebAssembly.compile(buffer);
    const instance = await WebAssembly.instantiate(module, imports);

    // Get the raw exports
    const exports = instance.exports as any;

    // Create a wrapper object instead of modifying the original
    const wrapper: ShipSimWasm = {
      // Pass through memory
      memory: exports.memory,

      // Runtime functions
      __setArgumentsLength: exports.__setArgumentsLength,
      __new: exports.__new,
      __pin: exports.__pin,
      __unpin: exports.__unpin,
      __collect: exports.__collect,
      __getArray: exports.__getArray,

      // Math functions
      add: exports.add,
      multiply: exports.multiply,

      // Wrap updateVesselState to handle arguments
      updateVesselState: (
        vesselPtr: number,
        dt: number,
        windSpeed?: number,
        windDirection?: number,
        currentSpeed?: number,
        currentDirection?: number,
        seaState?: number,
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
          // Ensure parameters are within reasonable bounds to avoid WASM errors
          // Pointer must be positive integer
          if (vesselPtr <= 0 || !Number.isInteger(vesselPtr)) {
            return vesselPtr;
          }

          // Delta time must be positive and reasonable
          if (dt <= 0 || dt > 1.0) {
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

          // Set the correct argument count - the compiled WebAssembly only expects 4 parameters
          if (exports.__setArgumentsLength) {
            exports.__setArgumentsLength(4);
          }

          // Only pass the parameters that the WASM function actually accepts
          return exports.updateVesselState(
            vesselPtr,
            dt,
            safeWindSpeed,
            safeWindDirection,
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
            console.error('Parameters:', {
              vesselPtr,
              dt,
              windSpeed,
              windDirection,
              currentSpeed,
              currentDirection,
              seaState,
            });
          }

          // Return the vessel pointer as fallback to prevent simulation crash
          return vesselPtr;
        }
      },

      // Vessel management
      createVessel: exports.createVessel,

      // Control functions
      setThrottle: exports.setThrottle,
      setRudderAngle: exports.setRudderAngle,
      setBallast: exports.setBallast,

      // State access
      getVesselX: exports.getVesselX,
      getVesselY: exports.getVesselY,
      getVesselHeading: exports.getVesselHeading,
      getVesselSpeed: exports.getVesselSpeed,
      getVesselEngineRPM: exports.getVesselEngineRPM,
      getVesselFuelLevel: exports.getVesselFuelLevel,
      getVesselFuelConsumption: exports.getVesselFuelConsumption,
      getVesselGM: exports.getVesselGM,
      getVesselCenterOfGravityY: exports.getVesselCenterOfGravityY,
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

/**
 * Clear the cached WebAssembly instance
 */
export function unloadWasmModule(): void {
  if (wasmInstance && typeof wasmInstance.__collect === 'function') {
    wasmInstance.__collect();
  }
  wasmInstance = null;
}
