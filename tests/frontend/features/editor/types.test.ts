import {
  isBBoxBounds,
  isPolygonBounds,
} from '../../../../src/features/editor/types';

describe('editor types guards', () => {
  it('detects polygon and bbox bounds', () => {
    const polygon = {
      type: 'polygon' as const,
      coordinates: [
        [60, 24],
        [61, 25],
      ],
    };
    const bbox = {
      type: 'bbox' as const,
      minLat: 60,
      minLon: 24,
      maxLat: 61,
      maxLon: 25,
    };

    expect(isPolygonBounds(polygon)).toBe(true);
    expect(isBBoxBounds(polygon)).toBe(false);
    expect(isBBoxBounds(bbox)).toBe(true);
    expect(isPolygonBounds(bbox)).toBe(false);
  });
});
