const mockGetOverlayChunks = jest.fn();

jest.mock('../../../../../src/server/editorCompilationStore', () => ({
  getOverlayChunks: (...args: any[]) => mockGetOverlayChunks(...args),
}));

import handler from '../../../../../src/pages/api/editor/overlay';

const makeRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json };
};

describe('pages/api/editor/overlay', () => {
  beforeEach(() => {
    mockGetOverlayChunks.mockReset();
  });

  it('rejects non-GET requests', () => {
    const res = makeRes();

    handler({ method: 'POST' } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('validates required query parameters', () => {
    const res = makeRes();

    handler({ method: 'GET', query: { packId: 'p' } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing query parameters',
    });
  });

  it('loads chunks using comma-separated layer list', () => {
    const res = makeRes();
    mockGetOverlayChunks.mockReturnValue([
      { layerId: 'l1', lod: 8, bytesBase64: 'abc' },
      { layerId: 'l2', lod: 8, bytesBase64: 'def' },
    ]);

    handler(
      {
        method: 'GET',
        query: {
          packId: 'pack-1',
          z: '8',
          x: '12',
          y: '20',
          lod: '8',
          layers: 'l1,l2',
        },
      } as any,
      res as any,
    );

    expect(mockGetOverlayChunks).toHaveBeenCalledWith({
      packId: 'pack-1',
      tile: { z: 8, x: 12, y: 20 },
      layerIds: ['l1', 'l2'],
      lod: 8,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      chunks: [
        { layerId: 'l1', lod: 8, bytesBase64: 'abc' },
        { layerId: 'l2', lod: 8, bytesBase64: 'def' },
      ],
    });
  });

  it('accepts array query layers', () => {
    const res = makeRes();
    mockGetOverlayChunks.mockReturnValue([]);

    handler(
      {
        method: 'GET',
        query: {
          packId: 'pack-1',
          z: '8',
          x: '1',
          y: '2',
          lod: '8',
          layers: ['l1', 'l2'],
        },
      } as any,
      res as any,
    );

    expect(mockGetOverlayChunks).toHaveBeenCalledWith(
      expect.objectContaining({ layerIds: ['l1', 'l2'] }),
    );
  });
});
