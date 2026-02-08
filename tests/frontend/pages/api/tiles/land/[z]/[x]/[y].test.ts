import handler from '../../../../../../../../src/pages/api/tiles/land/[z]/[x]/[y]';

const makeRes = () => {
  const send = jest.fn();
  const setHeader = jest.fn();
  const status = jest.fn(() => ({ send }));
  return { status, send, setHeader };
};

describe('land tile api', () => {
  it('validates z/x/y', async () => {
    const res = makeRes();

    await handler({ query: {} } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Missing z/x/y');
  });

  it('proxies error response', async () => {
    const res = makeRes();
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'missing',
    });

    await handler({ query: { z: '1', x: '2', y: '3' } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('missing');
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
