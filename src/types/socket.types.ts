import { EnvironmentState } from './environment.types';
import {
  SimpleVesselState,
  VesselControls,
  VesselPose,
  VesselVelocity,
} from './vessel.types';
import { AuthenticatedUser } from '../server/middleware/authentication';

type ControlUpdate = Partial<Pick<VesselControls, 'throttle' | 'rudderAngle'>>;

// Type definitions for Socket.IO communication
export interface SimulationUpdateData {
  vessels: Record<string, SimpleVesselState>;
  environment?: EnvironmentState;
  partial?: boolean;
  timestamp?: number;
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
} // Type definitions for Socket.IO
export type ServerToClientEvents = {
  'simulation:update': (data: SimulationUpdateData) => void;
  'vessel:joined': (data: VesselJoinedData) => void;
  'vessel:left': (data: VesselLeftData) => void;
  'environment:update': (data: EnvironmentState) => void;
  'chat:message': (data: {
    userId: string;
    username: string;
    message: string;
  }) => void;
  error: (error: string) => void;
};
export type ClientToServerEvents = {
  'vessel:update': (data: VesselUpdateData) => void;
  'vessel:control': (data: VesselControlData) => void;
  'simulation:state': (data: { isRunning: boolean }) => void;
  'admin:weather': (data: {
    pattern?: string;
    coordinates?: { lat: number; lng: number };
  }) => void;
  'chat:message': (data: { message: string }) => void;
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
  _socketSpecific?: boolean; // Placeholder to make TypeScript happy
}

export interface ChatMessageData {
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}
