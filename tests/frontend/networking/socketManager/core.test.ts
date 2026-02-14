import { flushPromises, setupSocketManager } from './harness';

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
  jest.clearAllMocks();
});

describe('socket manager core guards', () => {
  it('disconnects existing stale socket before reconnecting', () => {
    const { socketManager, ioMock, socket } = setupSocketManager();

    socketManager.connect('ws://example');
    expect(ioMock).toHaveBeenCalledTimes(1);

    socket.connected = false;
    socketManager.connect('ws://example-2');

    expect(socket.disconnect).toHaveBeenCalled();
    expect(ioMock).toHaveBeenCalledTimes(2);
  });

  it('switches space by resetting simulation clock and reconnecting', () => {
    const { socketManager, socket } = setupSocketManager({ spaceId: 'global' });
    socketManager.connect('ws://example');
    socket.connected = false;

    socketManager.switchSpace('harbor');

    expect(socket.disconnect).toHaveBeenCalled();
  });

  it('waitForConnection queues when disconnected and resolves on connect', async () => {
    const { socketManager, handlers, socket } = setupSocketManager();
    socketManager.connect('ws://example');
    socket.connected = false;

    let resolved = false;
    const pending = socketManager.waitForConnection().then(() => {
      resolved = true;
    });
    await flushPromises(1);
    expect(resolved).toBe(false);

    handlers.connect?.();
    await pending;
    expect(resolved).toBe(true);
  });

  it('handles disconnected command guards and username parsing fallback', () => {
    const warnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { socketManager, socket } = setupSocketManager({ roles: ['admin'] });
    socketManager.connect('ws://example');
    socket.emit.mockClear();

    socket.connected = false;
    socketManager.sendVesselUpdate();
    socketManager.requestNewVessel({ x: 1, y: 2 });
    socketManager.requestJoinVessel('v-1');
    socketManager.requestHelm('claim');
    socketManager.requestStation('helm', 'release');
    socketManager.requestRepair('v-1');
    socketManager.sendChatMessage('hello');
    socketManager.requestChatHistory('global');
    socketManager.sendClientLog({ level: 'info', source: 'ui', message: 'x' });
    socketManager.notifyModeChange('spectator');
    socketManager.sendAdminVesselMove('v-1', { x: 1, y: 2 });
    socketManager.sendAdminVesselMode('v-1', 'ai');
    socketManager.sendAdminVesselStop('v-1');
    socketManager.sendAdminVesselRemove('v-1');
    socketManager.sendAdminKick('u-1');
    socketManager.sendWeatherControl('storm');
    socketManager.enableRandomWeather();
    expect(socket.emit).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();

    window.localStorage.setItem('ship-sim-auth', '{bad json');
    expect(socketManager.getUsername()).toBe('Anonymous');
    expect(errorSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('supports weather string mode, connection subscription, and auth refresh', async () => {
    const { socketManager, socket, handlers } = setupSocketManager({
      roles: ['admin'],
    });
    socketManager.connect('ws://example');
    socket.emit.mockClear();

    const listener = jest.fn();
    const unsubscribe = socketManager.subscribeConnectionStatus(listener);
    expect(listener).toHaveBeenCalledWith(true);

    handlers.disconnect?.('bye');
    handlers.connect?.();
    expect(listener).toHaveBeenCalled();
    unsubscribe();

    socketManager.sendWeatherControl('rain');
    expect(socket.emit).toHaveBeenCalledWith('admin:weather', {
      pattern: 'rain',
      mode: 'manual',
    });

    socketManager.refreshAuth(undefined, undefined, undefined);
    expect(socket.emit).toHaveBeenCalledWith('user:auth', {
      token: null,
      userId: expect.stringMatching(/^user_/),
      username: 'Anonymous',
    });

    const immediate = await socketManager.waitForConnection();
    expect(immediate).toBeUndefined();
  });
});
