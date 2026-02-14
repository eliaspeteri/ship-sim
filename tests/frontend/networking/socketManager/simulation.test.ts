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
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('socket manager simulation and inbound state', () => {
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
    const { socketManager, handlers, storeState } = setupSocketManager({
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
    const eventTypes = (
      (storeState.addEvent as jest.Mock).mock.calls as Array<[{ type: string }]>
    ).map(call => call[0].type);
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
    expect(mockSimulationLoop.syncVesselFromStore).toHaveBeenCalled();
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

    const callCount = (storeState.setOtherVessels as jest.Mock).mock.calls
      .length;

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
    const { socketManager, handlers, storeState } = setupSocketManager({
      currentVesselId: 'v-1',
    });

    socketManager.connect('ws://example');
    storeState.setCurrentVesselId('v-1');

    handlers['vessel:teleport']?.({
      vesselId: 'v-1_extra',
      position: { x: 5, y: 6, z: 1 },
    });

    await flushPromises();

    expect(mockSimulationLoop.teleportVessel).toHaveBeenCalledWith({
      x: 5,
      y: 6,
      z: 1,
    });
  });
});
