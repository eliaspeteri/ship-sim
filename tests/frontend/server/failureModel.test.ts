import { updateFailureState } from '../../../src/server/failureModel';

describe('failureModel', () => {
  it('returns early when failures are disabled', () => {
    const result = updateFailureState({
      state: { floodingLevel: 0.2 },
      dt: 1,
      nowMs: 0,
      throttle: 1,
      rudderAngle: 1,
      speed: 5,
      failuresEnabled: false,
    });
    expect(result.triggered.engineFailure).toBe(false);
    expect(result.state.floodingLevel).toBeCloseTo(0.2);
  });

  it('triggers engine and steering failures based on rng', () => {
    const rng = jest.fn().mockReturnValue(0);
    const result = updateFailureState({
      dt: 1000,
      nowMs: 1000,
      throttle: 1,
      rudderAngle: 1,
      speed: 6,
      failuresEnabled: true,
      rng,
    });
    expect(result.triggered.engineFailure).toBe(true);
    expect(result.triggered.steeringFailure).toBe(true);
  });

  it('adds flooding when depth is shallow and drains when idle', () => {
    const flooded = updateFailureState({
      state: { floodingLevel: 0 },
      dt: 10,
      nowMs: 1000,
      throttle: 0.5,
      rudderAngle: 0,
      speed: 2,
      waterDepth: 5,
      draft: 5,
      failuresEnabled: true,
      rng: () => 1,
    });
    expect(flooded.triggered.flooding).toBe(true);
    const drained = updateFailureState({
      state: { floodingLevel: 0.5 },
      dt: 10,
      nowMs: 2000,
      throttle: 0,
      rudderAngle: 0,
      speed: 0,
      failuresEnabled: true,
      rng: () => 1,
    });
    expect(drained.state.floodingLevel).toBeLessThan(0.5);
  });

  it('recovers failures after minimum delay', () => {
    const now = 200_000;
    const rng = jest.fn().mockReturnValue(0);
    const result = updateFailureState({
      state: {
        engineFailure: true,
        steeringFailure: true,
        floodingLevel: 0,
        engineFailureAt: 1,
        steeringFailureAt: 1,
      },
      dt: 10,
      nowMs: now,
      throttle: 0,
      rudderAngle: 0,
      speed: 0,
      failuresEnabled: true,
      rng,
    });
    expect(result.triggered.engineRecovered).toBe(true);
    expect(result.triggered.steeringRecovered).toBe(true);
  });
});
