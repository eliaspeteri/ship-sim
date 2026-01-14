import { positionFromXY } from '../../lib/position';
import { HudTab } from './types';

export const HUD_TABS: { id: HudTab; label: string }[] = [
  { id: 'vessels', label: 'Vessels' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'ecdis', label: 'ECDIS' },
  { id: 'sounder', label: 'Echo sounder' },
  { id: 'conning', label: 'Conning' },
  { id: 'weather', label: 'Weather' },
  { id: 'systems', label: 'Systems' },
  { id: 'missions', label: 'Missions' },
  { id: 'replay', label: 'Replay' },
  { id: 'spaces', label: 'Spaces' },
  { id: 'chat', label: 'Chat' },
  { id: 'events', label: 'Events' },
  { id: 'radio', label: 'Radio' },
  { id: 'radar', label: 'Radar' },
  { id: 'alarms', label: 'Alarms' },
  { id: 'admin', label: 'Admin' },
];

export const HUD_PORTS = [
  {
    id: 'harbor-alpha',
    name: 'Harbor Alpha',
    position: positionFromXY({ x: 0, y: 0 }),
  },
  {
    id: 'bay-delta',
    name: 'Bay Delta',
    position: positionFromXY({ x: 2000, y: -1500 }),
  },
  {
    id: 'island-anchorage',
    name: 'Island Anchorage',
    position: positionFromXY({ x: -2500, y: 1200 }),
  },
  {
    id: 'channel-gate',
    name: 'Channel Gate',
    position: positionFromXY({ x: 800, y: 2400 }),
  },
];

export const DEFAULT_RADAR_SETTINGS = {
  range: 6,
  gain: 70,
  seaClutter: 50,
  rainClutter: 50,
  heading: 0,
  orientation: 'head-up' as const,
  trails: true,
  trailDuration: 30,
  nightMode: false,
};

export const DEFAULT_RADAR_EBL = { active: false, angle: 0 };
export const DEFAULT_RADAR_VRM = { active: false, distance: 0 };
export const DEFAULT_GUARD_ZONE = {
  active: false,
  startAngle: 320,
  endAngle: 40,
  innerRange: 0.5,
  outerRange: 3,
};

export const DEFAULT_BALLAST = 0.5;
export const BALLAST_SLIDER_STEP = 0.01;
export const PERCENT_SCALE = 100;
export const THROTTLE_MIN = -1;
export const THROTTLE_MAX = 1;

export const KNOTS_PER_MS = 1.94384;
export const METERS_PER_NM = 1852;
export const DEG_PER_RAD = 180 / Math.PI;
export const FULL_CIRCLE_DEG = 360;
export const COMPASS_ZERO_OFFSET_DEG = 90;

export const COURSE_SPEED_THRESHOLD_MS = 0.05;
export const ENGINE_RUNNING_THROTTLE_THRESHOLD = 0.05;

export const RADAR_SEA_STATE_MAX = 10;
export const RADAR_RAIN_INTENSITY_MAX = 10;
export const RADAR_RAIN_SCALE = 10;
export const RADAR_VISIBILITY_DEFAULT = 10;
export const RADAR_MIN_DISTANCE_M = 1;
export const RADAR_TARGET_SIZE_MIN = 0.25;
export const RADAR_TARGET_SIZE_MAX = 1;
export const RADAR_TARGET_SIZE_DEFAULT_METERS = 80;
export const RADAR_TARGET_SIZE_SCALE_METERS = 250;

export const DRAFT_WATER_DENSITY = 1025;
export const DRAFT_MASS_BASE_FACTOR = 0.9;
export const DRAFT_MASS_BALLAST_FACTOR = 0.4;
export const DRAFT_NEUTRAL_SCALE_BASE = 0.7;
export const DRAFT_NEUTRAL_SCALE_RANGE = 0.5;
export const DRAFT_DIVISOR_EPSILON = 1e-6;

export const PITCH_MIN = 0;
export const PITCH_MAX = 100;
export const PITCH_THROTTLE_OFFSET = 1;
export const PITCH_THROTTLE_SCALE = 50;
export const RATE_OF_TURN_SCALE = 4;
export const RATE_OF_TURN_MAX = 100;
export const OIL_PRESSURE_SCALE = 10;

export const LAT_LON_DECIMALS = 6;
export const NAV_YAW_RATE_DECIMALS = 2;
export const WAVE_HEIGHT_DECIMALS = 1;
export const NAV_RUDDER_DECIMALS = 1;
export const NAV_THROTTLE_DECIMALS = 0;
export const NAV_BALLAST_DECIMALS = 0;
export const FLEET_COORD_DECIMALS = 4;
export const DRAFT_DECIMALS = 1;
export const STABILITY_DECIMALS = 2;
export const MASS_TON_DECIMALS = 0;
export const BLOCK_COEFF_DECIMALS = 2;
export const SEA_DEPTH_DECIMALS = 1;
export const BEAM_DECIMALS = 1;
export const SAFETY_SCORE_DECIMALS = 2;

export const NM_DECIMALS = 1;
export const METERS_DECIMALS = 0;

export const CREW_CARD_HEIGHT_PX = 160;
export const RUDDER_INDICATOR_SIZE_PX = 160;
export const RADAR_DISPLAY_SIZE_PX = 360;
export const RADIO_DISPLAY_WIDTH_PX = 440;
export const RADIO_DISPLAY_HEIGHT_PX = 320;
export const ALARM_ICON_SIZE_PX = 18;

export const REPLAY_MIN_FRAMES = 2;
export const ECONOMY_TRANSACTIONS_LIMIT = 8;

export const MS_PER_SECOND = 1000;
export const MINUTES_PER_HOUR = 60;

export const DEFAULT_COORD_DECIMALS = 1;
export const PERCENT_DECIMALS = 0;
export const FUEL_CONSUMPTION_DECIMALS = 1;
export const RPM_DECIMALS = 0;
export const TEMPERATURE_DECIMALS = 0;
export const OIL_PRESSURE_DECIMALS = 1;
export const VOLTAGE_DECIMALS = 0;
export const POWER_DECIMALS = 0;
export const ACCOUNT_DECIMALS = 0;
export const XP_DECIMALS = 0;
export const TRANSACTION_AMOUNT_DECIMALS = 0;
export const REPLAY_SECONDS_DECIMALS = 1;

export const MIN_RANK_XP = 1000;
export const RANK_XP_MULTIPLIER = 1000;

export const TELEGRAPH_SCALE = [
  { label: 'F.Astern', value: -1, major: true },
  { label: 'H.Astern', value: -0.5 },
  { label: 'S.Astern', value: -0.25 },
  { label: 'Stop', value: 0, major: true },
  { label: 'S.Ahead', value: 0.25 },
  { label: 'H.Ahead', value: 0.5 },
  { label: 'F.Ahead', value: 1, major: true },
];

export const DAMAGE_CRITICAL_THRESHOLD = 0.4;
export const REPAIR_SPEED_THRESHOLD_MS = 0.2;
export const METER_WARN_THRESHOLD = 0.35;
export const METER_DANGER_THRESHOLD = 0.15;

export const DEFAULT_SPACE_ID = 'global';
