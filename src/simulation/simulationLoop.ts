import useStore from '../store';
import { loadWasm } from '../lib/wasmLoader';
import { WasmBridge } from '../lib/wasmBridge';
import { VesselState } from '../types/vessel.types';
import { safe } from '../lib/safe';
import socketManager from '../networking/socket';

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
  private lastBroadcastTime = 0;
  private readonly broadcastInterval = 0.2; // seconds (5 Hz)
  private stopped = false;

  constructor() {
    if (simulationInstance) {
      console.info(
        'SimulationLoop instance already exists, returning existing instance.',
      );

      return simulationInstance;
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    simulationInstance = this;
  }

  /**
   * Initialize the simulation with WASM exports
   * Ensures vessel pointer and initial position are set in the store.
   */
  public async initialize(): Promise<void> {
    try {
      console.info('Initializing simulation with WASM module...');
      // Load WASM via our bridge that handles missing exports
      const bridge = await loadWasm();
      this.wasmBridge = bridge;
      const state = useStore.getState();
      const { vessel } = state;
      const {
        position,
        orientation,
        velocity,
        controls,
        angularVelocity,
        properties,
      } = vessel;
      // Ensure vessel is created at rest unless restoring a running state
      const initialSurge = safe(velocity.surge, 0);
      const initialSway = safe(velocity.sway, 0);
      const initialHeave = safe(velocity.heave, 0);
      const initialThrottle = safe(controls.throttle, 0);
      // If not restoring from a running state, force all to zero
      const isRestoring = !!(
        position?.x ||
        position?.y ||
        position?.z ||
        initialSurge ||
        initialSway ||
        initialHeave ||
        initialThrottle
      );
      const surge = isRestoring ? initialSurge : 0;
      const sway = isRestoring ? initialSway : 0;
      const heave = isRestoring ? initialHeave : 0;
      const throttle = isRestoring ? initialThrottle : 0;
      const vesselPtr = this.wasmBridge.createVessel(
        safe(position.x, 0),
        safe(position.y, 0),
        safe(position.z, 0),
        safe(orientation.heading, 0),
        safe(orientation.roll, 0),
        safe(orientation.pitch, 0),
        surge,
        sway,
        heave,
        safe(angularVelocity.yaw, 0),
        safe(angularVelocity.roll, 0),
        safe(angularVelocity.pitch, 0),
        throttle,
        safe(controls.rudderAngle, 0),
        safe(properties.mass, 14950000),
        safe(properties.length, 212),
        safe(properties.beam, 28),
        safe(properties.draft, 9.1),
      );
      state.setWasmVesselPtr(vesselPtr);

      // Immediately read vessel position and verify it's valid
      if (vesselPtr && this.wasmBridge) {
        const x = this.wasmBridge.getVesselX(vesselPtr);
        const y = this.wasmBridge.getVesselY(vesselPtr);
        const z = this.wasmBridge.getVesselZ(vesselPtr);
        const roll = this.wasmBridge.getVesselRollAngle(vesselPtr);
        const pitch = this.wasmBridge.getVesselPitchAngle(vesselPtr);
        const surge = this.wasmBridge.getVesselSurgeVelocity(vesselPtr);
        const sway = this.wasmBridge.getVesselSwayVelocity(vesselPtr);
        const heave = this.wasmBridge.getVesselHeaveVelocity(vesselPtr);
        // Update store with initial state (no advanced stability checks)
        state.updateVessel({
          orientation: { roll, pitch, heading: 0 },
          velocity: { sway, heave, surge },
          position: { x, y, z },
        });
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
  public start(): void {
    if (this.animationFrameId !== null) {
      return; // Already running
    }

    this.stopped = false;
    this.lastFrameTime = performance.now();

    // Using an arrow function instead of bind(this)
    this.animationFrameId = requestAnimationFrame(time => this.loop(time));

    console.info('Simulation loop started');
  }

  /**
   * The main simulation loop
   */
  private loop(currentTime: number): void {
    // Calculate time delta
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // in seconds
    this.lastFrameTime = currentTime;

    this.accumulatedTime += deltaTime;

    while (this.accumulatedTime >= this.fixedTimeStep) {
      this.updatePhysics(this.fixedTimeStep);
      this.accumulatedTime -= this.fixedTimeStep;
    }

    // Update UI state from physics state
    this.updateUIFromPhysics();

    // Continue the loop using arrow function
    if (!this.stopped) {
      this.animationFrameId = requestAnimationFrame(time => this.loop(time));
    }
  }

  /**
   * Stop the simulation loop (used for spectator mode or teardown)
   */
  public stop(): void {
    this.stopped = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
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
    state.updateEnvironment({ seaState: calculatedSeaState });

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
        throw new Error('NaN position values from physics engine');
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
    if (state.mode === 'spectator') return;

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
        surge: this.wasmBridge.getVesselSurgeVelocity(vesselPtr),
        sway: this.wasmBridge.getVesselSwayVelocity(vesselPtr),
        heave: this.wasmBridge.getVesselHeaveVelocity(vesselPtr),
      };

      // Add angular velocity (roll, pitch, yaw)
      vesselUpdate.angularVelocity = {
        roll: this.wasmBridge.getVesselRollRate(vesselPtr),
        pitch: this.wasmBridge.getVesselPitchRate(vesselPtr),
        yaw: this.wasmBridge.getVesselYawRate(vesselPtr),
      };

      // Update engine state from WASM after each step
      const engineUpdate = {
        rpm: this.wasmBridge.getVesselEngineRPM(vesselPtr),
        fuelLevel: this.wasmBridge.getVesselFuelLevel(vesselPtr),
        fuelConsumption: this.wasmBridge.getVesselFuelConsumption(vesselPtr),
        temperature: 25,
        oilPressure: 5.0,
        load: 0,
        running: false,
        hours: state.vessel.engineState.hours || 0,
      };

      vesselUpdate.engineState = engineUpdate;

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

      // Throttled broadcast of local vessel state to server
      const nowSeconds = performance.now() / 1000;
      if (
        nowSeconds - this.lastBroadcastTime >= this.broadcastInterval &&
        state.mode !== 'spectator'
      ) {
        socketManager.sendVesselUpdate();
        this.lastBroadcastTime = nowSeconds;
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
}

// Singleton export
export const getSimulationLoop = (): SimulationLoop => {
  if (!simulationInstance) {
    simulationInstance = new SimulationLoop();
  }
  return simulationInstance;
};
