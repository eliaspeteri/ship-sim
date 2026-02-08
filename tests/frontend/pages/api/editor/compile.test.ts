const mockStoreArtifacts = jest.fn();

jest.mock('../../../../../src/server/editorCompilationStore', () => ({
  storeArtifacts: (...args: any[]) => mockStoreArtifacts(...args),
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
  });

  it('rejects non-POST requests', () => {
    const res = makeRes();

    handler({ method: 'GET' } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('validates payload', () => {
    const res = makeRes();

    handler({ method: 'POST', body: { layerIds: [] } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid payload' });
  });

  it('compiles and stores artifacts', () => {
    const res = makeRes();

    handler(
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
});
