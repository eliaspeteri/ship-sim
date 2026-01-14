import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import createJiti from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = createJiti(__filename);

const { DEFAULT_DAMAGE_STATE, computeRepairCost, applyRepair } = jiti(
  '../../src/lib/damage.ts',
);
const { applyCollisionDamage, applyGroundingDamage, applyFailureWear } = jiti(
  '../../src/server/damageModel.ts',
);

describe('damageModel', () => {
  it('applies collision damage', () => {
    const damaged = applyCollisionDamage(DEFAULT_DAMAGE_STATE, 0.8);
    assert.ok(damaged.hullIntegrity < 1);
    assert.ok(damaged.steeringHealth < 1);
  });

  it('applies grounding damage over time', () => {
    const damaged = applyGroundingDamage(DEFAULT_DAMAGE_STATE, 10, 1);
    assert.ok(damaged.hullIntegrity < 1);
    assert.ok(damaged.floodingDamage > 0);
  });

  it('applies failure wear', () => {
    const damaged = applyFailureWear(DEFAULT_DAMAGE_STATE, true, true);
    assert.ok(damaged.engineHealth < 1);
    assert.ok(damaged.steeringHealth < 1);
  });

  it('computes repair cost and applies repair', () => {
    const damaged = applyCollisionDamage(DEFAULT_DAMAGE_STATE, 0.5);
    const cost = computeRepairCost(damaged);
    assert.ok(cost > 0);
    const repaired = applyRepair(damaged);
    assert.deepEqual(repaired, DEFAULT_DAMAGE_STATE);
  });
});
