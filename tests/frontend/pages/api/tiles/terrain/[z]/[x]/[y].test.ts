import handler from '../../../../../../../../src/pages/api/tiles/terrain/[z]/[x]/[y]';

const makeRes = () => {
  const send = jest.fn();
  const setHeader = jest.fn();
  const status = jest.fn(() => ({ send }));
  return { status, send, setHeader };
};

describe('terrain tile api', () => {
  it('validates z/x/y', async () => {
    const res = makeRes();

    await handler({ query: {} } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Missing z/x/y');
  });

  it('proxies non-ok response', async () => {
    const res = makeRes();
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'upstream fail',
    });

    await handler({ query: { z: '3', x: '4', y: '5' } } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('upstream fail');
  });

  it('returns png tile bytes', async () => {
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const res = makeRes();
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([4, 5, 6]).buffer,
    });

    process.env.TERRAIN_TILES_BASE_URL = 'https://tiles.example.com';

    await handler({ query: { z: '3', x: '4', y: '5' } } as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
    expect(infoSpy).toHaveBeenCalled();

    infoSpy.mockRestore();
  });
});
