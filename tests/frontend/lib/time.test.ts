import {
  estimateTimeZoneOffsetHours,
  applyOffsetToTimeOfDay,
  formatUtcOffset,
  formatTimeOfDay,
} from '../../../src/lib/time';

describe('time utilities', () => {
  describe('estimateTimeZoneOffsetHours', () => {
    it('returns null for null lon', () => {
      expect(estimateTimeZoneOffsetHours(null)).toBeNull();
    });

    it('returns null for undefined lon', () => {
      expect(estimateTimeZoneOffsetHours(undefined)).toBeNull();
    });

    it('returns null for non-finite lon', () => {
      expect(estimateTimeZoneOffsetHours(NaN)).toBeNull();
      expect(estimateTimeZoneOffsetHours(Infinity)).toBeNull();
    });

    it('calculates offset for valid lon', () => {
      expect(estimateTimeZoneOffsetHours(0)).toEqual({
        offsetHours: 0,
        label: 'UTC+0',
      });
      expect(estimateTimeZoneOffsetHours(15)).toEqual({
        offsetHours: 1,
        label: 'UTC+1',
      });
      expect(estimateTimeZoneOffsetHours(-15)).toEqual({
        offsetHours: -1,
        label: 'UTC-1',
      });
    });

    it('clamps offset to -12 to 14', () => {
      expect(estimateTimeZoneOffsetHours(-200)).toEqual({
        offsetHours: -12,
        label: 'UTC-12',
      });
      expect(estimateTimeZoneOffsetHours(200)).toEqual({
        offsetHours: 13,
        label: 'UTC+13',
      });
    });
  });

  describe('applyOffsetToTimeOfDay', () => {
    it('applies positive offset', () => {
      expect(applyOffsetToTimeOfDay(10, 2)).toBe(12);
    });

    it('applies negative offset', () => {
      expect(applyOffsetToTimeOfDay(10, -2)).toBe(8);
    });

    it('wraps around 24 hours', () => {
      expect(applyOffsetToTimeOfDay(23, 2)).toBe(1);
      expect(applyOffsetToTimeOfDay(1, -2)).toBe(23);
    });
  });

  describe('formatUtcOffset', () => {
    it('formats positive offset', () => {
      expect(formatUtcOffset(5)).toBe('UTC+5');
    });

    it('formats negative offset', () => {
      expect(formatUtcOffset(-3)).toBe('UTC-3');
    });

    it('formats zero offset', () => {
      expect(formatUtcOffset(0)).toBe('UTC+0');
    });
  });

  describe('formatTimeOfDay', () => {
    it('formats valid time', () => {
      expect(formatTimeOfDay(9.5)).toBe('09:30');
      expect(formatTimeOfDay(0)).toBe('00:00');
      expect(formatTimeOfDay(23.99)).toBe('23:59');
    });

    it('handles non-finite input', () => {
      expect(formatTimeOfDay(NaN)).toBe('00:00');
      expect(formatTimeOfDay(Infinity)).toBe('00:00');
    });

    it('wraps time of day', () => {
      expect(formatTimeOfDay(25)).toBe('01:00');
      expect(formatTimeOfDay(-1)).toBe('23:00');
    });
  });
});
