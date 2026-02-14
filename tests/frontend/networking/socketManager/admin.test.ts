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

describe('socket manager admin and outbound commands', () => {
  it('sendControlUpdate only emits when control changes exceed epsilon', () => {
    const { socketManager, socket } = setupSocketManager();

    socketManager.connect('ws://example');
    socket.emit.mockClear();

    socketManager.sendControlUpdate(0, 0, 0);
    expect(socket.emit).not.toHaveBeenCalled();

    socketManager.sendControlUpdate(0.1, 0, 0);
    expect(socket.emit).toHaveBeenCalledWith(
      'vessel:control',
      expect.objectContaining({
        throttle: 0.1,
        rudderAngle: 0,
        ballast: 0,
      }),
    );

    const callCount = socket.emit.mock.calls.length;
    socketManager.sendControlUpdate(0.1, 0, 0);
    expect(socket.emit).toHaveBeenCalledTimes(callCount);
  });

  it('sendWeatherControl requires admin privileges', () => {
    const { socketManager, socket } = setupSocketManager({ roles: [] });

    socketManager.connect('ws://example');
    socket.emit.mockClear();

    socketManager.sendWeatherControl('storm');
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('sendWeatherControl emits admin:weather when authorized', () => {
    const { socketManager, socket } = setupSocketManager({
      roles: ['admin'],
    });

    socketManager.connect('ws://example');
    socket.emit.mockClear();

    socketManager.sendWeatherControl({ pattern: 'rain', mode: 'manual' });
    expect(socket.emit).toHaveBeenCalledWith('admin:weather', {
      pattern: 'rain',
      coordinates: undefined,
      mode: 'manual',
    });
  });

  it('emits admin and repair actions when connected', () => {
    const { socketManager, socket, storeState } = setupSocketManager();

    socketManager.connect('ws://example');
    socket.emit.mockImplementation(
      (
        event: string,
        _payload: unknown,
        cb?: (result?: { ok: boolean; message?: string }) => void,
      ) => {
        if (event === 'vessel:repair' && typeof cb === 'function') {
          cb({ ok: true, message: 'Repaired' });
        }
      },
    );

    socketManager.requestHelm('claim');
    expect(socket.emit).toHaveBeenCalledWith('vessel:helm', {
      action: 'claim',
    });

    socketManager.requestStation('engine', 'release');
    expect(socket.emit).toHaveBeenCalledWith('vessel:station', {
      station: 'engine',
      action: 'release',
    });

    socketManager.requestJoinVessel('v-9');
    expect(socket.emit).toHaveBeenCalledWith('vessel:join', {
      vesselId: 'v-9',
    });

    socketManager.requestNewVessel({ x: 1, y: 2 });
    const createCall = socket.emit.mock.calls.find(
      call => call[0] === 'vessel:create',
    );
    expect(createCall).toBeTruthy();
    expect(createCall?.[1]).toEqual(
      expect.objectContaining({
        x: 1,
        y: 2,
        lat: expect.any(Number),
        lon: expect.any(Number),
      }),
    );

    socketManager.requestRepair('v-1');
    expect(storeState.setNotice).toHaveBeenCalledWith({
      type: 'info',
      message: 'Repaired',
    });

    socket.emit.mockImplementation(
      (
        event: string,
        _payload: unknown,
        cb?: (result?: { ok: boolean; message?: string }) => void,
      ) => {
        if (event === 'vessel:repair' && typeof cb === 'function') {
          cb({ ok: false, message: 'Nope' });
        }
      },
    );
    socketManager.requestRepair('v-1');
    expect(storeState.setNotice).toHaveBeenCalledWith({
      type: 'error',
      message: 'Nope',
    });

    socketManager.sendAdminVesselMove('v-1', { x: 3, y: 4 });
    const moveCall = socket.emit.mock.calls.find(
      call => call[0] === 'admin:vessel:move',
    );
    expect(moveCall?.[1]).toEqual(
      expect.objectContaining({
        vesselId: 'v-1',
        position: expect.objectContaining({
          x: 3,
          y: 4,
          lat: expect.any(Number),
          lon: expect.any(Number),
        }),
      }),
    );

    socketManager.sendAdminVesselMode('v-1', 'ai');
    expect(socket.emit).toHaveBeenCalledWith('admin:vesselMode', {
      vesselId: 'v-1',
      mode: 'ai',
    });

    socketManager.sendAdminVesselStop('v-1');
    expect(socket.emit).toHaveBeenCalledWith('admin:vessel:stop', {
      vesselId: 'v-1',
    });

    socketManager.sendAdminVesselRemove('v-1');
    expect(socket.emit).toHaveBeenCalledWith('admin:vessel:remove', {
      vesselId: 'v-1',
    });

    socketManager.sendAdminKick('user-1', 'reason');
    expect(socket.emit).toHaveBeenCalledWith('admin:kick', {
      userId: 'user-1',
      reason: 'reason',
    });
  });

  it('sendVesselUpdate and sendClientLog emit when connected', () => {
    const { socketManager, socket } = setupSocketManager();

    socketManager.connect('ws://example');
    socket.emit.mockClear();

    socketManager.sendVesselUpdate();
    expect(socket.emit).toHaveBeenCalledWith(
      'vessel:update',
      expect.objectContaining({
        position: expect.any(Object),
        orientation: expect.any(Object),
        velocity: expect.any(Object),
      }),
    );

    socketManager.sendClientLog({
      level: 'info',
      source: 'ui',
      message: 'hello',
    });
    expect(socket.emit).toHaveBeenCalledWith('client:log', {
      level: 'info',
      source: 'ui',
      message: 'hello',
    });
  });
});
