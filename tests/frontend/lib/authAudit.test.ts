import { recordAuthEvent } from '../../../src/lib/authAudit';

const { prismaMock } = require('./prismaMock');

jest.mock('../../../src/lib/prisma', () => ({
  prisma: require('./prismaMock').prismaMock,
}));

describe('recordAuthEvent', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    warnSpy.mockRestore();
  });

  it('records auth events with normalized payload', async () => {
    prismaMock.authEvent.create.mockResolvedValue({});

    await recordAuthEvent({
      userId: 'user-1',
      event: 'login',
      detail: { provider: 'credentials' },
    });

    expect(prismaMock.authEvent.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        event: 'login',
        detail: { provider: 'credentials' },
      },
    });
  });

  it('normalizes null values for prisma payload', async () => {
    prismaMock.authEvent.create.mockResolvedValue({});

    await recordAuthEvent({
      userId: null,
      event: 'logout',
      detail: null,
    });

    expect(prismaMock.authEvent.create).toHaveBeenCalledWith({
      data: {
        userId: null,
        event: 'logout',
        detail: undefined,
      },
    });
  });

  it('swallows prisma errors', async () => {
    prismaMock.authEvent.create.mockRejectedValue(new Error('boom'));

    await recordAuthEvent({ event: 'login' });

    expect(console.warn).toHaveBeenCalled();
  });
});
