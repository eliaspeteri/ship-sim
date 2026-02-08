import fs from 'fs';

jest.mock('fs', () => {
  const mocked = {
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
  };
  return {
    __esModule: true,
    default: mocked,
    ...mocked,
  };
});

type MockedFs = {
  existsSync: jest.Mock;
  readFileSync: jest.Mock;
  mkdirSync: jest.Mock;
  writeFileSync: jest.Mock;
};
let mockedFs = fs as unknown as MockedFs;

const loadStore = async () => {
  return import('../../../src/server/editorCompilationStore');
};

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
    mockedFs.existsSync.mockReset();
    mockedFs.readFileSync.mockReset();
    mockedFs.mkdirSync.mockReset();
    mockedFs.writeFileSync.mockReset();
    mockedFs.existsSync.mockReturnValue(false);
  });

  it('stores artifacts and returns timestamp', async () => {
    const toIsoSpy = jest
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValue('2026-02-08T00:00:00.000Z');
    const { storeArtifacts } = await loadStore();

    const storedAt = storeArtifacts('pack-a', [sampleArtifact]);

    expect(storedAt).toBe('2026-02-08T00:00:00.000Z');
    expect(mockedFs.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
    expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
    const serialized = mockedFs.writeFileSync.mock.calls[0]?.[1] as string;
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
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(
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

    const chunks = getOverlayChunks({
      packId: 'pack-a',
      tile: { z: 8, x: 1, y: 2 },
      layerIds: ['depth', 'land'],
      lod: 8,
    });
    const second = getOverlayChunks({
      packId: 'pack-a',
      tile: { z: 8, x: 1, y: 2 },
      layerIds: ['depth'],
      lod: 8,
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual(expect.objectContaining({ layerId: 'depth' }));
    expect(second).toHaveLength(1);
    expect(mockedFs.readFileSync).toHaveBeenCalledTimes(1);
  });

  it('handles malformed disk payload and still stores data', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('{not-json');
    const { getOverlayChunks, storeArtifacts } = await loadStore();

    const missing = getOverlayChunks({
      packId: 'pack-b',
      tile: { z: 1, x: 1, y: 1 },
      layerIds: ['depth'],
      lod: 1,
    });
    storeArtifacts('pack-b', [sampleArtifact]);

    expect(missing).toEqual([]);
    expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
  });
});
