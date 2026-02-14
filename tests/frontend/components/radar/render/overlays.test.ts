import { drawRadarOverlays } from '../../../../../src/components/radar/render/overlays';

jest.mock('../../../../../src/components/radar/utils', () => ({
  getSeaClutterStrength: jest.fn(() => 0.5),
  getRainClutterStrength: jest.fn(() => 0.2),
}));

const createCtx = () =>
  ({
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    closePath: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    arc: jest.fn(),
    setLineDash: jest.fn(),
    createRadialGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
  }) as unknown as CanvasRenderingContext2D;

describe('drawRadarOverlays', () => {
  it('renders all overlay layers when toggles and weather are active', () => {
    const ctx = createCtx();
    const randomSpy = jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.2)
      .mockReturnValue(0.3);

    drawRadarOverlays(
      { ctx, radius: 100, radarRadius: 95, rotationAngle: 15 },
      {
        sweepAngle: 45,
        settings: {
          range: 12,
          band: 'X',
          seaClutter: 60,
          rainClutter: 60,
          nightMode: true,
        },
        environment: {
          seaState: 4,
          rainIntensity: 0.8,
        },
        guardZone: {
          active: true,
          startAngle: 300,
          endAngle: 20,
          innerRange: 1,
          outerRange: 4,
        },
        ebl: { active: true, angle: 75 },
        vrm: { active: true, distance: 3 },
      } as any,
    );

    expect(ctx.createRadialGradient).toHaveBeenCalled();
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.setLineDash).toHaveBeenCalled();
    randomSpy.mockRestore();
  });

  it('skips clutter and optional overlays when disabled', () => {
    const ctx = createCtx();

    drawRadarOverlays({ ctx, radius: 100, radarRadius: 95, rotationAngle: 0 }, {
      sweepAngle: 90,
      settings: {
        range: 6,
        band: 'S',
        seaClutter: 0,
        rainClutter: 0,
        nightMode: false,
      },
      environment: {
        seaState: 0,
        rainIntensity: 0,
      },
      guardZone: {
        active: false,
        startAngle: 0,
        endAngle: 0,
        innerRange: 0,
        outerRange: 0,
      },
      ebl: { active: false, angle: 0 },
      vrm: { active: false, distance: 0 },
    } as any);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });
});
