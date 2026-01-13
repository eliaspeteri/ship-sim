const TAU = Math.PI * 2;

export type TideTrend = 'rising' | 'falling';

export type TideState = {
  height: number;
  range: number;
  phase: number;
  trend: TideTrend;
};

type TideInput = {
  timestampMs: number;
  spaceId?: string;
  rangeOverride?: number | null;
};

type Constituent = {
  name: string;
  periodHours: number;
  amplitude: number;
  phaseOffset: number;
};

const CONSTITUENTS: Constituent[] = [
  { name: 'M2', periodHours: 12.4206, amplitude: 0.6, phaseOffset: 0 },
  { name: 'S2', periodHours: 12.0, amplitude: 0.35, phaseOffset: 0.3 },
  { name: 'K1', periodHours: 23.9345, amplitude: 0.25, phaseOffset: 1.1 },
  { name: 'O1', periodHours: 25.8193, amplitude: 0.18, phaseOffset: 2.2 },
];

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const getTideSeed = (spaceId: string) => {
  const seed = hashString(spaceId || 'global');
  const phase = (seed % 10_000) / 10_000;
  const amplitudeScale = 0.6 + ((seed >>> 8) % 1_000) / 1_000; // 0.6 - 1.6
  return { phase, amplitudeScale };
};

const computeTideHeight = (hours: number, spaceId: string): number => {
  const { phase, amplitudeScale } = getTideSeed(spaceId);
  let height = 0;
  for (let i = 0; i < CONSTITUENTS.length; i += 1) {
    const c = CONSTITUENTS[i];
    const phaseOffset = (phase + c.phaseOffset + i * 0.17) * TAU;
    height +=
      c.amplitude *
      amplitudeScale *
      Math.sin(TAU * (hours / c.periodHours) + phaseOffset);
  }
  return height;
};

export const computeTideState = ({
  timestampMs,
  spaceId = 'global',
  rangeOverride,
}: TideInput): TideState => {
  const hours = timestampMs / 3_600_000;
  const height = computeTideHeight(hours, spaceId);

  let range = 0;
  const { amplitudeScale } = getTideSeed(spaceId);
  for (const c of CONSTITUENTS) {
    range += c.amplitude * amplitudeScale;
  }
  range *= 2;

  if (rangeOverride && rangeOverride > 0 && Number.isFinite(rangeOverride)) {
    const scale = range > 0 ? rangeOverride / range : 1;
    range = rangeOverride;
    return {
      height: height * scale,
      range,
      phase: ((hours / CONSTITUENTS[0].periodHours) % 1 + 1) % 1,
      trend: computeTideHeight(hours + 0.25, spaceId) - height >= 0
        ? 'rising'
        : 'falling',
    };
  }

  return {
    height,
    range,
    phase: ((hours / CONSTITUENTS[0].periodHours) % 1 + 1) % 1,
    trend:
      computeTideHeight(hours + 0.25, spaceId) - height >= 0
        ? 'rising'
        : 'falling',
  };
};
