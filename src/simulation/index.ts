// Ship simulator simulation manager
// Handles integration between WASM physics and application state

import useStore from '../store';
// Change this import to use the custom loader instead of wasmLoader
import { loadWasmModule } from '../lib/customWasmLoader';

// Types for WASM module interface
interface WasmPhysics {
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
  setThrottle: (vesselPtr: number, throttle: number) => void;
  setRudderAngle: (vesselPtr: number, angle: number) => void;
  setBallast: (vesselPtr: number, level: number) => void;
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

// Global instance for the simulation manager
let simulationInstance: SimulationManager | null = null;

// Pointer to the vessel in WASM memory
let vesselPtr: number | null = null;

// Add throttling to prevent too many state updates
const MIN_UPDATE_INTERVAL = 50; // milliseconds between state updates

class SimulationManager {
  private wasmModule: WasmPhysics | null = null;
  private animationFrameId: number | null = null;
  private lastTime: number | null = null;
  private lastStateUpdateTime: number = 0;
  private isRunning = false;
  private accumulatedVesselUpdate: any = {};

  /**
   * Initialize the simulation
   */
  async initialize(): Promise<void> {
    try {
      // Load WASM module using custom loader
      this.wasmModule = (await loadWasmModule()) as unknown as WasmPhysics;

      // Create vessel in WASM
      const vesselPtr = this.wasmModule.createVessel();

      // Update the store with the vessel pointer
      const store = useStore.getState();
      store.setWasmVesselPtr(vesselPtr);

      // Initialize store with running state
      store.setRunning(true);

      console.log(
        'Simulation initialized successfully with vessel pointer:',
        vesselPtr,
      );
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize simulation:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Start the simulation loop
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Start the animation frame loop
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.update.bind(this));

    console.log('Simulation started');
  }

  /**
   * Stop the simulation loop
   */
  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    console.log('Simulation stopped');
  }

  /**
   * Update function called on each animation frame
   */
  private update(timestamp: number): void {
    if (!this.isRunning || !this.wasmModule) return;

    // Calculate delta time in seconds
    const deltaTime = this.lastTime ? (timestamp - this.lastTime) / 1000 : 0;
    this.lastTime = timestamp;

    // Cap deltaTime to prevent huge jumps in simulation
    const dt = Math.min(0.1, deltaTime);

    // Get current state and WASM vessel pointer
    const store = useStore.getState();
    const { wasmVesselPtr, environment } = store;

    if (wasmVesselPtr !== null) {
      try {
        // Update physics in WASM with enhanced parameters
        this.wasmModule.updateVesselState(
          wasmVesselPtr,
          dt,
          environment.wind.speed,
          environment.wind.direction,
          environment.current.speed,
          environment.current.direction,
          environment.seaState,
        );

        // Throttle state updates to reduce React re-renders
        const now = performance.now();

        // Only update state periodically (20 times per second max)
        if (now - this.lastStateUpdateTime >= MIN_UPDATE_INTERVAL) {
          // Get updated vessel state values from WASM in a single batch
          const vesselUpdate = {
            position: {
              x: this.wasmModule.getVesselX(wasmVesselPtr),
              y: this.wasmModule.getVesselY(wasmVesselPtr),
              z: 0,
            },
            orientation: {
              heading: this.wasmModule.getVesselHeading(wasmVesselPtr),
              roll: 0,
              pitch: 0,
            },
            velocity: {
              surge: this.wasmModule.getVesselSpeed(wasmVesselPtr),
              sway: 0,
              heave: 0,
            },
          };

          // Only add engine state if the functions exist
          if (typeof this.wasmModule.getVesselEngineRPM === 'function') {
            const engineUpdate = {
              rpm: this.wasmModule.getVesselEngineRPM(wasmVesselPtr),
              fuelLevel:
                this.wasmModule.getVesselFuelLevel?.(wasmVesselPtr) ||
                store.vessel.engineState.fuelLevel,
              fuelConsumption:
                this.wasmModule.getVesselFuelConsumption?.(wasmVesselPtr) || 0,
            };

            // @ts-ignore - Add engineState only if needed
            vesselUpdate.engineState = engineUpdate;
          }

          // Only add stability info if the function exists
          if (typeof this.wasmModule.getVesselGM === 'function') {
            const stabilityUpdate = {
              metacentricHeight: this.wasmModule.getVesselGM(wasmVesselPtr),
              centerOfGravity: { ...store.vessel.stability.centerOfGravity },
            };

            if (
              typeof this.wasmModule.getVesselCenterOfGravityY === 'function'
            ) {
              stabilityUpdate.centerOfGravity.y =
                this.wasmModule.getVesselCenterOfGravityY(wasmVesselPtr);
            }

            // @ts-ignore - Add stability only if needed
            vesselUpdate.stability = stabilityUpdate;
          }

          // Update the store with new vessel state in a single operation
          store.updateVessel(vesselUpdate);

          // Update simulation elapsed time
          store.incrementTime(dt);
          this.lastStateUpdateTime = now;
        }
      } catch (error) {
        console.error('Error in simulation update:', error);
        this.stop();
      }
    }

    // Continue the animation loop
    this.animationFrameId = requestAnimationFrame(this.update.bind(this));
  }

  /**
   * Apply controls to the vessel
   */
  applyControls(throttle: number, rudderAngle: number, ballast?: number): void {
    if (!this.wasmModule) return;

    const { wasmVesselPtr } = useStore.getState();

    if (wasmVesselPtr !== null) {
      // Set throttle and rudder in WASM
      this.wasmModule.setThrottle(wasmVesselPtr, throttle);
      this.wasmModule.setRudderAngle(wasmVesselPtr, rudderAngle);

      // Set ballast if specified and function is available
      if (
        ballast !== undefined &&
        typeof this.wasmModule.setBallast === 'function'
      ) {
        this.wasmModule.setBallast(wasmVesselPtr, ballast);
      }

      // Update the store
      const controlsUpdate: any = {
        throttle,
        rudderAngle,
      };

      if (ballast !== undefined) {
        controlsUpdate.ballast = ballast;
      }

      useStore.getState().updateVessel({
        controls: controlsUpdate,
      });
    }
  }
}

// Create singleton instance
export const simulationManager = new SimulationManager();

// Export some convenience functions
export const initializeSimulation = async (): Promise<void> => {
  return simulationManager.initialize();
};

export const startSimulation = (): void => {
  simulationManager.start();
};

export const stopSimulation = (): void => {
  simulationManager.stop();
};

export const applyVesselControls = (
  throttle: number,
  rudderAngle: number,
  ballast?: number,
): void => {
  simulationManager.applyControls(throttle, rudderAngle, ballast);
};
