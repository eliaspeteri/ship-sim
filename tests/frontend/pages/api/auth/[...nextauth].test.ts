import { prismaMock } from '../../../lib/prismaMock';

const mockNextAuth = jest.fn<unknown, unknown[]>(() => 'next-auth-handler');
const mockCredentialsProvider = jest.fn<unknown, unknown[]>(
  (config: unknown) => config,
);
const mockPrismaAdapter = jest.fn<unknown, unknown[]>(() => ({
  id: 'adapter',
}));
const mockCompare = jest.fn();
const mockSign = jest.fn<unknown, unknown[]>(() => 'signed-token');
const mockRecordAuthEvent = jest.fn();

jest.mock('next-auth', () => ({
  __esModule: true,
  default: (...args: Parameters<typeof mockNextAuth>) => mockNextAuth(...args),
}));

jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: (...args: Parameters<typeof mockCredentialsProvider>) =>
    mockCredentialsProvider(...args),
}));

jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: (...args: Parameters<typeof mockPrismaAdapter>) =>
    mockPrismaAdapter(...args),
}));

jest.mock('../../../../../src/lib/prisma', () => ({
  prisma: prismaMock,
}));

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    compare: (...args: unknown[]) => mockCompare(...args),
  },
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: (...args: Parameters<typeof mockSign>) => mockSign(...args),
  },
}));

jest.mock('../../../../../src/lib/authAudit', () => ({
  recordAuthEvent: (...args: unknown[]) => mockRecordAuthEvent(...args),
}));

const loadModule = async () => {
  jest.resetModules();
  return import('../../../../../src/pages/api/auth/[...nextauth]');
};

const getAuthorize = async () => {
  const mod = await loadModule();
  const provider = mod.authOptions.providers?.[0] as unknown as {
    authorize: (
      credentials: { username?: string; password?: string } | undefined,
      req: unknown,
    ) => Promise<unknown>;
  };
  return { authorize: provider.authorize, authOptions: mod.authOptions };
};

describe('pages/api/auth/[...nextauth]', () => {
  beforeEach(() => {
    mockNextAuth.mockClear();
    mockCredentialsProvider.mockClear();
    mockPrismaAdapter.mockClear();
    mockCompare.mockReset();
    mockSign.mockReset();
    mockSign.mockReturnValue('signed-token');
    mockRecordAuthEvent.mockReset();
    prismaMock.user.findFirst.mockReset();
    delete process.env.NEXTAUTH_SECRET;
  });

  it('builds auth options and exports NextAuth handler', async () => {
    const mod = await loadModule();

    expect(mockPrismaAdapter).toHaveBeenCalledWith(prismaMock);
    expect(mockCredentialsProvider).toHaveBeenCalledTimes(1);
    expect(mockNextAuth).toHaveBeenCalledWith(mod.authOptions);
    expect(mod.default).toBe('next-auth-handler');
    expect(mod.authOptions.pages?.signIn).toBe('/login');
  });

  it('authorizes valid credentials and rejects invalid inputs', async () => {
    const { authorize } = await getAuthorize();
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'captain',
      rank: 3,
      credits: 42,
      experience: 77,
      safetyScore: 0.95,
      passwordHash: 'hashed',
    });
    mockCompare.mockResolvedValue(true);

    await expect(authorize(undefined, {})).resolves.toBeNull();

    const user = await authorize(
      { username: 'alice@example.com', password: 'pw' },
      {},
    );

    expect(user).toEqual(
      expect.objectContaining({
        id: 'u1',
        name: 'Alice',
        role: 'captain',
        rank: 3,
        credits: 42,
        experience: 77,
        safetyScore: 0.95,
      }),
    );
  });

  it('enforces lockout after repeated failures and unlocks after timeout', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const { authorize } = await getAuthorize();
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'u2',
      email: 'bob@example.com',
      passwordHash: 'hashed',
    });
    mockCompare.mockResolvedValue(false);

    for (let i = 0; i < 5; i += 1) {
      await expect(
        authorize({ username: 'bob', password: 'bad' }, {}),
      ).resolves.toBeNull();
    }
    mockCompare.mockResolvedValue(true);
    await expect(
      authorize({ username: 'bob', password: 'good' }, {}),
    ).rejects.toThrow(/^LOCKED_OUT:\d+$/);
    mockCompare.mockResolvedValue(false);
    await expect(
      authorize({ username: 'bob', password: 'bad' }, {}),
    ).rejects.toThrow(/^LOCKED_OUT:\d+$/);

    nowSpy.mockReturnValue(1_000 + 10 * 60 * 1000 + 1);
    mockCompare.mockResolvedValue(true);
    await expect(
      authorize({ username: 'bob', password: 'good' }, {}),
    ).resolves.toEqual(expect.objectContaining({ id: 'u2' }));

    nowSpy.mockRestore();
  });

  it('populates jwt token fields and records login/token rotation audits', async () => {
    const { authOptions } = await getAuthorize();
    const jwtCallback = authOptions.callbacks?.jwt;
    expect(jwtCallback).toBeDefined();

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(20_000_000);
    const first = await jwtCallback!({
      token: { iat: 1 },
      user: {
        id: 'u3',
        name: 'Carol',
        role: 'player',
        rank: 2,
        credits: 9,
        experience: 11,
        safetyScore: 0.9,
      },
      account: {
        provider: 'credentials',
        type: 'credentials',
        providerAccountId: 'x',
      },
    } as any);

    expect(first).toEqual(
      expect.objectContaining({
        sub: 'u3',
        name: 'Carol',
        role: 'player',
        rank: 2,
        credits: 9,
        experience: 11,
        safetyScore: 0.9,
        lastRotationAt: 20_000_000,
      }),
    );
    expect(mockRecordAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u3', event: 'login' }),
    );

    mockRecordAuthEvent.mockClear();
    nowSpy.mockReturnValue(30_000_000);
    const rotated = await jwtCallback!({
      token: { iat: 1, sub: 'u3' },
      user: undefined,
      account: undefined,
    } as any);

    expect(rotated).toEqual(
      expect.objectContaining({ lastRotationAt: 30_000_000 }),
    );
    expect(mockRecordAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u3', event: 'token_rotate' }),
    );

    nowSpy.mockRestore();
  });

  it('maps session fields and signs socket token when secret is set', async () => {
    process.env.NEXTAUTH_SECRET = 'secret';
    const { authOptions } = await getAuthorize();
    const sessionCallback = authOptions.callbacks?.session;
    expect(sessionCallback).toBeDefined();

    const session = await sessionCallback!({
      session: { user: { name: 'Dora' } },
      token: {
        sub: 'u4',
        role: 'admin',
        rank: 7,
        credits: 123,
        experience: 456,
        safetyScore: 0.88,
        iat: 1,
      },
    } as any);

    expect(session).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          id: 'u4',
          role: 'admin',
          rank: 7,
          credits: 123,
          experience: 456,
          safetyScore: 0.88,
        }),
        socketToken: 'signed-token',
      }),
    );
    expect(mockSign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'u4' }),
      'secret',
    );
  });
});
