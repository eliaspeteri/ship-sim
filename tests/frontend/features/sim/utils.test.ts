import { bboxKey, haversineMeters } from '../../../../src/features/sim/utils';

describe('features/sim/utils', () => {
  it('computes haversine distance', () => {
    const d = haversineMeters(
      { lat: 60, lon: 24 },
      { lat: 60.001, lon: 24.001 },
    );
    expect(d).toBeGreaterThan(0);
  });

  it('builds stable bbox key', () => {
    const key = bboxKey({
      south: 1.234567,
      west: 2.345678,
      north: 3.456789,
      east: 4.567891,
    });
    expect(typeof key).toBe('string');
    expect(key.split(':')).toHaveLength(4);
  });
});
