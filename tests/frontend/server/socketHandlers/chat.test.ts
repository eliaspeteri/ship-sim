import { registerChatHandlers } from '../../../../src/server/socketHandlers/chat';
import { prisma } from '../../../../src/lib/prisma';
import { socketHasPermission } from '../../../../src/server/middleware/authorization';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    chatMessage: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/server/middleware/authorization', () => ({
  socketHasPermission: jest.fn(),
}));

describe('registerChatHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects messages without permission', async () => {
    (socketHasPermission as jest.Mock).mockReturnValue(false);

    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User' },
    };

    registerChatHandlers({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      getVesselIdForUser: jest.fn(),
      resolveChatChannel: jest.fn(() => 'space:space-1:global'),
      normalizeVesselId: jest.fn(id => id),
      getActiveMute: jest.fn(async () => null),
      loadChatHistory: jest.fn(),
      chatHistoryPageSize: 20,
      defaultSpaceId: 'space-1',
    } as unknown as Parameters<typeof registerChatHandlers>[0]);

    await handlers['chat:message']({ message: 'hello' });

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Not authorized to send chat messages',
    );
  });

  it('emits messages to resolved channel', async () => {
    (socketHasPermission as jest.Mock).mockReturnValue(true);
    (prisma.chatMessage.create as jest.Mock).mockResolvedValue({
      id: 'm-1',
      createdAt: new Date(1000),
    });

    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User' },
    };

    registerChatHandlers({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      getVesselIdForUser: jest.fn(() => 'v-1'),
      resolveChatChannel: jest.fn(() => 'space:space-1:v-1'),
      normalizeVesselId: jest.fn(id => id),
      getActiveMute: jest.fn(async () => null),
      loadChatHistory: jest.fn(),
      chatHistoryPageSize: 20,
      defaultSpaceId: 'space-1',
    } as unknown as Parameters<typeof registerChatHandlers>[0]);

    await handlers['chat:message']({ message: ' hello ' });

    expect(prisma.chatMessage.create).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('chat:message', {
      id: 'm-1',
      userId: 'user-1',
      username: 'User',
      message: 'hello',
      timestamp: 1000,
      channel: 'space:space-1:v-1',
    });
  });

  it('loads chat history with defaults', async () => {
    (socketHasPermission as jest.Mock).mockReturnValue(true);
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User' },
    };
    const loadChatHistory = jest.fn(async () => ({
      messages: [{ id: 'm-1' }],
      hasMore: true,
    }));

    registerChatHandlers({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      getVesselIdForUser: jest.fn(() => 'v-1'),
      resolveChatChannel: jest.fn(() => 'space:space-1:global'),
      normalizeVesselId: jest.fn(id => id),
      getActiveMute: jest.fn(async () => null),
      loadChatHistory,
      chatHistoryPageSize: 20,
      defaultSpaceId: 'space-1',
    } as unknown as Parameters<typeof registerChatHandlers>[0]);

    await handlers['chat:history']({});

    expect(loadChatHistory).toHaveBeenCalledWith(
      'space:space-1:global',
      undefined,
      20,
    );
    expect(socket.emit).toHaveBeenCalledWith('chat:history', {
      channel: 'space:space-1:global',
      messages: [{ id: 'm-1' }],
      hasMore: true,
      reset: true,
    });
  });
});
