import useStore from '../store';
import { loadWasm } from '../lib/wasmLoader';
import { WasmBridge } from '../lib/wasmBridge';

// Import VesselState from the store file
import { ShipType } from '../store';

// Define VesselState interface here as it's not exported from store
interface VesselState {
  position: {
    x: number;
    y: number;
    z: number;
    waveHeight?: number;
    wavePhase?: number;
  };
  orientation: { heading: number; roll: number; pitch: number };
  velocity: { surge: number; sway: number; heave: number };
  angularVelocity: { yaw: number; roll: number; pitch: number };
  controls: {
    throttle: number;
    rudderAngle: number;
    ballast: number;
    bowThruster?: number;
  };
  properties: {
    name: string;
    type: ShipType;
    mass: number;
    length: number;
    beam: number;
    draft: number;
    blockCoefficient: number;
    maxSpeed: number;
  };
  engineState: {
    rpm: number;
    fuelLevel: number;
    fuelConsumption: number;
    temperature: number;
    oilPressure: number;
    load: number;
    running: boolean;
    hours: number;
  };
  electricalSystem: {
    mainBusVoltage: number;
    generatorOutput: number;
    batteryLevel: number;
    powerConsumption: number;
    generatorRunning: boolean;
  };
  stability: {
    metacentricHeight: number;
    centerOfGravity: { x: number; y: number; z: number };
    trim: number;
    list: number;
  };
  alarms: {
    engineOverheat: boolean;
    lowOilPressure: boolean;
    lowFuel: boolean;
    fireDetected: boolean;
    collisionAlert: boolean;
    stabilityWarning: boolean;
    generatorFault: boolean;
    blackout: boolean;
    otherAlarms: Record<string, boolean>;
  };
}

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
   */
  async initialize(): Promise<void> {
    try {
      // Load WASM via our bridge that handles missing exports
      const bridge = await loadWasm();
      this.wasmBridge = bridge;

      // Create a vessel in WASM and store the pointer
      const vesselPtr = this.wasmBridge.createVessel();
      useStore.getState().setWasmVesselPtr(vesselPtr);

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
   * Stop the simulation loop
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      useStore.getState().setRunning(false);

      console.info('Simulation loop stopped');
    }
  }

  /**
   * Toggle pause state
   */
  togglePause(): void {
    const _state = useStore.getState();
    _state.togglePause();

    if (_state.simulation.paused) {
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
    if (this.wasmBridge) {
      const vesselPtr = this.wasmBridge.createVessel();
      useStore.getState().setWasmVesselPtr(vesselPtr);
    }

    console.info('Simulation reset');
  }

  /**
   * The main simulation loop
   */
  private loop(currentTime: number): void {
    // Calculate time delta
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // in seconds
    this.lastFrameTime = currentTime;

    const _state = useStore.getState();

    // Ensure state.simulation is properly initialized with default values if needed
    if (!_state.simulation) {
      console.error('Simulation state is null, reinitializing');
      _state.resetSimulation();
      return;
    }

    // Initialize elapsedTime if it's null
    if (
      _state.simulation.elapsedTime === null ||
      _state.simulation.elapsedTime === undefined
    ) {
      _state.incrementTime(0); // This will set elapsedTime to 0
    }

    // Only update if simulation is running and not paused
    if (_state.simulation.isRunning && !_state.simulation.paused) {
      // Scale delta time by time scale factor
      const scaledDeltaTime = deltaTime * (_state.simulation.timeScale || 1.0);
      this.accumulatedTime += scaledDeltaTime;

      // Run fixed timestep physics updates
      while (this.accumulatedTime >= this.fixedTimeStep) {
        this.updatePhysics(this.fixedTimeStep);
        this.accumulatedTime -= this.fixedTimeStep;
      }

      // Increment simulation time - ensure this is always called when running
      _state.incrementTime(scaledDeltaTime);

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
  private updatePhysics(deltaTime: number): void {
    if (!this.wasmBridge) return;

    const state = useStore.getState();
    const vesselPtr = state.wasmVesselPtr;

    if (vesselPtr === null) return;

    // Get environment state
    const { wind, current, seaState } = state.environment;

    // Ensure vessel.controls exists before accessing its properties
    if (!state.vessel.controls) {
      // Initialize controls with safe defaults if missing
      state.updateVessel({
        controls: {
          throttle: 0,
          rudderAngle: 0,
          ballast: 0.5,
          bowThruster: 0,
        },
      });
      return; // Skip this physics update until controls are available
    }

    // Get control inputs
    const { throttle, rudderAngle, ballast } = state.vessel.controls;

    // Update controls in WASM
    this.wasmBridge.setThrottle(vesselPtr, throttle);
    this.wasmBridge.setRudderAngle(vesselPtr, rudderAngle);
    this.wasmBridge.setBallast(vesselPtr, ballast);

    this.wasmBridge.updateVesselState(
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
      this.wasmBridge.setThrottle(vesselPtr, 0);
    }
    if (failures.rudderFailure) {
      // If rudder failure, add random drift to rudder
      const randomDrift = (Math.random() - 0.5) * 0.2;
      this.wasmBridge.setRudderAngle(vesselPtr, randomDrift);
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

    const _state = useStore.getState();
    const vesselPtr = _state.wasmVesselPtr;

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

    const _state = useStore.getState();
    const vesselPtr = _state.wasmVesselPtr;

    if (vesselPtr === null) return;

    try {
      // Get environment parameters
      const { seaState, wind } = _state.environment;

      // Get wave height from physics engine
      const waveHeight = this.wasmBridge.getWaveHeight(seaState);
      _state.updateEnvironment({ waveHeight });

      // Get wave properties from physics calculations
      const waveProps = this.wasmBridge.calculateWaveProperties(
        seaState,
        wind.speed,
        wind.direction,
      );

      if (waveProps && waveProps.length >= 4) {
        _state.updateEnvironment({
          waveHeight: waveProps[0],
          waveLength: waveProps[1],
          // Remove waveFrequency as it's not in the EnvironmentState type
          waveDirection: waveProps[3],
        });
      }

      // Get vessel-specific wave data
      const vesselWaveHeight = this.wasmBridge.getVesselWaveHeight(vesselPtr);
      const vesselWavePhase = this.wasmBridge.getVesselWavePhase(vesselPtr);

      // Update vessel wave data in store
      _state.updateVessel({
        position: {
          ..._state.vessel.position,
          waveHeight: vesselWaveHeight,
          wavePhase: vesselWavePhase,
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

    const _state = useStore.getState();
    const vesselPtr = _state.wasmVesselPtr;

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
        hours: _state.vessel.engineState.hours || 0, // Preserve engine hours
      };

      // Calculate load based on throttle and RPM
      if (engineUpdate.rpm > 0) {
        const maxRpm = 1200; // Maximum RPM
        const normalizedRPM = Math.min(engineUpdate.rpm / maxRpm, 1);

        // Calculate engine load based on RPM and current throttle setting
        const throttleValue = _state.vessel.controls?.throttle || 0;
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
        _state.updateVessel(vesselUpdate);
      }

      // Check for low fuel alarm - with null safety
      const engineState = vesselUpdate.engineState;
      if (
        engineState &&
        engineState.fuelLevel !== undefined &&
        engineState.fuelLevel < 0.1 &&
        !_state.vessel?.alarms?.lowFuel
      ) {
        _state.updateVessel({
          alarms: {
            ...(_state.vessel?.alarms || {}),
            lowFuel: true,
          },
        });

        // Add event to log
        _state.addEvent({
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
        !_state.vessel?.alarms?.stabilityWarning
      ) {
        _state.updateVessel({
          alarms: {
            ...(_state.vessel?.alarms || {}),
            stabilityWarning: true,
          },
        });

        // Add event to log
        _state.addEvent({
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
        _state.addEvent({
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
    const _state = useStore.getState();

    // Increment engine hours if running
    if (_state.vessel.engineState.running) {
      const hourIncrement = deltaTime / 3600; // convert seconds to hours
      _state.updateVessel({
        engineState: {
          ..._state.vessel.engineState,
          hours: _state.vessel.engineState.hours + hourIncrement,
        },
      });

      // Increase generator output when engine is running
      // Add null-safety check for state.vessel.controls
      if (_state.vessel.controls) {
        _state.updateVessel({
          electricalSystem: {
            ..._state.vessel.electricalSystem,
            generatorOutput: 200 * (_state.vessel.controls.throttle || 0),
          },
        });
      }
    }

    // Random failures based on engine hours or other conditions
    // This is a simplified model - real implementation would be more complex
    const engineHours = _state.vessel.engineState.hours;
    const machinerySystems = _state.machinerySystems;

    // Engine failure probability increases with engine hours
    if (engineHours > 100 && !machinerySystems.failures.engineFailure) {
      const failureChance = (engineHours - 100) / 10000; // Very small chance per update
      if (Math.random() < failureChance * deltaTime) {
        _state.triggerFailure('engineFailure', true);
      }
    }

    // Process weather events
    this.updateWeather(deltaTime);
  }

  /**
   * Update weather conditions dynamically
   */
  private updateWeather(deltaTime: number): void {
    const _state = useStore.getState();

    // Gradually change wind direction and speed
    const windVariation = (Math.random() - 0.5) * 0.1 * deltaTime;
    const windSpeedChange = (Math.random() - 0.5) * 0.2 * deltaTime;

    _state.updateEnvironment({
      wind: {
        ..._state.environment.wind,
        direction:
          (_state.environment.wind.direction + windVariation) % (2 * Math.PI),
        speed: Math.max(0, _state.environment.wind.speed + windSpeedChange),
      },
    });

    // Occasionally generate wind gusts
    if (Math.random() < 0.01 * deltaTime) {
      const gustDuration = 5 + Math.random() * 10; // 5-15 seconds
      const gustStrength =
        _state.environment.wind.speed *
        (_state.environment.wind.gustFactor - 1);

      _state.updateEnvironment({
        wind: {
          ..._state.environment.wind,
          gusting: true,
          speed: _state.environment.wind.speed + gustStrength,
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

  /**
   * Update vessel physics
   */
  private updateVesselPhysics(deltaTime: number): void {
    if (!this.wasmBridge) return;

    const _state = useStore.getState();
    const vesselPtr = _state.wasmVesselPtr;

    if (vesselPtr === null) return;

    // Apply physics update for vessel with current environment parameters
    this.updatePhysics(deltaTime);

    // Update UI state from physics calculations
    this.updateUIFromPhysics();
  }

  /**
   * Update environment physics
   */
  private updateEnvironmentPhysics(deltaTime: number): void {
    const _state = useStore.getState();

    // Update weather conditions
    this.updateWeather(deltaTime);

    // Process environmental events (failures, etc)
    this.processEvents(deltaTime);
  }

  /**
   * Update simulation state
   */
  public update(deltaTime: number): void {
    if (!this.wasmBridge) return;

    // Vessel physics update
    this.updateVesselPhysics(deltaTime);

    // Environment physics update
    this.updateEnvironmentPhysics(deltaTime);

    // Wave properties update (less frequent)
    this.updateWaveProperties();
  }
}

// Singleton export
export const getSimulationLoop = (): SimulationLoop => {
  if (!simulationInstance) {
    simulationInstance = new SimulationLoop();
  }
  return simulationInstance;
};
