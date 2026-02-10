import { buildRulesetAuditEntry } from '../../../src/lib/rulesetAudit';
import { getDefaultRules, RulesetType } from '../../../src/types/rules.types';

describe('rulesetAudit', () => {
  it('returns null when no changes', () => {
    const baseRules = getDefaultRules(RulesetType.CASUAL);
    const entry = buildRulesetAuditEntry({
      spaceId: 'space-1',
      spaceName: 'Test',
      previousRulesetType: RulesetType.CASUAL,
      nextRulesetType: RulesetType.CASUAL,
      previousRules: baseRules,
      nextRules: baseRules,
      changedBy: 'user-1',
    });

    expect(entry).toBeNull();
  });

  it('records ruleset type changes', () => {
    const baseRules = getDefaultRules(RulesetType.CASUAL);
    const entry = buildRulesetAuditEntry({
      spaceId: 'space-1',
      spaceName: 'Test',
      previousRulesetType: RulesetType.CASUAL,
      nextRulesetType: RulesetType.REALISM,
      previousRules: baseRules,
      nextRules: baseRules,
      changedBy: 'user-1',
    });

    expect(entry).not.toBeNull();
    expect(entry?.meta.previousRulesetType).toBe('CASUAL');
    expect(entry?.meta.nextRulesetType).toBe('REALISM');
    expect(entry?.meta.rulesChanged).toBe(false);
  });

  it('records rules changes', () => {
    const baseRules = getDefaultRules(RulesetType.CASUAL);
    const entry = buildRulesetAuditEntry({
      spaceId: 'space-1',
      spaceName: 'Test',
      previousRulesetType: RulesetType.CASUAL,
      nextRulesetType: RulesetType.CASUAL,
      previousRules: {
        ...baseRules,
        assists: { ...baseRules.assists, docking: true },
      },
      nextRules: {
        ...baseRules,
        assists: { ...baseRules.assists, docking: false },
      },
      changedBy: 'user-1',
    });

    expect(entry).not.toBeNull();
    expect(entry?.meta.rulesChanged).toBe(true);
  });
});
