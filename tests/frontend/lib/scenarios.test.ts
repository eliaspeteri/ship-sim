import { getScenarios } from '../../../src/lib/scenarios';

describe('scenarios', () => {
  it('returns an array of scenarios', () => {
    const result = getScenarios();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns scenarios with required properties', () => {
    const result = getScenarios();
    result.forEach(scenario => {
      expect(typeof scenario.id).toBe('string');
      expect(typeof scenario.name).toBe('string');
      expect(typeof scenario.description).toBe('string');
      expect(scenario.spawn).toBeTruthy();
      expect(typeof scenario.spawn.lat).toBe('number');
      expect(typeof scenario.spawn.lon).toBe('number');
      expect(typeof scenario.spawn.z).toBe('number');
      expect(scenario.rules).toBeTruthy();
      expect(typeof scenario.rules.colregs).toBe('boolean');
      expect(typeof scenario.rules.collisionPenalty).toBe('number');
      expect(typeof scenario.rules.nearMissPenalty).toBe('number');
      expect(typeof scenario.rankRequired).toBe('number');
    });
  });

  it('includes expected scenarios', () => {
    const result = getScenarios();
    const ids = result.map(s => s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'harbor-entry',
        'colregs-crossing',
        'heavy-weather',
      ]),
    );
  });
});
