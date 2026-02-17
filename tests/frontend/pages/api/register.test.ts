const mockHash = jest.fn();
const mockFindFirst = jest.fn();
const mockCreate = jest.fn();
const mockRecordAuthEvent = jest.fn();

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: (...args: unknown[]) => mockHash(...args),
  },
}));

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

jest.mock('../../../../src/lib/authAudit', () => ({
  recordAuthEvent: (...args: unknown[]) => mockRecordAuthEvent(...args),
}));

import handler from '../../../../src/pages/api/register';
import { REGISTER_LIMITS } from '../../../../src/server/requestLimits';

import type { NextApiRequest, NextApiResponse } from 'next';

const makeRes = () => {
  const json = jest.fn();
  const res = {
    statusCode: 200,
    status: jest.fn((code: number) => {
      res.statusCode = code;
      return { json };
    }),
    json,
    setHeader: jest.fn(),
  };
  return res;
};

const toReq = (req: Partial<NextApiRequest>) => req as NextApiRequest;
const toRes = (res: ReturnType<typeof makeRes>) =>
  res as unknown as NextApiResponse;

describe('pages/api/register', () => {
  beforeEach(() => {
    mockHash.mockReset();
    mockFindFirst.mockReset();
    mockCreate.mockReset();
    mockRecordAuthEvent.mockReset();
    mockHash.mockResolvedValue('hashed-pass');
  });

  it('rejects non-POST requests', async () => {
    const res = makeRes();

    await handler(toReq({ method: 'GET' }), toRes(res));

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
      toReq({ method: 'POST', body: { username: 'captain' } }),
      toRes(res),
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
      toReq({
        method: 'POST',
        body: { username: 'captain', password: 'secret' },
      }),
      toRes(res),
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
      toReq({
        method: 'POST',
        body: { username: 'captain', password: 'secret' },
      }),
      toRes(res),
    );

    expect(mockHash).toHaveBeenCalledWith('secret', 10);
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
      toReq({
        method: 'POST',
        body: { username: 'captain', password: 'secret' },
      }),
      toRes(res),
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
    });

    errorSpy.mockRestore();
  });

  it('rejects overly long credentials', async () => {
    const res = makeRes();
    const longName = 'a'.repeat(REGISTER_LIMITS.maxUsernameLength + 1);

    await handler(
      toReq({
        method: 'POST',
        body: { username: longName, password: 'secret' },
      }),
      toRes(res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Username or password is too long',
    });
  });

  it('rate limits repeated registration attempts', async () => {
    const attempts = REGISTER_LIMITS.rateLimit.max + 1;
    const ip = '10.0.0.1';
    let lastStatus = 0;

    for (let i = 0; i < attempts; i += 1) {
      const res = makeRes();
      const req = toReq({
        method: 'POST',
        body: { username: 'ratelimit-user' },
      });
      Object.defineProperty(req, 'socket', {
        value: { remoteAddress: ip },
      });
      await handler(req, toRes(res));
      lastStatus = res.statusCode;
    }

    expect(lastStatus).toBe(429);
  });
});
