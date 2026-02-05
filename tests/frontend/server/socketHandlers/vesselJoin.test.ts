import { registerVesselJoinHandler } from '../../../../src/server/socketHandlers/vesselJoin';
import {
  applyEconomyAdjustment,
  calculateVesselCreationCost,
  getEconomyProfile,
} from '../../../../src/server/economy';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    vessel: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/server/economy', () => ({
  applyEconomyAdjustment: jest.fn(),
  calculateVesselCreationCost: jest.fn(() => 100),
  getEconomyProfile: jest.fn(),
  resolvePortForPosition: jest.fn(() => null),
}));

jest.mock('../../../../src/lib/position', () => ({
  distanceMeters: jest.fn(() => 0),
}));

const flushPromises = async (ticks = 3) => {
  for (let i = 0; i < ticks; i += 1) {
    await Promise.resolve();
  }
};

describe('registerVesselJoinHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects join when not authorized', async () => {
    const handlers: Record<string, any> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User', rank: 1 },
    };

    registerVesselJoinHandler({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      effectiveUsername: 'User',
      isPlayerOrHigher: jest.fn(() => false),
      spaceMeta: { rankRequired: 1 },
      globalState: { vessels: new Map(), userLastVessel: new Map() },
      buildVesselRecordFromRow: jest.fn(),
      findVesselInSpace: jest.fn(),
      getVesselIdForUser: jest.fn(),
      findJoinableVessel: jest.fn(),
      hasAdminRole: jest.fn(() => false),
      maxCrew: 4,
      detachUserFromCurrentVessel: jest.fn(),
      assignStationsForCrew: jest.fn(),
      aiControllers: new Set(),
      userSpaceKey: jest.fn(() => 'key'),
      updateSocketVesselRoom: jest.fn(),
      toSimpleVesselState: jest.fn(),
      persistVesselToDb: jest.fn(),
      defaultSpaceId: 'space-1',
      createNewVesselForUser: jest.fn(),
      syncUserSocketsEconomy: jest.fn(),
      getRulesForSpace: jest.fn(() => ({ type: 'casual' })),
    } as any);

    await handlers['vessel:join']({ vesselId: 'v-1' });

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Not authorized to join a vessel',
    );
  });

  it('joins an existing vessel and broadcasts update', async () => {
    const handlers: Record<string, any> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User', rank: 2 },
    };
    const vessel = {
      id: 'v-1',
      spaceId: 'space-1',
      crewIds: new Set<string>(),
      crewNames: new Map<string, string>(),
      mode: 'ai',
      desiredMode: 'ai',
      lastCrewAt: 0,
      lastUpdate: 0,
      position: { lat: 0, lon: 0 },
    };
    const globalState = {
      vessels: new Map([['v-1', vessel]]),
      userLastVessel: new Map(),
    };

    registerVesselJoinHandler({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      effectiveUsername: 'User',
      isPlayerOrHigher: jest.fn(() => true),
      spaceMeta: { rankRequired: 1 },
      globalState,
      buildVesselRecordFromRow: jest.fn(),
      findVesselInSpace: jest.fn(() => vessel),
      getVesselIdForUser: jest.fn(),
      findJoinableVessel: jest.fn(),
      hasAdminRole: jest.fn(() => false),
      maxCrew: 4,
      detachUserFromCurrentVessel: jest.fn(),
      assignStationsForCrew: jest.fn(),
      aiControllers: new Set(['v-1']),
      userSpaceKey: jest.fn(() => 'user:space-1'),
      updateSocketVesselRoom: jest.fn(),
      toSimpleVesselState: jest.fn(() => ({ id: 'v-1' })),
      persistVesselToDb: jest.fn(),
      defaultSpaceId: 'space-1',
      createNewVesselForUser: jest.fn(),
      syncUserSocketsEconomy: jest.fn(),
      getRulesForSpace: jest.fn(() => ({ type: 'casual' })),
    } as any);

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(500);
    await handlers['vessel:join']({ vesselId: 'v-1' });

    expect(vessel.mode).toBe('player');
    expect(vessel.crewIds.has('user-1')).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith('simulation:update', {
      vessels: { 'v-1': { id: 'v-1' } },
      partial: true,
      timestamp: 500,
    });
    nowSpy.mockRestore();
  });

  it('rejects vessel creation with insufficient credits', async () => {
    const handlers: Record<string, any> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User', rank: 1 },
    };

    (getEconomyProfile as jest.Mock).mockResolvedValue({ rank: 1, credits: 0 });
    (calculateVesselCreationCost as jest.Mock).mockReturnValue(100);

    registerVesselJoinHandler({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      effectiveUsername: 'User',
      isPlayerOrHigher: jest.fn(() => true),
      spaceMeta: { rankRequired: 1 },
      globalState: { vessels: new Map(), userLastVessel: new Map() },
      buildVesselRecordFromRow: jest.fn(),
      findVesselInSpace: jest.fn(),
      getVesselIdForUser: jest.fn(),
      findJoinableVessel: jest.fn(),
      hasAdminRole: jest.fn(() => false),
      maxCrew: 4,
      detachUserFromCurrentVessel: jest.fn(),
      assignStationsForCrew: jest.fn(),
      aiControllers: new Set(),
      userSpaceKey: jest.fn(() => 'user:space-1'),
      updateSocketVesselRoom: jest.fn(),
      toSimpleVesselState: jest.fn(),
      persistVesselToDb: jest.fn(),
      defaultSpaceId: 'space-1',
      createNewVesselForUser: jest.fn(),
      syncUserSocketsEconomy: jest.fn(),
      getRulesForSpace: jest.fn(() => ({ type: 'casual' })),
    } as any);

    handlers['vessel:create']({});

    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Insufficient credits for vessel creation (100 cr required)',
    );
  });

  it('creates a new vessel and broadcasts update', async () => {
    const handlers: Record<string, any> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User', rank: 2 },
    };

    (getEconomyProfile as jest.Mock).mockResolvedValue({
      rank: 1,
      credits: 1000,
    });
    (calculateVesselCreationCost as jest.Mock).mockReturnValue(100);
    (applyEconomyAdjustment as jest.Mock).mockResolvedValue({ credits: 900 });

    const newVessel = {
      id: 'v-new',
      crewIds: new Set<string>(),
      crewNames: new Map<string, string>(),
      position: { lat: 0, lon: 0 },
    };

    registerVesselJoinHandler({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      effectiveUsername: 'User',
      isPlayerOrHigher: jest.fn(() => true),
      spaceMeta: { rankRequired: 1 },
      globalState: { vessels: new Map(), userLastVessel: new Map() },
      buildVesselRecordFromRow: jest.fn(),
      findVesselInSpace: jest.fn(),
      getVesselIdForUser: jest.fn(),
      findJoinableVessel: jest.fn(),
      hasAdminRole: jest.fn(() => false),
      maxCrew: 4,
      detachUserFromCurrentVessel: jest.fn(),
      assignStationsForCrew: jest.fn(),
      aiControllers: new Set(),
      userSpaceKey: jest.fn(() => 'user:space-1'),
      updateSocketVesselRoom: jest.fn(),
      toSimpleVesselState: jest.fn(() => ({ id: 'v-new' })),
      persistVesselToDb: jest.fn(),
      defaultSpaceId: 'space-1',
      createNewVesselForUser: jest.fn(() => newVessel),
      syncUserSocketsEconomy: jest.fn(),
      getRulesForSpace: jest.fn(() => ({ type: 'casual' })),
    } as any);

    handlers['vessel:create']({});

    await flushPromises();
    expect(emitSpy).toHaveBeenCalledWith('simulation:update', {
      vessels: { 'v-new': { id: 'v-new' } },
      partial: true,
      timestamp: expect.any(Number),
    });
  });
});
