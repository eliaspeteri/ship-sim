import { renderRadarFrame } from '../../../../../src/components/radar/render/renderRadarFrame';

import type { RadarRenderModel } from '../../../../../src/components/radar/render/model';

const drawRadarBackgroundMock = jest.fn();
const drawRadarTargetsMock = jest.fn();
const drawRadarOverlaysMock = jest.fn();

jest.mock('../../../../../src/components/radar/render/background', () => ({
  drawRadarBackground: (...args: unknown[]) => drawRadarBackgroundMock(...args),
}));

jest.mock('../../../../../src/components/radar/render/targets', () => ({
  drawRadarTargets: (...args: unknown[]) => drawRadarTargetsMock(...args),
}));

jest.mock('../../../../../src/components/radar/render/overlays', () => ({
  drawRadarOverlays: (...args: unknown[]) => drawRadarOverlaysMock(...args),
}));

describe('renderRadarFrame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds a render context and runs draw stages in order', () => {
    const ctx = {} as CanvasRenderingContext2D;
    const model: RadarRenderModel = {
      size: 200,
      sweepAngle: 45,
      settings: {
        band: 'X',
        range: 6,
        gain: 70,
        seaClutter: 50,
        rainClutter: 50,
        heading: 0,
        orientation: 'head-up',
        trails: true,
        trailDuration: 30,
        nightMode: false,
      },
      environment: {
        seaState: 3,
        rainIntensity: 1,
        visibility: 8,
      },
      targets: [],
      aisTargets: [],
      arpaSettings: {
        autoAcquisitionEnabled: true,
        autoAcquisitionRange: 6,
        collisionWarningTime: 15,
        collisionWarningDistance: 0.5,
        guardZoneEnabled: false,
        vectorTimeMinutes: 6,
        historyPointsCount: 10,
        relativeVectors: true,
      },
      arpaTargets: [],
      arpaEnabled: true,
      ownShip: {
        position: { lat: 0, lon: 0 },
        speed: 0,
        course: 12,
        heading: 18,
      },
      ebl: { active: false, angle: 0 },
      vrm: { active: false, distance: 0 },
      guardZone: {
        active: false,
        startAngle: 320,
        endAngle: 40,
        innerRange: 0.5,
        outerRange: 3,
      },
    };

    renderRadarFrame(ctx, model);

    expect(drawRadarBackgroundMock).toHaveBeenCalledTimes(1);
    expect(drawRadarTargetsMock).toHaveBeenCalledTimes(1);
    expect(drawRadarOverlaysMock).toHaveBeenCalledTimes(1);

    const [renderContext] = drawRadarBackgroundMock.mock.calls[0] as [
      { radius: number; radarRadius: number; rotationAngle: number },
    ];
    expect(renderContext.radius).toBe(100);
    expect(renderContext.radarRadius).toBe(98);
    expect(renderContext.rotationAngle).toBe(18);
  });
});
