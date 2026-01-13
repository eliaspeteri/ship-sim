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

export type CrewStation = 'helm' | 'engine' | 'radio';

export interface CrewStationAssignment {
  userId: string | null;
  username?: string | null;
}

export type VesselStations = Partial<
  Record<CrewStation, CrewStationAssignment>
>;

// Unified vessel state interface
export interface VesselState {
  // Basic position and orientation
  position: {
    lat: number; // decimal degrees
    lon: number; // decimal degrees
    z: number;
    x?: number; // derived meters (east)
    y?: number; // derived meters (north)
  };
  waterDepth?: number;
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
  stations?: VesselStations;

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
  hydrodynamics: {
    rudderForceCoefficient: number;
    rudderStallAngle: number;
    rudderMaxAngle: number;
    dragCoefficient: number;
    yawDamping: number;
    yawDampingQuad: number;
    swayDamping: number;
    maxThrust: number;
    rollDamping: number;
    pitchDamping: number;
    heaveStiffness: number;
    heaveDamping: number;
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

  // Failure modeling
  failureState?: {
    engineFailure: boolean;
    steeringFailure: boolean;
    floodingLevel: number;
  };

  damageState?: {
    hullIntegrity: number;
    engineHealth: number;
    steeringHealth: number;
    electricalHealth: number;
    floodingDamage: number;
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
  stations?: VesselStations;
  angularVelocity?: Partial<VesselState['angularVelocity']>;
  hydrodynamics?: Partial<VesselState['hydrodynamics']>;
  properties?: Partial<
    Pick<
      VesselState['properties'],
      'name' | 'type' | 'length' | 'beam' | 'draft'
    >
  >;
  mode?: 'player' | 'ai';
  desiredMode?: 'player' | 'ai';
  lastCrewAt?: number;
  waterDepth?: number;
  failureState?: VesselState['failureState'];
  damageState?: VesselState['damageState'];
};

// Simplified vessel state for network transmission
export type SimpleVesselState = VesselSnapshot;
