const mockDeletePack = jest.fn();
const mockGetPack = jest.fn();
const mockGetPackBySlug = jest.fn();
const mockHasDuplicateName = jest.fn();
const mockTransitionPackStatus = jest.fn();
const mockUpdatePack = jest.fn();
const mockGetToken = jest.fn();

jest.mock('next-auth/jwt', () => ({
  getToken: (...args: any[]) => mockGetToken(...args),
}));

jest.mock('../../../../../../src/server/editorPacksStore', () => ({
  deletePack: (...args: any[]) => mockDeletePack(...args),
  getPack: (...args: any[]) => mockGetPack(...args),
  getPackBySlug: (...args: any[]) => mockGetPackBySlug(...args),
  hasDuplicateName: (...args: any[]) => mockHasDuplicateName(...args),
  transitionPackStatus: (...args: any[]) => mockTransitionPackStatus(...args),
  updatePack: (...args: any[]) => mockUpdatePack(...args),
}));

import handler from '../../../../../../src/pages/api/editor/packs/[packId]';

const makeRes = () => {
  const json = jest.fn();
  const end = jest.fn();
  const status = jest.fn(() => ({ json, end }));
  return { status, json, end };
};

describe('pages/api/editor/packs/[packId]', () => {
  beforeEach(() => {
    [
      mockDeletePack,
      mockGetPack,
      mockGetPackBySlug,
      mockHasDuplicateName,
      mockTransitionPackStatus,
      mockUpdatePack,
    ].forEach(mock => mock.mockReset());
    mockGetToken.mockReset();
  });

  it('validates pack id', async () => {
    const res = makeRes();

    await handler(
      { method: 'GET', query: { packId: ['x'] } } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid pack id' });
  });

  it('gets pack by slug when owner provided', async () => {
    const res = makeRes();
    mockGetPackBySlug.mockReturnValue({ id: 'p1' });

    await handler(
      { method: 'GET', query: { packId: 'slug', ownerId: 'owner-1' } } as any,
      res as any,
    );

    expect(mockGetPackBySlug).toHaveBeenCalledWith('owner-1', 'slug');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when get misses', async () => {
    const res = makeRes();
    mockGetPack.mockReturnValue(null);

    await handler(
      { method: 'GET', query: { packId: 'p1' } } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Pack not found' });
  });

  it('rejects unauthenticated patch requests', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue(null);

    await handler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { status: 'submitted' },
      } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  it('handles status transition patch for owner', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'o1', role: 'player' });
    mockGetPack.mockReturnValue({ id: 'p1', ownerId: 'o1', status: 'draft' });
    mockTransitionPackStatus.mockReturnValue({ id: 'p1', status: 'submitted' });

    await handler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { status: 'submitted' },
      } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects invalid status transition', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'o1', role: 'player' });
    mockGetPack.mockReturnValue({ id: 'p1', ownerId: 'o1', status: 'draft' });
    mockTransitionPackStatus.mockReturnValue(null);

    await handler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { status: 'published' },
      } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid status transition',
    });
  });

  it('forbids non-owner patch', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'o2', role: 'player' });
    mockGetPack.mockReturnValue({ id: 'p1', ownerId: 'o1', status: 'draft' });

    await handler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { name: 'Updated' },
      } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Not authorized to update this pack',
    });
  });

  it('handles duplicate and revoke validations for patch', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'o1', role: 'player' });
    mockGetPack.mockReturnValue({
      id: 'p1',
      ownerId: 'o1',
      status: 'published',
    });
    mockHasDuplicateName.mockReturnValue(true);

    await handler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { name: 'Duplicate', submitForReview: true },
      } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(409);

    const res2 = makeRes();
    mockHasDuplicateName.mockReturnValue(false);

    await handler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { submitForReview: false },
      } as any,
      res2 as any,
    );

    expect(res2.status).toHaveBeenCalledWith(400);
    expect(res2.json).toHaveBeenCalledWith({
      error: 'Published packs cannot be revoked',
    });
  });

  it('updates pack', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'o1', role: 'player' });
    mockGetPack.mockReturnValue({ id: 'p1', ownerId: 'o1', status: 'draft' });
    mockHasDuplicateName.mockReturnValue(false);
    mockUpdatePack.mockReturnValue({ id: 'p1', name: 'Updated' });

    await handler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { name: 'Updated' },
      } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      pack: { id: 'p1', name: 'Updated' },
    });
  });

  it('forbids non-owner delete', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'o2', role: 'player' });
    mockGetPack.mockReturnValue({ id: 'p1', ownerId: 'o1', status: 'draft' });

    await handler(
      { method: 'DELETE', query: { packId: 'p1' } } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Not authorized to delete this pack',
    });
  });

  it('deletes pack and returns 204', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'o1', role: 'player' });
    mockGetPack.mockReturnValue({ id: 'p1', ownerId: 'o1', status: 'draft' });
    mockDeletePack.mockReturnValue(true);

    await handler(
      { method: 'DELETE', query: { packId: 'p1' } } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('returns 404 on delete miss and 405 on unknown method', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'o1', role: 'player' });
    mockGetPack.mockReturnValue(null);
    mockDeletePack.mockReturnValue(false);

    await handler(
      { method: 'DELETE', query: { packId: 'p1' } } as any,
      res as any,
    );
    expect(res.status).toHaveBeenCalledWith(404);

    const res2 = makeRes();
    await handler(
      { method: 'PUT', query: { packId: 'p1' } } as any,
      res2 as any,
    );
    expect(res2.status).toHaveBeenCalledWith(405);
  });
});
