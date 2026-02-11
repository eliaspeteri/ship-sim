import useStore from '../store';
import { loadWasm } from '../lib/wasmLoader';
import { WasmBridge } from '../lib/wasmBridge';
import type { VesselState } from '../types/vessel.types';
import type { DeepPartial } from '../types/utility';
import { safe } from '../lib/safe';
import socketManager from '../networking/socket';
import { positionFromXY, positionToXY } from '../lib/position';
import { clampRudderAngle, DEFAULT_HYDRO } from '../constants/vessel';
import { deriveWaveState } from '../lib/waves';
import {
  buildDisplacementParams,
  buildPhysicsPayload,
} from '../lib/physicsParams';

// Singleton for simulation instance
let simulationInstance: SimulationLoop | null = null;

const buildHydroParams = (vessel: VesselState) =>
  buildDisplacementParams(vessel);

export class SimulationLoop {
  private loopTestHooks: {
    updatePhysics?: (dt: number) => void;
    updateUIFromPhysics?: () => void;
  } = {};
  private wasmBridge: WasmBridge | null = null;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private accumulatedTime: number = 0;
  private readonly fixedTimeStep: number = 1 / 60; // Fixed physics step at 60Hz
  private static readonly perfLoggingEnabled =
    process.env.NEXT_PUBLIC_SIM_PERF_LOGS === 'true' ||
    process.env.NODE_ENV !== 'production';
  private static readonly perfLogIntervalMs = 5000;
  private static readonly perfAvgWarnMs = 20;
  private static readonly perfMaxWarnMs = 40;

  private lastStateUpdateTime = 0;
  private stabilityUpdateCounter = 0;
  private wavePropertiesUpdateCounter = 0;
  private replayUpdateCounter = 0;
  private lastBroadcastTime = 0;
  private readonly broadcastInterval = 0.2; // seconds (5 Hz)
  private stopped = false;
  // Perf tracking
  private frameCounter = 0;
  private accumulatedFrameMs = 0;
  private maxFrameMs = 0;
  private lastPerfLogMs = 0;

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
      if (state.mode === 'spectator' || !state.currentVesselId) {
        state.setWasmVesselPtr(null);
        return;
      }
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
      const { x: initialX, y: initialY } = positionToXY({
        lat: position.lat,
        lon: position.lon,
      });
      const isRestoring = !!(
        initialX ||
        initialY ||
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
      const blockCoeff = Number.isFinite(properties.blockCoefficient)
        ? properties.blockCoefficient
        : 0.8;
      const hydro = buildHydroParams(vessel);
      const vesselPtr = this.wasmBridge.createVessel(
        safe(initialX, 0),
        safe(initialY, 0),
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
        clampRudderAngle(safe(controls.rudderAngle, 0)),
        safe(properties.mass, 14950000),
        safe(properties.length, 212),
        safe(properties.beam, 28),
        safe(properties.draft, 9.1),
        blockCoeff,
        hydro.rudderForceCoefficient,
        hydro.rudderStallAngle,
        hydro.rudderMaxAngle,
        hydro.dragCoefficient,
        hydro.yawDamping,
        hydro.yawDampingQuad,
        hydro.swayDamping,
        hydro.maxThrust,
        hydro.maxSpeed,
        hydro.rollDamping,
        hydro.pitchDamping,
        hydro.heaveStiffness,
        hydro.heaveDamping,
      );
      this.applyPhysicsParams(vesselPtr, vessel);
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
          position: positionFromXY({ x, y, z }),
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

  private applyPhysicsParams(vesselPtr: number, vessel: VesselState): void {
    if (!this.wasmBridge) return;
    const payload = buildPhysicsPayload(vessel);
    this.wasmBridge.setVesselParams(vesselPtr, payload.modelId, payload.params);
  }

  public refreshPhysicsParams(): void {
    if (!this.wasmBridge) return;
    const state = useStore.getState();
    if (!state.wasmVesselPtr) return;
    this.applyPhysicsParams(state.wasmVesselPtr, state.vessel);
  }

  /**
   * The main simulation loop
   */
  private loop(currentTime: number): void {
    // Calculate time delta
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // in seconds
    this.lastFrameTime = currentTime;
    if (SimulationLoop.perfLoggingEnabled) {
      const deltaMs = deltaTime * 1000;
      this.frameCounter += 1;
      this.accumulatedFrameMs += deltaMs;
      if (deltaMs > this.maxFrameMs) {
        this.maxFrameMs = deltaMs;
      }
    }

    this.accumulatedTime += deltaTime;

    while (this.accumulatedTime >= this.fixedTimeStep) {
      if (this.loopTestHooks.updatePhysics) {
        this.loopTestHooks.updatePhysics(this.fixedTimeStep);
      } else {
        this.updatePhysics(this.fixedTimeStep);
      }
      this.accumulatedTime -= this.fixedTimeStep;
    }

    // Update UI state from physics state
    if (this.loopTestHooks.updateUIFromPhysics) {
      this.loopTestHooks.updateUIFromPhysics();
    } else {
      this.updateUIFromPhysics();
    }

    // Perf budget log every interval in dev/preprod
    if (
      SimulationLoop.perfLoggingEnabled &&
      currentTime - this.lastPerfLogMs > SimulationLoop.perfLogIntervalMs
    ) {
      const avgMs =
        this.frameCounter > 0 ? this.accumulatedFrameMs / this.frameCounter : 0;
      if (
        avgMs > SimulationLoop.perfAvgWarnMs ||
        this.maxFrameMs > SimulationLoop.perfMaxWarnMs
      ) {
        console.warn(
          `Simulation loop over budget: avg ${avgMs.toFixed(2)}ms, max ${this.maxFrameMs.toFixed(2)}ms`,
        );
        socketManager.sendClientLog({
          level: 'warn',
          source: 'sim-loop',
          message: 'Simulation loop over budget',
          meta: { avgMs, maxMs: this.maxFrameMs },
        });
      } else {
        console.info(
          `Simulation loop timing: avg ${avgMs.toFixed(2)}ms, max ${this.maxFrameMs.toFixed(2)}ms`,
        );
      }
      this.lastPerfLogMs = currentTime;
      this.frameCounter = 0;
      this.accumulatedFrameMs = 0;
      this.maxFrameMs = 0;
    }

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

  // Test seams for replacing brittle private-state poking in unit tests.
  public setWasmBridgeForTest(bridge: WasmBridge | null): void {
    this.wasmBridge = bridge;
  }

  public updatePhysicsForTest(dt: number): void {
    this.updatePhysics(dt);
  }

  public updateUIFromPhysicsForTest(): void {
    this.updateUIFromPhysics();
  }

  public setAnimationFrameIdForTest(id: number | null): void {
    this.animationFrameId = id;
  }

  public setStoppedForTest(stopped: boolean): void {
    this.stopped = stopped;
  }

  public setPerfTimingForTest(params: {
    lastFrameTime?: number;
    lastPerfLogMs?: number;
  }): void {
    if (params.lastFrameTime !== undefined) {
      this.lastFrameTime = params.lastFrameTime;
    }
    if (params.lastPerfLogMs !== undefined) {
      this.lastPerfLogMs = params.lastPerfLogMs;
    }
  }

  public setLoopTestHooks(hooks: {
    updatePhysics?: (dt: number) => void;
    updateUIFromPhysics?: () => void;
  }): void {
    this.loopTestHooks = hooks;
  }

  public loopForTest(currentTime: number): void {
    this.loop(currentTime);
  }

  /**
   * Update physics state using WASM module
   */
  private updatePhysics(dt: number): void {
    const state = useStore.getState();
    if (!state || !this.wasmBridge || !state.wasmVesselPtr) return;
    if (state.mode === 'spectator') return;

    const { wind, current } = state.environment;
    const prevVesselPos = state.vessel.position;
    const prevXY = positionToXY({
      lat: prevVesselPos.lat,
      lon: prevVesselPos.lon,
    });

    const waveState = deriveWaveState(state.environment, {
      fallbackDirection: wind.direction,
    });
    if (this.wavePropertiesUpdateCounter++ % 30 === 0) {
      state.updateEnvironment({
        waveHeight: waveState.amplitude * 2,
        waveDirection: waveState.direction,
        waveLength: waveState.wavelength,
        waveSteepness: waveState.steepness,
      });
    }
    const waterDepth = Number.isFinite(state.vessel.waterDepth)
      ? (state.vessel.waterDepth as number)
      : (state.environment.waterDepth ?? 0);
    this.wasmBridge.setEnvironment([
      wind.speed,
      wind.direction,
      current.speed,
      current.direction,
      waveState.amplitude * 2,
      waveState.wavelength,
      waveState.direction,
      waveState.steepness,
      waterDepth,
    ]);

    try {
      // Update vessel state in WASM - store the updated pointer in case it changes
      const updatedVesselPtr = this.wasmBridge.updateVesselState(
        state.wasmVesselPtr,
        dt,
        wind.speed,
        wind.direction,
        current.speed,
        current.direction,
        waveState.amplitude * 2,
        waveState.wavelength,
        waveState.direction,
        waveState.steepness,
      );

      // Read vessel data from WASM
      const x = this.wasmBridge.getVesselX(updatedVesselPtr);
      const y = this.wasmBridge.getVesselY(updatedVesselPtr);
      const z = this.wasmBridge.getVesselZ(updatedVesselPtr);
      const heading = this.wasmBridge.getVesselHeading(updatedVesselPtr);
      const roll = this.wasmBridge.getVesselRollAngle(updatedVesselPtr);
      const pitch = this.wasmBridge.getVesselPitchAngle(updatedVesselPtr);

      // Check for NaN values - use previous or default values if needed
      const positionUpdate = positionFromXY({
        x: isNaN(x) ? prevXY.x : x,
        y: isNaN(y) ? prevXY.y : y,
        z: isNaN(z) ? prevVesselPos?.z || 0 : z,
      });

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
   * @param controls.rudderAngle - Rudder angle in radians
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
        const maxAngle =
          state.vessel.hydrodynamics?.rudderMaxAngle ??
          DEFAULT_HYDRO.rudderMaxAngle;
        const clamped = Math.max(
          -maxAngle,
          Math.min(maxAngle, controls.rudderAngle),
        );
        this.wasmBridge.setRudderAngle(vesselPtr, clamped);
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
   * Teleport the local vessel to a new position and reset motion.
   */
  teleportVessel(position: { x: number; y: number; z?: number }): void {
    if (!this.wasmBridge) return;

    const state = useStore.getState();
    const { vessel } = state;
    const nextZ = position.z ?? vessel.position.z ?? 0;
    const blockCoeff = Number.isFinite(vessel.properties.blockCoefficient)
      ? vessel.properties.blockCoefficient
      : 0.8;
    const hydro = buildHydroParams(vessel);
    const nextPtr = this.wasmBridge.createVessel(
      safe(position.x, 0),
      safe(position.y, 0),
      safe(nextZ, 0),
      safe(vessel.orientation.heading, 0),
      safe(vessel.orientation.roll, 0),
      safe(vessel.orientation.pitch, 0),
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      clampRudderAngle(0),
      safe(vessel.properties.mass, 14950000),
      safe(vessel.properties.length, 212),
      safe(vessel.properties.beam, 28),
      safe(vessel.properties.draft, 9.1),
      blockCoeff,
      hydro.rudderForceCoefficient,
      hydro.rudderStallAngle,
      hydro.rudderMaxAngle,
      hydro.dragCoefficient,
      hydro.yawDamping,
      hydro.yawDampingQuad,
      hydro.swayDamping,
      hydro.maxThrust,
      hydro.maxSpeed,
      hydro.rollDamping,
      hydro.pitchDamping,
      hydro.heaveStiffness,
      hydro.heaveDamping,
    );
    this.applyPhysicsParams(nextPtr, vessel);

    if (state.wasmVesselPtr) {
      this.wasmBridge.destroyVessel(state.wasmVesselPtr);
    }
    state.setWasmVesselPtr(nextPtr);
    state.updateVessel({
      position: positionFromXY({ x: position.x, y: position.y, z: nextZ }),
      velocity: { surge: 0, sway: 0, heave: 0 },
      angularVelocity: { yaw: 0, roll: 0, pitch: 0 },
      controls: {
        throttle: 0,
        rudderAngle: 0,
        ballast: vessel.controls.ballast ?? 0.5,
        bowThruster: 0,
      },
    });
  }

  /**
   * Recreate the local WASM vessel from the current store state.
   * Used when switching from spectator to player to avoid stale positions.
   */
  syncVesselFromStore(): void {
    if (!this.wasmBridge) return;
    const state = useStore.getState();
    const { vessel } = state;
    const { x, y } = positionToXY({
      lat: vessel.position.lat,
      lon: vessel.position.lon,
    });
    const blockCoeff = Number.isFinite(vessel.properties.blockCoefficient)
      ? vessel.properties.blockCoefficient
      : 0.8;
    const hydro = buildHydroParams(vessel);
    const nextPtr = this.wasmBridge.createVessel(
      safe(x, 0),
      safe(y, 0),
      safe(vessel.position.z, 0),
      safe(vessel.orientation.heading, 0),
      safe(vessel.orientation.roll, 0),
      safe(vessel.orientation.pitch, 0),
      safe(vessel.velocity.surge, 0),
      safe(vessel.velocity.sway, 0),
      safe(vessel.velocity.heave, 0),
      safe(vessel.angularVelocity.yaw, 0),
      safe(vessel.angularVelocity.roll, 0),
      safe(vessel.angularVelocity.pitch, 0),
      safe(vessel.controls.throttle, 0),
      clampRudderAngle(safe(vessel.controls.rudderAngle, 0)),
      safe(vessel.properties.mass, 14950000),
      safe(vessel.properties.length, 212),
      safe(vessel.properties.beam, 28),
      safe(vessel.properties.draft, 9.1),
      blockCoeff,
      hydro.rudderForceCoefficient,
      hydro.rudderStallAngle,
      hydro.rudderMaxAngle,
      hydro.dragCoefficient,
      hydro.yawDamping,
      hydro.yawDampingQuad,
      hydro.swayDamping,
      hydro.maxThrust,
      hydro.maxSpeed,
      hydro.rollDamping,
      hydro.pitchDamping,
      hydro.heaveStiffness,
      hydro.heaveDamping,
    );
    this.applyPhysicsParams(nextPtr, vessel);
    if (state.wasmVesselPtr) {
      this.wasmBridge.destroyVessel(state.wasmVesselPtr);
    }
    state.setWasmVesselPtr(nextPtr);
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
    if (state.mode === 'spectator') return;
    const vesselPtr = state.wasmVesselPtr;

    if (vesselPtr === null) return;

    try {
      // Initialize update object with proper typing
      const vesselUpdate: DeepPartial<VesselState> = {};

      // Position and orientation updates
      const positionUpdate = positionFromXY({
        x: this.wasmBridge.getVesselX(vesselPtr),
        y: this.wasmBridge.getVesselY(vesselPtr),
        z: this.wasmBridge.getVesselZ(vesselPtr),
      });
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

      if (this.stabilityUpdateCounter++ % 20 === 0) {
        const gm = this.wasmBridge.getVesselGM(vesselPtr);
        const cgY = this.wasmBridge.getVesselCenterOfGravityY(vesselPtr);
        vesselUpdate.stability = {
          ...state.vessel.stability,
          metacentricHeight: Number.isFinite(gm)
            ? gm
            : state.vessel.stability.metacentricHeight,
          centerOfGravity: {
            ...state.vessel.stability.centerOfGravity,
            y: Number.isFinite(cgY)
              ? cgY
              : state.vessel.stability.centerOfGravity.y,
          },
          trim: ((orientationUpdate.pitch ?? 0) * 180) / Math.PI,
          list: ((orientationUpdate.roll ?? 0) * 180) / Math.PI,
        };
      }

      const waterDepth = state.vessel.waterDepth;
      const draft = state.vessel.properties?.draft ?? 0;
      if (
        Number.isFinite(waterDepth) &&
        Number.isFinite(draft) &&
        (waterDepth as number) <= draft + 0.1
      ) {
        vesselUpdate.velocity = { surge: 0, sway: 0, heave: 0 };
        vesselUpdate.controls = {
          ...state.vessel.controls,
          throttle: 0,
          rudderAngle: 0,
        };
        const otherAlarms = state.vessel.alarms?.otherAlarms || {};
        if (!otherAlarms.grounding) {
          vesselUpdate.alarms = {
            ...state.vessel.alarms,
            collisionAlert: true,
            otherAlarms: { ...otherAlarms, grounding: true },
          };
          state.addEvent({
            category: 'alarm',
            type: 'grounding',
            message: 'Grounding detected: keel exceeds local depth',
            severity: 'critical',
          });
        }
      }

      // Only update the store if we have something to update
      if (Object.keys(vesselUpdate).length > 0) {
        // Update the store with the collected values
        state.updateVessel(vesselUpdate);
      }

      if (state.replay.recording && positionUpdate && orientationUpdate) {
        if (this.replayUpdateCounter++ % 3 === 0) {
          state.addReplayFrame({
            timestamp: Date.now(),
            position: {
              x: positionUpdate.x ?? 0,
              y: positionUpdate.y ?? 0,
              z: positionUpdate.z ?? 0,
              lat: positionUpdate.lat ?? 0,
              lon: positionUpdate.lon ?? 0,
            },
            orientation: {
              heading: orientationUpdate.heading ?? 0,
              roll: orientationUpdate.roll ?? 0,
              pitch: orientationUpdate.pitch ?? 0,
            },
          });
        }
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
      if (nowSeconds - this.lastBroadcastTime >= this.broadcastInterval) {
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
