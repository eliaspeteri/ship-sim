import { distanceMeters } from '../../../../src/lib/position';
import { prisma } from '../../../../src/lib/prisma';
import {
  applyEconomyAdjustment,
  calculateVesselCreationCost,
  getEconomyProfile,
  resolvePortForPosition,
} from '../../../../src/server/economy';
import { registerVesselJoinHandler } from '../../../../src/server/socketHandlers/vesselJoin';

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
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
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
    } as unknown as Parameters<typeof registerVesselJoinHandler>[0]);

    await handlers['vessel:join']({ vesselId: 'v-1' });

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Not authorized to join a vessel',
    );
  });

  it('joins an existing vessel and broadcasts update', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
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
    } as unknown as Parameters<typeof registerVesselJoinHandler>[0]);

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
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
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
    } as unknown as Parameters<typeof registerVesselJoinHandler>[0]);

    handlers['vessel:create']({});

    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Insufficient credits for vessel creation (100 cr required)',
    );
  });

  it('creates a new vessel and broadcasts update', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
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
    } as unknown as Parameters<typeof registerVesselJoinHandler>[0]);

    handlers['vessel:create']({});

    await flushPromises();
    expect(emitSpy).toHaveBeenCalledWith('simulation:update', {
      vessels: { 'v-new': { id: 'v-new' } },
      partial: true,
      timestamp: expect.any(Number),
    });
  });

  it('rejects joining when rank is below space requirement', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
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
      isPlayerOrHigher: jest.fn(() => true),
      spaceMeta: { rankRequired: 3 },
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
    } as unknown as Parameters<typeof registerVesselJoinHandler>[0]);

    await handlers['vessel:join']({ vesselId: 'v-1' });
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Rank 3 required for this space',
    );
  });

  it('loads vessel from persistence and rejects unauthorized users', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User', rank: 5 },
    };

    (prisma.vessel.findUnique as jest.Mock).mockResolvedValue({
      id: 'v-db',
      ownerId: 'other-user',
      chartererId: null,
      leaseeId: null,
    });

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
      findVesselInSpace: jest.fn(() => null),
      getVesselIdForUser: jest.fn(),
      findJoinableVessel: jest.fn(() => null),
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
    } as unknown as Parameters<typeof registerVesselJoinHandler>[0]);

    await handlers['vessel:join']({ vesselId: 'v-db' });
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Not authorized to join this vessel',
    );
  });

  it('blocks realism vessel switching when far from target and no port', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User', rank: 5 },
    };
    const currentVessel = {
      id: 'v-current',
      position: { lat: 0, lon: 0 },
      crewIds: new Set<string>(),
      crewNames: new Map<string, string>(),
    };
    const targetVessel = {
      id: 'v-target',
      position: { lat: 5, lon: 5 },
      crewIds: new Set<string>(),
      crewNames: new Map<string, string>(),
    };

    (distanceMeters as jest.Mock).mockReturnValueOnce(2001);
    (resolvePortForPosition as jest.Mock).mockReturnValue(null);

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
      findVesselInSpace: jest.fn((id: string) =>
        id === 'v-target' ? targetVessel : currentVessel,
      ),
      getVesselIdForUser: jest.fn(() => 'v-current'),
      findJoinableVessel: jest.fn(() => targetVessel),
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
      getRulesForSpace: jest.fn(() => ({ type: 'REALISM' })),
    } as unknown as Parameters<typeof registerVesselJoinHandler>[0]);

    await handlers['vessel:join']({ vesselId: 'v-target' });
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Switching vessels is only allowed in port or near the target vessel.',
    );
  });

  it('rejects creating a vessel when not docked in realism mode', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User', rank: 5 },
    };
    const currentVessel = {
      id: 'v-current',
      position: { lat: 0, lon: 0 },
    };
    (resolvePortForPosition as jest.Mock).mockReturnValue(null);

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
      findVesselInSpace: jest.fn(() => currentVessel),
      getVesselIdForUser: jest.fn(() => 'v-current'),
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
      getRulesForSpace: jest.fn(() => ({ type: 'EXAM' })),
    } as unknown as Parameters<typeof registerVesselJoinHandler>[0]);

    handlers['vessel:create']({});
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Creating a vessel is only allowed while docked at a port.',
    );
  });
});
