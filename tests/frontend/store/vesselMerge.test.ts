import { defaultVesselState } from '../../../src/store/defaults';
import { mergeVesselUpdate } from '../../../src/store/slices/vesselMerge';

describe('mergeVesselUpdate', () => {
  it('merges station assignment into helm and station map', () => {
    const next = mergeVesselUpdate(defaultVesselState, {
      stations: { helm: { userId: 'u1', username: 'Pilot' } },
    });

    expect(next.helm?.userId).toBe('u1');
    expect(next.stations?.helm?.username).toBe('Pilot');
  });

  it('merges physics params without overwriting existing keys with undefined', () => {
    const base = mergeVesselUpdate(defaultVesselState, {
      physics: { params: { drag: 1, lift: 2 } },
    });

    const next = mergeVesselUpdate(base, {
      physics: { params: { drag: undefined, lift: 3, yaw: 4 } },
    });

    expect(next.physics?.params).toEqual({ drag: 1, lift: 3, yaw: 4 });
  });

  it('initializes missing stability defaults before applying partial update', () => {
    const base = {
      ...defaultVesselState,
      stability: undefined as unknown as typeof defaultVesselState.stability,
    };

    const next = mergeVesselUpdate(base, {
      stability: { centerOfGravity: { y: 5 } },
    });

    expect(next.stability.centerOfGravity.y).toBe(5);
    expect(next.stability.centerOfGravity.x).toBe(0);
  });
});
