const mockListPacks = jest.fn();
const mockCreatePack = jest.fn();
const mockGetToken = jest.fn();

jest.mock('next-auth/jwt', () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
}));

jest.mock('../../../../../../src/server/editorPacksStore', () => ({
  listPacks: (...args: unknown[]) => mockListPacks(...args),
  createPack: (...args: unknown[]) => mockCreatePack(...args),
}));

import handler from '../../../../../../src/pages/api/editor/packs/index';

import type { NextApiRequest, NextApiResponse } from 'next';

const makeRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json };
};

const toReq = (req: Partial<NextApiRequest>) => req as NextApiRequest;
const toRes = (res: ReturnType<typeof makeRes>) =>
  res as unknown as NextApiResponse;

describe('pages/api/editor/packs/index', () => {
  beforeEach(() => {
    mockListPacks.mockReset();
    mockCreatePack.mockReset();
    mockGetToken.mockReset();
  });

  it('lists packs for requested user', async () => {
    const res = makeRes();
    mockListPacks.mockReturnValue([{ id: 'p1' }]);

    await handler(
      toReq({ method: 'GET', query: { userId: 'u1' } }),
      toRes(res),
    );

    expect(mockListPacks).toHaveBeenCalledWith('u1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ packs: [{ id: 'p1' }] });
  });

  it('defaults demo user for list packs', async () => {
    const res = makeRes();
    mockListPacks.mockReturnValue([]);

    await handler(toReq({ method: 'GET', query: {} }), toRes(res));

    expect(mockListPacks).toHaveBeenCalledWith('demo');
  });

  it('rejects unauthenticated create', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue(null);

    await handler(
      toReq({ method: 'POST', body: { name: 'Pack', description: 'Desc' } }),
      toRes(res),
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  it('validates post payload', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'u1', role: 'player' });

    await handler(
      toReq({ method: 'POST', body: { name: 'name' } }),
      toRes(res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing pack name/description',
    });
  });

  it('handles duplicate pack names', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'u1', role: 'player' });
    mockCreatePack.mockReturnValue({ error: 'Duplicate' });

    await handler(
      toReq({
        method: 'POST',
        body: { name: 'Pack', description: 'Desc', ownerId: 'u1' },
      }),
      toRes(res),
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Duplicate' });
  });

  it('creates pack with server-derived owner id', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'actor-1', role: 'player' });
    mockCreatePack.mockReturnValue({ pack: { id: 'p1', name: 'Pack' } });

    await handler(
      toReq({
        method: 'POST',
        body: { name: 'Pack', description: 'Desc', ownerId: 'spoofed-owner' },
      }),
      toRes(res),
    );

    expect(mockCreatePack).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Pack',
        description: 'Desc',
        ownerId: 'actor-1',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ pack: { id: 'p1', name: 'Pack' } });
  });

  it('rejects unsupported methods', async () => {
    const res = makeRes();

    await handler(toReq({ method: 'PATCH' }), toRes(res));

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });
});
