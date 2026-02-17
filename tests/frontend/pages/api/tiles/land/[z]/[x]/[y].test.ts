import handler from '../../../../../../../../src/pages/api/tiles/land/[z]/[x]/[y]';

import type { NextApiRequest, NextApiResponse } from 'next';

const makeRes = () => {
  const send = jest.fn();
  const setHeader = jest.fn();
  const status = jest.fn(() => ({ send }));
  return { status, send, setHeader };
};

const callHandler = (
  req: Partial<NextApiRequest>,
  res: ReturnType<typeof makeRes>,
) => handler(req as NextApiRequest, res as unknown as NextApiResponse);

const mockFetch = jest.fn();

describe('land tile api', () => {
  beforeEach(() => {
    process.env.TILES_BASE_URL = 'http://localhost:7800';
  });

  it('validates z/x/y', async () => {
    const res = makeRes();

    await callHandler({ query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Missing z/x/y');
  });

  it('fails predictably when base url is missing', async () => {
    const res = makeRes();
    delete process.env.TILES_BASE_URL;

    await callHandler({ query: { z: '1', x: '2', y: '3' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Tile proxy is not configured');
  });

  it('maps non-ok upstream responses to 502', async () => {
    const res = makeRes();
    globalThis.fetch = mockFetch as typeof fetch;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'missing',
    });

    await callHandler({ query: { z: '1', x: '2', y: '3' } }, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.send).toHaveBeenCalledWith('Land tile upstream error');
  });

  it('maps upstream timeout to 504', async () => {
    const res = makeRes();
    globalThis.fetch = mockFetch as typeof fetch;
    mockFetch.mockRejectedValue(
      Object.assign(new Error('timed out'), { name: 'AbortError' }),
    );

    await callHandler({ query: { z: '1', x: '2', y: '3' } }, res);

    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.send).toHaveBeenCalledWith('Land tile upstream timeout');
  });

  it('maps upstream network failure to 502', async () => {
    const res = makeRes();
    globalThis.fetch = mockFetch as typeof fetch;
    mockFetch.mockRejectedValue(new Error('network down'));

    await callHandler({ query: { z: '1', x: '2', y: '3' } }, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.send).toHaveBeenCalledWith('Land tile upstream unavailable');
  });

  it('returns protobuf tile bytes', async () => {
    const res = makeRes();
    globalThis.fetch = mockFetch as typeof fetch;
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    });

    await callHandler({ query: { z: '1', x: '2', y: '3' } }, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/x-protobuf',
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
  });
});
