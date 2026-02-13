import handler from '../../../../../../../../src/pages/api/tiles/land/[z]/[x]/[y]';

const makeRes = () => {
  const send = jest.fn();
  const setHeader = jest.fn();
  const status = jest.fn(() => ({ send }));
  return { status, send, setHeader };
};

describe('land tile api', () => {
  beforeEach(() => {
    process.env.TILES_BASE_URL = 'http://localhost:7800';
  });

  it('validates z/x/y', async () => {
    const res = makeRes();

    await handler({ query: {} } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Missing z/x/y');
  });

  it('fails predictably when base url is missing', async () => {
    const res = makeRes();
    delete process.env.TILES_BASE_URL;

    await handler({ query: { z: '1', x: '2', y: '3' } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Tile proxy is not configured');
  });

  it('maps non-ok upstream responses to 502', async () => {
    const res = makeRes();
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'missing',
    });

    await handler({ query: { z: '1', x: '2', y: '3' } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.send).toHaveBeenCalledWith('Land tile upstream error');
  });

  it('maps upstream timeout to 504', async () => {
    const res = makeRes();
    (globalThis as any).fetch = jest
      .fn()
      .mockRejectedValue(
        Object.assign(new Error('timed out'), { name: 'AbortError' }),
      );

    await handler({ query: { z: '1', x: '2', y: '3' } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.send).toHaveBeenCalledWith('Land tile upstream timeout');
  });

  it('maps upstream network failure to 502', async () => {
    const res = makeRes();
    (globalThis as any).fetch = jest
      .fn()
      .mockRejectedValue(new Error('network down'));

    await handler({ query: { z: '1', x: '2', y: '3' } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.send).toHaveBeenCalledWith('Land tile upstream unavailable');
  });

  it('returns protobuf tile bytes', async () => {
    const res = makeRes();
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    });

    await handler({ query: { z: '1', x: '2', y: '3' } } as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/x-protobuf',
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
  });
});
