import * as GeoJSON from 'geojson';
import type { Role } from '../server/roles';
import type { EnvironmentState } from '../types/environment.types';
import type { EventLogEntry } from '../types/events.types';
import type {
  MissionAssignmentData,
  MissionDefinition,
} from '../types/mission.types';
import type { ChatMessageData } from '../types/socket.types';
import type {
  CrewStation,
  CrewStationAssignment,
  ShipType,
  SimpleVesselState,
  VesselState,
} from '../types/vessel.types';
import type { WasmModule } from '../types/wasm';
import type { DeepPartial } from '../types/utility';
import type { StateCreator } from 'zustand';

export interface MachinerySystemStatus {
  engineHealth: number;
  propulsionEfficiency: number;
  electricalSystemHealth: number;
  steeringSystemHealth: number;
  failures: {
    engineFailure: boolean;
    propellerDamage: boolean;
    rudderFailure: boolean;
    electricalFailure: boolean;
    pumpFailure: boolean;
  };
}

export interface NavigationData {
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

export interface ReplayFrame {
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

export interface ReplayState {
  recording: boolean;
  playing: boolean;
  frames: ReplayFrame[];
}

export interface SpaceInfo {
  id: string;
  name: string;
  visibility?: string;
  kind?: string;
  rankRequired?: number;
  rules?: Record<string, unknown> | null;
  role?: 'host' | 'member';
}

export type SeamarksState = {
  bboxKey: string | null;
  center: { lat: number; lon: number } | null;
  radiusMeters: number;
  features: GeoJSON.Feature[] | null;
  updatedAt: number | null;
};

export interface SimulationState {
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
  vessel: VesselState;
  currentVesselId: string | null;
  otherVessels: Record<string, SimpleVesselState>;
  resetVessel: () => void;
  updateVessel: (vessel: DeepPartial<VesselState>) => void;
  setPhysicsParams: (params: Record<string, number>) => void;
  setVesselName: (name: string) => void;
  setVesselType: (type: ShipType) => void;
  setCurrentVesselId: (id: string | null) => void;
  setOtherVessels: (vessels: Record<string, SimpleVesselState>) => void;
  environment: EnvironmentState;
  updateEnvironment: (environment: DeepPartial<EnvironmentState>) => void;
  setDayNightCycle: (enabled: boolean) => void;
  seamarks: SeamarksState;
  setSeamarks: (next: Partial<SeamarksState>) => void;
  eventLog: EventLogEntry[];
  addEvent: (event: Omit<EventLogEntry, 'id' | 'timestamp'>) => void;
  clearEventLog: () => void;
  machinerySystems: MachinerySystemStatus;
  updateMachineryStatus: (status: DeepPartial<MachinerySystemStatus>) => void;
  triggerFailure: (
    failureType: keyof MachinerySystemStatus['failures'],
    active: boolean,
  ) => void;
  navigation: NavigationData;
  updateNavigation: (nav: DeepPartial<NavigationData>) => void;
  addWaypoint: (x: number, y: number, name: string) => void;
  removeWaypoint: (index: number) => void;
  wasmVesselPtr: number | null;
  setWasmVesselPtr: (ptr: number | null) => void;
  wasmExports?: WasmModule;
  setWasmExports: (exports: WasmModule) => void;
  applyVesselControls: (controls: {
    throttle?: number;
    rudderAngle?: number;
    ballast?: number;
    bowThruster?: number;
  }) => void;
  updateWaterStatus: (
    set: (state: SimulationState) => void,
    get: () => SimulationState,
  ) => (state: SimulationState) => void;
  updateVesselProperties: (
    set: (
      updater: (state: SimulationState) => Partial<SimulationState>,
    ) => void,
  ) => (newProperties: Partial<VesselState['properties']>) => void;
}

export type StoreSet = Parameters<StateCreator<SimulationState, [], []>>[0];
export type StoreGet = Parameters<StateCreator<SimulationState, [], []>>[1];

export type CrewStationEntries = [
  CrewStation,
  DeepPartial<CrewStationAssignment> | undefined,
][];
