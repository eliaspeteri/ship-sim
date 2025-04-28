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
    waveHeight?: number;
    wavePhase?: number;
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

// Simplified vessel state for network transmission
export interface SimpleVesselState {
  id: string;
  position: { x: number; y: number; z: number };
  orientation: { heading: number; roll: number; pitch: number };
  velocity: { surge: number; sway: number; heave: number };
}

// Basic vessel control data
export interface VesselControlData {
  id?: string;
  throttle?: number;
  rudderAngle?: number;
}

// Basic vessel update data
export interface VesselUpdateData {
  id?: string;
  position?: { x: number; y: number; z: number };
  orientation?: { heading: number; roll: number; pitch: number };
  velocity?: { surge: number; sway: number; heave: number };
}

// Vessel event data
export interface VesselJoinedData {
  id: string;
  name: string;
  vesselType: string;
}

export interface VesselLeftData {
  id: string;
}
