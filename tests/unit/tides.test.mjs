import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import jitiFactory from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = jitiFactory(__filename);

const { computeTideState } = jiti('../../src/lib/tides.ts');

describe('tides', () => {
  it('computes deterministic tide state for a space', () => {
    const timestampMs = Date.UTC(2024, 0, 1, 0, 0, 0);
    const first = computeTideState({ timestampMs, spaceId: 'global' });
    const second = computeTideState({ timestampMs, spaceId: 'global' });

    assert.equal(first.height, second.height);
    assert.equal(first.range, second.range);
    assert.equal(first.phase, second.phase);
    assert.equal(first.trend, second.trend);
  });

  it('keeps phase and range within expected bounds', () => {
    const tide = computeTideState({
      timestampMs: Date.UTC(2024, 4, 10, 12, 0, 0),
      spaceId: 'pacific',
    });

    assert.ok(Number.isFinite(tide.height));
    assert.ok(tide.range > 0);
    assert.ok(tide.phase >= 0 && tide.phase <= 1);
    assert.ok(tide.trend === 'rising' || tide.trend === 'falling');
    assert.ok(Math.abs(tide.height) <= tide.range / 2 + 1e-6);
  });

  it('changes with different space seeds', () => {
    const timestampMs = Date.UTC(2024, 0, 1, 6, 0, 0);
    const global = computeTideState({ timestampMs, spaceId: 'global' });
    const arctic = computeTideState({ timestampMs, spaceId: 'arctic' });

    assert.ok(
      global.height !== arctic.height ||
        global.phase !== arctic.phase ||
        global.range !== arctic.range,
    );
  });

  it('respects range overrides', () => {
    const rangeOverride = 6;
    const tide = computeTideState({
      timestampMs: Date.UTC(2024, 0, 2, 0, 0, 0),
      spaceId: 'override',
      rangeOverride,
    });

    assert.equal(tide.range, rangeOverride);
    assert.ok(Math.abs(tide.height) <= rangeOverride / 2 + 1e-6);
  });
});
