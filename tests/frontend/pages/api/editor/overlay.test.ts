const mockGetOverlayChunks = jest.fn();

jest.mock('../../../../../src/server/editorCompilationStore', () => ({
  getOverlayChunks: (...args: unknown[]) => mockGetOverlayChunks(...args),
}));

import handler from '../../../../../src/pages/api/editor/overlay';

import type { NextApiRequest, NextApiResponse } from 'next';

const makeRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json };
};

const toReq = (req: Partial<NextApiRequest>) => req as NextApiRequest;
const toRes = (res: ReturnType<typeof makeRes>) =>
  res as unknown as NextApiResponse;

describe('pages/api/editor/overlay', () => {
  beforeEach(() => {
    mockGetOverlayChunks.mockReset();
  });

  it('rejects non-GET requests', async () => {
    const res = makeRes();

    await handler(toReq({ method: 'POST' }), toRes(res));

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('validates required query parameters', async () => {
    const res = makeRes();

    await handler(toReq({ method: 'GET', query: { packId: 'p' } }), toRes(res));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing query parameters',
    });
  });

  it('loads chunks using comma-separated layer list', async () => {
    const res = makeRes();
    mockGetOverlayChunks.mockResolvedValue([
      { layerId: 'l1', lod: 8, bytesBase64: 'abc' },
      { layerId: 'l2', lod: 8, bytesBase64: 'def' },
    ]);

    await handler(
      toReq({
        method: 'GET',
        query: {
          packId: 'pack-1',
          z: '8',
          x: '12',
          y: '20',
          lod: '8',
          layers: 'l1,l2',
        },
      }),
      toRes(res),
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

  it('accepts array query layers', async () => {
    const res = makeRes();
    mockGetOverlayChunks.mockResolvedValue([]);

    await handler(
      toReq({
        method: 'GET',
        query: {
          packId: 'pack-1',
          z: '8',
          x: '1',
          y: '2',
          lod: '8',
          layers: ['l1', 'l2'],
        },
      }),
      toRes(res),
    );

    expect(mockGetOverlayChunks).toHaveBeenCalledWith(
      expect.objectContaining({ layerIds: ['l1', 'l2'] }),
    );
  });
});
