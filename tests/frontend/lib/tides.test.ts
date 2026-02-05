import { computeTideState } from '../../../src/lib/tides';

describe('tides', () => {
  it('computes deterministic tide state for a space', () => {
    const timestampMs = Date.UTC(2024, 0, 1, 0, 0, 0);
    const first = computeTideState({ timestampMs, spaceId: 'global' });
    const second = computeTideState({ timestampMs, spaceId: 'global' });

    expect(first).toEqual(second);
  });

  it('keeps phase and range within expected bounds', () => {
    const tide = computeTideState({
      timestampMs: Date.UTC(2024, 4, 10, 12, 0, 0),
      spaceId: 'pacific',
    });

    expect(Number.isFinite(tide.height)).toBe(true);
    expect(tide.range).toBeGreaterThan(0);
    expect(tide.phase).toBeGreaterThanOrEqual(0);
    expect(tide.phase).toBeLessThanOrEqual(1);
    expect(['rising', 'falling']).toContain(tide.trend);
    expect(Math.abs(tide.height)).toBeLessThanOrEqual(tide.range / 2 + 1e-6);
  });

  it('changes with different space seeds', () => {
    const timestampMs = Date.UTC(2024, 0, 1, 6, 0, 0);
    const global = computeTideState({ timestampMs, spaceId: 'global' });
    const arctic = computeTideState({ timestampMs, spaceId: 'arctic' });

    expect(
      global.height !== arctic.height ||
        global.phase !== arctic.phase ||
        global.range !== arctic.range,
    ).toBe(true);
  });

  it('respects range overrides', () => {
    const rangeOverride = 6;
    const tide = computeTideState({
      timestampMs: Date.UTC(2024, 0, 2, 0, 0, 0),
      spaceId: 'override',
      rangeOverride,
    });

    expect(tide.range).toBe(rangeOverride);
    expect(Math.abs(tide.height)).toBeLessThanOrEqual(rangeOverride / 2 + 1e-6);
  });
});
