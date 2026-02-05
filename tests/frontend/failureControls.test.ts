import { applyFailureControlLimits } from '../../src/lib/failureControls';

describe('failureControls', () => {
  it('caps throttle and raises ballast when flooding', () => {
    const result = applyFailureControlLimits(
      { throttle: 1, rudderAngle: 0.5, ballast: 0.2 },
      { floodingLevel: 0.5, engineFailure: false, steeringFailure: false },
      undefined,
    );

    expect(result.throttle).toBeLessThanOrEqual(0.6);
    expect(result.ballast).toBeGreaterThanOrEqual(0.7);
  });
});
