import { ARPATargetStatus } from '../../../../../src/components/radar/arpa';
import {
  drawRadarTargets,
  getArpaTargetColor,
  isTargetInGuardZone,
} from '../../../../../src/components/radar/render/targets';
import type { RadarRenderModel } from '../../../../../src/components/radar/render/model';

jest.mock('../../../../../src/components/radar/utils', () => ({
  calculateTargetVisibility: jest.fn(() => 1),
  polarToCartesian: jest.fn((distance: number) => ({
    x: distance,
    y: distance,
  })),
}));

jest.mock('../../../../../src/components/radar/arpa', () => ({
  ARPATargetStatus: {
    DANGEROUS: 'DANGEROUS',
    LOST: 'LOST',
    ACQUIRING: 'ACQUIRING',
    TRACKING: 'TRACKING',
  },
  getTargetStatus: jest.fn(() => 'DANGEROUS'),
  getVectorEndpoint: jest.fn(() => ({ distance: 1, bearing: 0 })),
}));

const createCtx = () =>
  ({
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    arc: jest.fn(),
    rect: jest.fn(),
    setLineDash: jest.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
  }) as unknown as CanvasRenderingContext2D;

describe('radar render target helpers', () => {
  it('detects targets inside wrapped guard-zone angles', () => {
    const guardZone = {
      active: true,
      startAngle: 320,
      endAngle: 40,
      innerRange: 0.5,
      outerRange: 3,
    };

    expect(
      isTargetInGuardZone(guardZone, { bearing: 350, distance: 1.2 }),
    ).toBe(true);
    expect(isTargetInGuardZone(guardZone, { bearing: 20, distance: 2.2 })).toBe(
      true,
    );
    expect(isTargetInGuardZone(guardZone, { bearing: 90, distance: 1.2 })).toBe(
      false,
    );
    expect(
      isTargetInGuardZone(guardZone, { bearing: 350, distance: 4.2 }),
    ).toBe(false);
    expect(
      isTargetInGuardZone(
        { ...guardZone, active: false },
        { bearing: 0, distance: 1 },
      ),
    ).toBe(false);
  });

  it('maps ARPA statuses to stable colors', () => {
    expect(getArpaTargetColor(ARPATargetStatus.DANGEROUS)).toBe('#FF3333');
    expect(getArpaTargetColor(ARPATargetStatus.LOST)).toBe('#888888');
    expect(getArpaTargetColor(ARPATargetStatus.ACQUIRING)).toBe('#FFAA33');
    expect(getArpaTargetColor(ARPATargetStatus.TRACKING)).toBe('#55FF55');
  });

  it('draws radar targets, tracked overlays, land returns, and AIS symbols', () => {
    const ctx = createCtx();
    drawRadarTargets({ ctx, rotationAngle: 0, radarRadius: 100, radius: 100 }, {
      settings: {
        range: 12,
        band: 'X',
        gain: 70,
        seaClutter: 30,
        rainClutter: 10,
        nightMode: false,
      },
      environment: { seaState: 2, rainIntensity: 0, visibility: 8 },
      guardZone: {
        active: true,
        startAngle: 300,
        endAngle: 60,
        innerRange: 0.5,
        outerRange: 5,
      },
      targets: [
        {
          id: 'tracked-1',
          distance: 1.5,
          bearing: 10,
          size: 0.6,
          type: 'vessel',
          isTracked: true,
        },
        {
          id: 'land-1',
          distance: 2,
          bearing: 30,
          size: 0.4,
          type: 'land',
          isTracked: false,
        },
        {
          id: 'far',
          distance: 20,
          bearing: 0,
          size: 0.2,
          type: 'vessel',
          isTracked: false,
        },
      ],
      aisTargets: [
        {
          id: 'ais-1',
          distance: 1,
          bearing: 20,
          heading: 10,
          course: 10,
        },
      ],
      arpaEnabled: true,
      arpaTargets: [
        {
          id: 'tracked-1',
          historicalPositions: [
            { distance: 1.2, bearing: 8 },
            { distance: 1.3, bearing: 9 },
            { distance: 1.4, bearing: 10 },
          ],
        },
      ],
      arpaSettings: {
        historyPointsCount: 5,
        vectorTimeMinutes: 6,
      },
      ownShip: {
        position: { lat: 0, lon: 0 },
        speed: 0,
        course: 0,
        heading: 0,
      },
    } as unknown as RadarRenderModel);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.setLineDash).toHaveBeenCalled();
    expect(ctx.translate).toHaveBeenCalled();
    expect(ctx.rotate).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });
});
