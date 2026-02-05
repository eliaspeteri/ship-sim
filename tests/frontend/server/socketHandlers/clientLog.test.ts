import { registerClientLogHandler } from '../../../../src/server/socketHandlers/clientLog';
import { recordLog } from '../../../../src/server/observability';

jest.mock('../../../../src/server/observability', () => ({
  recordLog: jest.fn(),
}));

describe('registerClientLogHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records client logs with defaults', () => {
    (recordLog as jest.Mock).mockClear();
    const handlers: Record<string, any> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      data: { userId: 'user-1', spaceId: 'space-1' },
    };

    registerClientLogHandler({
      socket,
      defaultSpaceId: 'default-space',
    } as any);

    handlers['client:log']({ message: 'hello' });

    expect(recordLog).toHaveBeenCalledWith({
      level: 'info',
      source: 'client',
      message: 'hello',
      meta: { userId: 'user-1', spaceId: 'space-1' },
    });
  });

  it('skips invalid log payloads', () => {
    (recordLog as jest.Mock).mockClear();
    const handlers: Record<string, any> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      data: {},
    };

    registerClientLogHandler({
      socket,
      defaultSpaceId: 'default-space',
    } as any);

    handlers['client:log']({ level: 'warn' });

    expect(recordLog).not.toHaveBeenCalled();
  });
});
