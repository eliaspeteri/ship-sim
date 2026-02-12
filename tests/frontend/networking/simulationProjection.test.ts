import {
  hasVesselChanged,
  resolvePreferredSelfId,
} from '../../../src/networking/socket/simulationProjection';

const vessel = {
  id: 'v-1',
  ownerId: 'u-1',
  crewIds: ['u-1'],
  position: { lat: 1, lon: 2, x: 10, y: 20, z: 0 },
  orientation: { heading: 0, roll: 0, pitch: 0 },
  velocity: { surge: 0, sway: 0, heave: 0 },
  controls: { throttle: 0, rudderAngle: 0, ballast: 0 },
};

describe('simulationProjection', () => {
  it('detects meaningful vessel deltas', () => {
    expect(hasVesselChanged(vessel, { ...vessel })).toBe(false);
    expect(
      hasVesselChanged(vessel, {
        ...vessel,
        position: { ...vessel.position, x: 11 },
      }),
    ).toBe(true);
  });

  it('resolves preferred self vessel from explicit and crew ownership hints', () => {
    const vessels = {
      'v-1_extra': vessel,
      'v-2': {
        ...vessel,
        id: 'v-2',
        ownerId: 'u-2',
        crewIds: ['u-2'],
      },
    };

    expect(
      resolvePreferredSelfId({
        requestedVesselId: 'v-1',
        vessels,
        selfUserId: 'u-1',
      }),
    ).toBe('v-1_extra');

    expect(
      resolvePreferredSelfId({
        requestedVesselId: undefined,
        vessels,
        selfUserId: 'u-1',
      }),
    ).toBe('v-1_extra');
  });
});
