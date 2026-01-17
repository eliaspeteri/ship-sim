import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../../types/socket.types';
import type { SimpleVesselState } from '../../types/vessel.types';
import type { EnvironmentState } from '../../types/environment.types';
import type { VesselRecord } from '../index';
import type { WeatherPattern } from '../weatherSystem';

export type GlobalState = {
  vessels: Map<string, VesselRecord>;
  userLastVessel: Map<string, string>;
  environmentBySpace: Map<string, EnvironmentState>;
};

export type SocketHandlerContext = {
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
  spaceId: string;
  effectiveUserId: string;
  effectiveUsername: string;
  roleSet: Set<string>;
  isPlayerOrHigher: boolean;
  isSpectatorOnly: boolean;
  isGuest: boolean;
  spaceMeta: {
    rankRequired: number;
    rulesetType?: string | null;
    rules?: Record<string, unknown> | null;
    name?: string;
    visibility?: string;
    kind?: string;
  };
  globalState: GlobalState;
  getVesselIdForUser: (userId: string, spaceId: string) => string | undefined;
  ensureVesselForUser: (
    userId: string,
    username: string,
    spaceId: string,
  ) => VesselRecord | undefined;
  buildVesselRecordFromRow: (row: unknown) => VesselRecord;
  findVesselInSpace: (vesselId: string, spaceId: string) => VesselRecord | null;
  findJoinableVessel: (userId: string, spaceId: string) => VesselRecord | null;
  userSpaceKey: (userId: string, spaceId: string) => string;
  maxCrew: number;
  createNewVesselForUser: (
    userId: string,
    username: string,
    payload: unknown,
    spaceId: string,
  ) => VesselRecord;
  updateStationAssignment: (
    vessel: VesselRecord,
    station: 'helm' | 'engine' | 'radio',
    action: string,
    userId: string,
    username: string,
    isAdmin: boolean,
  ) =>
    | { ok: true }
    | { ok: false; message?: string | undefined };
  resolveChatChannel: (
    requestedChannel: string | undefined,
    vesselId: string | undefined,
    spaceId: string,
  ) => string;
  normalizeVesselId: (id?: string | null) => string | undefined;
  loadChatHistory: (
    channel: string,
    before: number | undefined,
    take: number,
  ) => Promise<{ messages: unknown[]; hasMore: boolean }>;
  getActiveMute: (
    userId: string | undefined,
    username: string | undefined,
    spaceId: string,
  ) => Promise<
    | {
        reason?: string | null;
      }
    | null
  >;
  getSpaceIdForSocket: (socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >) => string;
  assignStationsForCrew: (
    vessel: VesselRecord,
    userId: string,
    username: string,
  ) => void;
  detachUserFromCurrentVessel: (userId: string, spaceId: string) => void;
  updateSocketVesselRoom: (
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
    spaceId: string,
    vesselId?: string | null,
  ) => void;
  toSimpleVesselState: (vessel: VesselRecord) => SimpleVesselState;
  persistVesselToDb: (
    vessel: VesselRecord,
    opts?: { force?: boolean },
  ) => Promise<void> | void;
  persistEnvironmentToDb: (opts?: { force?: boolean; spaceId?: string }) => Promise<void> | void;
  defaultSpaceId: string;
  aiControllers: Map<string, { heading: number; speed: number }>;
  hasAdminRole: (
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
  ) => boolean;
  clamp: (val: number, min: number, max: number) => number;
  clampSigned: (val: number, limit: number) => number;
  clampHeading: (rad: number) => number;
  rudderMaxAngleRad: number;
  resolveChargeUserId: (vessel: VesselRecord) => string | undefined;
  getRulesForSpace: (spaceId: string) => Record<string, unknown>;
  syncUserSocketsEconomy: (
    userId: string,
    profile: {
      rank: number;
      experience: number;
      credits: number;
      safetyScore: number;
    },
  ) => Promise<void>;
  economyLedger: Map<
    string,
    { lastChargeAt: number; accrued: number; lastPortId?: string }
  >;
  chatHistoryPageSize: number;
  isSpaceHost: (userId: string | undefined, spaceId: string) => Promise<boolean>;
  weather: {
    getMode: () => 'manual' | 'auto';
    setMode: (mode: 'manual' | 'auto') => void;
    getTarget: () => WeatherPattern | null;
    setTarget: (pattern: WeatherPattern | null) => void;
    getNextAuto: () => number;
    setNextAuto: (value: number) => void;
  };
  getEnvironmentForSpace: (spaceId: string) => EnvironmentState;
  currentUtcTimeOfDay: () => number;
  weatherAutoIntervalMs: number;
};
