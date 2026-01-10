import { EnvironmentState } from './environment.types';
import {
  SimpleVesselState,
  VesselControls,
  VesselPose,
  VesselVelocity,
} from './vessel.types';
import { AuthenticatedUser } from '../server/middleware/authentication';
import type { Role } from '../server/roles';
import type { CrewStation } from './vessel.types';
import type { MissionAssignmentData } from './mission.types';

type ControlUpdate = Partial<Pick<VesselControls, 'throttle' | 'rudderAngle'>>;

// Type definitions for Socket.IO communication
export interface SimulationUpdateData {
  vessels: Record<string, SimpleVesselState>;
  environment?: EnvironmentState;
  partial?: boolean;
  timestamp?: number;
  spaceId?: string;
  self?: {
    userId: string;
    roles: Role[];
    rank?: number;
    credits?: number;
    experience?: number;
    safetyScore?: number;
    spaceId?: string;
    mode?: 'player' | 'spectator';
    vesselId?: string;
  };
  spaceInfo?: {
    id: string;
    name: string;
    visibility?: string;
    kind?: string;
    rankRequired?: number;
    rules?: Record<string, unknown> | null;
    role?: 'host' | 'member';
  };
  chatHistory?: ChatMessageData[];
}
export interface VesselJoinedData {
  userId: string;
  username: string;
  position: VesselPose['position'];
  orientation: VesselPose['orientation'];
}
export interface VesselLeftData {
  userId: string;
}
export interface VesselUpdateData {
  userId: string;
  position: VesselPose['position'];
  orientation: VesselPose['orientation'];
  velocity: VesselVelocity;
  angularVelocity?: { yaw?: number; roll?: number; pitch?: number };
  controls?: ControlUpdate;
}
export interface VesselControlData {
  userId: string;
  throttle?: number;
  rudderAngle?: number;
  ballast?: number;
} // Type definitions for Socket.IO

export interface AdminVesselMoveData {
  vesselId: string;
  position: Partial<VesselPose['position']>;
}

export interface VesselTeleportData {
  vesselId: string;
  position: VesselPose['position'];
  reset?: boolean;
}

export interface ChatHistoryRequest {
  channel?: string;
  before?: number;
  limit?: number;
}

export interface ChatHistoryResponse {
  channel: string;
  messages: ChatMessageData[];
  hasMore: boolean;
  reset?: boolean;
}

export type ServerToClientEvents = {
  'simulation:update': (data: SimulationUpdateData) => void;
  'vessel:joined': (data: VesselJoinedData) => void;
  'vessel:left': (data: VesselLeftData) => void;
  'vessel:teleport': (data: VesselTeleportData) => void;
  'environment:update': (data: EnvironmentState) => void;
  'mission:update': (data: MissionAssignmentData) => void;
  'economy:update': (data: {
    rank: number;
    experience: number;
    credits: number;
    safetyScore: number;
  }) => void;
  'latency:pong': (data: { sentAt: number; serverAt: number }) => void;
  'chat:message': (data: {
    userId: string;
    username: string;
    message: string;
    timestamp?: number;
    channel?: string;
  }) => void;
  'chat:history': (data: ChatHistoryResponse) => void;
  error: (error: string) => void;
};
export type ClientToServerEvents = {
  'vessel:update': (data: VesselUpdateData) => void;
  'vessel:control': (data: VesselControlData) => void;
  'vessel:join': (data?: { vesselId?: string }) => void;
  'vessel:create': (data?: {
    lat?: number;
    lon?: number;
    z?: number;
    x?: number;
    y?: number;
  }) => void;
  'vessel:helm': (data: { action: 'claim' | 'release' }) => void;
  'vessel:station': (data: {
    station: CrewStation;
    action: 'claim' | 'release';
  }) => void;
  'simulation:state': (data: { isRunning: boolean }) => void;
  'admin:weather': (data: {
    pattern?: string;
    coordinates?: { lat: number; lng: number };
    mode?: 'auto' | 'manual';
  }) => void;
  'admin:kick': (data: { userId: string; reason?: string }) => void;
  'admin:vessel:move': (data: AdminVesselMoveData) => void;
  'admin:vessel:stop': (data: { vesselId: string }) => void;
  'admin:vessel:remove': (data: { vesselId: string }) => void;
  'chat:message': (data: { message: string; channel?: string }) => void;
  'chat:history': (data: ChatHistoryRequest) => void;
  'admin:vesselMode': (data: {
    vesselId: string;
    mode: 'player' | 'ai';
  }) => void;
  'user:mode': (data: { mode: 'player' | 'spectator' }) => void;
  'latency:ping': (data: { sentAt: number }) => void;
  'client:log': (data: {
    level: 'info' | 'warn' | 'error';
    source: string;
    message: string;
    meta?: Record<string, unknown>;
  }) => void;
};
// Define Socket.IO interface
export interface InterServerEvents {
  // Custom inter-server events would go here if needed
  _placeholder?: boolean; // Placeholder to make TypeScript happy
}
export interface SocketData extends AuthenticatedUser {
  // Additional socket data properties would go here if needed
  vesselId?: string;
  spaceId?: string;
  mode?: 'player' | 'spectator';
  autoJoin?: boolean;
  spaceRole?: 'host' | 'member';
  _socketSpecific?: boolean; // Placeholder to make TypeScript happy
}

export interface ChatMessageData {
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  id?: string;
  channel?: string;
}
