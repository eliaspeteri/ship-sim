/// <reference types="@testing-library/jest-dom" />
import {
  clamp01,
  formatBearing,
  formatDegrees,
  formatDistance,
  formatKnots,
  formatKnotsValue,
  formatTransactionReason,
} from '../../src/components/hud/format';

describe('hud formatting helpers', () => {
  it('clamps values to 0-1', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(2)).toBe(1);
  });

  it('formats bearings and degrees with normalization', () => {
    expect(formatDegrees(Math.PI / 2)).toBe('90°');
    expect(formatBearing(-30)).toBe('330°');
    expect(formatBearing(NaN)).toBe('—');
  });

  it('formats knots values and labels', () => {
    expect(formatKnotsValue(10)).toContain('kts');
    expect(formatKnots(0)).toContain('0.0 kts');
  });

  it('formats distance properly in meters and nautical miles', () => {
    expect(formatDistance(50)).toContain('m');
    expect(formatDistance(2000)).toContain('nm');
  });

  it('returns friendly transaction labels', () => {
    expect(formatTransactionReason('operating_cost')).toBe('Operating cost');
    expect(formatTransactionReason('unknown_tag')).toBe('unknown tag');
  });
});
