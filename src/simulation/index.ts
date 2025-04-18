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
  ) => number;
  setThrottle: (vesselPtr: number, throttle: number) => void;
  setRudderAngle: (vesselPtr: number, angle: number) => void;
  getVesselX: (vesselPtr: number) => number;
  getVesselY: (vesselPtr: number) => number;
  getVesselHeading: (vesselPtr: number) => number;
  getVesselSpeed: (vesselPtr: number) => number;
}

class SimulationManager {
  private wasmModule: WasmPhysics | null = null;
  private animationFrameId: number | null = null;
  private lastTime: number | null = null;
  private isRunning = false;

  /**
   * Initialize the simulation
   */
  async initialize(): Promise<void> {
    try {
      // Load WASM module using custom loader
      this.wasmModule = await loadWasmModule();

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
        // Update physics in WASM
        this.wasmModule.updateVesselState(
          wasmVesselPtr,
          dt,
          environment.wind.speed,
          environment.wind.direction,
        );

        // Get updated vessel state values from WASM
        const x = this.wasmModule.getVesselX(wasmVesselPtr);
        const y = this.wasmModule.getVesselY(wasmVesselPtr);
        const heading = this.wasmModule.getVesselHeading(wasmVesselPtr);
        const speed = this.wasmModule.getVesselSpeed(wasmVesselPtr);

        // Update the store with new vessel state
        store.updateVessel({
          position: { x, y, z: 0 },
          orientation: { heading, roll: 0, pitch: 0 },
          velocity: { surge: speed, sway: 0, heave: 0 },
        });

        // Update simulation elapsed time
        store.incrementTime(dt);
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
  applyControls(throttle: number, rudderAngle: number): void {
    if (!this.wasmModule) return;

    const { wasmVesselPtr } = useStore.getState();

    if (wasmVesselPtr !== null) {
      // Set throttle and rudder in WASM
      this.wasmModule.setThrottle(wasmVesselPtr, throttle);
      this.wasmModule.setRudderAngle(wasmVesselPtr, rudderAngle);

      // Update the store
      useStore.getState().updateVessel({
        controls: { throttle, rudderAngle },
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
): void => {
  simulationManager.applyControls(throttle, rudderAngle);
};
