import { EnvironmentState } from './environment.types';
import {
  SimpleVesselState,
  VesselControls,
  VesselPose,
  VesselVelocity,
} from './vessel.types';
import { AuthenticatedUser } from '../server/middleware/authentication';
import type { Role } from '../server/roles';

type ControlUpdate = Partial<Pick<VesselControls, 'throttle' | 'rudderAngle'>>;

// Type definitions for Socket.IO communication
export interface SimulationUpdateData {
  vessels: Record<string, SimpleVesselState>;
  environment?: EnvironmentState;
  partial?: boolean;
  timestamp?: number;
  self?: { userId: string; roles: Role[] };
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
  'environment:update': (data: EnvironmentState) => void;
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
  'vessel:create': (data?: { x?: number; y?: number; lat?: number; lon?: number }) => void;
  'vessel:helm': (data: { action: 'claim' | 'release' }) => void;
  'simulation:state': (data: { isRunning: boolean }) => void;
  'admin:weather': (data: {
    pattern?: string;
    coordinates?: { lat: number; lng: number };
    mode?: 'auto' | 'manual';
  }) => void;
  'chat:message': (data: { message: string; channel?: string }) => void;
  'chat:history': (data: ChatHistoryRequest) => void;
  'admin:vesselMode': (data: { vesselId: string; mode: 'player' | 'ai' }) => void;
  'user:mode': (data: { mode: 'player' | 'spectator' }) => void;
};
// Define Socket.IO interface
export interface InterServerEvents {
  // Custom inter-server events would go here if needed
  _placeholder?: boolean; // Placeholder to make TypeScript happy
}
export interface SocketData extends AuthenticatedUser {
  // Additional socket data properties would go here if needed
  vesselId?: string;
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
