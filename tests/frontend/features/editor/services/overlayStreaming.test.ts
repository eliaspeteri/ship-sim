import {
  clearOverlayCache,
  getVisibleOverlayTiles,
  getWorkAreaTiles,
  loadOverlayChunks,
  selectOverlayLod,
} from '../../../../../src/features/editor/services/overlayStreaming';

type WorkAreasArg = Parameters<typeof getWorkAreaTiles>[0];
type VisibleArg = Parameters<typeof getVisibleOverlayTiles>[0];
type LoadRequests = Parameters<typeof loadOverlayChunks>[0];

const testGlobals = globalThis as {
  fetch?: typeof fetch;
  atob?: (value: string) => string;
};

describe('overlayStreaming', () => {
  beforeEach(() => {
    clearOverlayCache();
    testGlobals.fetch = undefined;
    testGlobals.atob = undefined;
  });

  it('computes work area tile keys for bbox and polygon', () => {
    const keys = getWorkAreaTiles([
      {
        id: 'a',
        name: 'bbox',
        bounds: {
          type: 'bbox',
          minLat: 60,
          minLon: 24,
          maxLat: 60.2,
          maxLon: 24.2,
        },
        allowedZoom: [8, 14],
        sources: [],
      },
      {
        id: 'b',
        name: 'poly',
        bounds: {
          type: 'polygon',
          coordinates: [
            [60, 24],
            [60.2, 24.2],
            [60.1, 24.1],
          ],
        },
        allowedZoom: [9, 14],
        sources: [],
      },
    ] as unknown as WorkAreasArg);

    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every(k => Number.isInteger(k.z))).toBe(true);
  });

  it('computes visible overlay tiles and fallback center tile', () => {
    const visible = getVisibleOverlayTiles({
      centerLat: 60.1,
      centerLon: 24.9,
      zoom: 10.6,
      workAreas: [],
      cameraHeight: 200,
      cameraFov: 55,
      cameraAspect: 1.6,
    });

    expect(visible.length).toBeGreaterThan(0);

    const filteredOut = getVisibleOverlayTiles({
      centerLat: 60.1,
      centerLon: 24.9,
      zoom: 10,
      workAreas: [
        {
          id: 'far',
          name: 'far',
          bounds: {
            type: 'bbox',
            minLat: -10,
            minLon: -10,
            maxLat: -9,
            maxLon: -9,
          },
          allowedZoom: [8, 14],
          sources: [],
        },
      ] as unknown as VisibleArg['workAreas'],
    });

    expect(filteredOut).toHaveLength(1);
  });

  it('selects overlay lod with clamp', () => {
    expect(selectOverlayLod(5.9)).toBe(5);
    expect(selectOverlayLod(-4)).toBe(0);
    expect(selectOverlayLod(30)).toBe(22);
  });

  it('loads overlay chunks from API and cache', async () => {
    testGlobals.atob = (value: string) =>
      Buffer.from(value, 'base64').toString('binary');

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        chunks: [
          {
            layerId: 'l1',
            lod: 10,
            bytesBase64: Buffer.from('abc').toString('base64'),
          },
        ],
      }),
    });
    testGlobals.fetch = fetchMock as unknown as typeof fetch;

    const requests = [
      {
        packId: 'pack-1',
        key: { z: 10, x: 1, y: 2 },
        layers: ['l1'],
        lod: 10,
      },
    ];

    const first = await loadOverlayChunks(requests as unknown as LoadRequests);
    const second = await loadOverlayChunks(requests as unknown as LoadRequests);

    expect(first).toHaveLength(1);
    expect(first[0].bytes.byteLength).toBe(3);
    expect(second).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to empty chunks on failed fetch', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    testGlobals.fetch = jest
      .fn()
      .mockRejectedValue(new Error('network fail')) as unknown as typeof fetch;

    const chunks = await loadOverlayChunks([
      {
        packId: 'pack-1',
        key: { z: 10, x: 3, y: 4 },
        layers: ['l1', 'l2'],
        lod: 10,
      },
    ] as unknown as LoadRequests);

    expect(chunks).toHaveLength(2);
    expect(chunks.every(chunk => chunk.bytes.byteLength === 0)).toBe(true);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
