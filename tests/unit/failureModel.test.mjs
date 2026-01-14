import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import createJiti from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = createJiti(__filename);

const { updateFailureState } = jiti('../../src/server/failureModel.ts');

describe('failureModel', () => {
  it('triggers engine failure under stress', () => {
    const result = updateFailureState({
      state: null,
      dt: 60,
      nowMs: Date.now(),
      throttle: 1,
      rudderAngle: 0,
      speed: 5,
      failuresEnabled: true,
      rng: () => 0,
    });

    assert.equal(result.state.engineFailure, true);
    assert.equal(result.triggered.engineFailure, true);
  });

  it('increases flooding when grounded', () => {
    const result = updateFailureState({
      state: { floodingLevel: 0 },
      dt: 10,
      nowMs: Date.now(),
      throttle: 0,
      rudderAngle: 0,
      speed: 0,
      waterDepth: 5,
      draft: 6,
      failuresEnabled: true,
      rng: () => 1,
    });

    assert.ok(result.state.floodingLevel > 0);
    assert.equal(result.triggered.flooding, true);
  });

  it('repairs engine failures over time when stopped', () => {
    const now = Date.now();
    const result = updateFailureState({
      state: {
        engineFailure: true,
        engineFailureAt: now - 200_000,
        steeringFailure: false,
        floodingLevel: 0,
      },
      dt: 120,
      nowMs: now,
      throttle: 0,
      rudderAngle: 0,
      speed: 0,
      failuresEnabled: true,
      rng: () => 0,
    });

    assert.equal(result.state.engineFailure, false);
    assert.equal(result.triggered.engineRecovered, true);
  });
});
