import handler from '../../../../src/pages/api/hello';

describe('pages/api/hello', () => {
  it('returns hello response', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const req = {} as any;
    const res = { status } as any;

    handler(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ message: 'Hello from Next.js!' });
  });
});
