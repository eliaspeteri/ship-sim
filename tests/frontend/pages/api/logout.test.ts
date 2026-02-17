const mockGetToken = jest.fn();
const mockRecordAuthEvent = jest.fn();

jest.mock('next-auth/jwt', () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
}));

jest.mock('../../../../src/lib/authAudit', () => ({
  recordAuthEvent: (...args: unknown[]) => mockRecordAuthEvent(...args),
}));

import handler from '../../../../src/pages/api/logout';

import type { NextApiRequest, NextApiResponse } from 'next';

const makeRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const setHeader = jest.fn();
  return { json, status, setHeader };
};

const toReq = (req: Partial<NextApiRequest>) => req as NextApiRequest;
const toRes = (res: ReturnType<typeof makeRes>) =>
  res as unknown as NextApiResponse;

describe('pages/api/logout', () => {
  beforeEach(() => {
    mockGetToken.mockReset();
    mockRecordAuthEvent.mockReset();
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

  it('clears cookies and records logout event when token exists', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'user-1' });

    await handler(toReq({ method: 'POST' }), toRes(res));

    expect(mockRecordAuthEvent).toHaveBeenCalledWith({
      userId: 'user-1',
      event: 'logout',
      detail: { reason: 'manual' },
    });
    expect(res.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.arrayContaining([
        expect.stringContaining('next-auth.session-token=deleted'),
        expect.stringContaining('__Secure-next-auth.session-token=deleted'),
        expect.stringContaining('access_token=deleted'),
        expect.stringContaining('refresh_token=deleted'),
      ]),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('still succeeds if logout event recording path throws', async () => {
    const res = makeRes();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockGetToken.mockRejectedValue(new Error('boom'));

    await handler(toReq({ method: 'POST' }), toRes(res));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
