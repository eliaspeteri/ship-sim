import {
  deriveWaveState,
  getWaveComponents,
  getGerstnerSample,
  getCompositeWaveSample,
} from '../../src/lib/waves';

describe('waves', () => {
  it('derives wave state with fallback direction and clamped wavelength', () => {
    const wave = deriveWaveState(
      {
        wind: { speed: 5 },
        current: { speed: 0, direction: 0 },
        seaState: 4,
      } as any,
      { fallbackDirection: 1.2 },
    );

    expect(wave.direction).toBe(1.2);
    expect(wave.wavelength).toBeGreaterThanOrEqual(12);
    expect(wave.wavelength).toBeLessThanOrEqual(600);
    expect(wave.steepness).toBeGreaterThan(0);
  });

  it('builds wave components with consistent scaling', () => {
    const wave = deriveWaveState(
      {
        wind: { speed: 2, direction: 0.5 },
        current: { speed: 0, direction: 0 },
        seaState: 1,
      } as any,
      {},
    );
    const components = getWaveComponents(wave);

    expect(components).toHaveLength(6);
    expect(components[0].amplitude).toBeCloseTo(wave.amplitude, 6);
    expect(components[1].k).toBeCloseTo(wave.k * 1.6, 6);
    expect(components[1].omega).toBeCloseTo(wave.omega * 1.5, 6);
    expect(components[1].dirX).toBeCloseTo(Math.cos(wave.direction + 0.7), 6);
  });

  it('computes gerstner sample and composite sample', () => {
    const wave = deriveWaveState(
      {
        wind: { speed: 3, direction: 0 },
        current: { speed: 0, direction: 0 },
        seaState: 2,
      } as any,
      {},
    );

    const sample = getGerstnerSample(1, 2, 3, wave);
    expect(sample.normal.z).toBe(1);

    const composite = getCompositeWaveSample(1, 2, 3, wave);
    expect(composite.normal.z).toBe(1);
  });
});
