import type { Rules } from '../types/rules.types';

export type RulesetAuditEntry = {
  message: string;
  meta: {
    spaceId: string;
    spaceName: string;
    changedBy?: string | null;
    previousRulesetType?: string | null;
    nextRulesetType?: string | null;
    rulesChanged: boolean;
  };
};

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return null;
  }
};

export const buildRulesetAuditEntry = (input: {
  spaceId: string;
  spaceName: string;
  previousRulesetType?: string | null;
  nextRulesetType?: string | null;
  previousRules?: Rules | null;
  nextRules?: Rules | null;
  changedBy?: string | null;
}): RulesetAuditEntry | null => {
  const rulesetChanged =
    input.nextRulesetType !== undefined &&
    input.nextRulesetType !== input.previousRulesetType;

  const prevRules = safeStringify(input.previousRules ?? null);
  const nextRules = safeStringify(input.nextRules ?? null);
  const rulesChanged =
    input.nextRules !== undefined &&
    prevRules !== null &&
    nextRules !== null &&
    prevRules !== nextRules;

  if (!rulesetChanged && !rulesChanged) return null;

  return {
    message: 'Space ruleset updated',
    meta: {
      spaceId: input.spaceId,
      spaceName: input.spaceName,
      changedBy: input.changedBy ?? null,
      previousRulesetType: input.previousRulesetType ?? null,
      nextRulesetType: input.nextRulesetType ?? null,
      rulesChanged,
    },
  };
};
