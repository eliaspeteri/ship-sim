import useStore from '../store';
import { loadWasm } from '../lib/wasmLoader';

// Type definitions for WASM exports to ensure type safety
interface WasmExports {
  // Core vessel creation and management
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

  // Control functions
  setThrottle: (vesselPtr: number, throttle: number) => void;
  setRudderAngle: (vesselPtr: number, angle: number) => void;
  setBallast: (vesselPtr: number, level: number) => void;

  // Vessel state accessors
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

// Singleton for simulation instance
let simulationInstance: SimulationLoop | null = null;

export class SimulationLoop {
  private wasmExports: WasmExports | null = null;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private accumulatedTime: number = 0;
  private readonly fixedTimeStep: number = 1 / 60; // Fixed physics step at 60Hz

  private lastStateUpdateTime = 0;
  private stabilityUpdateCounter = 0;

  constructor() {
    if (simulationInstance) {
      return simulationInstance;
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    simulationInstance = this;
  }

  /**
   * Initialize the simulation with WASM exports
   */
  async initialize(): Promise<void> {
    try {
      const exports = await loadWasm();
      this.wasmExports = exports as unknown as WasmExports;

      // Create a vessel in WASM and store the pointer
      const vesselPtr = this.wasmExports.createVessel();
      useStore.getState().setWasmVesselPtr(vesselPtr);

      console.log(
        'Simulation initialized with WASM vessel pointer:',
        vesselPtr,
      );
    } catch (error) {
      console.error('Failed to initialize WASM module:', error);
    }
  }

  /**
   * Start the simulation loop
   */
  start(): void {
    if (this.animationFrameId !== null) {
      return; // Already running
    }

    this.lastFrameTime = performance.now();

    // Using an arrow function instead of bind(this)
    this.animationFrameId = requestAnimationFrame(time => this.loop(time));

    useStore.getState().setRunning(true);

    console.log('Simulation loop started');
  }

  /**
   * Stop the simulation loop
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      useStore.getState().setRunning(false);

      console.log('Simulation loop stopped');
    }
  }

  /**
   * Toggle pause state
   */
  togglePause(): void {
    const state = useStore.getState();
    state.togglePause();

    if (state.simulation.paused) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Reset simulation state
   */
  reset(): void {
    this.stop();

    // Reset the store state
    useStore.getState().resetSimulation();

    // Re-create WASM vessel
    if (this.wasmExports) {
      const vesselPtr = this.wasmExports.createVessel();
      useStore.getState().setWasmVesselPtr(vesselPtr);
    }

    console.log('Simulation reset');
  }

  /**
   * The main simulation loop
   */
  private loop(currentTime: number): void {
    // Calculate time delta
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // in seconds
    this.lastFrameTime = currentTime;

    const state = useStore.getState();

    // Only update if simulation is running and not paused
    if (state.simulation.isRunning && !state.simulation.paused) {
      // Scale delta time by time scale factor
      const scaledDeltaTime = deltaTime * state.simulation.timeScale;
      this.accumulatedTime += scaledDeltaTime;

      // Run fixed timestep physics updates
      while (this.accumulatedTime >= this.fixedTimeStep) {
        this.updatePhysics(this.fixedTimeStep);
        this.accumulatedTime -= this.fixedTimeStep;
      }

      // Increment simulation time
      state.incrementTime(scaledDeltaTime);

      // Update UI state from physics state
      this.updateUIFromPhysics();

      // Process any failures or events
      this.processEvents(scaledDeltaTime);
    }

    // Continue the loop using arrow function
    this.animationFrameId = requestAnimationFrame(time => this.loop(time));
  }

  /**
   * Update physics state using WASM module
   */
  private updatePhysics(deltaTime: number): void {
    if (!this.wasmExports) return;

    const state = useStore.getState();
    const vesselPtr = state.wasmVesselPtr;

    if (vesselPtr === null) return;

    // Get environment state
    const { wind, current, seaState } = state.environment;

    // Get control inputs
    const { throttle, rudderAngle, ballast } = state.vessel.controls;

    // Update controls in WASM
    this.wasmExports.setThrottle(vesselPtr, throttle);
    this.wasmExports.setRudderAngle(vesselPtr, rudderAngle);
    this.wasmExports.setBallast(vesselPtr, ballast);

    // Update vessel physics in WASM
    this.wasmExports.updateVesselState(
      vesselPtr,
      deltaTime,
      wind.speed,
      wind.direction,
      current.speed,
      current.direction,
      seaState,
    );

    // Handle machinery failures by adjusting physics behavior
    const { failures } = state.machinerySystems;
    if (failures.engineFailure) {
      // If engine failure, force throttle to 0
      this.wasmExports.setThrottle(vesselPtr, 0);
    }
    if (failures.rudderFailure) {
      // If rudder failure, add random drift to rudder
      const randomDrift = (Math.random() - 0.5) * 0.2;
      this.wasmExports.setRudderAngle(vesselPtr, randomDrift);
    }
  }

  /**
   * Apply vessel controls to the physics engine
   */
  applyControls(controls: {
    throttle?: number;
    rudderAngle?: number;
    ballast?: number;
  }): void {
    if (!this.wasmExports) return;

    const state = useStore.getState();
    const vesselPtr = state.wasmVesselPtr;

    if (vesselPtr === null) return;

    // Set throttle if provided
    if (controls.throttle !== undefined) {
      this.wasmExports.setThrottle(vesselPtr, controls.throttle);
    }

    // Set rudder angle if provided
    if (controls.rudderAngle !== undefined) {
      this.wasmExports.setRudderAngle(vesselPtr, controls.rudderAngle);
    }

    // Set ballast if provided
    if (controls.ballast !== undefined) {
      this.wasmExports.setBallast(vesselPtr, controls.ballast);
    }
  }

  /**
   * Update the UI state from physics engine results
   */
  private updateUIFromPhysics(): void {
    if (!this.wasmExports) return;

    const state = useStore.getState();
    const vesselPtr = state.wasmVesselPtr;

    if (vesselPtr === null) return;

    try {
      // Initialize update object with safe defaults
      const vesselUpdate: any = {};

      // Only add position and orientation updates every frame
      if (
        typeof this.wasmExports.getVesselX === 'function' &&
        typeof this.wasmExports.getVesselY === 'function' &&
        typeof this.wasmExports.getVesselHeading === 'function'
      ) {
        vesselUpdate.position = {
          x: this.wasmExports.getVesselX(vesselPtr),
          y: this.wasmExports.getVesselY(vesselPtr),
          z: 0,
        };

        vesselUpdate.orientation = {
          heading: this.wasmExports.getVesselHeading(vesselPtr),
          roll: 0,
          pitch: 0,
        };
      }

      // Add speed if available
      if (typeof this.wasmExports.getVesselSpeed === 'function') {
        vesselUpdate.velocity = {
          surge: this.wasmExports.getVesselSpeed(vesselPtr),
          sway: 0,
          heave: 0,
        };
      }

      // Engine state updates
      const engineUpdate: any = {};
      let hasEngineUpdate = false;

      // Only add engine values if they're available
      if (typeof this.wasmExports.getVesselEngineRPM === 'function') {
        engineUpdate.rpm = this.wasmExports.getVesselEngineRPM(vesselPtr);
        hasEngineUpdate = true;
      }

      if (typeof this.wasmExports.getVesselFuelLevel === 'function') {
        engineUpdate.fuelLevel = this.wasmExports.getVesselFuelLevel(vesselPtr);
        hasEngineUpdate = true;
      }

      if (typeof this.wasmExports.getVesselFuelConsumption === 'function') {
        engineUpdate.fuelConsumption =
          this.wasmExports.getVesselFuelConsumption(vesselPtr);
        hasEngineUpdate = true;
      }

      if (hasEngineUpdate) {
        vesselUpdate.engineState = engineUpdate;
      }

      // Only update stability properties every 10 frames to avoid overwhelming the store
      // and potentially causing cascading errors
      this.stabilityUpdateCounter++;
      if (this.stabilityUpdateCounter >= 10) {
        this.stabilityUpdateCounter = 0;

        const stabilityUpdate: any = {};
        let hasStabilityUpdate = false;

        if (typeof this.wasmExports.getVesselGM === 'function') {
          stabilityUpdate.metacentricHeight =
            this.wasmExports.getVesselGM(vesselPtr);
          hasStabilityUpdate = true;
        }

        if (typeof this.wasmExports.getVesselCenterOfGravityY === 'function') {
          stabilityUpdate.centerOfGravity = {
            y: this.wasmExports.getVesselCenterOfGravityY(vesselPtr),
          };
          hasStabilityUpdate = true;
        }

        if (hasStabilityUpdate) {
          vesselUpdate.stability = stabilityUpdate;
        }
      }

      // Only update the store if we have something to update
      if (Object.keys(vesselUpdate).length > 0) {
        // Update the store with the collected values
        state.updateVessel(vesselUpdate);
      }

      // Check for low fuel alarm - with null safety
      if (
        vesselUpdate.engineState?.fuelLevel !== undefined &&
        vesselUpdate.engineState.fuelLevel < 0.1 &&
        !state.vessel?.alarms?.lowFuel
      ) {
        state.updateVessel({
          alarms: {
            ...(state.vessel?.alarms || {}),
            lowFuel: true,
          },
        });

        // Add event to log
        state.addEvent({
          category: 'alarm',
          type: 'low_fuel',
          message: 'Fuel level critical: Less than 10% remaining',
          severity: 'warning',
        });
      }

      // Check stability - with null safety - only when we have stability data
      if (
        vesselUpdate.stability?.metacentricHeight !== undefined &&
        vesselUpdate.stability.metacentricHeight < 0.5 &&
        !state.vessel?.alarms?.stabilityWarning
      ) {
        state.updateVessel({
          alarms: {
            ...(state.vessel?.alarms || {}),
            stabilityWarning: true,
          },
        });

        // Add event to log
        state.addEvent({
          category: 'alarm',
          type: 'stability_warning',
          message: 'Vessel stability compromised: Low GM value',
          severity: 'critical',
        });
      }
    } catch (error: unknown) {
      console.error('Error in updateUIFromPhysics:', error);

      // Limit frequency of error logging to avoid flooding the console
      const now = Date.now();
      if (now - this.lastStateUpdateTime > 5000) {
        // Only log once every 5 seconds
        this.lastStateUpdateTime = now;

        // Log the error as an event
        state.addEvent({
          category: 'system',
          type: 'critical_error',
          message: `Critical error in physics update: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'critical',
        });
      }
    }
  }

  /**
   * Process simulation events like machinery failures
   */
  private processEvents(deltaTime: number): void {
    const state = useStore.getState();

    // Increment engine hours if running
    if (state.vessel.engineState.running) {
      const hourIncrement = deltaTime / 3600; // convert seconds to hours
      state.updateVessel({
        engineState: {
          ...state.vessel.engineState,
          hours: state.vessel.engineState.hours + hourIncrement,
        },
      });

      // Increase generator output when engine is running
      state.updateVessel({
        electricalSystem: {
          ...state.vessel.electricalSystem,
          generatorOutput: 200 * state.vessel.controls.throttle,
        },
      });
    }

    // Random failures based on engine hours or other conditions
    // This is a simplified model - real implementation would be more complex
    const engineHours = state.vessel.engineState.hours;
    const machinerySystems = state.machinerySystems;

    // Engine failure probability increases with engine hours
    if (engineHours > 100 && !machinerySystems.failures.engineFailure) {
      const failureChance = (engineHours - 100) / 10000; // Very small chance per update
      if (Math.random() < failureChance * deltaTime) {
        state.triggerFailure('engineFailure', true);
      }
    }

    // Process weather events
    this.updateWeather(deltaTime);
  }

  /**
   * Update weather conditions dynamically
   */
  private updateWeather(deltaTime: number): void {
    const state = useStore.getState();

    // Gradually change wind direction and speed
    const windVariation = (Math.random() - 0.5) * 0.1 * deltaTime;
    const windSpeedChange = (Math.random() - 0.5) * 0.2 * deltaTime;

    state.updateEnvironment({
      wind: {
        ...state.environment.wind,
        direction:
          (state.environment.wind.direction + windVariation) % (2 * Math.PI),
        speed: Math.max(0, state.environment.wind.speed + windSpeedChange),
      },
    });

    // Occasionally generate wind gusts
    if (Math.random() < 0.01 * deltaTime) {
      const gustDuration = 5 + Math.random() * 10; // 5-15 seconds
      const gustStrength =
        state.environment.wind.speed * (state.environment.wind.gustFactor - 1);

      state.updateEnvironment({
        wind: {
          ...state.environment.wind,
          gusting: true,
          speed: state.environment.wind.speed + gustStrength,
        },
      });

      // Schedule the end of the gust
      setTimeout(() => {
        const currentState = useStore.getState();
        currentState.updateEnvironment({
          wind: {
            ...currentState.environment.wind,
            gusting: false,
            speed: currentState.environment.wind.speed - gustStrength,
          },
        });
      }, gustDuration * 1000);
    }
  }
}

// Singleton export
export const getSimulationLoop = (): SimulationLoop => {
  if (!simulationInstance) {
    simulationInstance = new SimulationLoop();
  }
  return simulationInstance;
};
