import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import createJiti from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = createJiti(__filename);

const { buildRulesetAuditEntry } = jiti('../../src/lib/rulesetAudit.ts');

describe('rulesetAudit', () => {
  it('returns null when no changes', () => {
    const entry = buildRulesetAuditEntry({
      spaceId: 'space-1',
      spaceName: 'Test',
      previousRulesetType: 'CASUAL',
      nextRulesetType: 'CASUAL',
      previousRules: { type: 'CASUAL' },
      nextRules: { type: 'CASUAL' },
      changedBy: 'user-1',
    });

    assert.equal(entry, null);
  });

  it('records ruleset type changes', () => {
    const entry = buildRulesetAuditEntry({
      spaceId: 'space-1',
      spaceName: 'Test',
      previousRulesetType: 'CASUAL',
      nextRulesetType: 'REALISM',
      previousRules: { type: 'CASUAL' },
      nextRules: { type: 'CASUAL' },
      changedBy: 'user-1',
    });

    assert.ok(entry);
    assert.equal(entry.meta.previousRulesetType, 'CASUAL');
    assert.equal(entry.meta.nextRulesetType, 'REALISM');
    assert.equal(entry.meta.rulesChanged, false);
  });

  it('records rules changes', () => {
    const entry = buildRulesetAuditEntry({
      spaceId: 'space-1',
      spaceName: 'Test',
      previousRulesetType: 'CASUAL',
      nextRulesetType: 'CASUAL',
      previousRules: { type: 'CASUAL', assists: { docking: true } },
      nextRules: { type: 'CASUAL', assists: { docking: false } },
      changedBy: 'user-1',
    });

    assert.ok(entry);
    assert.equal(entry.meta.rulesChanged, true);
  });
});
