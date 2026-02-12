import { DEFAULT_HYDRO } from '../constants/vessel';
import type { EnvironmentState } from '../types/environment.types';
import { ensurePosition } from '../lib/position';
import { ShipType } from '../types/vessel.types';
import type { VesselState } from '../types/vessel.types';
import type {
  AccountState,
  MachinerySystemStatus,
  NavigationData,
  SeamarksState,
} from './types';

export const shallowEqualEnv = (a: EnvironmentState, b: EnvironmentState) => {
  if (a.seaState !== b.seaState) return false;
  if (a.timeOfDay !== b.timeOfDay) return false;
  if (a.waveHeight !== b.waveHeight) return false;
  if (a.waveLength !== b.waveLength) return false;
  if (a.waveDirection !== b.waveDirection) return false;
  if (a.tideHeight !== b.tideHeight) return false;
  if (a.tideRange !== b.tideRange) return false;
  if (a.tidePhase !== b.tidePhase) return false;
  if (a.tideTrend !== b.tideTrend) return false;
  if (a.wind.speed !== b.wind.speed) return false;
  if (a.wind.direction !== b.wind.direction) return false;
  if (a.current.speed !== b.current.speed) return false;
  if (a.current.direction !== b.current.direction) return false;
  return true;
};

export const hydrodynamicsForType = (type: ShipType) => {
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

export const defaultVesselState: VesselState = {
  position: ensurePosition({ lat: 0, lon: 0, z: 0 }),
  waterDepth: undefined,
  orientation: { heading: 0, roll: 0, pitch: 0 },
  velocity: { surge: 0, sway: 0, heave: 0 },
  angularVelocity: { yaw: 0, roll: 0, pitch: 0 },
  controls: { throttle: 0, rudderAngle: 0, ballast: 0.5, bowThruster: 0 },
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
  hydrodynamics: { ...hydrodynamicsForType(ShipType.CONTAINER) },
  physics: { model: 'displacement', schemaVersion: 1 },
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
  render: {},
  failureState: {
    engineFailure: false,
    steeringFailure: false,
    floodingLevel: 0,
  },
  damageState: {
    hullIntegrity: 1,
    engineHealth: 1,
    steeringHealth: 1,
    electricalHealth: 1,
    floodingDamage: 0,
  },
};

export const defaultEnvironmentState: EnvironmentState = {
  wind: { speed: 5, direction: 0, gusting: false, gustFactor: 1.5 },
  current: { speed: 0.5, direction: Math.PI / 4, variability: 0 },
  seaState: 0,
  waterDepth: 100,
  waveHeight: 0,
  waveDirection: 0,
  waveLength: 50,
  visibility: 10,
  timeOfDay: 12,
  precipitation: 'rain',
  precipitationIntensity: 0,
  tideHeight: 0,
  tideRange: 0,
  tidePhase: 0,
  tideTrend: 'rising',
};

export const normalizeSeaState = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), 12);
};

export const defaultMachinerySystemStatus: MachinerySystemStatus = {
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

export const defaultNavigationData: NavigationData = {
  route: { waypoints: [], currentWaypoint: -1 },
  charts: { visible: true, scale: 1.0 },
  navigationMode: 'manual',
  autopilotHeading: null,
};

export const defaultAccountState: AccountState = {
  rank: 1,
  experience: 0,
  credits: 0,
  safetyScore: 1,
};

export const defaultSeamarks: SeamarksState = {
  bboxKey: null,
  center: null,
  radiusMeters: 25_000,
  features: null,
  updatedAt: null,
};

export const MAX_REPLAY_FRAMES = 1800;
