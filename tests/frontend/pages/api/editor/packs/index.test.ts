const mockListPacks = jest.fn();
const mockCreatePack = jest.fn();

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
  });

  it('lists packs for requested user', () => {
    const res = makeRes();
    mockListPacks.mockReturnValue([{ id: 'p1' }]);

    handler({ method: 'GET', query: { userId: 'u1' } } as any, res as any);

    expect(mockListPacks).toHaveBeenCalledWith('u1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ packs: [{ id: 'p1' }] });
  });

  it('defaults demo user for list packs', () => {
    const res = makeRes();
    mockListPacks.mockReturnValue([]);

    handler({ method: 'GET', query: {} } as any, res as any);

    expect(mockListPacks).toHaveBeenCalledWith('demo');
  });

  it('validates post payload', () => {
    const res = makeRes();

    handler({ method: 'POST', body: { name: 'name' } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing pack name/description',
    });
  });

  it('handles duplicate pack names', () => {
    const res = makeRes();
    mockCreatePack.mockReturnValue({ error: 'Duplicate' });

    handler(
      {
        method: 'POST',
        body: { name: 'Pack', description: 'Desc', ownerId: 'u1' },
      } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Duplicate' });
  });

  it('creates pack', () => {
    const res = makeRes();
    mockCreatePack.mockReturnValue({ pack: { id: 'p1', name: 'Pack' } });

    handler(
      {
        method: 'POST',
        body: { name: 'Pack', description: 'Desc', ownerId: 'u1' },
      } as any,
      res as any,
    );

    expect(mockCreatePack).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Pack',
        description: 'Desc',
        ownerId: 'u1',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ pack: { id: 'p1', name: 'Pack' } });
  });

  it('rejects unsupported methods', () => {
    const res = makeRes();

    handler({ method: 'PATCH' } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });
});
