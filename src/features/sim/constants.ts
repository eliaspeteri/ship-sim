import { positionFromXY } from '../../lib/position';

export const PORTS = [
  { name: 'Harbor Alpha', position: positionFromXY({ x: 0, y: 0 }) },
  { name: 'Bay Delta', position: positionFromXY({ x: 2000, y: -1500 }) },
  { name: 'Island Anchorage', position: positionFromXY({ x: -2500, y: 1200 }) },
  { name: 'Channel Gate', position: positionFromXY({ x: 800, y: 2400 }) },
];

export const DEFAULT_SPACE_ID = 'global';
export const SEAMARK_RADIUS_M = 25_000;
export const REQUERY_DISTANCE_M = 5_000;
export const REQUERY_MIN_MS = 2_000;
export const SEAMARK_REQUEST_LIMIT = 5_000;
export const HAVERSINE_EARTH_RADIUS_M = 6_371_000;
export const BBOX_KEY_PRECISION = 5;

export const STORAGE_SPACE_KEY = 'ship-sim-space';
export const STORAGE_SPACE_SELECTED_KEY = 'ship-sim-space-selected';
export const STORAGE_JOIN_CHOICE_KEY = 'ship-sim-join-choice';
export const STORAGE_ACTIVE_VESSEL_KEY = 'ship-sim-active-vessel';

export const NOTICE_CLEAR_MS = 5_000;

export const THROTTLE_STEP = 0.05;
export const RUDDER_STEP = 0.05;
export const THROTTLE_MIN = -1;
export const THROTTLE_MAX = 1;
