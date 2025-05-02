import useStore from '../store';
import { loadWasm } from '../lib/wasmLoader';
import { WasmBridge } from '../lib/wasmBridge';
import { VesselState } from '../types/vessel.types';

// Singleton for simulation instance
let simulationInstance: SimulationLoop | null = null;

export class SimulationLoop {
  private wasmBridge: WasmBridge | null = null;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private accumulatedTime: number = 0;
  private readonly fixedTimeStep: number = 1 / 60; // Fixed physics step at 60Hz

  private lastStateUpdateTime = 0;
  private stabilityUpdateCounter = 0;
  private wavePropertiesUpdateCounter = 0;

  constructor() {
    if (simulationInstance) {
      return simulationInstance;
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    simulationInstance = this;
  }

  /**
   * Initialize the simulation with WASM exports
   * Ensures vessel pointer and initial position are set in the store.
   */
  async initialize(): Promise<void> {
    try {
      console.info('Initializing simulation with WASM module...');
      // Load WASM via our bridge that handles missing exports
      const bridge = await loadWasm();
      this.wasmBridge = bridge;

      // Create a vessel in WASM and store the pointer
      const vesselPtr = this.wasmBridge.createVessel();
      useStore.getState().setWasmVesselPtr(vesselPtr);

      // Immediately read vessel position and verify it's valid
      if (vesselPtr && this.wasmBridge) {
        const x = this.wasmBridge.getVesselX(vesselPtr);
        const y = this.wasmBridge.getVesselY(vesselPtr);
        const z = this.wasmBridge.getVesselZ(vesselPtr);

        // Check for NaN values which indicate a problem with the WASM vessel state
        if (isNaN(x) || isNaN(y) || isNaN(z)) {
          console.error('WASM vessel position contains NaN values:', {
            x,
            y,
            z,
          });
        } else {
          // Valid position values - update store
          useStore.getState().updateVessel({ position: { x, y, z } });
        }
      }

      console.info(
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

    console.info('Simulation loop started');
  }

  /**
   * The main simulation loop
   */
  private loop(currentTime: number): void {
    // Calculate time delta
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // in seconds
    this.lastFrameTime = currentTime;

    const state = useStore.getState();

    // Ensure state.simulation is properly initialized with default values if needed
    if (!state.simulation) {
      console.error('Simulation state is null, reinitializing');
      return;
    }

    // Initialize elapsedTime if it's null
    if (
      state.simulation.elapsedTime === null ||
      state.simulation.elapsedTime === undefined
    ) {
      state.incrementTime(0); // This will set elapsedTime to 0
    }

    // Only update if simulation is running
    if (state.simulation.isRunning) {
      // Scale delta time by time scale factor
      const scaledDeltaTime = deltaTime * (state.simulation.timeScale || 1.0);
      this.accumulatedTime += scaledDeltaTime;

      // Run fixed timestep physics updates
      while (this.accumulatedTime >= this.fixedTimeStep) {
        this.updatePhysics(this.fixedTimeStep);
        this.accumulatedTime -= this.fixedTimeStep;
      }

      // Increment simulation time - ensure this is always called when running
      state.incrementTime(scaledDeltaTime);

      // Update UI state from physics state
      this.updateUIFromPhysics();

      // Update wave properties for the ocean renderer
      this.updateWaveProperties();

      // Process any failures or events
      this.processEvents(scaledDeltaTime);
    }

    // Continue the loop using arrow function
    this.animationFrameId = requestAnimationFrame(time => this.loop(time));
  }

  /**
   * Update physics state using WASM module
   */
  private updatePhysics(dt: number): void {
    const state = useStore.getState();
    if (!state || !this.wasmBridge || !state.wasmVesselPtr) return;

    const { wind, current } = state.environment;
    const prevVesselPos = state.vessel.position;

    // Calculate the actual sea state based on wind speed
    const calculatedSeaState = this.wasmBridge.calculateSeaState(wind.speed);

    // Update the state with the calculated sea state
    if (state.environment.seaState !== calculatedSeaState) {
      state.environment.seaState = calculatedSeaState;
    }

    try {
      // Update vessel state in WASM - store the updated pointer in case it changes
      const updatedVesselPtr = this.wasmBridge.updateVesselState(
        state.wasmVesselPtr,
        dt,
        wind.speed,
        wind.direction,
        current.speed,
        current.direction,
      );

      // Read vessel data from WASM
      const x = this.wasmBridge.getVesselX(updatedVesselPtr);
      const y = this.wasmBridge.getVesselY(updatedVesselPtr);
      const z = this.wasmBridge.getVesselZ(updatedVesselPtr);
      const heading = this.wasmBridge.getVesselHeading(updatedVesselPtr);
      const roll = this.wasmBridge.getVesselRollAngle(updatedVesselPtr);
      const pitch = this.wasmBridge.getVesselPitchAngle(updatedVesselPtr);

      // Check for NaN values - use previous or default values if needed
      const positionUpdate = {
        x: isNaN(x) ? prevVesselPos?.x || 0 : x,
        y: isNaN(y) ? prevVesselPos?.y || 0 : y,
        z: isNaN(z) ? prevVesselPos?.z || 0 : z,
      };

      // Log if any values were NaN
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        console.warn('Physics returned NaN position values:', { x, y, z });
      }

      // Check orientation values
      const orientationUpdate = {
        heading: isNaN(heading)
          ? state.vessel.orientation.heading || 0
          : heading,
        roll: isNaN(roll) ? state.vessel.orientation.roll || 0 : roll,
        pitch: isNaN(pitch) ? state.vessel.orientation.pitch || 0 : pitch,
      };

      // Update state with sanitized values
      state.updateVessel({
        position: positionUpdate,
        orientation: orientationUpdate,
      });

      // Update vessel pointer if it changed
      if (updatedVesselPtr !== state.wasmVesselPtr) {
        state.setWasmVesselPtr(updatedVesselPtr);
      }

      // Handle machinery failures by adjusting physics behavior
      const { failures } = state.machinerySystems;
      if (failures.engineFailure && this.wasmBridge) {
        // If engine failure, force throttle to 0
        this.wasmBridge.setThrottle(state.wasmVesselPtr, 0);
      }
      if (failures.rudderFailure && this.wasmBridge) {
        // If rudder failure, add random drift to rudder
        const randomDrift = (Math.random() - 0.5) * 0.2;
        this.wasmBridge.setRudderAngle(state.wasmVesselPtr, randomDrift);
      }
    } catch (error) {
      console.error('Error in updatePhysics:', error);
      // Don't update vessel state on error - maintain last known good state
    }
  }

  /**
   * Apply vessel controls to the physics engine
   * @param controls - Object containing throttle, rudder angle, and ballast values
   * @param controls.throttle - Throttle value (0 to 1)
   * @param controls.rudderAngle - Rudder angle in degrees
   * @param controls.ballast - Ballast value (0 to 1)
   * @returns void
   */
  applyControls(controls: {
    throttle?: number;
    rudderAngle?: number;
    ballast?: number;
  }): void {
    if (!this.wasmBridge) return;

    const state = useStore.getState();
    const vesselPtr = state.wasmVesselPtr;

    if (vesselPtr === null) return;

    try {
      // Set throttle if provided
      if (controls.throttle !== undefined) {
        this.wasmBridge.setThrottle(vesselPtr, controls.throttle);
      }

      // Set rudder angle if provided
      if (controls.rudderAngle !== undefined) {
        this.wasmBridge.setRudderAngle(vesselPtr, controls.rudderAngle);
      }

      // Set ballast if provided
      if (controls.ballast !== undefined) {
        this.wasmBridge.setBallast(vesselPtr, controls.ballast);
      }
    } catch (error) {
      console.error('Error applying vessel controls to WASM:', error);
      // Don't update store here - the store has already been updated in applyVesselControls
      // This prevents circular updates that can lead to "Maximum update depth exceeded"
    }
  }

  /**
   * Update wave properties in the store based on physics calculations
   * Exports the wave data needed for the ocean renderer
   */
  private updateWaveProperties(): void {
    if (!this.wasmBridge) return;

    // Only update wave properties every few frames to avoid performance issues
    this.wavePropertiesUpdateCounter++;
    if (this.wavePropertiesUpdateCounter < 5) return; // Update every 5 frames
    this.wavePropertiesUpdateCounter = 0;

    const state = useStore.getState();
    const vesselPtr = state.wasmVesselPtr;

    if (vesselPtr === null) return;

    try {
      // Get environment parameters
      const { seaState, wind } = state.environment;

      // Get wave height from physics engine
      const waveHeight = this.wasmBridge.getWaveHeightForSeaState(seaState);
      state.updateEnvironment({ waveHeight });

      state.updateEnvironment({
        waveHeight: this.wasmBridge.getWaveHeightForSeaState(seaState),
        waveDirection: wind.direction,
      });

      // Update vessel wave data in store
      state.updateVessel({
        position: {
          ...state.vessel.position,
        },
      });
    } catch (error) {
      console.error('Error updating wave properties:', error);
    }
  }

  /**
   * Update the UI state from physics engine results
   */
  private updateUIFromPhysics(): void {
    if (!this.wasmBridge) return;

    const state = useStore.getState();
    const vesselPtr = state.wasmVesselPtr;

    if (vesselPtr === null) return;

    try {
      // Initialize update object with proper typing
      const vesselUpdate: Partial<VesselState> = {};

      // Position and orientation updates
      const positionUpdate = {
        x: this.wasmBridge.getVesselX(vesselPtr),
        y: this.wasmBridge.getVesselY(vesselPtr),
        z: this.wasmBridge.getVesselZ(vesselPtr),
      };
      vesselUpdate.position = positionUpdate;

      // Get vessel orientation including roll and pitch from physics
      const orientationUpdate = {
        heading: this.wasmBridge.getVesselHeading(vesselPtr),
        roll: this.wasmBridge.getVesselRollAngle(vesselPtr),
        pitch: this.wasmBridge.getVesselPitchAngle(vesselPtr),
      };
      vesselUpdate.orientation = orientationUpdate;

      // Add speed
      vesselUpdate.velocity = {
        surge: this.wasmBridge.getVesselSpeed(vesselPtr),
        sway: 0,
        heave: 0,
      };

      // Engine state updates
      const isEngineRunning = false; // Default value since this function may not exist
      const engineUpdate = {
        rpm: this.wasmBridge.getVesselEngineRPM(vesselPtr),
        fuelLevel: this.wasmBridge.getVesselFuelLevel(vesselPtr),
        fuelConsumption: this.wasmBridge.getVesselFuelConsumption(vesselPtr),
        temperature: 25,
        oilPressure: 5.0,
        load: 0,
        running: isEngineRunning,
        hours: state.vessel.engineState.hours || 0, // Preserve engine hours
      };

      // Calculate load based on throttle and RPM
      if (engineUpdate.rpm > 0) {
        const maxRpm = 1200; // Maximum RPM
        const normalizedRPM = Math.min(engineUpdate.rpm / maxRpm, 1);

        // Calculate engine load based on RPM and current throttle setting
        const throttleValue = state.vessel.controls?.throttle || 0;
        engineUpdate.load = normalizedRPM * (0.5 + throttleValue * 0.5);

        // Adjust temperature based on load
        engineUpdate.temperature = 25 + 65 * engineUpdate.load;

        // Adjust oil pressure based on RPM
        engineUpdate.oilPressure = 2.0 + 3.0 * normalizedRPM;
      }

      vesselUpdate.engineState = engineUpdate;

      // Only update stability properties every 10 frames to avoid overwhelming the store
      // and potentially causing cascading errors
      this.stabilityUpdateCounter++;
      if (this.stabilityUpdateCounter >= 10) {
        this.stabilityUpdateCounter = 0;

        const stabilityUpdate = {
          metacentricHeight: this.wasmBridge.getVesselGM(vesselPtr),
          centerOfGravity: {
            x: 0,
            y: this.wasmBridge.getVesselCenterOfGravityY(vesselPtr),
            z: 6.0,
          },
          trim: 0,
          list: 0,
        };

        vesselUpdate.stability = stabilityUpdate;
      }

      // Only update the store if we have something to update
      if (Object.keys(vesselUpdate).length > 0) {
        // Update the store with the collected values
        state.updateVessel(vesselUpdate);
      }

      // Check for low fuel alarm - with null safety
      const engineState = vesselUpdate.engineState;
      if (
        engineState &&
        engineState.fuelLevel !== undefined &&
        engineState.fuelLevel < 0.1 &&
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
      const stability = vesselUpdate.stability;
      if (
        stability &&
        stability.metacentricHeight !== undefined &&
        stability.metacentricHeight < 0.5 &&
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
          message: `Critical error in physics update: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
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
      // Add null-safety check for state.vessel.controls
      if (state.vessel.controls) {
        state.updateVessel({
          electricalSystem: {
            ...state.vessel.electricalSystem,
            generatorOutput: 200 * (state.vessel.controls.throttle || 0),
          },
        });
      }
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
