import { registerAdminHandlers } from '../../../../src/server/socketHandlers/admin';
import { prisma } from '../../../../src/lib/prisma';
import { mergePosition } from '../../../../src/lib/position';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    vessel: {
      delete: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/lib/position', () => ({
  mergePosition: jest.fn((current, next) => ({ ...current, ...next })),
}));

describe('registerAdminHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates vessel mode to ai and clears crew', () => {
    const handlers: Record<string, any> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'admin' },
    };
    const vessel = {
      id: 'v-1',
      desiredMode: 'player',
      mode: 'player',
      crewIds: new Set(['user-1']),
      lastUpdate: 0,
    };
    const persistVesselToDb = jest.fn();

    registerAdminHandlers({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      hasAdminRole: jest.fn(() => true),
      globalState: { vessels: new Map([['v-1', vessel]]) },
      aiControllers: new Set(),
      economyLedger: new Map(),
      findVesselInSpace: jest.fn(),
      getSpaceIdForSocket: jest.fn(() => 'space-1'),
      toSimpleVesselState: jest.fn(),
      persistVesselToDb,
    } as any);

    handlers['admin:vesselMode']({ vesselId: 'v-1', mode: 'ai' });

    expect(vessel.mode).toBe('ai');
    expect(vessel.desiredMode).toBe('ai');
    expect(vessel.crewIds.size).toBe(0);
    expect(persistVesselToDb).toHaveBeenCalled();
  });

  it('stops vessel and broadcasts update', () => {
    const handlers: Record<string, any> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'admin' },
    };
    const vessel = {
      id: 'v-1',
      controls: { throttle: 1, rudderAngle: 0.2, bowThruster: 1 },
      velocity: { surge: 1, sway: 1, heave: 1 },
      yawRate: 2,
      lastUpdate: 0,
    };
    const persistVesselToDb = jest.fn();

    registerAdminHandlers({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      hasAdminRole: jest.fn(() => true),
      globalState: { vessels: new Map() },
      aiControllers: new Set(),
      economyLedger: new Map(),
      findVesselInSpace: jest.fn(() => vessel),
      getSpaceIdForSocket: jest.fn(() => 'space-1'),
      toSimpleVesselState: jest.fn(() => ({ id: 'v-1' })),
      persistVesselToDb,
    } as any);

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1234);
    handlers['admin:vessel:stop']({ vesselId: 'v-1' });

    expect(vessel.controls.throttle).toBe(0);
    expect(vessel.velocity.surge).toBe(0);
    expect(vessel.yawRate).toBe(0);
    expect(persistVesselToDb).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('simulation:update', {
      vessels: { 'v-1': { id: 'v-1' } },
      partial: true,
      timestamp: 1234,
    });
    nowSpy.mockRestore();
  });

  it('kicks matching user sockets', async () => {
    const handlers: Record<string, any> = {};
    const targetSocket = {
      data: { userId: 'user-2' },
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    const io = {
      to: jest.fn(() => ({ emit: jest.fn() })),
      fetchSockets: jest.fn(async () => [targetSocket]),
    };
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'admin' },
    };

    registerAdminHandlers({
      io,
      socket,
      hasAdminRole: jest.fn(() => true),
      globalState: { vessels: new Map() },
      aiControllers: new Set(),
      economyLedger: new Map(),
      findVesselInSpace: jest.fn(),
      getSpaceIdForSocket: jest.fn(),
      toSimpleVesselState: jest.fn(),
      persistVesselToDb: jest.fn(),
    } as any);

    await handlers['admin:kick']({ userId: 'user-2', reason: 'bye' });

    expect(targetSocket.emit).toHaveBeenCalledWith('error', 'bye');
    expect(targetSocket.disconnect).toHaveBeenCalledWith(true);
  });

  it('removes vessels and clears caches', async () => {
    const handlers: Record<string, any> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'admin' },
    };
    const vessel = { id: 'v-1' } as any;
    const globalState = {
      vessels: new Map([['v-1', vessel]]),
      userLastVessel: new Map([['user:space-1', 'v-1']]),
    };
    const aiControllers = new Set(['v-1']);
    const economyLedger = new Map([['v-1', { accrued: 0, lastChargeAt: 0 }]]);

    registerAdminHandlers({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      hasAdminRole: jest.fn(() => true),
      globalState,
      aiControllers,
      economyLedger,
      findVesselInSpace: jest.fn(() => vessel),
      getSpaceIdForSocket: jest.fn(() => 'space-1'),
      toSimpleVesselState: jest.fn(),
      persistVesselToDb: jest.fn(),
    } as any);

    await handlers['admin:vessel:remove']({ vesselId: 'v-1' });

    expect(aiControllers.has('v-1')).toBe(false);
    expect(economyLedger.has('v-1')).toBe(false);
    expect(globalState.vessels.has('v-1')).toBe(false);
    expect(globalState.userLastVessel.size).toBe(0);
    expect(prisma.vessel.delete).toHaveBeenCalledWith({
      where: { id: 'v-1' },
    });
  });

  it('teleports vessel and broadcasts updates', () => {
    const handlers: Record<string, any> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'admin' },
    };
    const vessel = {
      id: 'v-1',
      position: { lat: 1, lon: 2 },
      controls: { throttle: 1, rudderAngle: 1, bowThruster: 1 },
      velocity: { surge: 1, sway: 1, heave: 1 },
      yawRate: 1,
      lastUpdate: 0,
    };
    const persistVesselToDb = jest.fn();

    registerAdminHandlers({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      hasAdminRole: jest.fn(() => true),
      globalState: { vessels: new Map() },
      aiControllers: new Set(),
      economyLedger: new Map(),
      findVesselInSpace: jest.fn(() => vessel),
      getSpaceIdForSocket: jest.fn(() => 'space-1'),
      toSimpleVesselState: jest.fn(() => ({ id: 'v-1' })),
      persistVesselToDb,
    } as any);

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(111);
    handlers['admin:vessel:move']({
      vesselId: 'v-1',
      position: { lat: 3, lon: 4 },
    });

    expect(mergePosition).toHaveBeenCalledWith(
      { lat: 1, lon: 2 },
      { lat: 3, lon: 4 },
    );
    expect(persistVesselToDb).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('vessel:teleport', {
      vesselId: 'v-1',
      position: { lat: 3, lon: 4 },
      reset: true,
    });
    expect(emitSpy).toHaveBeenCalledWith('simulation:update', {
      vessels: { 'v-1': { id: 'v-1' } },
      partial: true,
      timestamp: 111,
    });
    nowSpy.mockRestore();
  });
});
