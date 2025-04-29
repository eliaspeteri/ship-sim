import { EnvironmentState } from '../server';
import { SimpleVesselState } from './vessel.types';

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
  position: { x: number; y: number; z: number };
  orientation: { heading: number; roll: number; pitch: number };
}
export interface VesselLeftData {
  userId: string;
}
export interface VesselUpdateData {
  position?: { x: number; y: number; z: number };
  orientation?: { heading: number; roll: number; pitch: number };
  velocity?: { surge: number; sway: number; heave: number };
}
export interface VesselControlData {
  throttle?: number;
  rudderAngle?: number;
}
