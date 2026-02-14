const prismaClientMock = jest.fn(() => ({ mocked: true }));
const prismaPgMock = jest.fn((pool: unknown) => ({ pool }));
const poolMock = jest.fn((opts: unknown) => ({ opts }));

jest.mock('dotenv/config', () => ({}));

jest.mock('@prisma/client', () => ({
  PrismaClient: prismaClientMock,
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: prismaPgMock,
}));

jest.mock('pg', () => ({
  Pool: poolMock,
}));

describe('prisma', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete (globalThis as { prisma?: unknown }).prisma;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    expect(() => {
      jest.isolateModules(() => {
        require('../../../src/lib/prisma');
      });
    }).toThrow('DATABASE_URL is not set');
  });

  it('creates and caches prisma client when configured', () => {
    process.env.DATABASE_URL = 'postgres://example';
    jest.isolateModules(() => {
      const { prisma } = require('../../../src/lib/prisma');

      expect(poolMock).toHaveBeenCalledWith({
        connectionString: 'postgres://example',
      });
      expect(prismaPgMock).toHaveBeenCalled();
      expect(prismaClientMock).toHaveBeenCalledWith({
        adapter: expect.any(Object),
      });
      expect((globalThis as { prisma?: unknown }).prisma).toBe(prisma);
    });
  });

  it('reuses global prisma instance when available', () => {
    process.env.DATABASE_URL = 'postgres://example';
    const cached = { cached: true };
    (globalThis as { prisma?: unknown }).prisma = cached;

    jest.isolateModules(() => {
      const { prisma } = require('../../../src/lib/prisma');
      expect(prisma).toBe(cached);
    });

    expect(prismaClientMock).not.toHaveBeenCalled();
  });
});
