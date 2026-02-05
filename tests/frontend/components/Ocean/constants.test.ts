import * as constants from '../../../../src/components/Ocean/constants';

describe('Ocean constants', () => {
  it('exposes expected numeric values', () => {
    expect(constants.BASE_AMPLITUDE).toBe(0.025);
    expect(constants.AMPLITUDE_PER_SEASTATE).toBe(1);
    expect(constants.MAX_AMPLITUDE).toBeGreaterThan(constants.BASE_AMPLITUDE);

    expect(constants.BASE_FREQUENCY).toBe(1.07);
    expect(constants.MIN_FREQUENCY).toBeLessThan(constants.BASE_FREQUENCY);

    expect(constants.BASE_SPEED).toBe(0.2);
    expect(constants.MAX_SPEED).toBeGreaterThan(constants.BASE_SPEED);

    expect(constants.BASE_PERSISTENCE).toBe(0.1);
    expect(constants.MAX_PERSISTENCE).toBeGreaterThan(
      constants.BASE_PERSISTENCE,
    );

    expect(constants.BASE_LACUNARITY).toBe(1.18);
    expect(constants.MAX_LACUNARITY).toBeGreaterThan(constants.BASE_LACUNARITY);

    expect(constants.BASE_PEAK_THRESHOLD).toBe(0.12);
    expect(constants.MAX_PEAK_THRESHOLD).toBeGreaterThan(
      constants.BASE_PEAK_THRESHOLD,
    );

    expect(constants.BASE_TROUGH_THRESHOLD).toBe(-0.01);
    expect(constants.MIN_TROUGH_THRESHOLD).toBeLessThan(
      constants.BASE_TROUGH_THRESHOLD,
    );

    expect(constants.SMOOTHING_SPEED).toBe(1.5);
  });
});
