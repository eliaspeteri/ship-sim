import {
  polarToCartesian,
  calculateTargetVisibility,
  generateRadarNoise,
  getSeaClutterStrength,
  getRainClutterStrength,
  generateNoisePattern,
} from '../../../../src/components/radar/utils';
import {
  RadarEnvironment,
  RadarTarget,
} from '../../../../src/components/radar/types';

describe('radar utils', () => {
  const environment: RadarEnvironment = {
    seaState: 6,
    rainIntensity: 4,
    visibility: 8,
  };

  const target: RadarTarget = {
    id: 't1',
    distance: 2,
    bearing: 90,
    size: 0.8,
    speed: 10,
    course: 90,
    type: 'ship',
  };

  beforeAll(() => {
    if (!globalThis.ImageData) {
      // Minimal ImageData polyfill for tests
      // @ts-expect-error - define for test runtime
      globalThis.ImageData = class ImageData {
        data: Uint8ClampedArray;
        constructor(
          public width: number,
          public height: number,
        ) {
          this.data = new Uint8ClampedArray(width * height * 4);
        }
      };
    }
  });

  it('polarToCartesian converts to screen coordinates', () => {
    const { x, y } = polarToCartesian(0, 0, 10, 100);
    expect(x).toBe(100);
    expect(y).toBe(100);

    const right = polarToCartesian(5, 90, 10, 100);
    expect(right.x).toBeGreaterThan(100);
    expect(Math.round(right.y)).toBe(100);
  });

  it('calculateTargetVisibility accounts for band and target type', () => {
    const xBand = calculateTargetVisibility(target, 'X', 50, 0, 0, environment);
    const sBand = calculateTargetVisibility(target, 'S', 50, 0, 0, environment);
    expect(xBand).toBeGreaterThan(0);
    expect(sBand).toBeGreaterThan(0);
    expect(sBand).toBeGreaterThan(xBand);

    const land = calculateTargetVisibility(
      { ...target, type: 'land' },
      'S',
      50,
      0,
      0,
      environment,
    );
    const buoy = calculateTargetVisibility(
      { ...target, type: 'buoy' },
      'S',
      50,
      0,
      0,
      environment,
    );
    expect(land).toBeGreaterThan(buoy);
  });

  it('generateRadarNoise responds to band and environment', () => {
    const xNoise = generateRadarNoise('X', environment, 50);
    const sNoise = generateRadarNoise('S', environment, 50);
    expect(xNoise).toBeGreaterThan(sNoise);
  });

  it('getSeaClutterStrength clamps to expected range', () => {
    const strong = getSeaClutterStrength(0, 10, 10, 0);
    expect(strong).toBeLessThanOrEqual(0.8);
    const weak = getSeaClutterStrength(10, 10, 0, 100);
    expect(weak).toBe(0);
  });

  it('getRainClutterStrength clamps to expected range', () => {
    const xBand = getRainClutterStrength('X', 5, 0);
    const sBand = getRainClutterStrength('S', 5, 0);
    expect(xBand).toBeGreaterThan(sBand);
    expect(getRainClutterStrength('X', 10, 100)).toBe(0);
  });

  it('generateNoisePattern returns ImageData with alpha values', () => {
    const rand = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const image = generateNoisePattern(1, 1, 1);
    expect(image.data.length).toBe(4);
    expect(image.data[3]).toBe(255);
    rand.mockRestore();
  });
});
