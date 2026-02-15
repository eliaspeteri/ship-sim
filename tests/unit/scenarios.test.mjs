import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import jitiFactory from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = jitiFactory(__filename);

const { getScenarios } = jiti('../../src/lib/scenarios.ts');

describe('scenarios', () => {
  describe('getScenarios', () => {
    it('returns an array of scenarios', () => {
      const result = getScenarios();
      assert(Array.isArray(result));
      assert(result.length > 0);
    });

    it('returns scenarios with required properties', () => {
      const result = getScenarios();
      result.forEach(scenario => {
        assert(typeof scenario.id === 'string');
        assert(typeof scenario.name === 'string');
        assert(typeof scenario.description === 'string');
        assert(scenario.spawn);
        assert(typeof scenario.spawn.lat === 'number');
        assert(typeof scenario.spawn.lon === 'number');
        assert(typeof scenario.spawn.z === 'number');
        assert(scenario.rules);
        assert(typeof scenario.rules.colregs === 'boolean');
        assert(typeof scenario.rules.collisionPenalty === 'number');
        assert(typeof scenario.rules.nearMissPenalty === 'number');
        assert(typeof scenario.rankRequired === 'number');
      });
    });

    it('includes expected scenarios', () => {
      const result = getScenarios();
      const ids = result.map(s => s.id);
      assert(ids.includes('harbor-entry'));
      assert(ids.includes('colregs-crossing'));
      assert(ids.includes('heavy-weather'));
    });
  });
});
