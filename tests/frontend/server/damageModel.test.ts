import {
  applyCollisionDamage,
  applyFailureWear,
  applyGroundingDamage,
  mergeDamageState,
} from '../../../src/server/damageModel';
import { DEFAULT_DAMAGE_STATE } from '../../../src/lib/damage';

describe('damageModel', () => {
  it('applies collision damage with clamped severity', () => {
    const damaged = applyCollisionDamage(DEFAULT_DAMAGE_STATE, 2);
    expect(damaged.hullIntegrity).toBeLessThan(1);
    expect(damaged.engineHealth).toBeLessThan(1);
    expect(damaged.floodingDamage).toBeGreaterThan(0);
  });

  it('applies grounding damage only for positive dt', () => {
    const unchanged = applyGroundingDamage(DEFAULT_DAMAGE_STATE, -1, 1);
    expect(unchanged).toEqual(DEFAULT_DAMAGE_STATE);
    const damaged = applyGroundingDamage(DEFAULT_DAMAGE_STATE, 10, 1);
    expect(damaged.hullIntegrity).toBeLessThan(1);
    expect(damaged.floodingDamage).toBeGreaterThan(0);
  });

  it('applies failure wear to engine and steering', () => {
    const damaged = applyFailureWear(DEFAULT_DAMAGE_STATE, true, false);
    expect(damaged.engineHealth).toBeLessThan(1);
    expect(damaged.steeringHealth).toBe(1);
  });

  it('merges damage state with normalization', () => {
    const merged = mergeDamageState({
      hullIntegrity: 2,
      engineHealth: -1,
      steeringHealth: 0.5,
      electricalHealth: 0.25,
      floodingDamage: 2,
    });
    expect(merged.hullIntegrity).toBe(1);
    expect(merged.engineHealth).toBe(0);
    expect(merged.floodingDamage).toBe(1);
  });
});
