import { EnvironmentState } from '../types/environment.types';

export type WaveState = {
  amplitude: number;
  wavelength: number;
  direction: number;
  steepness: number;
  speed: number;
  k: number;
  omega: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const deriveWaveState = (
  environment: EnvironmentState,
  opts: { fallbackDirection?: number } = {},
): WaveState => {
  const seaState = Math.max(0, Math.min(environment.seaState ?? 0, 12));
  const windSpeed = environment.wind?.speed ?? 0;
  const waveHeight =
    environment.waveHeight ??
    clamp(0.2 + seaState * 0.5 + windSpeed * 0.05, 0, 8);
  const amplitude = waveHeight / 2;
  const wavelength =
    environment.waveLength ??
    clamp(30 + seaState * 35 + windSpeed * 4, 12, 600);
  const direction =
    environment.waveDirection ??
    environment.wind?.direction ??
    opts.fallbackDirection ??
    0;
  const k = (2 * Math.PI) / Math.max(1, wavelength);
  const speed = Math.sqrt(9.81 / k);
  const omega = speed * k;
  const steepness = clamp(amplitude * k, 0.01, 0.8);

  return {
    amplitude,
    wavelength,
    direction,
    steepness,
    speed,
    k,
    omega,
  };
};

export const getGerstnerSample = (
  x: number,
  y: number,
  time: number,
  wave: WaveState,
) => {
  const dirX = Math.cos(wave.direction);
  const dirY = Math.sin(wave.direction);
  const phase = wave.k * (dirX * x + dirY * y) - wave.omega * time;
  const sin = Math.sin(phase);
  const cos = Math.cos(phase);
  const height = wave.amplitude * sin;
  const slope = wave.steepness * cos;
  return {
    height,
    normal: {
      x: -dirX * slope,
      y: -dirY * slope,
      z: 1,
    },
  };
};
