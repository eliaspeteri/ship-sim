/** @jest-environment node */
import jwt from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';

import {
  authenticateRequest,
  requireUser,
} from '../../../src/server/middleware/authentication';

import type { Request, Response } from 'express';

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

const getTokenMock = getToken as jest.MockedFunction<typeof getToken>;
const verifyMock = jwt.verify as jest.MockedFunction<typeof jwt.verify>;
const fakeRes = {} as unknown as Response;

const makeReq = (overrides: Partial<Request> = {}): Request => {
  return {
    headers: {},
    cookies: {},
    ...overrides,
  } as Request;
};

describe('authentication middleware', () => {
  const originalSecret = process.env.NEXTAUTH_SECRET;

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    getTokenMock.mockReset();
    verifyMock.mockReset();
  });

  afterAll(() => {
    process.env.NEXTAUTH_SECRET = originalSecret;
  });

  it('attaches user when next-auth token is present', async () => {
    getTokenMock.mockResolvedValue({
      sub: 'user-1',
      name: 'Ada',
      role: 'player',
      rank: 2,
      credits: 100,
      experience: 5,
      safetyScore: 1.2,
    } as Awaited<ReturnType<typeof getToken>>);

    const req = makeReq();
    const next = jest.fn();

    await authenticateRequest(req, fakeRes, next);

    expect(req.user).toBeTruthy();
    expect(req.user?.userId).toBe('user-1');
    expect(req.user?.username).toBe('Ada');
    expect(req.user?.roles).toContain('player');
    expect(req.user?.permissions.length).toBeGreaterThan(0);
    expect(next).toHaveBeenCalled();
  });

  it('falls back to JWT verification when getToken fails', async () => {
    getTokenMock.mockRejectedValue(new Error('boom'));
    verifyMock.mockReturnValue({
      sub: 'user-2',
      name: 'Jane',
      role: 'spectator',
    } as unknown as ReturnType<typeof jwt.verify>);

    const req = makeReq({
      headers: { authorization: 'Bearer token-abc' },
    });
    const next = jest.fn();

    await authenticateRequest(req, fakeRes, next);

    expect(verifyMock).toHaveBeenCalledWith('token-abc', 'test-secret');
    expect(req.user?.userId).toBe('user-2');
    expect(req.user?.roles).toContain('spectator');
    expect(next).toHaveBeenCalled();
  });

  it('does nothing when no secret is configured', async () => {
    process.env.NEXTAUTH_SECRET = '';
    const req = makeReq();
    const next = jest.fn();

    await authenticateRequest(req, fakeRes, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('does not attach user when no token is available', async () => {
    getTokenMock.mockResolvedValue(null);
    const req = makeReq();
    const next = jest.fn();

    await authenticateRequest(req, fakeRes, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('requireUser returns the user when authenticated', () => {
    const req = makeReq({
      user: {
        userId: 'user-1',
        username: 'Ada',
        roles: ['player'],
        permissions: [],
        rank: 1,
        credits: 0,
        experience: 0,
        safetyScore: 1,
      } as Request['user'],
    });
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const user = requireUser(req, res);

    expect(user).toBe(req.user);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('requireUser returns null and responds 401 when missing', () => {
    const req = makeReq();
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const user = requireUser(req, res);

    expect(user).toBeNull();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required',
    });
  });
});
