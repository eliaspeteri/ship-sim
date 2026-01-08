export type TimeZoneEstimate = {
  offsetHours: number;
  label: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const estimateTimeZoneOffsetHours = (
  lon?: number | null,
): TimeZoneEstimate | null => {
  if (lon === null || lon === undefined) return null;
  if (!Number.isFinite(lon)) return null;
  const raw = Math.round(lon / 15);
  const offsetHours = clamp(raw, -12, 14);
  const label = formatUtcOffset(offsetHours);
  return { offsetHours, label };
};

export const applyOffsetToTimeOfDay = (
  timeOfDay: number,
  offsetHours: number,
): number => (((timeOfDay + offsetHours) % 24) + 24) % 24;

export const formatUtcOffset = (offsetHours: number): string =>
  `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`;

export const formatTimeOfDay = (timeOfDay: number): string => {
  const safe = Number.isFinite(timeOfDay) ? ((timeOfDay % 24) + 24) % 24 : 0;
  const hours = Math.floor(safe);
  const minutes = Math.round((safe % 1) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
};
