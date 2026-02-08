const mockGetToken = jest.fn();
const mockRecordAuthEvent = jest.fn();

jest.mock('next-auth/jwt', () => ({
  getToken: (...args: any[]) => mockGetToken(...args),
}));

jest.mock('../../../../src/lib/authAudit', () => ({
  recordAuthEvent: (...args: any[]) => mockRecordAuthEvent(...args),
}));

import handler from '../../../../src/pages/api/logout';

const makeRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const setHeader = jest.fn();
  return { json, status, setHeader };
};

describe('pages/api/logout', () => {
  beforeEach(() => {
    mockGetToken.mockReset();
    mockRecordAuthEvent.mockReset();
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

  it('clears cookies and records logout event when token exists', async () => {
    const res = makeRes();
    mockGetToken.mockResolvedValue({ sub: 'user-1' });

    await handler({ method: 'POST' } as any, res as any);

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

    await handler({ method: 'POST' } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
