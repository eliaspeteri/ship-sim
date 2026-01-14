import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import createJiti from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = createJiti(__filename);

const { applyFailureControlLimits } = jiti('../../src/lib/failureControls.ts');

describe('failureControls', () => {
  it('forces throttle and rudder on failures', () => {
    const result = applyFailureControlLimits(
      { throttle: 0.8, rudderAngle: 0.4 },
      {
        engineFailure: true,
        steeringFailure: true,
        floodingLevel: 0,
      },
    );

    assert.equal(result.throttle, 0);
    assert.equal(result.rudderAngle, 0);
  });

  it('caps throttle and raises ballast for flooding', () => {
    const result = applyFailureControlLimits(
      { throttle: 1, ballast: 0.5 },
      {
        engineFailure: false,
        steeringFailure: false,
        floodingLevel: 0.6,
      },
    );

    assert.ok(result.throttle < 1);
    assert.ok((result.ballast ?? 0) > 0.5);
  });

  it('limits controls based on damage', () => {
    const result = applyFailureControlLimits(
      { throttle: 1, rudderAngle: 0.6 },
      { engineFailure: false, steeringFailure: false, floodingLevel: 0 },
      {
        hullIntegrity: 0.8,
        engineHealth: 0.4,
        steeringHealth: 0.5,
        electricalHealth: 0.9,
        floodingDamage: 0.1,
      },
    );

    assert.ok(result.throttle <= 0.4);
    assert.ok(result.rudderAngle < 0.6);
  });
});
