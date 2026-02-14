import {
  STORAGE_SPACE_KEY,
  STORAGE_SPACE_SELECTED_KEY,
} from '../../../../src/features/sim/constants';
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

describe('socket manager auth and connection', () => {
  it('connects with store auth and skips reconnecting when already connected', () => {
    const { socketManager, ioMock, storeState } = setupSocketManager({
      spaceId: 'harbor',
    });

    socketManager.setSpaceId('harbor');
    socketManager.connect('ws://example');

    expect(ioMock).toHaveBeenCalledTimes(1);
    const [url, options] = ioMock.mock.calls[0] as unknown as [
      string,
      { auth: Record<string, unknown> },
    ];
    expect(url).toBe('ws://example');
    const auth = options.auth;
    expect(auth.spaceId).toBe('harbor');
    expect(auth.username).toBe('Anonymous');
    expect(auth.mode).toBe('player');
    expect(auth.autoJoin).toBe(true);
    expect(auth.userId).toMatch(/^user_/);
    expect(storeState.setCurrentVesselId).toHaveBeenCalledWith(null);

    socketManager.connect('ws://example');
    expect(ioMock).toHaveBeenCalledTimes(1);
  });

  it('refreshAuth updates socket auth and emits user:auth', () => {
    const { socketManager, socket } = setupSocketManager({ spaceId: 'harbor' });

    socketManager.connect('ws://example');
    socket.auth = { existing: 'keep' };
    socket.emit.mockClear();

    socketManager.refreshAuth('token-1', 'user-42', 'Ada');

    expect(socket.auth).toEqual(
      expect.objectContaining({
        existing: 'keep',
        token: 'token-1',
        userId: 'user-42',
        username: 'Ada',
        spaceId: 'harbor',
        mode: 'player',
        autoJoin: true,
      }),
    );
    expect(socket.emit).toHaveBeenCalledWith('user:auth', {
      token: 'token-1',
      userId: 'user-42',
      username: 'Ada',
    });
  });

  it('resolves waitForConnection and starts latency/resync timers on connect', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00Z'));
    const { socketManager, handlers, socket } = setupSocketManager();

    socketManager.connect('ws://example');
    socket.emit.mockClear();

    const waitPromise = socketManager.waitForConnection();
    handlers.connect?.();
    await waitPromise;

    expect(socket.emit).toHaveBeenCalledWith('user:mode', { mode: 'player' });

    socket.emit.mockClear();
    jest.advanceTimersByTime(9000);

    const events = socket.emit.mock.calls.map(call => call[0]);
    expect(events).toContain('latency:ping');
    expect(events).toContain('simulation:resync');
  });

  it('attempts reconnect on disconnect and connect_error', () => {
    jest.useFakeTimers();
    const { socketManager, handlers, socket } = setupSocketManager();

    socketManager.connect('ws://example');
    socket.connect.mockClear();

    handlers.disconnect?.('io server disconnect');
    jest.advanceTimersByTime(2000);
    expect(socket.connect).toHaveBeenCalled();

    socket.connect.mockClear();
    handlers.connect_error?.(new Error('boom'));
    jest.advanceTimersByTime(4000);
    expect(socket.connect).toHaveBeenCalled();
  });

  it('updates socket auth via setters', () => {
    const { socketManager, socket, storeState } = setupSocketManager({
      spaceId: 'reef',
    });

    socketManager.connect('ws://example');
    socket.auth = {};

    socketManager.setJoinPreference('spectator', false);
    expect(socket.auth).toEqual(
      expect.objectContaining({ mode: 'spectator', autoJoin: false }),
    );

    socketManager.setSpaceId('reef');
    expect(socket.auth).toEqual(expect.objectContaining({ spaceId: 'reef' }));

    socketManager.setAuthToken('token', 'user-9', 'Nova');
    expect(socket.auth).toEqual(
      expect.objectContaining({
        token: 'token',
        userId: 'user-9',
        username: 'Nova',
        spaceId: storeState.spaceId,
      }),
    );
  });

  it('handles space mismatch errors by switching space and persisting selection', () => {
    const { socketManager, handlers, storeState } = setupSocketManager({
      spaceId: 'global',
    });

    socketManager.connect('ws://example');
    const switchSpy = jest
      .spyOn(socketManager, 'switchSpace')
      .mockImplementation(() => {});

    handlers.error?.('Vessel is in space Harbor-1');

    expect(storeState.setSpaceId).toHaveBeenCalledWith('harbor-1');
    expect(storeState.setChatMessages).toHaveBeenCalledWith([]);
    expect(window.localStorage.getItem(STORAGE_SPACE_KEY)).toBe('harbor-1');
    expect(window.localStorage.getItem(STORAGE_SPACE_SELECTED_KEY)).toBe(
      'true',
    );
    expect(switchSpy).toHaveBeenCalledWith('harbor-1');
    expect(storeState.setNotice).toHaveBeenCalledWith({
      type: 'error',
      message: 'Vessel is in space Harbor-1',
    });
  });

  it('forces spectator mode on auth errors', () => {
    const { socketManager, handlers, storeState } = setupSocketManager();

    socketManager.connect('ws://example');
    handlers.error?.('Signed in elsewhere');

    expect(storeState.setMode).toHaveBeenCalledWith('spectator');
    expect(storeState.setCurrentVesselId).toHaveBeenCalledWith(null);
  });
});
