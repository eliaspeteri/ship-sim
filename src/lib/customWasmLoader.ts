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
  __getArray?: (ptr: number) => unknown[];

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
    const exports = instance.exports as WebAssembly.Exports;

    // Create a wrapper object with proper type casting
    const wrapper: ShipSimWasm = {
      // Pass through memory
      memory: exports.memory as WebAssembly.Memory,

      // Runtime functions
      __setArgumentsLength: exports.__setArgumentsLength as
        | ((length: number) => void)
        | undefined,
      __new: exports.__new as
        | ((size: number, id: number) => number)
        | undefined,
      __pin: exports.__pin as ((ptr: number) => number) | undefined,
      __unpin: exports.__unpin as ((ptr: number) => void) | undefined,
      __collect: exports.__collect as (() => void) | undefined,
      __getArray: exports.__getArray as
        | ((ptr: number) => unknown[])
        | undefined,

      // Math functions
      add: exports.add as (a: number, b: number) => number,
      multiply: exports.multiply as (a: number, b: number) => number,

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
          if (wrapper.__setArgumentsLength) {
            wrapper.__setArgumentsLength(4);
          }

          // Only pass the parameters that the WASM function actually accepts
          const updateFn = exports.updateVesselState as (
            vesselPtr: number,
            dt: number,
            windSpeed: number,
            windDirection: number,
          ) => number;

          return updateFn(vesselPtr, dt, safeWindSpeed, safeWindDirection);
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

      // State access
      getVesselX: exports.getVesselX as (vesselPtr: number) => number,
      getVesselY: exports.getVesselY as (vesselPtr: number) => number,
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
  if (wasmInstance) {
    try {
      // Call AssemblyScript's garbage collection
      if (typeof wasmInstance.__collect === 'function') {
        wasmInstance.__collect();
      }

      // Release any explicitly pinned objects
      if (typeof wasmInstance.__unpin === 'function') {
        // In a real implementation, you'd keep track of pinned pointers
        // and unpin them here
      }

      // Clear reference to the instance to allow GC
      wasmInstance = null;

      // Force a browser garbage collection hint (not guaranteed)
      if (typeof window !== 'undefined' && window.gc) {
        window.gc();
      }

      console.info('WebAssembly module resources cleaned up');
    } catch (error) {
      console.error('Error cleaning up WebAssembly module:', error);
    }
  }
}
