const mockHashSync = jest.fn();
const mockFindFirst = jest.fn();
const mockCreate = jest.fn();
const mockRecordAuthEvent = jest.fn();

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hashSync: (...args: any[]) => mockHashSync(...args),
  },
}));

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
      create: (...args: any[]) => mockCreate(...args),
    },
  },
}));

jest.mock('../../../../src/lib/authAudit', () => ({
  recordAuthEvent: (...args: any[]) => mockRecordAuthEvent(...args),
}));

import handler from '../../../../src/pages/api/register';

const makeRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const setHeader = jest.fn();
  return { json, status, setHeader };
};

describe('pages/api/register', () => {
  beforeEach(() => {
    mockHashSync.mockReset();
    mockFindFirst.mockReset();
    mockCreate.mockReset();
    mockRecordAuthEvent.mockReset();
    mockHashSync.mockReturnValue('hashed-pass');
  });

  it('rejects non-POST requests', async () => {
    const res = makeRes();

    await handler({ method: 'GET' } as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'POST');
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Method not allowed',
    });
  });

  it('validates required fields', async () => {
    const res = makeRes();

    await handler(
      { method: 'POST', body: { username: 'captain' } } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Username and password are required',
    });
  });

  it('rejects existing username', async () => {
    const res = makeRes();
    mockFindFirst.mockResolvedValue({ id: 'existing-user' });

    await handler(
      {
        method: 'POST',
        body: { username: 'captain', password: 'secret' },
      } as any,
      res as any,
    );

    expect(mockFindFirst).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Username already exists',
    });
  });

  it('creates user and records register event', async () => {
    const res = makeRes();
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 'u1', name: 'captain', role: 'player' });

    await handler(
      {
        method: 'POST',
        body: { username: 'captain', password: 'secret' },
      } as any,
      res as any,
    );

    expect(mockHashSync).toHaveBeenCalledWith('secret', 10);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'captain',
          role: 'player',
          passwordHash: 'hashed-pass',
        }),
      }),
    );
    expect(mockRecordAuthEvent).toHaveBeenCalledWith({
      userId: 'u1',
      event: 'register',
      detail: { method: 'credentials' },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: { id: 'u1', name: 'captain', role: 'player' },
    });
  });

  it('returns 500 on unexpected errors', async () => {
    const res = makeRes();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockRejectedValue(new Error('db fail'));

    await handler(
      {
        method: 'POST',
        body: { username: 'captain', password: 'secret' },
      } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
    });

    errorSpy.mockRestore();
  });
});
