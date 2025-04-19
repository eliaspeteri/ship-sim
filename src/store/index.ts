import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSimulationLoop } from '../simulation/simulationLoop';

// Ship type enumeration
export enum ShipType {
  CONTAINER = 'CONTAINER',
  TANKER = 'TANKER',
  CARGO = 'CARGO',
  DEFAULT = 'DEFAULT',
}

// Vessel state interface
interface VesselState {
  // Basic position and orientation
  position: { x: number; y: number; z: number };
  orientation: { heading: number; roll: number; pitch: number };
  velocity: { surge: number; sway: number; heave: number };
  angularVelocity: { yaw: number; roll: number; pitch: number };

  // Controls
  controls: {
    throttle: number;
    rudderAngle: number;
    ballast: number; // 0.0-1.0 ballast level
    bowThruster?: number; // -1.0 to 1.0
  };

  // Vessel properties
  properties: {
    name: string;
    type: ShipType;
    mass: number;
    length: number;
    beam: number;
    draft: number;
    blockCoefficient: number;
    maxSpeed: number; // Maximum speed in knots
  };

  // Engine state information
  engineState: {
    rpm: number;
    fuelLevel: number; // 0.0-1.0
    fuelConsumption: number; // kg/h
    temperature: number; // Engine temperature in °C
    oilPressure: number; // Oil pressure in bar
    load: number; // Engine load 0.0-1.0
    running: boolean; // Is engine running?
    hours: number; // Runtime hours
  };

  // Electrical system
  electricalSystem: {
    mainBusVoltage: number; // Volts
    generatorOutput: number; // kW
    batteryLevel: number; // 0.0-1.0
    powerConsumption: number; // kW
    generatorRunning: boolean;
  };

  // Stability information
  stability: {
    metacentricHeight: number; // GM value
    centerOfGravity: { x: number; y: number; z: number };
    trim: number; // Trim in degrees
    list: number; // List in degrees
  };

  // Alarms and status
  alarms: {
    engineOverheat: boolean;
    lowOilPressure: boolean;
    lowFuel: boolean;
    fireDetected: boolean;
    collisionAlert: boolean;
    stabilityWarning: boolean; // GM below safe threshold
    generatorFault: boolean;
    blackout: boolean;
    otherAlarms: Record<string, boolean>; // For additional alarm types
  };
}

// Environment state interface with enhanced weather
interface EnvironmentState {
  // Weather conditions
  wind: {
    speed: number; // m/s
    direction: number; // Radians
    gusting: boolean;
    gustFactor: number; // Multiplier for gusts
  };

  current: {
    speed: number; // m/s
    direction: number; // Radians
    variability: number; // How much current varies 0-1
  };

  // Sea conditions
  seaState: number; // Beaufort scale (0-12)
  waterDepth: number; // Meters
  waveHeight: number; // Meters
  waveDirection: number; // Radians
  waveLength: number; // Meters

  // Visibility and time
  visibility: number; // Nautical miles
  timeOfDay: number; // 0-24 hours
  precipitation: 'none' | 'rain' | 'snow' | 'fog';
  precipitationIntensity: number; // 0-1
}

// Event system for logging and scenarios
interface EventLogEntry {
  id: string;
  timestamp: number; // Simulation time
  category:
    | 'navigation'
    | 'engine'
    | 'alarm'
    | 'environmental'
    | 'system'
    | 'crew';
  type: string; // Specific event type
  message: string;
  severity: 'info' | 'warning' | 'critical';
  data?: Record<string, any>; // Additional event data
}

// Simulation control with enhanced features
interface SimulationControl {
  isRunning: boolean;
  timeScale: number;
  elapsedTime: number; // Simulation time in seconds
  realStartTime: number; // Real world timestamp when sim started
  paused: boolean;
  scenarioId: string | null;
  scenarioName: string | null;
  debugMode: boolean;
}

// Machinery failures for more realistic simulation
interface MachinerySystemStatus {
  // Engine health
  engineHealth: number; // 0-1, affects performance
  propulsionEfficiency: number; // 0-1
  electricalSystemHealth: number; // 0-1
  steeringSystemHealth: number; // 0-1

  // Failures
  failures: {
    engineFailure: boolean;
    propellerDamage: boolean;
    rudderFailure: boolean;
    electricalFailure: boolean;
    pumpFailure: boolean;
  };
}

// Navigation data
interface NavigationData {
  route: {
    waypoints: { x: number; y: number; name: string }[];
    currentWaypoint: number;
  };
  charts: {
    visible: boolean;
    scale: number;
  };
  navigationMode: 'manual' | 'autopilot';
  autopilotHeading: number | null;
}

// Complete simulation state with new system
interface SimulationState {
  // Vessel state
  vessel: VesselState;
  updateVessel: (vessel: Partial<VesselState>) => void;
  setVesselName: (name: string) => void;
  setVesselType: (type: ShipType) => void;

  // Environment state
  environment: EnvironmentState;
  updateEnvironment: (environment: Partial<EnvironmentState>) => void;
  setDayNightCycle: (enabled: boolean) => void;

  // Simulation control
  simulation: SimulationControl;
  setRunning: (running: boolean) => void;
  setTimeScale: (scale: number) => void;
  incrementTime: (deltaTime: number) => void;
  togglePause: () => void;
  resetSimulation: () => void;

  // Event log
  eventLog: EventLogEntry[];
  addEvent: (event: Omit<EventLogEntry, 'id' | 'timestamp'>) => void;
  clearEventLog: () => void;

  // Machinery systems
  machinerySystems: MachinerySystemStatus;
  updateMachineryStatus: (status: Partial<MachinerySystemStatus>) => void;
  triggerFailure: (
    failureType: keyof MachinerySystemStatus['failures'],
    active: boolean,
  ) => void;

  // Navigation
  navigation: NavigationData;
  updateNavigation: (nav: Partial<NavigationData>) => void;
  addWaypoint: (x: number, y: number, name: string) => void;
  removeWaypoint: (index: number) => void;

  // WASM pointer (used for communication with physics engine)
  wasmVesselPtr: number | null;
  setWasmVesselPtr: (ptr: number | null) => void;

  // Apply vessel controls
  applyVesselControls: (controls: {
    throttle?: number;
    rudderAngle?: number;
    ballast?: number;
    bowThruster?: number;
  }) => void;
}

// Default states

const defaultVesselState: VesselState = {
  position: { x: 0, y: 0, z: 0 },
  orientation: { heading: 0, roll: 0, pitch: 0 },
  velocity: { surge: 0, sway: 0, heave: 0 },
  angularVelocity: { yaw: 0, roll: 0, pitch: 0 },
  controls: {
    throttle: 0,
    rudderAngle: 0,
    ballast: 0.5,
    bowThruster: 0,
  },
  properties: {
    name: 'MV Explorer',
    type: ShipType.CONTAINER,
    mass: 50000,
    length: 200,
    beam: 32,
    draft: 12,
    blockCoefficient: 0.8,
    maxSpeed: 25,
  },
  engineState: {
    rpm: 0,
    fuelLevel: 1.0,
    fuelConsumption: 0,
    temperature: 25,
    oilPressure: 5.0,
    load: 0,
    running: false,
    hours: 0,
  },
  electricalSystem: {
    mainBusVoltage: 440,
    generatorOutput: 0,
    batteryLevel: 1.0,
    powerConsumption: 50,
    generatorRunning: true,
  },
  stability: {
    metacentricHeight: 2.0,
    centerOfGravity: { x: 0, y: 0, z: 6.0 },
    trim: 0,
    list: 0,
  },
  alarms: {
    engineOverheat: false,
    lowOilPressure: false,
    lowFuel: false,
    fireDetected: false,
    collisionAlert: false,
    stabilityWarning: false,
    generatorFault: false,
    blackout: false,
    otherAlarms: {},
  },
};

const defaultEnvironmentState: EnvironmentState = {
  wind: {
    speed: 5,
    direction: 0,
    gusting: false,
    gustFactor: 1.5,
  },
  current: {
    speed: 0.5,
    direction: Math.PI / 4,
    variability: 0.1,
  },
  seaState: 3,
  waterDepth: 100,
  waveHeight: 0.5,
  waveDirection: 0,
  waveLength: 50,
  visibility: 10,
  timeOfDay: 12,
  precipitation: 'none',
  precipitationIntensity: 0,
};

const defaultSimulationControl: SimulationControl = {
  isRunning: false,
  timeScale: 1.0,
  elapsedTime: 0,
  realStartTime: Date.now(),
  paused: false,
  scenarioId: null,
  scenarioName: null,
  debugMode: false,
};

const defaultMachinerySystemStatus: MachinerySystemStatus = {
  engineHealth: 1.0,
  propulsionEfficiency: 1.0,
  electricalSystemHealth: 1.0,
  steeringSystemHealth: 1.0,
  failures: {
    engineFailure: false,
    propellerDamage: false,
    rudderFailure: false,
    electricalFailure: false,
    pumpFailure: false,
  },
};

const defaultNavigationData: NavigationData = {
  route: {
    waypoints: [],
    currentWaypoint: -1,
  },
  charts: {
    visible: true,
    scale: 1.0,
  },
  navigationMode: 'manual',
  autopilotHeading: null,
};

// Create the Zustand store with persistence
const useStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      // Vessel state
      vessel: defaultVesselState,
      updateVessel: vesselUpdate =>
        set(state => {
          try {
            // Create a shallow copy of the current vessel state
            const updatedVessel = { ...state.vessel };

            // Handle top-level properties first
            if (vesselUpdate.position) {
              updatedVessel.position = {
                ...updatedVessel.position,
                ...vesselUpdate.position,
              };
            }

            if (vesselUpdate.orientation) {
              updatedVessel.orientation = {
                ...updatedVessel.orientation,
                ...vesselUpdate.orientation,
              };
            }

            if (vesselUpdate.velocity) {
              updatedVessel.velocity = {
                ...updatedVessel.velocity,
                ...vesselUpdate.velocity,
              };
            }

            if (vesselUpdate.angularVelocity) {
              updatedVessel.angularVelocity = {
                ...updatedVessel.angularVelocity,
                ...vesselUpdate.angularVelocity,
              };
            }

            if (vesselUpdate.controls) {
              updatedVessel.controls = {
                ...updatedVessel.controls,
                ...vesselUpdate.controls,
              };
            }

            if (vesselUpdate.properties) {
              updatedVessel.properties = {
                ...updatedVessel.properties,
                ...vesselUpdate.properties,
              };
            }

            if (vesselUpdate.engineState) {
              updatedVessel.engineState = {
                ...updatedVessel.engineState,
                ...vesselUpdate.engineState,
              };
            }

            if (vesselUpdate.electricalSystem) {
              updatedVessel.electricalSystem = {
                ...updatedVessel.electricalSystem,
                ...vesselUpdate.electricalSystem,
              };
            }

            // Handle stability property safely
            if (vesselUpdate.stability) {
              // Ensure stability exists in both source and target
              if (!updatedVessel.stability) {
                updatedVessel.stability = {
                  metacentricHeight: 2.0,
                  centerOfGravity: { x: 0, y: 0, z: 6.0 },
                  trim: 0,
                  list: 0,
                };
              }

              // Create updated stability object
              const updatedStability = {
                ...updatedVessel.stability,
                ...vesselUpdate.stability,
              };

              // Handle centerOfGravity property separately
              if (vesselUpdate.stability.centerOfGravity) {
                if (!updatedStability.centerOfGravity) {
                  updatedStability.centerOfGravity = { x: 0, y: 0, z: 6.0 };
                }

                updatedStability.centerOfGravity = {
                  ...updatedStability.centerOfGravity,
                  ...vesselUpdate.stability.centerOfGravity,
                };
              }

              updatedVessel.stability = updatedStability;
            }

            if (vesselUpdate.alarms) {
              updatedVessel.alarms = {
                ...updatedVessel.alarms,
                ...vesselUpdate.alarms,
              };

              if (vesselUpdate.alarms.otherAlarms) {
                updatedVessel.alarms.otherAlarms = {
                  ...updatedVessel.alarms.otherAlarms,
                  ...vesselUpdate.alarms.otherAlarms,
                };
              }
            }

            return { vessel: updatedVessel };
          } catch (error) {
            console.error('Error in updateVessel:', error);
            // Return unchanged state if there was an error
            return {};
          }
        }),

      setVesselName: name =>
        set(state => ({
          vessel: {
            ...state.vessel,
            properties: {
              ...state.vessel.properties,
              name,
            },
          },
        })),

      setVesselType: type =>
        set(state => ({
          vessel: {
            ...state.vessel,
            properties: {
              ...state.vessel.properties,
              type,
            },
          },
        })),

      // Environment state
      environment: defaultEnvironmentState,
      updateEnvironment: environmentUpdate =>
        set(state => ({
          environment: {
            ...state.environment,
            ...environmentUpdate,
            wind: {
              ...state.environment.wind,
              ...(environmentUpdate.wind || {}),
            },
            current: {
              ...state.environment.current,
              ...(environmentUpdate.current || {}),
            },
          },
        })),

      setDayNightCycle: enabled => {
        // Implement day/night cycle logic
        if (enabled) {
          // Set up time progression
          const _intervalId = setInterval(() => {
            set(state => ({
              environment: {
                ...state.environment,
                timeOfDay: (state.environment.timeOfDay + 0.1) % 24,
              },
            }));
          }, 10000); // Update every 10 seconds

          // Store intervalId somewhere to clear it when disabled
          // This is simplified - you'd need a way to store and clear this interval
        }
      },

      // Simulation control
      simulation: defaultSimulationControl,
      setRunning: running =>
        set(_state => ({
          simulation: {
            ..._state.simulation,
            isRunning: running,
            paused: running ? false : _state.simulation.paused,
            realStartTime:
              running && !_state.simulation.isRunning
                ? Date.now()
                : _state.simulation.realStartTime,
          },
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

      togglePause: () =>
        set(state => ({
          simulation: {
            ...state.simulation,
            paused: !state.simulation.paused,
            isRunning: state.simulation.paused
              ? state.simulation.isRunning
              : false,
          },
        })),

      resetSimulation: () =>
        set(_state => ({
          vessel: defaultVesselState,
          simulation: {
            ...defaultSimulationControl,
            realStartTime: Date.now(),
          },
          eventLog: [],
          machinerySystems: defaultMachinerySystemStatus,
        })),

      // Event system
      eventLog: [],
      addEvent: event => {
        const newEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: get().simulation.elapsedTime,
          ...event,
        };

        set(state => ({
          eventLog: [newEvent, ...state.eventLog].slice(0, 200), // Keep only the most recent 200 events
        }));

        // For critical alarms, we might want to update vessel state too
        if (event.severity === 'critical' && event.category === 'alarm') {
          if (event.type === 'engine_overheat') {
            set(state => ({
              vessel: {
                ...state.vessel,
                alarms: {
                  ...state.vessel.alarms,
                  engineOverheat: true,
                },
              },
            }));
          }
          // Add similar logic for other alarm types
        }
      },

      clearEventLog: () => set({ eventLog: [] }),

      // Machinery systems
      machinerySystems: defaultMachinerySystemStatus,
      updateMachineryStatus: statusUpdate =>
        set(state => ({
          machinerySystems: {
            ...state.machinerySystems,
            ...statusUpdate,
            failures: {
              ...state.machinerySystems.failures,
              ...(statusUpdate.failures || {}),
            },
          },
        })),

      triggerFailure: (failureType, active) =>
        set(state => {
          const newMachinerySystems = {
            ...state.machinerySystems,
            failures: {
              ...state.machinerySystems.failures,
              [failureType]: active,
            },
          };

          // Update related systems based on failure
          if (failureType === 'engineFailure') {
            newMachinerySystems.engineHealth = active ? 0.2 : 1.0;
          } else if (failureType === 'propellerDamage') {
            newMachinerySystems.propulsionEfficiency = active ? 0.6 : 1.0;
          } else if (failureType === 'rudderFailure') {
            newMachinerySystems.steeringSystemHealth = active ? 0.3 : 1.0;
          } else if (failureType === 'electricalFailure') {
            newMachinerySystems.electricalSystemHealth = active ? 0.4 : 1.0;
          }

          // Log the failure event
          if (active) {
            get().addEvent({
              category: 'alarm',
              type: failureType,
              message: `${failureType} has occurred!`,
              severity: 'critical',
            });
          }

          return { machinerySystems: newMachinerySystems };
        }),

      // Navigation
      navigation: defaultNavigationData,
      updateNavigation: navUpdate =>
        set(state => ({
          navigation: {
            ...state.navigation,
            ...navUpdate,
            route: navUpdate.route
              ? {
                  ...state.navigation.route,
                  ...navUpdate.route,
                }
              : state.navigation.route,
            charts: navUpdate.charts
              ? {
                  ...state.navigation.charts,
                  ...navUpdate.charts,
                }
              : state.navigation.charts,
          },
        })),

      addWaypoint: (x, y, name) =>
        set(state => ({
          navigation: {
            ...state.navigation,
            route: {
              ...state.navigation.route,
              waypoints: [...state.navigation.route.waypoints, { x, y, name }],
              currentWaypoint:
                state.navigation.route.currentWaypoint === -1
                  ? 0
                  : state.navigation.route.currentWaypoint,
            },
          },
        })),

      removeWaypoint: index =>
        set(state => {
          const newWaypoints = [...state.navigation.route.waypoints];
          newWaypoints.splice(index, 1);

          let newCurrentWaypoint = state.navigation.route.currentWaypoint;
          if (newWaypoints.length === 0) {
            newCurrentWaypoint = -1;
          } else if (index <= state.navigation.route.currentWaypoint) {
            newCurrentWaypoint = Math.max(
              0,
              state.navigation.route.currentWaypoint - 1,
            );
          }

          return {
            navigation: {
              ...state.navigation,
              route: {
                waypoints: newWaypoints,
                currentWaypoint: newCurrentWaypoint,
              },
            },
          };
        }),

      // WASM vessel pointer
      wasmVesselPtr: null,
      setWasmVesselPtr: ptr => set({ wasmVesselPtr: ptr }),

      // Apply vessel controls
      applyVesselControls: controls => {
        const simulationLoop = getSimulationLoop();

        // First update the store with the new control values
        set(state => ({
          vessel: {
            ...state.vessel,
            controls: {
              ...state.vessel.controls,
              ...controls,
            },
          },
        }));

        // Then apply the controls to the physics engine
        simulationLoop.applyControls(controls);
      },

      // Update water status
      updateWaterStatus: (_set: any, _get: any) => (_state: any) => {
        // Empty implementation
      },

      // Update vessel properties
      updateVesselProperties:
        (
          set: (
            updater: (state: SimulationState) => Partial<SimulationState>,
          ) => void,
        ) =>
        (newProperties: Partial<VesselState['properties']>) => {
          set((state: SimulationState) => ({
            vessel: {
              ...state.vessel,
              properties: {
                ...state.vessel.properties,
                ...newProperties,
              },
            },
          }));
        },
    }),
    {
      name: 'ship-sim-storage', // Name for localStorage/sessionStorage
      partialize: state => ({
        // Don't persist everything, only select fields
        vessel: {
          properties: state.vessel.properties,
          engineState: {
            hours: state.vessel.engineState.hours,
            fuelLevel: state.vessel.engineState.fuelLevel,
          },
        },
        navigation: {
          route: state.navigation.route,
        },
        simulation: {
          elapsedTime: state.simulation.elapsedTime,
        },
      }),
    },
  ),
);

export default useStore;
