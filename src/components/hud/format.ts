import {
  DEFAULT_COORD_DECIMALS,
  DEG_PER_RAD,
  FULL_CIRCLE_DEG,
  KNOTS_PER_MS,
  METERS_DECIMALS,
  METERS_PER_NM,
  NM_DECIMALS,
} from './constants';

const TRANSACTION_REASON_LABELS: Record<string, string> = {
  operating_cost: 'Operating cost',
  port_fee: 'Port fee',
  collision: 'Collision penalty',
  speed_violation: 'Speed violation',
  near_miss: 'Near miss',
  mission_reward: 'Mission reward',
  repair: 'Repairs',
};

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const toDegrees = (rad?: number) => ((rad ?? 0) * DEG_PER_RAD) as number;

export const formatDegrees = (rad?: number) => {
  if (rad === undefined) return '—';
  const deg = rad * DEG_PER_RAD;
  const normalized =
    ((deg % FULL_CIRCLE_DEG) + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG;
  return `${Math.round(normalized)}°`;
};

export const formatBearing = (deg?: number) => {
  if (deg === undefined || Number.isNaN(deg)) return '—';
  const normalized =
    ((deg % FULL_CIRCLE_DEG) + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG;
  return `${Math.round(normalized)}°`;
};

export const formatKnots = (val?: number) =>
  `${((val || 0) * KNOTS_PER_MS).toFixed(NM_DECIMALS)} kts`;

export const formatKnotsValue = (val?: number) =>
  `${(val || 0).toFixed(NM_DECIMALS)} kts`;

export const formatDistance = (meters: number) => {
  if (!Number.isFinite(meters)) return '--';
  const nm = meters / METERS_PER_NM;
  if (nm >= 1) return `${nm.toFixed(NM_DECIMALS)} nm`;
  return `${Math.round(meters).toFixed(METERS_DECIMALS)} m`;
};

export const formatTransactionReason = (reason?: string) => {
  if (!reason) return 'Economy update';
  return TRANSACTION_REASON_LABELS[reason] || reason.replace(/_/g, ' ');
};

export const formatCoord = (value?: number, digits = DEFAULT_COORD_DECIMALS) =>
  Number.isFinite(value) ? (value as number).toFixed(digits) : '—';
