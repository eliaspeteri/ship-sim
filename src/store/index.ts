import { create } from 'zustand';
import { getSimulationLoop } from '../simulation/simulationLoop';
import {
  VesselState,
  ShipType,
  SimpleVesselState,
} from '../types/vessel.types';
import { WasmModule } from '../types/wasm';
import { EventLogEntry } from '../types/events.types';
import { EnvironmentState } from '../types/environment.types';
import type { Role } from '../server/roles';
import type {
  MissionAssignmentData,
  MissionDefinition,
} from '../types/mission.types';
import { ChatMessageData } from '../types/socket.types';
import { ensurePosition, mergePosition } from '../lib/position';
import { DEFAULT_HYDRO } from '../constants/vessel';

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

export interface AccountState {
  rank: number;
  experience: number;
  credits: number;
  safetyScore: number;
}

interface ReplayFrame {
  timestamp: number;
  position: {
    x: number;
    y: number;
    z: number;
    lat: number;
    lon: number;
  };
  orientation: {
    heading: number;
    roll: number;
    pitch: number;
  };
}

interface ReplayState {
  recording: boolean;
  playing: boolean;
  frames: ReplayFrame[];
}

interface SpaceInfo {
  id: string;
  name: string;
  visibility?: string;
  kind?: string;
  rankRequired?: number;
  rules?: Record<string, unknown> | null;
  role?: 'host' | 'member';
}

const shallowEqualEnv = (a: EnvironmentState, b: EnvironmentState) => {
  if (a.seaState !== b.seaState) return false;
  if (a.timeOfDay !== b.timeOfDay) return false;
  if (a.waveHeight !== b.waveHeight) return false;
  if (a.waveLength !== b.waveLength) return false;
  if (a.waveDirection !== b.waveDirection) return false;

  // wind/current are nested
  if (a.wind.speed !== b.wind.speed) return false;
  if (a.wind.direction !== b.wind.direction) return false;
  if (a.current.speed !== b.current.speed) return false;
  if (a.current.direction !== b.current.direction) return false;

  return true;
};

const hydrodynamicsForType = (type: ShipType) => {
  switch (type) {
    case ShipType.TANKER:
      return {
        ...DEFAULT_HYDRO,
        dragCoefficient: 0.95,
        yawDamping: 0.7,
        swayDamping: 0.8,
        maxThrust: DEFAULT_HYDRO.maxThrust * 1.1,
      };
    case ShipType.CARGO:
      return {
        ...DEFAULT_HYDRO,
        dragCoefficient: 0.75,
        yawDamping: 0.45,
        swayDamping: 0.55,
        maxThrust: DEFAULT_HYDRO.maxThrust * 0.95,
      };
    case ShipType.CONTAINER:
      return {
        ...DEFAULT_HYDRO,
        dragCoefficient: 0.85,
        yawDamping: 0.6,
        swayDamping: 0.65,
        maxThrust: DEFAULT_HYDRO.maxThrust * 1.05,
      };
    default:
      return { ...DEFAULT_HYDRO };
  }
};

const normalizeChannel = (channel?: string): string => {
  const raw = channel || 'global';
  if (raw.startsWith('space:')) {
    const parts = raw.split(':'); // space:<spaceId>:rest...
    const spaceId = parts[1] || 'global';
    const remainder = parts.slice(2).join(':') || 'global';
    if (remainder.startsWith('vessel:')) {
      const [, rest] = remainder.split(':');
      const [id] = rest.split('_'); // strip any persisted suffix
      return `space:${spaceId}:vessel:${id}`;
    }
    return `space:${spaceId}:${remainder || 'global'}`;
  }
  if (raw.startsWith('vessel:')) {
    const [, rest] = raw.split(':');
    const [id] = rest.split('_'); // strip any persisted suffix
    return `vessel:${id}`;
  }
  return raw;
};
const normalizeChatMessage = (msg: ChatMessageData): ChatMessageData => ({
  ...msg,
  timestamp: msg.timestamp ?? Date.now(),
  channel: normalizeChannel(msg.channel),
});

const mergeChatMessages = (
  existing: ChatMessageData[],
  incoming: ChatMessageData[],
  maxMessages = 200,
): ChatMessageData[] => {
  const merged = new Map<string, ChatMessageData>();
  [...existing, ...incoming].forEach(msg => {
    const normalized = normalizeChatMessage(msg);
    const key =
      normalized.id ||
      `${normalized.channel}|${normalized.timestamp}|${normalized.userId}|${normalized.message}`;
    if (!merged.has(key)) {
      merged.set(key, normalized);
    }
  });

  return Array.from(merged.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-maxMessages);
};

// Complete simulation state with new system
interface SimulationState {
  mode: 'player' | 'spectator';
  setMode: (mode: 'player' | 'spectator') => void;
  roles: Role[];
  setRoles: (roles: Role[]) => void;
  spaceId: string;
  setSpaceId: (spaceId: string) => void;
  spaceInfo: SpaceInfo | null;
  setSpaceInfo: (info: SpaceInfo | null) => void;
  notice: { type: 'info' | 'error'; message: string } | null;
  setNotice: (notice: SimulationState['notice']) => void;
  sessionUserId: string | null;
  setSessionUserId: (id: string | null) => void;
  crewIds: string[];
  crewNames: Record<string, string>;
  setCrew: (crew: { ids?: string[]; names?: Record<string, string> }) => void;
  chatMessages: ChatMessageData[];
  chatHistoryMeta: Record<string, { hasMore: boolean; loaded?: boolean }>;
  addChatMessage: (msg: ChatMessageData) => void;
  setChatMessages: (msgs: ChatMessageData[]) => void;
  mergeChatMessages: (msgs: ChatMessageData[]) => void;
  replaceChannelMessages: (channel: string, msgs: ChatMessageData[]) => void;
  setChatHistoryMeta: (
    channel: string,
    meta: { hasMore: boolean; loaded?: boolean },
  ) => void;
  missions: MissionDefinition[];
  missionAssignments: MissionAssignmentData[];
  setMissions: (missions: MissionDefinition[]) => void;
  setMissionAssignments: (assignments: MissionAssignmentData[]) => void;
  upsertMissionAssignment: (assignment: MissionAssignmentData) => void;
  account: AccountState;
  setAccount: (account: Partial<AccountState>) => void;
  socketLatencyMs: number | null;
  setSocketLatencyMs: (ms: number | null) => void;
  replay: ReplayState;
  startReplayRecording: () => void;
  stopReplayRecording: () => void;
  clearReplay: () => void;
  addReplayFrame: (frame: ReplayFrame) => void;
  startReplayPlayback: () => void;
  stopReplayPlayback: () => void;

  // Vessel state
  vessel: VesselState;
  currentVesselId: string | null;
  otherVessels: Record<string, SimpleVesselState>;
  resetVessel: () => void;
  updateVessel: (vessel: Partial<VesselState>) => void;
  setVesselName: (name: string) => void;
  setVesselType: (type: ShipType) => void;
  setCurrentVesselId: (id: string | null) => void;
  setOtherVessels: (vessels: Record<string, SimpleVesselState>) => void;

  // Environment state
  environment: EnvironmentState;
  updateEnvironment: (environment: Partial<EnvironmentState>) => void;
  setDayNightCycle: (enabled: boolean) => void;

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

  // WASM exports for interacting with the WebAssembly module
  wasmExports?: WasmModule;
  setWasmExports?: (exports: WasmModule) => void;

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
  position: ensurePosition({ lat: 0, lon: 0, z: 0 }),
  waterDepth: undefined,
  orientation: { heading: 0, roll: 0, pitch: 0 },
  velocity: { surge: 0, sway: 0, heave: 0 },
  angularVelocity: { yaw: 0, roll: 0, pitch: 0 },
  controls: {
    throttle: 0,
    rudderAngle: 0,
    ballast: 0.5,
    bowThruster: 0,
  },
  helm: { userId: null, username: null },
  stations: {
    helm: { userId: null, username: null },
    engine: { userId: null, username: null },
    radio: { userId: null, username: null },
  },
  properties: {
    name: 'SS Atlantic Conveyor',
    type: ShipType.CONTAINER,
    mass: 14950000,
    length: 212,
    beam: 28,
    draft: 9.1,
    blockCoefficient: 0.8,
    maxSpeed: 23,
  },
  hydrodynamics: {
    ...hydrodynamicsForType(ShipType.CONTAINER),
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
    variability: 0,
  },
  seaState: 0,
  waterDepth: 100,
  waveHeight: 0,
  waveDirection: 0,
  waveLength: 50,
  visibility: 10,
  timeOfDay: 12,
  precipitation: 'rain',
  precipitationIntensity: 0,
};

const normalizeSeaState = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), 12);
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

const defaultAccountState: AccountState = {
  rank: 1,
  experience: 0,
  credits: 0,
  safetyScore: 1,
};

const MAX_REPLAY_FRAMES = 1800;

// Create the Zustand store with persistence
const useStore = create<SimulationState>()((set, get) => ({
  mode: 'player',
  setMode: mode => set({ mode }),
  roles: ['guest'],
  setRoles: roles => set({ roles }),
  spaceId: 'global',
  setSpaceId: spaceId => set({ spaceId: spaceId || 'global' }),
  spaceInfo: null,
  setSpaceInfo: info => set({ spaceInfo: info }),
  notice: null,
  setNotice: notice => set({ notice }),
  sessionUserId: null,
  setSessionUserId: id => set({ sessionUserId: id }),
  crewIds: [],
  crewNames: {},
  setCrew: crew =>
    set({
      crewIds: crew.ids ?? [],
      crewNames: crew.names ?? {},
    }),
  chatMessages: [],
  chatHistoryMeta: {},
  addChatMessage: message =>
    set(state => ({
      chatMessages: mergeChatMessages(state.chatMessages, [message]),
    })),
  setChatMessages: messages =>
    set({
      chatMessages: mergeChatMessages([], messages),
    }),
  mergeChatMessages: messages =>
    set(state => ({
      chatMessages: mergeChatMessages(state.chatMessages, messages),
    })),
  replaceChannelMessages: (channel, messages) =>
    set(state => {
      const normalizedChannel = normalizeChannel(channel);
      const retained = state.chatMessages.filter(
        msg => normalizeChannel(msg.channel) !== normalizedChannel,
      );
      return {
        chatMessages: mergeChatMessages(retained, messages),
      };
    }),
  setChatHistoryMeta: (channel, meta) =>
    set(state => ({
      chatHistoryMeta: {
        ...state.chatHistoryMeta,
        [channel]: {
          hasMore: meta.hasMore,
          loaded:
            meta.loaded ?? state.chatHistoryMeta[channel]?.loaded ?? false,
        },
      },
    })),
  missions: [],
  missionAssignments: [],
  setMissions: missions => set({ missions }),
  setMissionAssignments: assignments =>
    set({ missionAssignments: assignments }),
  upsertMissionAssignment: assignment =>
    set(state => {
      const existing = state.missionAssignments.find(
        current => current.id === assignment.id,
      );
      if (!existing) {
        return {
          missionAssignments: [...state.missionAssignments, assignment],
        };
      }
      return {
        missionAssignments: state.missionAssignments.map(current =>
          current.id === assignment.id ? assignment : current,
        ),
      };
    }),
  account: defaultAccountState,
  setAccount: account =>
    set(state => ({
      account: {
        ...state.account,
        ...account,
      },
    })),
  socketLatencyMs: null,
  setSocketLatencyMs: ms => set({ socketLatencyMs: ms }),
  replay: { recording: false, playing: false, frames: [] },
  startReplayRecording: () =>
    set({
      replay: { recording: true, playing: false, frames: [] },
    }),
  stopReplayRecording: () =>
    set(state => ({
      replay: { ...state.replay, recording: false },
    })),
  clearReplay: () =>
    set(state => ({
      replay: { ...state.replay, frames: [] },
    })),
  addReplayFrame: frame =>
    set(state => {
      if (!state.replay.recording) return {};
      const frames = [...state.replay.frames, frame];
      if (frames.length > MAX_REPLAY_FRAMES) {
        frames.splice(0, frames.length - MAX_REPLAY_FRAMES);
      }
      return {
        replay: { ...state.replay, frames },
      };
    }),
  startReplayPlayback: () =>
    set(state => ({
      replay: { ...state.replay, playing: true },
    })),
  stopReplayPlayback: () =>
    set(state => ({
      replay: { ...state.replay, playing: false },
    })),

  // Vessel state
  vessel: defaultVesselState,
  currentVesselId: null,
  otherVessels: {},
  resetVessel: () => set({ vessel: defaultVesselState }),
  setCurrentVesselId: id =>
    set({ currentVesselId: id ? id.split('_')[0] : null }),
  setOtherVessels: vessels => set({ otherVessels: vessels }),
  updateVessel: vesselUpdate =>
    set(state => {
      try {
        // Create a shallow copy of the current vessel state
        const updatedVessel = { ...state.vessel };

        // Handle top-level properties first
        if (vesselUpdate.position) {
          updatedVessel.position = mergePosition(
            updatedVessel.position,
            vesselUpdate.position,
          );
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

        if (vesselUpdate.waterDepth !== undefined) {
          updatedVessel.waterDepth = vesselUpdate.waterDepth;
        }

        if (vesselUpdate.helm) {
          updatedVessel.helm = {
            ...updatedVessel.helm,
            ...vesselUpdate.helm,
          };
        }

        if (vesselUpdate.stations) {
          updatedVessel.stations = {
            ...(updatedVessel.stations || {}),
            ...vesselUpdate.stations,
          };
          if (vesselUpdate.stations.helm) {
            updatedVessel.helm = {
              ...updatedVessel.helm,
              ...vesselUpdate.stations.helm,
            };
          }
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
        hydrodynamics: hydrodynamicsForType(type),
      },
    })),

  // Environment state
  environment: defaultEnvironmentState,
  updateEnvironment: environmentUpdate =>
    set(state => {
      const next: EnvironmentState = {
        ...state.environment,
        ...environmentUpdate,
        wind: { ...state.environment.wind, ...(environmentUpdate.wind || {}) },
        current: {
          ...state.environment.current,
          ...(environmentUpdate.current || {}),
        },
        seaState: normalizeSeaState(
          environmentUpdate.seaState ?? state.environment.seaState,
        ),
      };

      if (shallowEqualEnv(state.environment, next)) return {}; // <-- crucial
      return { environment: next };
    }),

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

  // Event system
  eventLog: [],
  addEvent: event =>
    set(state => {
      // Get the simulation time in seconds
      const simTimeSeconds = Date.now() / 1000; // Replace with actual simulation time

      // Convert simulation seconds to hours, minutes, seconds
      const hours = Math.floor(simTimeSeconds / 3600);
      const minutes = Math.floor((simTimeSeconds % 3600) / 60);
      const seconds = Math.floor(simTimeSeconds % 60);

      // Format time as HH:MM:SS
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      // Create the new event with simulation time
      const newEvent = {
        ...event,
        id: Date.now().toString(), // Use current timestamp as unique ID
        time: timeString,
        timestamp: Date.now(), // Keep this for sorting
      };

      return {
        eventLog: [...state.eventLog, newEvent],
      };
    }),

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

  // WASM exports
  wasmExports: undefined,
  setWasmExports: exports => set({ wasmExports: exports }),

  // Apply vessel controls
  applyVesselControls: controls => {
    try {
      const simulationLoop = getSimulationLoop();
      simulationLoop.applyControls(controls);
    } catch (error) {
      console.error('Error applying vessel controls to simulation:', error);
    }
  },

  // Update water status
  updateWaterStatus:
    (_set: (state: SimulationState) => void, _get: () => SimulationState) =>
    (_state: SimulationState) => {
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
}));

export default useStore;
