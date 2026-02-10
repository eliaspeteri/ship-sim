import { jest } from '@jest/globals';

type ReadFileMock = (path: string) => Promise<string>;

jest.mock('fs/promises', () => {
  const readFile = jest.fn<ReadFileMock>();
  return {
    __esModule: true,
    readFile,
    default: { readFile },
  };
});

const loadModule = async (
  setupFs?: (readFile: jest.MockedFunction<ReadFileMock>) => void,
) => {
  jest.resetModules();
  const fs = await import('fs/promises');
  const readFile = (
    fs.default as unknown as {
      readFile: jest.MockedFunction<ReadFileMock>;
    }
  ).readFile;
  if (setupFs) setupFs(readFile);
  return import('../../../src/server/bathymetry');
};

describe('bathymetry', () => {
  it('loads polygons and returns depth for matching points', async () => {
    const mod = await loadModule(readFile =>
      readFile.mockResolvedValueOnce(
        JSON.stringify({
          features: [
            {
              properties: { depth: 200 },
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [-1, -1],
                    [-1, 1],
                    [1, 1],
                    [1, -1],
                    [-1, -1],
                  ],
                ],
              },
            },
            {
              properties: { depth: 50 },
              geometry: {
                type: 'MultiPolygon',
                coordinates: [
                  [
                    [
                      [0.5, 0.5],
                      [0.5, 1.5],
                      [1.5, 1.5],
                      [1.5, 0.5],
                      [0.5, 0.5],
                    ],
                  ],
                ],
              },
            },
          ],
        }),
      ),
    );
    await mod.loadBathymetry();
    expect(mod.getBathymetryDepth(0, 0)).toBe(200);
    expect(mod.getBathymetryDepth(1, 1)).toBe(50);
    expect(mod.getBathymetryDepth(10, 10)).toBe(3000);
  });

  it('returns undefined before load or with invalid coordinates', async () => {
    const mod = await loadModule();
    expect(mod.getBathymetryDepth(0, 0)).toBeUndefined();
    await mod.loadBathymetry();
    expect(mod.getBathymetryDepth(undefined, 0)).toBeUndefined();
    expect(mod.getBathymetryDepth(0, undefined)).toBeUndefined();
    expect(mod.getBathymetryDepth(Number.NaN, 0)).toBeUndefined();
  });

  it('handles load errors and keeps data unloaded', async () => {
    const mod = await loadModule(readFile =>
      readFile.mockRejectedValueOnce(new Error('no file')),
    );
    await mod.loadBathymetry();
    expect(mod.getBathymetryDepth(0, 0)).toBeUndefined();
  });
});
