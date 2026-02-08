const mockDeletePack = jest.fn();
const mockGetPack = jest.fn();
const mockGetPackBySlug = jest.fn();
const mockHasDuplicateName = jest.fn();
const mockTransitionPackStatus = jest.fn();
const mockUpdatePack = jest.fn();

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
  });

  it('validates pack id', () => {
    const res = makeRes();

    handler({ method: 'GET', query: { packId: ['x'] } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid pack id' });
  });

  it('gets pack by slug when owner provided', () => {
    const res = makeRes();
    mockGetPackBySlug.mockReturnValue({ id: 'p1' });

    handler(
      { method: 'GET', query: { packId: 'slug', ownerId: 'owner-1' } } as any,
      res as any,
    );

    expect(mockGetPackBySlug).toHaveBeenCalledWith('owner-1', 'slug');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when get misses', () => {
    const res = makeRes();
    mockGetPack.mockReturnValue(null);

    handler({ method: 'GET', query: { packId: 'p1' } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Pack not found' });
  });

  it('handles status transition patch', () => {
    const res = makeRes();
    mockTransitionPackStatus.mockReturnValue({ id: 'p1', status: 'submitted' });

    handler(
      {
        method: 'PATCH',
        query: { packId: 'p1' },
        body: { status: 'submitted' },
      } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects invalid status transition', () => {
    const res = makeRes();
    mockTransitionPackStatus.mockReturnValue(null);

    handler(
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

  it('handles duplicate and revoke validations for patch', () => {
    const res = makeRes();
    mockGetPack.mockReturnValue({
      id: 'p1',
      ownerId: 'o1',
      status: 'published',
    });
    mockHasDuplicateName.mockReturnValue(true);

    handler(
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

    handler(
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

  it('updates pack', () => {
    const res = makeRes();
    mockGetPack.mockReturnValue({ id: 'p1', ownerId: 'o1', status: 'draft' });
    mockHasDuplicateName.mockReturnValue(false);
    mockUpdatePack.mockReturnValue({ id: 'p1', name: 'Updated' });

    handler(
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

  it('deletes pack and returns 204', () => {
    const res = makeRes();
    mockDeletePack.mockReturnValue(true);

    handler({ method: 'DELETE', query: { packId: 'p1' } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('returns 404 on delete miss and 405 on unknown method', () => {
    const res = makeRes();
    mockDeletePack.mockReturnValue(false);

    handler({ method: 'DELETE', query: { packId: 'p1' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(404);

    const res2 = makeRes();
    handler({ method: 'PUT', query: { packId: 'p1' } } as any, res2 as any);
    expect(res2.status).toHaveBeenCalledWith(405);
  });
});
