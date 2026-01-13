import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import createJiti from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = createJiti(__filename);

const {
  estimateTimeZoneOffsetHours,
  applyOffsetToTimeOfDay,
  formatUtcOffset,
  formatTimeOfDay,
} = jiti('../../src/lib/time.ts');

describe('time', () => {
  describe('estimateTimeZoneOffsetHours', () => {
    it('returns null for null lon', () => {
      assert.equal(estimateTimeZoneOffsetHours(null), null);
    });

    it('returns null for undefined lon', () => {
      assert.equal(estimateTimeZoneOffsetHours(undefined), null);
    });

    it('returns null for non-finite lon', () => {
      assert.equal(estimateTimeZoneOffsetHours(NaN), null);
      assert.equal(estimateTimeZoneOffsetHours(Infinity), null);
    });

    it('calculates offset for valid lon', () => {
      assert.deepEqual(estimateTimeZoneOffsetHours(0), {
        offsetHours: 0,
        label: 'UTC+0',
      });
      assert.deepEqual(estimateTimeZoneOffsetHours(15), {
        offsetHours: 1,
        label: 'UTC+1',
      });
      assert.deepEqual(estimateTimeZoneOffsetHours(-15), {
        offsetHours: -1,
        label: 'UTC-1',
      });
    });

    it('clamps offset to -12 to 14', () => {
      assert.deepEqual(estimateTimeZoneOffsetHours(-200), {
        offsetHours: -12,
        label: 'UTC-12',
      });
      assert.deepEqual(estimateTimeZoneOffsetHours(200), {
        offsetHours: 13,
        label: 'UTC+13',
      });
    });
  });

  describe('applyOffsetToTimeOfDay', () => {
    it('applies positive offset', () => {
      assert.equal(applyOffsetToTimeOfDay(10, 2), 12);
    });

    it('applies negative offset', () => {
      assert.equal(applyOffsetToTimeOfDay(10, -2), 8);
    });

    it('wraps around 24 hours', () => {
      assert.equal(applyOffsetToTimeOfDay(23, 2), 1);
      assert.equal(applyOffsetToTimeOfDay(1, -2), 23);
    });
  });

  describe('formatUtcOffset', () => {
    it('formats positive offset', () => {
      assert.equal(formatUtcOffset(5), 'UTC+5');
    });

    it('formats negative offset', () => {
      assert.equal(formatUtcOffset(-3), 'UTC-3');
    });

    it('formats zero offset', () => {
      assert.equal(formatUtcOffset(0), 'UTC+0');
    });
  });

  describe('formatTimeOfDay', () => {
    it('formats valid time', () => {
      assert.equal(formatTimeOfDay(9.5), '09:30');
      assert.equal(formatTimeOfDay(0), '00:00');
      assert.equal(formatTimeOfDay(23.99), '23:59');
    });

    it('handles non-finite input', () => {
      assert.equal(formatTimeOfDay(NaN), '00:00');
      assert.equal(formatTimeOfDay(Infinity), '00:00');
    });

    it('wraps time of day', () => {
      assert.equal(formatTimeOfDay(25), '01:00');
      assert.equal(formatTimeOfDay(-1), '23:00');
    });
  });
});
