import { buildRulesetAuditEntry } from '../../../src/lib/rulesetAudit';

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

    expect(entry).toBeNull();
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

    expect(entry).not.toBeNull();
    expect(entry?.meta.previousRulesetType).toBe('CASUAL');
    expect(entry?.meta.nextRulesetType).toBe('REALISM');
    expect(entry?.meta.rulesChanged).toBe(false);
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

    expect(entry).not.toBeNull();
    expect(entry?.meta.rulesChanged).toBe(true);
  });
});
