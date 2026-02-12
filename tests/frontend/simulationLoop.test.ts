import type { WasmBridge } from '../../src/lib/wasmBridge';

type StoreState = Record<string, any>;

const mockHydro = {
  rudderForceCoefficient: 1,
  rudderStallAngle: 0.5,
  rudderMaxAngle: 0.6,
  dragCoefficient: 0.1,
  yawDamping: 0.2,
  yawDampingQuad: 0.3,
  swayDamping: 0.4,
  maxThrust: 100,
  maxSpeed: 20,
  rollDamping: 0.5,
  pitchDamping: 0.6,
  heaveStiffness: 0.7,
  heaveDamping: 0.8,
};

const createStoreState = (overrides: Partial<StoreState> = {}): StoreState => {
  const state: StoreState = {
    mode: 'player',
    currentVesselId: 'v-1',
    wasmVesselPtr: 1,
    vessel: {
      position: { lat: 0, lon: 0, x: 0, y: 0, z: 0 },
      orientation: { heading: 0, roll: 0, pitch: 0 },
      velocity: { surge: 0, sway: 0, heave: 0 },
      angularVelocity: { yaw: 0, roll: 0, pitch: 0 },
      controls: { throttle: 0, rudderAngle: 0, ballast: 0.5, bowThruster: 0 },
      properties: {
        mass: 100,
        length: 10,
        beam: 2,
        draft: 5,
        blockCoefficient: 0.8,
      },
      hydrodynamics: {
        rudderMaxAngle: 0.5,
      },
      physics: { model: 'displacement', schemaVersion: 1 },
      engineState: { rpm: 0, fuelLevel: 1, fuelConsumption: 0, hours: 0 },
      stability: {
        metacentricHeight: 1,
        centerOfGravity: { x: 0, y: 0, z: 0 },
        trim: 0,
        list: 0,
      },
      alarms: { lowFuel: false, otherAlarms: {} },
      failureState: {},
      damageState: {},
    },
    environment: {
      wind: { speed: 5, direction: 0 },
      current: { speed: 1, direction: 0.2 },
      waterDepth: 100,
    },
    replay: { recording: false, playing: false, frames: [] },
    setWasmVesselPtr: jest.fn((ptr: number | null) => {
      state.wasmVesselPtr = ptr;
    }),
    updateVessel: jest.fn(),
    updateEnvironment: jest.fn(),
    addEvent: jest.fn(),
    addReplayFrame: jest.fn(),
    setMode: jest.fn(),
    setCurrentVesselId: jest.fn(),
  };

  return Object.assign(state, overrides);
};

const createWasmBridge = () => ({
  createVesselFromInput: jest.fn().mockReturnValue(123),
  destroyVessel: jest.fn(),
  setVesselParams: jest.fn(),
  setEnvironment: jest.fn(),
  updateVesselState: jest.fn().mockReturnValue(1),
  setThrottle: jest.fn(),
  setRudderAngle: jest.fn(),
  setBallast: jest.fn(),
  getVesselX: jest.fn().mockReturnValue(10),
  getVesselY: jest.fn().mockReturnValue(20),
  getVesselZ: jest.fn().mockReturnValue(3),
  getVesselHeading: jest.fn().mockReturnValue(0.1),
  getVesselRollAngle: jest.fn().mockReturnValue(0.2),
  getVesselPitchAngle: jest.fn().mockReturnValue(0.3),
  getVesselSurgeVelocity: jest.fn().mockReturnValue(1),
  getVesselSwayVelocity: jest.fn().mockReturnValue(2),
  getVesselHeaveVelocity: jest.fn().mockReturnValue(3),
  getVesselRollRate: jest.fn().mockReturnValue(0.01),
  getVesselPitchRate: jest.fn().mockReturnValue(0.02),
  getVesselYawRate: jest.fn().mockReturnValue(0.03),
  getVesselEngineRPM: jest.fn().mockReturnValue(1000),
  getVesselFuelLevel: jest.fn().mockReturnValue(1),
  getVesselFuelConsumption: jest.fn().mockReturnValue(0.1),
  getVesselGM: jest.fn().mockReturnValue(2),
  getVesselCenterOfGravityY: jest.fn().mockReturnValue(0.5),
});

const setupSimulation = (overrides: Partial<StoreState> = {}) => {
  jest.resetModules();
  const storeState = createStoreState(overrides);
  const wasmBridge = createWasmBridge();
  const socketManager = {
    sendClientLog: jest.fn(),
    sendVesselUpdate: jest.fn(),
  };

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

  jest.doMock('../../src/lib/wasmLoader', () => ({
    __esModule: true,
    loadWasm: jest.fn().mockResolvedValue(wasmBridge),
  }));

  jest.doMock('../../src/lib/physicsParams', () => ({
    __esModule: true,
    buildDisplacementParams: jest.fn(() => mockHydro),
    buildPhysicsPayload: jest.fn(() => ({
      modelId: 'displacement',
      params: [1, 2, 3],
    })),
  }));

  jest.doMock('../../src/lib/waves', () => ({
    __esModule: true,
    deriveWaveState: jest.fn(() => ({
      amplitude: 1,
      direction: 0.5,
      wavelength: 10,
      steepness: 0.2,
    })),
  }));

  jest.doMock('../../src/networking/socket', () => ({
    __esModule: true,
    default: socketManager,
  }));

  let SimulationLoop: any;
  let getSimulationLoop: any;
  jest.isolateModules(() => {
    ({
      SimulationLoop,
      getSimulationLoop,
    } = require('../../src/simulation/simulationLoop'));
  });

  const loop = getSimulationLoop();
  loop.setWasmBridgeForTest(wasmBridge as unknown as WasmBridge);
  return { loop, SimulationLoop, storeState, wasmBridge, socketManager };
};

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe('simulation loop', () => {
  it('returns the same instance from the constructor', () => {
    jest.resetModules();
    const { SimulationLoop } = require('../../src/simulation/simulationLoop');
    const first = new SimulationLoop();
    const second = new SimulationLoop();
    expect(second).toBe(first);
  });

  it('initialize skips when spectator or no vessel', async () => {
    const { loop, storeState, wasmBridge } = setupSimulation({
      mode: 'spectator',
      currentVesselId: null,
    });

    await loop.initialize();

    expect(storeState.setWasmVesselPtr).toHaveBeenCalledWith(null);
    expect(wasmBridge.createVesselFromInput).not.toHaveBeenCalled();
  });

  it('initialize creates vessel, sets params, and updates store', async () => {
    const { loop, storeState, wasmBridge } = setupSimulation({
      mode: 'player',
      currentVesselId: 'v-1',
    });

    await loop.initialize();

    expect(wasmBridge.createVesselFromInput).toHaveBeenCalled();
    expect(wasmBridge.setVesselParams).toHaveBeenCalledWith(
      123,
      'displacement',
      [1, 2, 3],
    );
    expect(storeState.setWasmVesselPtr).toHaveBeenCalledWith(123);
    expect(storeState.updateVessel).toHaveBeenCalledWith(
      expect.objectContaining({
        orientation: expect.objectContaining({ roll: 0.2, pitch: 0.3 }),
        velocity: expect.objectContaining({ surge: 1, sway: 2, heave: 3 }),
        position: expect.objectContaining({ x: 10, y: 20, z: 3 }),
      }),
    );
  });

  it('refreshPhysicsParams applies params when vessel pointer exists', () => {
    const { loop, wasmBridge } = setupSimulation({
      wasmVesselPtr: 55,
    });

    loop.refreshPhysicsParams();

    expect(wasmBridge.setVesselParams).toHaveBeenCalledWith(
      55,
      'displacement',
      [1, 2, 3],
    );
  });

  it('refreshPhysicsParams exits when bridge or pointer missing', () => {
    const { loop, wasmBridge, storeState } = setupSimulation({
      wasmVesselPtr: null,
    });

    loop.refreshPhysicsParams();
    expect(wasmBridge.setVesselParams).not.toHaveBeenCalled();

    loop.setWasmBridgeForTest(null);
    storeState.wasmVesselPtr = 10;
    loop.refreshPhysicsParams();
    expect(wasmBridge.setVesselParams).not.toHaveBeenCalled();
  });

  it('applyControls clamps rudder angle and forwards controls', () => {
    const { loop, wasmBridge, storeState } = setupSimulation({
      wasmVesselPtr: 7,
      vessel: {
        ...createStoreState().vessel,
        hydrodynamics: { rudderMaxAngle: 0.4 },
      },
    });

    loop.applyControls({ throttle: 0.7, rudderAngle: 1, ballast: 0.2 });

    expect(wasmBridge.setThrottle).toHaveBeenCalledWith(7, 0.7);
    expect(wasmBridge.setRudderAngle).toHaveBeenCalledWith(7, 0.4);
    expect(wasmBridge.setBallast).toHaveBeenCalledWith(7, 0.2);
    expect(storeState.updateVessel).not.toHaveBeenCalled();
  });

  it('applyControls exits when spectator or pointer missing', () => {
    const { loop, wasmBridge, storeState } = setupSimulation({
      mode: 'spectator',
      wasmVesselPtr: 7,
    });

    loop.applyControls({ throttle: 0.5 });
    expect(wasmBridge.setThrottle).not.toHaveBeenCalled();

    storeState.mode = 'player';
    storeState.wasmVesselPtr = null;
    loop.applyControls({ throttle: 0.5 });
    expect(wasmBridge.setThrottle).not.toHaveBeenCalled();
  });

  it('updatePhysics updates vessel state and environment', () => {
    const { loop, wasmBridge, storeState } = setupSimulation({
      wasmVesselPtr: 1,
    });
    wasmBridge.updateVesselState.mockReturnValue(2);

    loop.updatePhysicsForTest(0.016);

    expect(wasmBridge.setEnvironment).toHaveBeenCalledWith([
      5, 0, 1, 0.2, 2, 10, 0.5, 0.2, 100,
    ]);
    expect(storeState.updateEnvironment).toHaveBeenCalledWith(
      expect.objectContaining({
        waveHeight: 2,
        waveDirection: 0.5,
        waveLength: 10,
        waveSteepness: 0.2,
      }),
    );
    expect(storeState.updateVessel).toHaveBeenCalled();
    expect(storeState.setWasmVesselPtr).toHaveBeenCalledWith(2);
  });

  it('updatePhysics handles NaN values and skips updates', () => {
    const { loop, wasmBridge, storeState } = setupSimulation({
      wasmVesselPtr: 1,
    });
    wasmBridge.getVesselX.mockReturnValue(NaN);

    loop.updatePhysicsForTest(0.016);

    expect(console.warn).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
    expect(storeState.updateVessel).not.toHaveBeenCalled();
  });

  it('updatePhysics logs errors when wasm update throws', () => {
    const { loop, wasmBridge, storeState } = setupSimulation({
      wasmVesselPtr: 1,
    });
    wasmBridge.updateVesselState.mockImplementation(() => {
      throw new Error('boom');
    });

    loop.updatePhysicsForTest(0.016);

    expect(console.error).toHaveBeenCalled();
    expect(storeState.updateVessel).not.toHaveBeenCalled();
  });

  it('updateUIFromPhysics updates vessel, alarms, replay, and sends updates', () => {
    const nowSpy = jest.spyOn(performance, 'now').mockReturnValue(500);
    const { loop, wasmBridge, storeState, socketManager } = setupSimulation({
      wasmVesselPtr: 1,
      replay: { recording: true, playing: false, frames: [] },
      vessel: {
        ...createStoreState().vessel,
        waterDepth: 5,
        properties: {
          ...createStoreState().vessel.properties,
          draft: 5,
        },
        alarms: { lowFuel: false, otherAlarms: {} },
      },
    });
    wasmBridge.getVesselFuelLevel.mockReturnValue(0.05);

    loop.updateUIFromPhysicsForTest();

    expect(storeState.updateVessel).toHaveBeenCalled();
    const eventTypes = (
      storeState.addEvent.mock.calls as Array<[{ type: string }]>
    ).map(call => call[0].type);
    expect(eventTypes).toEqual(
      expect.arrayContaining(['grounding', 'low_fuel']),
    );
    expect(storeState.addReplayFrame).toHaveBeenCalled();
    expect(socketManager.sendVesselUpdate).toHaveBeenCalled();
    nowSpy.mockRestore();
  });

  it('updateUIFromPhysics handles errors with throttled events', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    const { loop, wasmBridge, storeState } = setupSimulation({
      wasmVesselPtr: 1,
    });
    wasmBridge.getVesselX.mockImplementation(() => {
      throw new Error('bad');
    });

    nowSpy.mockReturnValue(10000);
    loop.updateUIFromPhysicsForTest();
    expect(storeState.addEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'system',
        type: 'critical_error',
      }),
    );

    nowSpy.mockReturnValue(12000);
    loop.updateUIFromPhysicsForTest();
    expect(storeState.addEvent).toHaveBeenCalledTimes(1);
  });

  it('teleportVessel recreates wasm vessel and resets state', () => {
    const { loop, wasmBridge, storeState } = setupSimulation({
      wasmVesselPtr: 9,
    });

    loop.teleportVessel({ x: 10, y: 20, z: 2 });

    expect(wasmBridge.createVesselFromInput).toHaveBeenCalled();
    expect(wasmBridge.destroyVessel).toHaveBeenCalledWith(9);
    expect(storeState.setWasmVesselPtr).toHaveBeenCalledWith(123);
    expect(storeState.updateVessel).toHaveBeenCalledWith(
      expect.objectContaining({
        position: expect.objectContaining({ x: 10, y: 20, z: 2 }),
        velocity: { surge: 0, sway: 0, heave: 0 },
        angularVelocity: { yaw: 0, roll: 0, pitch: 0 },
      }),
    );
  });

  it('syncVesselFromStore recreates wasm vessel from store', () => {
    const { loop, wasmBridge, storeState } = setupSimulation({
      wasmVesselPtr: 5,
    });

    loop.syncVesselFromStore();

    expect(wasmBridge.createVesselFromInput).toHaveBeenCalled();
    expect(wasmBridge.destroyVessel).toHaveBeenCalledWith(5);
    expect(storeState.setWasmVesselPtr).toHaveBeenCalledWith(123);
  });

  it('start/stop schedules and cancels animation frames', () => {
    let rafCallback: ((time: number) => void) | undefined;
    const rafSpy = jest
      .spyOn(global, 'requestAnimationFrame' as any)
      .mockImplementation((cb: unknown) => {
        rafCallback = cb as (time: number) => void;
        return 1 as unknown as number;
      });
    const cancelSpy = jest
      .spyOn(global, 'cancelAnimationFrame' as any)
      .mockImplementation(() => {});
    const { loop } = setupSimulation();

    loop.start();
    if (rafCallback) {
      rafCallback(1000);
    }
    loop.stop();

    expect(rafSpy).toHaveBeenCalled();
    expect(cancelSpy).toHaveBeenCalledWith(1);
  });

  it('start does nothing when already running', () => {
    const rafSpy = jest
      .spyOn(global, 'requestAnimationFrame' as any)
      .mockImplementation(() => 1 as unknown as number);
    const { loop } = setupSimulation();
    loop.setAnimationFrameIdForTest(123);

    loop.start();

    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('perf logging sends warn and info based on timing', () => {
    const { loop, socketManager } = setupSimulation();

    loop.setLoopTestHooks({
      updatePhysics: jest.fn(),
      updateUIFromPhysics: jest.fn(),
    });
    loop.setStoppedForTest(true);

    loop.setPerfTimingForTest({ lastFrameTime: 5950, lastPerfLogMs: 0 });
    loop.loopForTest(6005);

    expect(console.warn).toHaveBeenCalled();
    expect(socketManager.sendClientLog).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'warn', source: 'sim-loop' }),
    );

    socketManager.sendClientLog.mockClear();
    jest.clearAllMocks();
    loop.setPerfTimingForTest({ lastFrameTime: 5990, lastPerfLogMs: 0 });
    loop.loopForTest(6005);

    expect(console.info).toHaveBeenCalled();
    expect(socketManager.sendClientLog).not.toHaveBeenCalled();
  });
});
