import {
  compileOverlayDraft,
  compileOverlayServer,
} from '../../../../../src/features/editor/services/overlayCompilation';

describe('overlayCompilation', () => {
  it('compiles draft artifacts in-memory', async () => {
    const result = await compileOverlayDraft({
      packId: 'pack-1',
      layerIds: ['l1', 'l2'],
      tiles: [{ z: 10, x: 1, y: 2 }],
    });

    expect(result.artifacts).toHaveLength(2);
    expect(result.artifacts[0].tile).toEqual({ z: 10, x: 1, y: 2 });
    expect(result.artifacts[0].bytes).toBeInstanceOf(ArrayBuffer);
    expect(typeof result.generatedAt).toBe('string');
  });

  it('calls compile server endpoint', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ artifactCount: 5, storedAt: 'now' }),
    });
    (globalThis as any).fetch = fetchMock;

    const result = await compileOverlayServer({
      packId: 'pack-1',
      layerIds: ['l1'],
      tiles: [{ z: 9, x: 4, y: 6 }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/editor/compile',
      expect.any(Object),
    );
    expect(result).toEqual({ artifactCount: 5, storedAt: 'now' });
  });

  it('throws on non-ok compile response', async () => {
    (globalThis as any).fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 503 });

    await expect(
      compileOverlayServer({
        packId: 'pack-1',
        layerIds: ['l1'],
        tiles: [{ z: 9, x: 1, y: 1 }],
      }),
    ).rejects.toThrow('Compile request failed: 503');
  });
});
