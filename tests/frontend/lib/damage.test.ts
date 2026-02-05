import {
  DEFAULT_DAMAGE_STATE,
  applyRepair,
  computeRepairCost,
  normalizeDamageState,
} from '../../../src/lib/damage';

describe('damage helpers', () => {
  it('normalizes damage state and clamps values', () => {
    const normalized = normalizeDamageState({
      hullIntegrity: 1.5,
      engineHealth: -1,
      steeringHealth: 0.25,
      electricalHealth: 2,
      floodingDamage: -0.5,
    });

    expect(normalized).toEqual({
      hullIntegrity: 1,
      engineHealth: 0,
      steeringHealth: 0.25,
      electricalHealth: 1,
      floodingDamage: 0,
    });
  });

  it('computes repair cost from damage levels', () => {
    expect(computeRepairCost(DEFAULT_DAMAGE_STATE)).toBe(250);

    const cost = computeRepairCost({
      hullIntegrity: 0.5,
      engineHealth: 0.75,
      steeringHealth: 1,
      electricalHealth: 0,
      floodingDamage: 0.2,
    });

    expect(cost).toBeGreaterThan(250);
    expect(cost).toBe(
      Math.round(
        250 + 0.5 * 2500 + 0.25 * 2000 + 0 * 1500 + 1 * 1200 + 0.2 * 1800,
      ),
    );
  });

  it('applies full repair', () => {
    expect(applyRepair()).toEqual(DEFAULT_DAMAGE_STATE);
  });
});
