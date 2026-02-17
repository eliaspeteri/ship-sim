const mockDeletePack = jest.fn();
const mockGetPack = jest.fn();
const mockGetPackBySlug = jest.fn();
const mockHasDuplicateName = jest.fn();
const mockTransitionPackStatus = jest.fn();
const mockUpdatePack = jest.fn();
const mockGetToken = jest.fn();

jest.mock('next-auth/jwt', () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
}));

jest.mock('../../../../../../src/server/editorPacksStore', () => ({
  deletePack: (...args: unknown[]) => mockDeletePack(...args),
  getPack: (...args: unknown[]) => mockGetPack(...args),
  getPackBySlug: (...args: unknown[]) => mockGetPackBySlug(...args),
  hasDuplicateName: (...args: unknown[]) => mockHasDuplicateName(...args),
  transitionPackStatus: (...args: unknown[]) =>
    mockTransitionPackStatus(...args),
  updatePack: (...args: unknown[]) => mockUpdatePack(...args),
}));

import handler from '../../../../../../src/pages/api/editor/packs/[packId]';

import type { NextApiRequest, NextApiResponse } from 'next';

const makeRes = () => {
  const json = jest.fn();
  const end = jest.fn();
  const status = jest.fn(() => ({ json, end }));
  return { status, json, end };
};

const callHandler = (
  req: Partial<NextApiRequest>,
  res: ReturnType<typeof makeRes>,
) => handler(req as NextApiRequest, res as unknown as NextApiResponse);

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

    await callHandler({ method: 'GET', query: { packId: ['x'] } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid pack id' });
  });

  it('gets pack by slug when owner provided', async () => {
    const res = makeRes();
    mockGetPackBySlug.mockReturnValue({ id: 'p1' });

    await callHandler(
      { method: 'GET', query: { packId: 'slug', ownerId: 'owner-1' } },
      res,
    );

    expect(mockGetPackBySlug).toHaveBeenCalledWith('owner-1', 'slug');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when get misses', async () => {
    const res = makeRes();
    mockGetPack.mockReturnValue(null);

    await callHandler({ method: 'GET', query: { packId: 'p1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Pack not found' });
  });

  it('rejects unauthenticated patch requests', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue(null);

    await callHandler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { status: 'submitted' },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  it('handles status transition patch for owner', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'o1', role: 'player' });
    mockGetPack.mockReturnValue({ id: 'p1', ownerId: 'o1', status: 'draft' });
    mockTransitionPackStatus.mockReturnValue({ id: 'p1', status: 'submitted' });

    await callHandler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { status: 'submitted' },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects invalid status transition', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'o1', role: 'player' });
    mockGetPack.mockReturnValue({ id: 'p1', ownerId: 'o1', status: 'draft' });
    mockTransitionPackStatus.mockReturnValue(null);

    await callHandler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { status: 'published' },
      },
      res,
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

    await callHandler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { name: 'Updated' },
      },
      res,
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

    await callHandler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { name: 'Duplicate', submitForReview: true },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(409);

    const res2 = makeRes();
    mockHasDuplicateName.mockReturnValue(false);

    await callHandler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { submitForReview: false },
      },
      res2,
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

    await callHandler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { name: 'Updated' },
      },
      res,
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

    await callHandler({ method: 'DELETE', query: { packId: 'p1' } }, res);

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

    await callHandler({ method: 'DELETE', query: { packId: 'p1' } }, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('returns 404 on delete miss and 405 on unknown method', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'o1', role: 'player' });
    mockGetPack.mockReturnValue(null);
    mockDeletePack.mockReturnValue(false);

    await callHandler({ method: 'DELETE', query: { packId: 'p1' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    const res2 = makeRes();
    await callHandler({ method: 'PUT', query: { packId: 'p1' } }, res2);
    expect(res2.status).toHaveBeenCalledWith(405);
  });
});
