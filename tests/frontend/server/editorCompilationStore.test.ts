import fs from 'fs';

jest.mock('fs', () => {
  const promises = {
    readFile: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    rename: jest.fn(),
  };
  return {
    __esModule: true,
    default: { promises },
    promises,
  };
});

type MockedFs = {
  promises: {
    readFile: jest.Mock;
    mkdir: jest.Mock;
    writeFile: jest.Mock;
    rename: jest.Mock;
  };
};
let mockedFs = fs as unknown as MockedFs;

const loadStore = async () =>
  import('../../../src/server/editorCompilationStore');

const sampleArtifact = {
  tile: { z: 10, x: 20, y: 30 },
  layerId: 'depth',
  lod: 10,
  bytesBase64: 'YWJj',
};

describe('editorCompilationStore', () => {
  beforeEach(() => {
    jest.resetModules();
    mockedFs = jest.requireMock('fs') as MockedFs;
    mockedFs.promises.readFile.mockReset();
    mockedFs.promises.mkdir.mockReset();
    mockedFs.promises.writeFile.mockReset();
    mockedFs.promises.rename.mockReset();
    mockedFs.promises.readFile.mockRejectedValue(
      Object.assign(new Error('missing'), { code: 'ENOENT' }),
    );
    mockedFs.promises.mkdir.mockResolvedValue(undefined);
    mockedFs.promises.writeFile.mockResolvedValue(undefined);
    mockedFs.promises.rename.mockResolvedValue(undefined);
  });

  it('stores artifacts and returns timestamp', async () => {
    const toIsoSpy = jest
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValue('2026-02-08T00:00:00.000Z');
    const { storeArtifacts } = await loadStore();

    const storedAt = await storeArtifacts('pack-a', [sampleArtifact]);

    expect(storedAt).toBe('2026-02-08T00:00:00.000Z');
    expect(mockedFs.promises.mkdir).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
    expect(mockedFs.promises.writeFile).toHaveBeenCalledTimes(1);
    const serialized = mockedFs.promises.writeFile.mock.calls[0]?.[1] as string;
    const payload = JSON.parse(serialized);
    expect(payload).toEqual([
      expect.objectContaining({
        ...sampleArtifact,
        packId: 'pack-a',
        storedAt: '2026-02-08T00:00:00.000Z',
      }),
    ]);

    toIsoSpy.mockRestore();
  });

  it('loads artifacts once and filters overlay chunks by layers', async () => {
    mockedFs.promises.readFile.mockResolvedValue(
      JSON.stringify([
        {
          packId: 'pack-a',
          tile: { z: 8, x: 1, y: 2 },
          layerId: 'depth',
          lod: 8,
          bytesBase64: 'old',
          storedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );
    const { getOverlayChunks } = await loadStore();

    const chunks = await getOverlayChunks({
      packId: 'pack-a',
      tile: { z: 8, x: 1, y: 2 },
      layerIds: ['depth', 'land'],
      lod: 8,
    });
    const second = await getOverlayChunks({
      packId: 'pack-a',
      tile: { z: 8, x: 1, y: 2 },
      layerIds: ['depth'],
      lod: 8,
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual(expect.objectContaining({ layerId: 'depth' }));
    expect(second).toHaveLength(1);
    expect(mockedFs.promises.readFile).toHaveBeenCalledTimes(1);
  });

  it('handles malformed disk payload and still stores data', async () => {
    mockedFs.promises.readFile.mockResolvedValue('{not-json');
    const { getOverlayChunks, storeArtifacts } = await loadStore();

    const missing = await getOverlayChunks({
      packId: 'pack-b',
      tile: { z: 1, x: 1, y: 1 },
      layerIds: ['depth'],
      lod: 1,
    });
    await storeArtifacts('pack-b', [sampleArtifact]);

    expect(missing).toEqual([]);
    expect(mockedFs.promises.writeFile).toHaveBeenCalledTimes(1);
  });

  it('trims artifacts when limits are exceeded', async () => {
    const toIsoSpy = jest
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValue('2026-02-08T00:00:00.000Z');
    const { storeArtifacts, ARTIFACT_LIMITS } = await loadStore();

    ARTIFACT_LIMITS.maxPerPack = 2;
    ARTIFACT_LIMITS.maxTotal = 3;

    await storeArtifacts('pack-a', [
      sampleArtifact,
      { ...sampleArtifact, tile: { z: 10, x: 20, y: 31 }, layerId: 'l2' },
      { ...sampleArtifact, tile: { z: 10, x: 20, y: 32 }, layerId: 'l3' },
    ]);

    let serialized = mockedFs.promises.writeFile.mock.calls[0]?.[1] as string;
    let payload = JSON.parse(serialized);
    expect(payload).toHaveLength(2);

    await storeArtifacts('pack-b', [
      { ...sampleArtifact, tile: { z: 9, x: 10, y: 11 }, layerId: 'b1' },
      { ...sampleArtifact, tile: { z: 9, x: 10, y: 12 }, layerId: 'b2' },
    ]);

    serialized = mockedFs.promises.writeFile.mock.calls.at(-1)?.[1] as string;
    payload = JSON.parse(serialized);
    expect(payload).toHaveLength(3);

    toIsoSpy.mockRestore();
  });
});
