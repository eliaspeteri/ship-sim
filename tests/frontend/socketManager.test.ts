import {
  STORAGE_SPACE_KEY,
  STORAGE_SPACE_SELECTED_KEY,
} from '../../src/features/sim/constants';

type StoreState = Record<string, any>;

const flushPromises = async (ticks = 3) => {
  for (let i = 0; i < ticks; i += 1) {
    await Promise.resolve();
  }
};

const createStoreState = (overrides: Partial<StoreState> = {}): StoreState => {
  const state: StoreState = {
    spaceId: 'harbor',
    roles: [],
    mode: 'player',
    sessionUserId: null,
    currentVesselId: null,
    vessel: {
      position: { lat: 0, lon: 0, x: 0, y: 0, z: 0 },
      orientation: { heading: 0, roll: 0, pitch: 0 },
      velocity: { surge: 0, sway: 0, heave: 0 },
      controls: { throttle: 0, rudderAngle: 0, ballast: 0 },
      failureState: {},
      damageState: {},
    },
    otherVessels: {},
    chatHistoryMeta: {},
    chatMessages: [],
    seamarks: { radiusMeters: 0 },
    setSpaceId: jest.fn((spaceId: string) => {
      state.spaceId = spaceId;
    }),
    setMode: jest.fn((mode: string) => {
      state.mode = mode;
    }),
    setCurrentVesselId: jest.fn((vesselId: string | null) => {
      state.currentVesselId = vesselId;
    }),
    setChatMessages: jest.fn((messages: unknown[]) => {
      state.chatMessages = messages;
    }),
    setChatHistoryMeta: jest.fn((channel: string, meta: unknown) => {
      state.chatHistoryMeta[channel] = meta;
    }),
    mergeChatMessages: jest.fn((messages: unknown[]) => {
      state.chatMessages = [...state.chatMessages, ...messages];
    }),
    replaceChannelMessages: jest.fn((channel: string, messages: any[]) => {
      state.chatMessages = state.chatMessages
        .filter((msg: any) => msg.channel !== channel)
        .concat(messages);
    }),
    setNotice: jest.fn(),
    setRoles: jest.fn((roles: string[]) => {
      state.roles = roles;
    }),
    setSessionUserId: jest.fn((userId: string) => {
      state.sessionUserId = userId;
    }),
    setOtherVessels: jest.fn((vessels: Record<string, unknown>) => {
      state.otherVessels = vessels;
    }),
    updateVessel: jest.fn((partial: Record<string, unknown>) => {
      state.vessel = { ...state.vessel, ...partial };
    }),
    setCrew: jest.fn(),
    updateEnvironment: jest.fn(),
    setAccount: jest.fn(),
    upsertMissionAssignment: jest.fn(),
    addChatMessage: jest.fn((message: unknown) => {
      state.chatMessages = [...state.chatMessages, message];
    }),
    addEvent: jest.fn(),
    setSeamarks: jest.fn((next: Record<string, unknown>) => {
      state.seamarks = { ...state.seamarks, ...next };
    }),
    setSocketLatencyMs: jest.fn(),
    setSpaceInfo: jest.fn(),
    updateMachineryStatus: jest.fn(),
    setMissionAssignments: jest.fn(),
    setMissions: jest.fn(),
  };

  return Object.assign(state, overrides);
};

const setupSocketManager = (overrides: Partial<StoreState> = {}) => {
  jest.resetModules();
  const storeState = createStoreState(overrides);
  const handlers: Record<string, (payload?: any) => void> = {};
  const simulationLoop = {
    syncVesselFromStore: jest.fn(),
    teleportVessel: jest.fn(),
  };
  const socket = {
    connected: true,
    auth: {},
    on: jest.fn((event: string, cb: (payload?: any) => void) => {
      handlers[event] = cb;
      return socket;
    }),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };

  const ioMock = jest.fn(() => socket);

  jest.doMock('socket.io-client', () => ({
    __esModule: true,
    default: ioMock,
  }));

  jest.doMock('../../src/simulation', () => ({
    __esModule: true,
    getSimulationLoop: () => simulationLoop,
  }));

  jest.doMock('../../src/store', () => {
    const useStore = (selector?: (state: StoreState) => unknown) =>
      selector ? selector(storeState) : storeState;
    (useStore as typeof useStore & { getState?: () => StoreState }).getState =
      () => storeState;
    return {
      __esModule: true,
      default: useStore,
    };
  });

  let socketManager: any;
  jest.isolateModules(() => {
    socketManager = require('../../src/networking/socket').default;
  });

  return {
    socketManager,
    socket,
    handlers,
    storeState,
    ioMock,
    simulationLoop,
  };
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('socket manager (frontend)', () => {
  it('connects with auth from store and avoids reconnecting when already connected', () => {
    const { socketManager, ioMock, storeState } = setupSocketManager({
      spaceId: 'harbor',
    });

    socketManager.setSpaceId('harbor');
    socketManager.connect('ws://example');

    expect(ioMock).toHaveBeenCalledTimes(1);
    const [url, options] = ioMock.mock.calls[0];
    expect(url).toBe('ws://example');
    expect(options.auth.spaceId).toBe('harbor');
    expect(options.auth.username).toBe('Anonymous');
    expect(options.auth.mode).toBe('player');
    expect(options.auth.autoJoin).toBe(true);
    expect(options.auth.userId).toMatch(/^user_/);
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

  it('requestChatHistory short-circuits when history is already loaded', () => {
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

  it('sendWeatherControl requires admin privileges', () => {
    const { socketManager, socket } = setupSocketManager({
      roles: [],
    });

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

    switchSpy.mockRestore();
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

  it('attempts reconnect on server disconnect and connect_error', () => {
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

  it('updates store on latency, mission, economy, and environment events', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const { socketManager, handlers, storeState } = setupSocketManager();

    socketManager.connect('ws://example');

    handlers['latency:pong']?.({ sentAt: 940 });
    expect(storeState.setSocketLatencyMs).toHaveBeenCalledWith(60);

    handlers['mission:update']?.({ id: 'm-1' });
    expect(storeState.upsertMissionAssignment).toHaveBeenCalledWith({
      id: 'm-1',
    });

    handlers['economy:update']?.({ credits: 10 });
    expect(storeState.setAccount).toHaveBeenCalledWith({ credits: 10 });

    handlers['environment:update']?.({ windSpeed: 3 });
    expect(storeState.updateEnvironment).toHaveBeenCalledWith({
      windSpeed: 3,
    });

    nowSpy.mockRestore();
  });

  it('handles seamarks updates', () => {
    const { socketManager, handlers, storeState } = setupSocketManager();
    socketManager.connect('ws://example');

    handlers['seamarks:data']?.({
      features: [{ type: 'Feature', geometry: null, properties: {} }],
      meta: {
        lat: 10,
        lon: 20,
        radiusMeters: 500,
        bbox: { south: 1, west: 2, north: 3, east: 4 },
      },
    });

    expect(storeState.setSeamarks).toHaveBeenCalledWith(
      expect.objectContaining({
        features: expect.any(Array),
        bboxKey: '1.00000:2.00000:3.00000:4.00000',
        center: { lat: 10, lon: 20 },
        radiusMeters: 500,
      }),
    );
  });

  it('processes simulation updates for self and other vessels', async () => {
    const { socketManager, handlers, storeState, simulationLoop } =
      setupSocketManager({
        spaceId: 'harbor',
        mode: 'player',
      });

    socketManager.connect('ws://example');
    const setSpaceSpy = jest.spyOn(socketManager, 'setSpaceId');

    handlers['simulation:update']?.({
      timestamp: 10,
      self: {
        userId: 'user-1',
        roles: ['player'],
        rank: 2,
        credits: 5,
        experience: 1,
        safetyScore: 0.9,
        mode: 'player',
        spaceId: 'bay',
      },
      spaceInfo: { id: 'bay', name: 'Bay' },
      environment: { windSpeed: 8 },
      chatHistory: [
        {
          userId: 'user-2',
          username: 'Crew',
          message: 'Status',
          channel: 'global',
          timestamp: 200,
        },
      ],
      vessels: {
        'v-1': {
          id: 'v-1',
          ownerId: 'user-1',
          crewIds: ['user-1'],
          crewNames: ['Captain'],
          position: { lat: 1, lon: 2, x: 10, y: 20, z: 0 },
          orientation: { heading: 1, roll: 0, pitch: 0 },
          velocity: { surge: 1, sway: 0, heave: 0 },
          controls: { throttle: 0.5, rudderAngle: 0.1, ballast: 0.2 },
          helm: { userId: 'user-1', username: 'Captain' },
          failureState: {
            engineFailure: true,
            steeringFailure: true,
            floodingLevel: 0.3,
          },
          damageState: {
            hullIntegrity: 0.3,
            engineHealth: 0.5,
            steeringHealth: 0.5,
            electricalHealth: 0.5,
            floodingDamage: 0.1,
          },
        },
        'v-2': {
          id: 'v-2',
          ownerId: 'user-2',
          crewIds: ['user-2'],
          position: { lat: 3, lon: 4, x: 30, y: 40, z: 0 },
          orientation: { heading: 0 },
          velocity: { surge: 0, sway: 0, heave: 0 },
          controls: { throttle: 0, rudderAngle: 0, ballast: 0 },
        },
      },
    });

    await flushPromises();

    expect(storeState.setRoles).toHaveBeenCalledWith(['player']);
    expect(storeState.setSessionUserId).toHaveBeenCalledWith('user-1');
    expect(storeState.setAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        rank: 2,
        credits: 5,
        experience: 1,
        safetyScore: 0.9,
      }),
    );
    expect(storeState.setMode).toHaveBeenCalledWith('player');
    expect(storeState.setSpaceId).toHaveBeenCalledWith('bay');
    expect(setSpaceSpy).toHaveBeenCalledWith('bay');
    expect(storeState.setSpaceInfo).toHaveBeenCalledWith({
      id: 'bay',
      name: 'Bay',
    });
    expect(storeState.updateEnvironment).toHaveBeenCalledWith({
      windSpeed: 8,
    });
    expect(storeState.setChatMessages).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          username: 'Crew',
          message: 'Status',
          channel: 'global',
        }),
      ]),
    );
    expect(storeState.setChatHistoryMeta).toHaveBeenCalledWith('global', {
      hasMore: false,
      loaded: true,
    });
    expect(storeState.setCurrentVesselId).toHaveBeenCalledWith('v-1');
    expect(storeState.setCrew).toHaveBeenCalledWith({
      ids: ['user-1'],
      names: ['Captain'],
    });
    expect(storeState.updateMachineryStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        failures: expect.objectContaining({
          engineFailure: true,
          rudderFailure: true,
          pumpFailure: true,
        }),
      }),
    );
    const eventTypes = storeState.addEvent.mock.calls.map(call => call[0].type);
    expect(eventTypes).toEqual(
      expect.arrayContaining([
        'engine_failure',
        'steering_failure',
        'flooding',
        'damage',
      ]),
    );
    expect(storeState.setOtherVessels).toHaveBeenCalledWith(
      expect.objectContaining({
        'v-2': expect.any(Object),
      }),
    );
    expect(simulationLoop.syncVesselFromStore).toHaveBeenCalled();
  });

  it('ignores simulation updates with older timestamps', () => {
    const { socketManager, handlers, storeState } = setupSocketManager();

    socketManager.connect('ws://example');

    handlers['simulation:update']?.({
      timestamp: 10,
      vessels: {
        'v-1': {
          id: 'v-1',
          ownerId: 'user-1',
          crewIds: ['user-1'],
          position: { lat: 1, lon: 2 },
          orientation: { heading: 1 },
          velocity: { surge: 0, sway: 0, heave: 0 },
          controls: { throttle: 0, rudderAngle: 0, ballast: 0 },
        },
      },
    });

    const callCount = storeState.setOtherVessels.mock.calls.length;

    handlers['simulation:update']?.({
      timestamp: 5,
      vessels: {
        'v-2': {
          id: 'v-2',
          ownerId: 'user-2',
          crewIds: ['user-2'],
          position: { lat: 3, lon: 4 },
          orientation: { heading: 0 },
          velocity: { surge: 0, sway: 0, heave: 0 },
          controls: { throttle: 0, rudderAngle: 0, ballast: 0 },
        },
      },
    });

    expect(storeState.setOtherVessels).toHaveBeenCalledTimes(callCount);
  });

  it('teleports vessel when receiving vessel:teleport for current vessel', async () => {
    const { socketManager, handlers, storeState, simulationLoop } =
      setupSocketManager({
        currentVesselId: 'v-1',
      });

    socketManager.connect('ws://example');
    storeState.setCurrentVesselId('v-1');

    handlers['vessel:teleport']?.({
      vesselId: 'v-1_extra',
      position: { x: 5, y: 6, z: 1 },
    });

    await flushPromises();

    expect(simulationLoop.teleportVessel).toHaveBeenCalledWith({
      x: 5,
      y: 6,
      z: 1,
    });
  });

  it('emits admin and repair actions when connected', () => {
    const { socketManager, socket, storeState } = setupSocketManager();

    socketManager.connect('ws://example');
    socket.emit.mockImplementation((event: string, payload: any, cb?: any) => {
      if (event === 'vessel:repair' && typeof cb === 'function') {
        cb({ ok: true, message: 'Repaired' });
      }
    });

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
      message: 'Repaired',
    });

    socket.emit.mockImplementation((event: string, payload: any, cb?: any) => {
      if (event === 'vessel:repair' && typeof cb === 'function') {
        cb({ ok: false, message: 'Nope' });
      }
    });
    socketManager.requestRepair('v-1');
    expect(storeState.setNotice).toHaveBeenCalledWith({
      message: 'Nope',
      kind: 'error',
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

  it('forces spectator mode on auth errors', () => {
    const { socketManager, handlers, storeState } = setupSocketManager();

    socketManager.connect('ws://example');

    handlers.error?.('Signed in elsewhere');
    expect(storeState.setMode).toHaveBeenCalledWith('spectator');
    expect(storeState.setCurrentVesselId).toHaveBeenCalledWith(null);
  });
});
