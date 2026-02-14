import { setupSocketManager } from './harness';

const mockSimulationLoop = {
  syncVesselFromStore: jest.fn(),
  teleportVessel: jest.fn(),
};

jest.mock('../../../../src/simulation', () => ({
  __esModule: true,
  getSimulationLoop: () => mockSimulationLoop,
}));

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('socket manager chat', () => {
  it('sendChatMessage prefixes channels with space and normalizes vessel ids', () => {
    const { socketManager, socket } = setupSocketManager({ spaceId: 'Harbor' });

    socketManager.connect('ws://example');
    socket.emit.mockClear();

    socketManager.sendChatMessage('hi');
    expect(socket.emit).toHaveBeenCalledWith('chat:message', {
      message: 'hi',
      channel: 'space:harbor:global',
    });

    socket.emit.mockClear();
    socketManager.sendChatMessage('yo', 'vessel:abc_123');
    expect(socket.emit).toHaveBeenCalledWith('chat:message', {
      message: 'yo',
      channel: 'space:harbor:vessel:abc',
    });
  });

  it('requestChatHistory short-circuits when channel history is loaded', () => {
    const { socketManager, socket, storeState } = setupSocketManager({
      chatHistoryMeta: {
        'space:harbor:global': { loaded: true, hasMore: true },
      },
    });

    socketManager.connect('ws://example');
    socket.emit.mockClear();

    socketManager.requestChatHistory('global');

    expect(socket.emit).not.toHaveBeenCalled();
    expect(storeState.setChatHistoryMeta).toHaveBeenCalledWith(
      'space:harbor:global',
      { hasMore: true, loaded: true },
    );
  });

  it('requestChatHistory emits normalized channel when not loaded', () => {
    const { socketManager, socket } = setupSocketManager({
      chatHistoryMeta: {},
      chatMessages: [],
    });

    socketManager.connect('ws://example');
    socket.emit.mockClear();

    socketManager.requestChatHistory('vessel:ship_99', undefined, 10);

    expect(socket.emit).toHaveBeenCalledWith('chat:history', {
      channel: 'space:harbor:vessel:ship',
      before: undefined,
      limit: 10,
    });
  });

  it('handles chat message and chat history events', () => {
    const { socketManager, handlers, storeState } = setupSocketManager();

    socketManager.connect('ws://example');

    handlers['chat:message']?.({
      id: 'msg-1',
      userId: 'system',
      username: 'System',
      message: 'Hello',
      timestamp: 100,
      channel: 'global',
    });

    expect(storeState.addChatMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'msg-1',
        userId: 'system',
        username: 'System',
        message: 'Hello',
        channel: 'global',
      }),
    );
    expect(storeState.addEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'system',
        type: 'notification',
        message: 'System: Hello',
      }),
    );

    handlers['chat:history']?.({
      channel: 'vessel:alpha_1',
      messages: [
        {
          id: 'msg-2',
          userId: 'user-2',
          username: 'Crew',
          message: 'Ahoy',
        },
      ],
      reset: true,
      hasMore: false,
    });

    expect(storeState.replaceChannelMessages).toHaveBeenCalledWith(
      'vessel:alpha',
      expect.any(Array),
    );
    expect(storeState.setChatHistoryMeta).toHaveBeenCalledWith('vessel:alpha', {
      hasMore: false,
      loaded: true,
    });
  });
});
