const mockListPacks = jest.fn();
const mockCreatePack = jest.fn();
const mockGetToken = jest.fn();

jest.mock('next-auth/jwt', () => ({
  getToken: (...args: any[]) => mockGetToken(...args),
}));

jest.mock('../../../../../../src/server/editorPacksStore', () => ({
  listPacks: (...args: any[]) => mockListPacks(...args),
  createPack: (...args: any[]) => mockCreatePack(...args),
}));

import handler from '../../../../../../src/pages/api/editor/packs/index';

const makeRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json };
};

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
      { method: 'GET', query: { userId: 'u1' } } as any,
      res as any,
    );

    expect(mockListPacks).toHaveBeenCalledWith('u1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ packs: [{ id: 'p1' }] });
  });

  it('defaults demo user for list packs', async () => {
    const res = makeRes();
    mockListPacks.mockReturnValue([]);

    await handler({ method: 'GET', query: {} } as any, res as any);

    expect(mockListPacks).toHaveBeenCalledWith('demo');
  });

  it('rejects unauthenticated create', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue(null);

    await handler(
      { method: 'POST', body: { name: 'Pack', description: 'Desc' } } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  it('validates post payload', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'u1', role: 'player' });

    await handler(
      { method: 'POST', body: { name: 'name' } } as any,
      res as any,
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
      {
        method: 'POST',
        body: { name: 'Pack', description: 'Desc', ownerId: 'u1' },
      } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Duplicate' });
  });

  it('creates pack with server-derived owner id', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'actor-1', role: 'player' });
    mockCreatePack.mockReturnValue({ pack: { id: 'p1', name: 'Pack' } });

    await handler(
      {
        method: 'POST',
        body: { name: 'Pack', description: 'Desc', ownerId: 'spoofed-owner' },
      } as any,
      res as any,
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

    await handler({ method: 'PATCH' } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });
});
