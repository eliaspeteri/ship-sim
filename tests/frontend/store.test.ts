/// <reference types="@testing-library/jest-dom" />
import { renderHook, act, cleanup } from '@testing-library/react';
import useStore from '../../src/store';
import { expect } from '@jest/globals';
import { ShipType } from '../../src/types/vessel.types';
import type { VesselState } from '../../src/types/vessel.types';
import type { WasmModule } from '../../src/types/wasm';

jest.mock('../../src/simulation/simulationLoop', () => {
  const applyControls = jest.fn();
  return {
    __esModule: true,
    getSimulationLoop: () => ({ applyControls }),
    __applyControlsMock: applyControls,
  };
});

const initialState = useStore.getState();
const createWasmStub = (): WasmModule => ({
  createVessel: () => 0,
  updateVesselState: () => 0,
  setThrottle: () => undefined,
  setRudderAngle: () => undefined,
  setBallast: () => undefined,
  getVesselX: () => 0,
  getVesselY: () => 0,
  getVesselZ: () => 0,
  getVesselHeading: () => 0,
  getVesselSpeed: () => 0,
  getVesselPitchAngle: () => 0,
  getVesselRollAngle: () => 0,
  getVesselRudderAngle: () => 0,
  getVesselBallastLevel: () => 0,
  getVesselEngineRPM: () => 0,
  getVesselFuelLevel: () => 0,
  getVesselFuelConsumption: () => 0,
  getVesselGM: () => 0,
  getVesselCenterOfGravityY: () => 0,
  getVesselSurgeVelocity: () => 0,
  getVesselSwayVelocity: () => 0,
  getVesselHeaveVelocity: () => 0,
  getVesselRollRate: () => 0,
  getVesselPitchRate: () => 0,
  getVesselYawRate: () => 0,
  calculateSeaState: () => 0,
  getWaveHeightForSeaState: () => 0,
});

afterEach(cleanup);
afterEach(() => {
  useStore.setState(initialState, true);
});

describe('store', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useStore());

    expect(result.current.vessel).toBeDefined();
    expect(result.current.environment).toBeDefined();
    expect(result.current.sessionUserId).toBeNull();
  });

  it('has vessel with required properties', () => {
    const { result } = renderHook(() => useStore());

    const vessel = result.current.vessel;
    expect(vessel).toHaveProperty('position');
    expect(vessel).toHaveProperty('orientation');
    expect(vessel).toHaveProperty('velocity');
  });

  it('has environment with required properties', () => {
    const { result } = renderHook(() => useStore());

    const environment = result.current.environment;
    expect(environment).toHaveProperty('wind');
    expect(environment).toHaveProperty('current');
    expect(environment).toHaveProperty('waveHeight');
    expect(environment).toHaveProperty('waveDirection');
  });

  it('can update vessel position', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.updateVessel({ position: { lat: 45, lon: -122, z: 0 } });
    });

    expect(result.current.vessel.position?.lat).toBe(45);
    expect(result.current.vessel.position?.lon).toBe(-122);
  });

  it('has crew management', () => {
    const { result } = renderHook(() => useStore());

    expect(Array.isArray(result.current.crewIds)).toBe(true);
    expect(typeof result.current.crewNames).toBe('object');
  });

  it('normalizes and replaces chat messages by channel', () => {
    act(() => {
      useStore.getState().setChatMessages([
        {
          id: 'a',
          userId: 'u1',
          username: 'A',
          message: 'hello',
          timestamp: 1,
          channel: 'space:harbor:vessel:abc_1',
        },
        {
          id: 'b',
          userId: 'u2',
          username: 'B',
          message: 'hi',
          timestamp: 2,
          channel: 'vessel:def_2',
        },
      ]);
    });

    expect(useStore.getState().chatMessages[0].channel).toBe(
      'space:harbor:vessel:abc',
    );

    act(() => {
      useStore.getState().replaceChannelMessages('vessel:def', [
        {
          id: 'c',
          userId: 'u3',
          username: 'C',
          message: 'replaced',
          timestamp: 3,
          channel: 'vessel:def_9',
        },
      ]);
    });

    const channels = useStore.getState().chatMessages.map(msg => msg.channel);
    expect(channels).toEqual(
      expect.arrayContaining(['space:harbor:vessel:abc', 'vessel:def']),
    );
  });

  it('preserves loaded chat history meta when not provided', () => {
    act(() => {
      useStore.setState(
        {
          chatHistoryMeta: { global: { hasMore: true, loaded: true } },
        },
        false,
      );
      useStore.getState().setChatHistoryMeta('global', { hasMore: false });
    });

    expect(useStore.getState().chatHistoryMeta.global).toEqual({
      hasMore: false,
      loaded: true,
    });
  });

  it('updateEnvironment short-circuits when no change and normalizes sea state', () => {
    const before = useStore.getState().environment;
    act(() => {
      useStore.getState().updateEnvironment({});
    });
    expect(useStore.getState().environment).toBe(before);

    act(() => {
      useStore.getState().updateEnvironment({
        wind: { speed: 9 },
        seaState: 20,
      });
    });
    expect(useStore.getState().environment.wind.speed).toBe(9);
    expect(useStore.getState().environment.seaState).toBe(12);
  });

  it('limits replay frames to max and only records when enabled', () => {
    act(() => {
      useStore.getState().addReplayFrame({
        timestamp: 1,
        position: { x: 0, y: 0, z: 0, lat: 0, lon: 0 },
        orientation: { heading: 0, roll: 0, pitch: 0 },
      });
    });
    expect(useStore.getState().replay.frames).toHaveLength(0);

    act(() => {
      useStore.getState().startReplayRecording();
      for (let i = 0; i < 1810; i += 1) {
        useStore.getState().addReplayFrame({
          timestamp: i,
          position: { x: i, y: i, z: 0, lat: 0, lon: 0 },
          orientation: { heading: 0, roll: 0, pitch: 0 },
        });
      }
    });

    expect(useStore.getState().replay.frames.length).toBe(1800);
  });

  it('merges vessel updates including stability, alarms, and stations', () => {
    act(() => {
      useStore.getState().updateVessel({
        stations: { helm: { userId: 'u1', username: 'Pilot' } },
        stability: { centerOfGravity: { y: 3 } },
        alarms: { otherAlarms: { grounding: true } },
        damageState: { hullIntegrity: 0.5 },
      });
    });

    const vessel = useStore.getState().vessel;
    expect(vessel.helm?.userId).toBe('u1');
    expect(vessel.stability.centerOfGravity.y).toBe(3);
    expect(vessel.alarms.otherAlarms?.grounding).toBe(true);
    expect(vessel.damageState?.hullIntegrity).toBe(0.5);
  });

  it('sets vessel type and updates hydrodynamics', () => {
    act(() => {
      useStore.getState().setVesselType(ShipType.TANKER);
    });

    expect(useStore.getState().vessel.properties.type).toBe(ShipType.TANKER);
    expect(useStore.getState().vessel.hydrodynamics.dragCoefficient).toBe(0.95);
  });

  it('updates machinery status and logs failures', () => {
    act(() => {
      useStore.getState().updateMachineryStatus({
        failures: { engineFailure: true },
      });
    });
    expect(useStore.getState().machinerySystems.failures.engineFailure).toBe(
      true,
    );

    const eventCount = useStore.getState().eventLog.length;
    act(() => {
      useStore.getState().triggerFailure('engineFailure', true);
    });
    expect(useStore.getState().machinerySystems.engineHealth).toBe(0.2);
    expect(useStore.getState().eventLog.length).toBe(eventCount + 1);
  });

  it('updates navigation and adjusts waypoints', () => {
    act(() => {
      useStore.getState().updateNavigation({
        route: { currentWaypoint: 0 },
        charts: { scale: 2 },
      });
      useStore.getState().addWaypoint(1, 2, 'A');
      useStore.getState().addWaypoint(3, 4, 'B');
    });

    expect(useStore.getState().navigation.route.waypoints).toHaveLength(2);
    expect(useStore.getState().navigation.route.currentWaypoint).toBe(0);

    act(() => {
      useStore.getState().removeWaypoint(0);
    });
    expect(useStore.getState().navigation.route.waypoints).toHaveLength(1);
    expect(useStore.getState().navigation.route.currentWaypoint).toBe(0);
  });

  it('applyVesselControls applies failure limits before sending to simulation', () => {
    const {
      __applyControlsMock,
    } = require('../../src/simulation/simulationLoop');

    act(() => {
      useStore.getState().updateVessel({
        failureState: { engineFailure: true, steeringFailure: true },
      });
      useStore.getState().applyVesselControls({
        throttle: 1,
        rudderAngle: 1,
      });
    });

    expect(__applyControlsMock).toHaveBeenCalledWith({
      throttle: 0,
      rudderAngle: 0,
    });
  });

  it('setDayNightCycle advances time of day when enabled', () => {
    jest.useFakeTimers();
    const before = useStore.getState().environment.timeOfDay;

    act(() => {
      useStore.getState().setDayNightCycle(true);
      jest.advanceTimersByTime(10000);
    });

    expect(useStore.getState().environment.timeOfDay).not.toBe(before);
    jest.useRealTimers();
  });

  it('clearEventLog resets event log', () => {
    act(() => {
      useStore.getState().addEvent({
        category: 'system',
        type: 'test',
        message: 'event',
        severity: 'info',
      });
      useStore.getState().clearEventLog();
    });
    expect(useStore.getState().eventLog).toHaveLength(0);
  });

  it('triggerFailure updates different systems', () => {
    act(() => {
      useStore.getState().triggerFailure('propellerDamage', true);
      useStore.getState().triggerFailure('rudderFailure', true);
      useStore.getState().triggerFailure('electricalFailure', true);
    });
    const systems = useStore.getState().machinerySystems;
    expect(systems.propulsionEfficiency).toBe(0.6);
    expect(systems.steeringSystemHealth).toBe(0.3);
    expect(systems.electricalSystemHealth).toBe(0.4);
  });

  it('removeWaypoint adjusts current waypoint when empty', () => {
    act(() => {
      useStore.getState().addWaypoint(1, 2, 'A');
      useStore.getState().removeWaypoint(0);
    });
    expect(useStore.getState().navigation.route.currentWaypoint).toBe(-1);
  });

  it('updates wasm pointers and exports', () => {
    act(() => {
      useStore.getState().setWasmVesselPtr(42);
      useStore.getState().setWasmExports(createWasmStub());
    });
    expect(useStore.getState().wasmVesselPtr).toBe(42);
    expect(useStore.getState().wasmExports).toBeDefined();
  });

  it('applies physics params and vessel name', () => {
    act(() => {
      useStore.getState().setPhysicsParams({ drag: 1 });
      useStore.getState().setVesselName('New Name');
    });
    expect(useStore.getState().vessel.physics?.params).toEqual({ drag: 1 });
    expect(useStore.getState().vessel.properties.name).toBe('New Name');
  });

  it('updateVessel initializes missing stability and centerOfGravity', () => {
    act(() => {
      useStore.setState(
        state => ({
          vessel: {
            ...state.vessel,
            stability: undefined as unknown as VesselState['stability'],
          },
        }),
        false,
      );
      useStore.getState().updateVessel({
        stability: { centerOfGravity: { y: 5 } },
      });
    });
    expect(useStore.getState().vessel.stability.centerOfGravity.y).toBe(5);
  });

  it('updateVessel handles errors gracefully', () => {
    act(() => {
      useStore.setState({ vessel: null as any }, false);
      useStore.getState().updateVessel({ position: { lat: 1, lon: 2 } });
    });
    expect(console.error).toHaveBeenCalled();
  });

  it('updateVesselProperties helper updates vessel properties', () => {
    act(() => {
      const updater = useStore
        .getState()
        .updateVesselProperties(useStore.setState);
      updater({ beam: 9 });
    });
    expect(useStore.getState().vessel.properties.beam).toBe(9);
  });

  it('applyVesselControls logs errors when simulation throws', () => {
    const {
      __applyControlsMock,
    } = require('../../src/simulation/simulationLoop');
    __applyControlsMock.mockImplementation(() => {
      throw new Error('boom');
    });
    act(() => {
      useStore.getState().applyVesselControls({ throttle: 0.5 });
    });
    expect(console.error).toHaveBeenCalled();
  });
});
