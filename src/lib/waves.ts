import type { EnvironmentState } from '../types/environment.types';

export type WaveState = {
  amplitude: number;
  wavelength: number;
  direction: number;
  steepness: number;
  speed: number;
  k: number;
  omega: number;
};

type WaveComponent = {
  amplitude: number;
  k: number;
  omega: number;
  dirX: number;
  dirY: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const deriveWaveState = (
  environment: EnvironmentState,
  opts: { fallbackDirection?: number } = {},
): WaveState => {
  const seaState = Math.max(0, Math.min(environment.seaState ?? 0, 12));
  const windSpeed = environment.wind?.speed ?? 0;
  const waveHeight = clamp(0.2 + seaState * 0.5 + windSpeed * 0.05, 0, 8);
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

export const getWaveComponents = (wave: WaveState): WaveComponent[] => {
  const baseAmp = wave.amplitude;
  const baseK = wave.k;
  const baseOmega = wave.omega;
  const baseDir = wave.direction;

  const amplitudes = [1.0, 0.6, 0.35, 0.22, 0.16, 0.12].map(m => baseAmp * m);
  const ks = [1.0, 1.6, 2.4, 3.2, 4.4, 5.8].map(m => baseK * m);
  const omegas = [1.0, 1.5, 2.1, 2.8, 3.6, 4.6].map(m => baseOmega * m);
  const dirOffsets = [0, 0.7, -0.5, 1.6, -1.4, 2.3];

  return amplitudes.map((amp, idx) => {
    const dir = baseDir + dirOffsets[idx];
    return {
      amplitude: amp,
      k: ks[idx],
      omega: omegas[idx],
      dirX: Math.cos(dir),
      dirY: Math.sin(dir),
    };
  });
};

export const getGerstnerSample = (
  ...args: [x: number, y: number, time: number, wave: WaveState]
) => {
  const [x, y, time, wave] = args;
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

export const getCompositeWaveSample = (
  ...args: [x: number, y: number, time: number, wave: WaveState]
) => {
  const [x, y, time, wave] = args;
  const components = getWaveComponents(wave);
  let height = 0;
  let dydx = 0;
  let dydy = 0;

  components.forEach(component => {
    const phase =
      component.k * (component.dirX * x + component.dirY * y) -
      component.omega * time;
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    height += component.amplitude * s;
    const slope = component.amplitude * c * component.k;
    dydx += slope * component.dirX;
    dydy += slope * component.dirY;
  });

  return {
    height,
    normal: {
      x: -dydx,
      y: -dydy,
      z: 1,
    },
  };
};
