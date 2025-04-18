import { create } from 'zustand';

// Vessel state interface
interface VesselState {
  position: { x: number; y: number; z: number };
  orientation: { heading: number; roll: number; pitch: number };
  velocity: { surge: number; sway: number; heave: number };
  angularVelocity: { yaw: number; roll: number; pitch: number };
  controls: {
    throttle: number;
    rudderAngle: number;
    ballast?: number; // 0.0-1.0 ballast level
  };
  properties: {
    mass: number;
    length: number;
    beam: number;
    draft: number;
    blockCoefficient?: number;
  };
  // Engine state information with required fields (no optional fields)
  engineState: {
    rpm: number;
    fuelLevel: number; // 0.0-1.0
    fuelConsumption: number; // kg/h
  };
  // Stability information with required fields
  stability: {
    metacentricHeight: number; // GM value
    centerOfGravity: { x: number; y: number; z: number };
  };
}

// Environment state interface
interface EnvironmentState {
  wind: { speed: number; direction: number };
  current: { speed: number; direction: number };
  seaState: number; // Beaufort scale (0-12)
  waterDepth: number;
}

// Simulation control interface
interface SimulationControl {
  isRunning: boolean;
  timeScale: number;
  elapsedTime: number;
}

// Complete simulation state
interface SimulationState {
  // Vessel state
  vessel: VesselState;
  updateVessel: (vessel: Partial<VesselState>) => void;

  // Environment state
  environment: EnvironmentState;
  updateEnvironment: (environment: Partial<EnvironmentState>) => void;

  // Simulation control
  simulation: SimulationControl;
  setRunning: (running: boolean) => void;
  setTimeScale: (scale: number) => void;
  incrementTime: (deltaTime: number) => void;

  // WASM pointer (used for communication with physics engine)
  wasmVesselPtr: number | null;
  setWasmVesselPtr: (ptr: number | null) => void;
}

const defaultVesselState: VesselState = {
  position: { x: 0, y: 0, z: 0 },
  orientation: { heading: 0, roll: 0, pitch: 0 },
  velocity: { surge: 0, sway: 0, heave: 0 },
  angularVelocity: { yaw: 0, roll: 0, pitch: 0 },
  controls: {
    throttle: 0,
    rudderAngle: 0,
    ballast: 0.5,
  },
  properties: {
    mass: 50000,
    length: 50,
    beam: 10,
    draft: 3,
    blockCoefficient: 0.8,
  },
  engineState: {
    rpm: 0,
    fuelLevel: 1.0,
    fuelConsumption: 0,
  },
  stability: {
    metacentricHeight: 2.0,
    centerOfGravity: { x: 0, y: 0, z: 1.5 },
  },
};

const defaultEnvironmentState: EnvironmentState = {
  wind: { speed: 5, direction: 0 }, // 5 m/s from North
  current: { speed: 0.5, direction: Math.PI / 4 }, // 0.5 m/s from NE
  seaState: 3, // Slight sea
  waterDepth: 100, // 100m deep
};

const defaultSimulationControl: SimulationControl = {
  isRunning: false,
  timeScale: 1.0,
  elapsedTime: 0,
};

const useStore = create<SimulationState>(set => ({
  // Initialize vessel state
  vessel: defaultVesselState,
  updateVessel: vesselUpdate =>
    set(state => ({
      vessel: {
        ...state.vessel,
        ...vesselUpdate,
        controls: {
          ...state.vessel.controls,
          ...(vesselUpdate.controls || {}),
        },
        position: {
          ...state.vessel.position,
          ...(vesselUpdate.position || {}),
        },
        orientation: {
          ...state.vessel.orientation,
          ...(vesselUpdate.orientation || {}),
        },
        velocity: {
          ...state.vessel.velocity,
          ...(vesselUpdate.velocity || {}),
        },
        angularVelocity: {
          ...state.vessel.angularVelocity,
          ...(vesselUpdate.angularVelocity || {}),
        },
        properties: {
          ...state.vessel.properties,
          ...(vesselUpdate.properties || {}),
        },
        engineState: vesselUpdate.engineState
          ? {
              ...state.vessel.engineState,
              ...vesselUpdate.engineState,
            }
          : state.vessel.engineState,
        stability: vesselUpdate.stability
          ? {
              ...state.vessel.stability,
              ...vesselUpdate.stability,
              centerOfGravity: vesselUpdate.stability.centerOfGravity
                ? {
                    ...state.vessel.stability.centerOfGravity,
                    ...vesselUpdate.stability.centerOfGravity,
                  }
                : state.vessel.stability.centerOfGravity,
            }
          : state.vessel.stability,
      },
    })),

  // Initialize environment state
  environment: defaultEnvironmentState,
  updateEnvironment: environmentUpdate =>
    set(state => ({
      environment: {
        ...state.environment,
        ...environmentUpdate,
        wind: { ...state.environment.wind, ...(environmentUpdate.wind || {}) },
        current: {
          ...state.environment.current,
          ...(environmentUpdate.current || {}),
        },
      },
    })),

  // Initialize simulation control
  simulation: defaultSimulationControl,
  setRunning: running =>
    set(state => ({
      simulation: { ...state.simulation, isRunning: running },
    })),
  setTimeScale: scale =>
    set(state => ({
      simulation: { ...state.simulation, timeScale: scale },
    })),
  incrementTime: deltaTime =>
    set(state => ({
      simulation: {
        ...state.simulation,
        elapsedTime: state.simulation.elapsedTime + deltaTime,
      },
    })),

  // WASM vessel pointer
  wasmVesselPtr: null,
  setWasmVesselPtr: ptr => set({ wasmVesselPtr: ptr }),
}));

export default useStore;
