const mockStoreArtifacts = jest.fn();
const mockGetPack = jest.fn();
const mockGetToken = jest.fn();

jest.mock('next-auth/jwt', () => ({
  getToken: (...args: any[]) => mockGetToken(...args),
}));

jest.mock('../../../../../src/server/editorCompilationStore', () => ({
  storeArtifacts: (...args: any[]) => mockStoreArtifacts(...args),
}));

jest.mock('../../../../../src/server/editorPacksStore', () => ({
  getPack: (...args: any[]) => mockGetPack(...args),
}));

import handler from '../../../../../src/pages/api/editor/compile';

const makeRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json };
};

describe('pages/api/editor/compile', () => {
  beforeEach(() => {
    mockStoreArtifacts.mockReset();
    mockStoreArtifacts.mockReturnValue('stored-at');
    mockGetPack.mockReset();
    mockGetToken.mockReset();
  });

  it('rejects non-POST requests', async () => {
    const res = makeRes();

    await handler({ method: 'GET' } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('rejects unauthenticated compile requests', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue(null);

    await handler(
      {
        method: 'POST',
        body: { packId: 'pack-1', layerIds: [], tiles: [] },
      } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  it('validates payload', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'owner-1', role: 'player' });

    await handler(
      { method: 'POST', body: { layerIds: [] } } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid payload' });
  });

  it('forbids compile for non-owner and non-admin actor', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'owner-2', role: 'player' });
    mockGetPack.mockReturnValue({ id: 'pack-1', ownerId: 'owner-1' });

    await handler(
      {
        method: 'POST',
        body: {
          packId: 'pack-1',
          layerIds: ['l1'],
          tiles: [{ z: 10, x: 3, y: 4 }],
        },
      } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Not authorized to compile this pack',
    });
  });

  it('compiles and stores artifacts for owner', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'owner-1', role: 'player' });
    mockGetPack.mockReturnValue({ id: 'pack-1', ownerId: 'owner-1' });

    await handler(
      {
        method: 'POST',
        body: {
          packId: 'pack-1',
          layerIds: ['l1', 'l2'],
          tiles: [{ z: 10, x: 3, y: 4 }],
        },
      } as any,
      res as any,
    );

    expect(mockStoreArtifacts).toHaveBeenCalledWith(
      'pack-1',
      expect.arrayContaining([
        expect.objectContaining({
          layerId: 'l1',
          lod: 10,
          tile: { z: 10, x: 3, y: 4 },
        }),
      ]),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      artifactCount: 2,
      storedAt: 'stored-at',
    });
  });

  it('allows admin compile for non-owned pack', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'admin-1', role: 'admin' });
    mockGetPack.mockReturnValue({ id: 'pack-1', ownerId: 'owner-1' });

    await handler(
      {
        method: 'POST',
        body: {
          packId: 'pack-1',
          layerIds: ['l1'],
          tiles: [{ z: 8, x: 1, y: 2 }],
        },
      } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockStoreArtifacts).toHaveBeenCalled();
  });
});
