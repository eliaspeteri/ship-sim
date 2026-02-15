import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import jitiFactory from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = jitiFactory(__filename);

const { RulesetType, getDefaultRules, mapToRulesetType } = jiti(
  '../../src/types/rules.types.ts',
);

test('getDefaultRules returns correct structure for CASUAL', () => {
  const rules = getDefaultRules(RulesetType.CASUAL);
  assert.equal(rules.type, RulesetType.CASUAL);
  assert.equal(rules.assists.stability, true);
  assert.equal(rules.assists.autopilot, true);
  assert.equal(rules.assists.docking, true);
  assert.equal(rules.realism.damage, false);
  assert.equal(rules.realism.wear, false);
  assert.equal(rules.realism.failures, false);
  assert.equal(rules.enforcement.colregs, false);
  assert.equal(rules.enforcement.penalties, false);
  assert.equal(rules.enforcement.investigations, false);
  assert.deepEqual(rules.allowedVessels, []);
  assert.deepEqual(rules.allowedMods, []);
  assert.equal(rules.progression.scoring, false);
});

test('getDefaultRules returns correct structure for REALISM', () => {
  const rules = getDefaultRules(RulesetType.REALISM);
  assert.equal(rules.type, RulesetType.REALISM);
  assert.equal(rules.assists.stability, false);
  assert.equal(rules.assists.autopilot, false);
  assert.equal(rules.assists.docking, false);
  assert.equal(rules.realism.damage, true);
  assert.equal(rules.realism.wear, true);
  assert.equal(rules.realism.failures, true);
  assert.equal(rules.enforcement.colregs, true);
  assert.equal(rules.enforcement.penalties, true);
  assert.equal(rules.enforcement.investigations, true);
  assert.deepEqual(rules.allowedVessels, []);
  assert.deepEqual(rules.allowedMods, []);
  assert.equal(rules.progression.scoring, true);
});

test('getDefaultRules returns correct structure for CUSTOM', () => {
  const rules = getDefaultRules(RulesetType.CUSTOM);
  assert.equal(rules.type, RulesetType.CUSTOM);
  assert.equal(rules.assists.stability, true);
  assert.equal(rules.assists.autopilot, true);
  assert.equal(rules.assists.docking, true);
  assert.equal(rules.realism.damage, false);
  assert.equal(rules.realism.wear, false);
  assert.equal(rules.realism.failures, false);
  assert.equal(rules.enforcement.colregs, false);
  assert.equal(rules.enforcement.penalties, false);
  assert.equal(rules.enforcement.investigations, false);
  assert.deepEqual(rules.allowedVessels, []);
  assert.deepEqual(rules.allowedMods, []);
  assert.equal(rules.progression.scoring, false);
});

test('getDefaultRules returns correct structure for EXAM', () => {
  const rules = getDefaultRules(RulesetType.EXAM);
  assert.equal(rules.type, RulesetType.EXAM);
  assert.equal(rules.assists.stability, false);
  assert.equal(rules.assists.autopilot, false);
  assert.equal(rules.assists.docking, false);
  assert.equal(rules.realism.damage, true);
  assert.equal(rules.realism.wear, false);
  assert.equal(rules.realism.failures, true);
  assert.equal(rules.enforcement.colregs, true);
  assert.equal(rules.enforcement.penalties, true);
  assert.equal(rules.enforcement.investigations, true);
  assert.deepEqual(rules.allowedVessels, ['fixed']);
  assert.deepEqual(rules.allowedMods, []);
  assert.equal(rules.progression.scoring, true);
});

test('getDefaultRules throws for invalid type', () => {
  assert.throws(() => {
    getDefaultRules('INVALID');
  }, /Unexpected ruleset type/);
});

test('mapToRulesetType maps new names correctly', () => {
  assert.equal(mapToRulesetType('CASUAL'), RulesetType.CASUAL);
  assert.equal(mapToRulesetType('REALISM'), RulesetType.REALISM);
  assert.equal(mapToRulesetType('CUSTOM'), RulesetType.CUSTOM);
  assert.equal(mapToRulesetType('EXAM'), RulesetType.EXAM);
});

test('mapToRulesetType maps legacy names correctly', () => {
  assert.equal(mapToRulesetType('CASUAL_PUBLIC'), RulesetType.CASUAL);
  assert.equal(mapToRulesetType('SIM_PUBLIC'), RulesetType.REALISM);
  assert.equal(mapToRulesetType('PRIVATE_SANDBOX'), RulesetType.CUSTOM);
  assert.equal(mapToRulesetType('TRAINING_EXAM'), RulesetType.EXAM);
});

test('mapToRulesetType defaults to CASUAL for unknown', () => {
  assert.equal(mapToRulesetType('UNKNOWN'), RulesetType.CASUAL);
  assert.equal(mapToRulesetType(''), RulesetType.CASUAL);
});
