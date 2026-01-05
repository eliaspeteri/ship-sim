/**
 * Unified vessel types for ship simulation
 * This centralizes all vessel-related type definitions
 */

// Ship type enumeration
export enum ShipType {
  CONTAINER = 'CONTAINER',
  TANKER = 'TANKER',
  CARGO = 'CARGO',
  DEFAULT = 'DEFAULT',
}

// Unified vessel state interface
export interface VesselState {
  // Basic position and orientation
  position: {
    x: number;
    y: number;
    z: number;
    lat?: number; // decimal degrees
    lon?: number; // decimal degrees
  };
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
  helm?: {
    userId: string | null;
    username?: string | null;
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

export type VesselPose = Pick<VesselState, 'position' | 'orientation'>;
export type VesselVelocity = VesselState['velocity'];
export type VesselControls = VesselState['controls'];
export type VesselSnapshot = VesselPose & {
  velocity: VesselVelocity;
  controls?: Partial<VesselControls>;
  id: string;
  ownerId?: string | null;
  crewIds?: string[];
  crewCount?: number;
  crewNames?: Record<string, string>;
  helm?: VesselState['helm'];
  angularVelocity?: Partial<VesselState['angularVelocity']>;
  mode?: 'player' | 'ai';
  desiredMode?: 'player' | 'ai';
  lastCrewAt?: number;
};

// Simplified vessel state for network transmission
export type SimpleVesselState = VesselSnapshot;
