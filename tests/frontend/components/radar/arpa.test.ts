import {
  DEFAULT_ARPA_SETTINGS,
  calculateCPA,
  isCollisionRisk,
  getTargetStatus,
  convertToARPATarget,
  updateARPATarget,
  calculateDistanceBetweenPoints,
  calculateBearingBetweenPoints,
  autoAcquireTargets,
  processRadarTargets,
  getVectorEndpoint,
  ARPATargetStatus,
} from '../../../../src/components/radar/arpa';
import { RadarTarget } from '../../../../src/components/radar/types';

const ownShip = {
  position: { lat: 0, lon: 0 },
  course: 90,
  speed: 10,
  heading: 90,
};

const baseTarget: RadarTarget = {
  id: 't1',
  distance: 5,
  bearing: 90,
  size: 0.7,
  speed: 10,
  course: 90,
  type: 'ship',
};

describe('arpa helpers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calculateCPA returns infinity when relative velocity is near zero', () => {
    const result = calculateCPA(baseTarget, ownShip);
    expect(result.tcpa).toBe(Infinity);
    expect(result.cpa).toBe(baseTarget.distance);
  });

  it('calculateDistanceBetweenPoints and bearing utilities work', () => {
    const distance = calculateDistanceBetweenPoints(1, 0, 1, 90);
    expect(distance).toBeGreaterThan(0);
    const bearing = calculateBearingBetweenPoints(1, 0, 1, 90);
    expect(bearing).toBeGreaterThan(0);
  });

  it('identifies collision risk', () => {
    const target = {
      ...convertToARPATarget(baseTarget, ownShip),
      cpa: 0.2,
      tcpa: 10,
    };
    expect(isCollisionRisk(target, DEFAULT_ARPA_SETTINGS)).toBe(true);
  });

  it('getTargetStatus handles acquiring, lost, and dangerous', () => {
    const now = new Date('2024-01-01T00:00:00Z');
    const target = {
      ...convertToARPATarget(baseTarget, ownShip),
      acquiredTime: new Date(now.getTime() - 10 * 1000),
      lastUpdatedTime: now,
    };
    expect(getTargetStatus(target, DEFAULT_ARPA_SETTINGS)).toBe(
      ARPATargetStatus.ACQUIRING,
    );

    const lost = {
      ...target,
      acquiredTime: new Date(now.getTime() - 40 * 1000),
      lastUpdatedTime: new Date(now.getTime() - 120 * 1000),
    };
    expect(getTargetStatus(lost, DEFAULT_ARPA_SETTINGS)).toBe(
      ARPATargetStatus.LOST,
    );

    const dangerous = {
      ...target,
      acquiredTime: new Date(now.getTime() - 40 * 1000),
      lastUpdatedTime: now,
      cpa: 0.2,
      tcpa: 10,
    };
    expect(getTargetStatus(dangerous, DEFAULT_ARPA_SETTINGS)).toBe(
      ARPATargetStatus.DANGEROUS,
    );
  });

  it('convertToARPATarget builds initial tracking data', () => {
    const arpa = convertToARPATarget(baseTarget, ownShip);
    expect(arpa.trackId).toBe(`ARPA-${baseTarget.id}`);
    expect(arpa.historicalPositions.length).toBe(1);
  });

  it('updateARPATarget computes course/speed from history', () => {
    const arpa = convertToARPATarget(baseTarget, ownShip);
    arpa.historicalPositions = [
      {
        distance: 1,
        bearing: 0,
        timestamp: new Date('2024-01-01T00:00:00Z'),
      },
    ];
    arpa.calculatedCourse = 5;
    arpa.calculatedSpeed = 1;

    jest.setSystemTime(new Date('2024-01-01T01:00:00Z'));

    const updated = updateARPATarget(
      arpa,
      { ...baseTarget, distance: 1, bearing: 90, course: 0, speed: 0 },
      ownShip,
    );

    expect(updated.historicalPositions.length).toBe(2);
    expect(updated.calculatedSpeed).toBeGreaterThan(0);
    expect(updated.calculatedCourse).toBeGreaterThanOrEqual(0);
  });

  it('autoAcquireTargets adds new non-land targets in range', () => {
    const result = autoAcquireTargets(
      [baseTarget, { ...baseTarget, id: 'land', type: 'land' }],
      [],
      { ...DEFAULT_ARPA_SETTINGS, autoAcquisitionRange: 6 },
      ownShip,
    );
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(baseTarget.id);
  });

  it('processRadarTargets retains recently seen targets', () => {
    const tracked = convertToARPATarget(baseTarget, ownShip);
    tracked.lastUpdatedTime = new Date('2024-01-01T00:00:30Z');

    jest.setSystemTime(new Date('2024-01-01T00:01:00Z'));

    const result = processRadarTargets(
      [],
      [tracked],
      DEFAULT_ARPA_SETTINGS,
      ownShip,
    );

    expect(result.length).toBe(1);
  });

  it('getVectorEndpoint returns relative and true vectors', () => {
    const target = convertToARPATarget(baseTarget, ownShip);

    const relative = getVectorEndpoint(target, DEFAULT_ARPA_SETTINGS, ownShip);
    expect(relative.distance).toBeGreaterThan(0);

    const trueVector = getVectorEndpoint(
      target,
      { ...DEFAULT_ARPA_SETTINGS, relativeVectors: false },
      ownShip,
    );
    expect(trueVector.distance).toBeGreaterThan(0);
  });
});
