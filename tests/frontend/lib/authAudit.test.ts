import { recordAuthEvent } from '../../../src/lib/authAudit';

jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    authEvent: {
      create: jest.fn(),
    },
  },
}));

const prismaMock = jest.requireMock('../../../src/lib/prisma') as {
  prisma: { authEvent: { create: jest.Mock } };
};

describe('recordAuthEvent', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('records auth events with normalized payload', async () => {
    prismaMock.prisma.authEvent.create.mockResolvedValue({});

    await recordAuthEvent({
      userId: 'user-1',
      event: 'login',
      detail: { provider: 'credentials' },
    });

    expect(prismaMock.prisma.authEvent.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        event: 'login',
        detail: { provider: 'credentials' },
      },
    });
  });

  it('normalizes null values for prisma payload', async () => {
    prismaMock.prisma.authEvent.create.mockResolvedValue({});

    await recordAuthEvent({
      userId: null,
      event: 'logout',
      detail: null,
    });

    expect(prismaMock.prisma.authEvent.create).toHaveBeenCalledWith({
      data: {
        userId: null,
        event: 'logout',
        detail: undefined,
      },
    });
  });

  it('swallows prisma errors', async () => {
    prismaMock.prisma.authEvent.create.mockRejectedValue(new Error('boom'));

    await recordAuthEvent({ event: 'login' });

    expect(console.warn).toHaveBeenCalled();
  });
});
