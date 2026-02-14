import { registerUserModeHandler } from '../../../../src/server/socketHandlers/userMode';
import { RulesetType } from '../../../../src/types/rules.types';

jest.mock('../../../../src/server/economy', () => ({
  resolvePortForPosition: jest.fn(() => null),
}));

jest.mock('../../../../src/lib/position', () => ({
  distanceMeters: jest.fn(() => 2000),
}));

describe('registerUserModeHandler', () => {
  it('rejects player mode for insufficient role', () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', rank: 1 },
    };

    registerUserModeHandler({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      effectiveUsername: 'User',
      isPlayerOrHigher: jest.fn(() => false),
      hasAdminRole: jest.fn(() => false),
      globalState: { vessels: new Map() },
      getVesselIdForUser: jest.fn(),
      ensureVesselForUser: jest.fn(),
      assignStationsForCrew: jest.fn(),
      detachUserFromCurrentVessel: jest.fn(),
      updateSocketVesselRoom: jest.fn(),
      toSimpleVesselState: jest.fn(),
      persistVesselToDb: jest.fn(),
      defaultSpaceId: 'space-1',
      aiControllers: new Set(),
      spaceMeta: { rankRequired: 1 },
      getRulesForSpace: jest.fn(() => ({ type: RulesetType.CASUAL })),
    } as unknown as Parameters<typeof registerUserModeHandler>[0]);

    handlers['user:mode']({ mode: 'player' });

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Your role does not permit player mode',
    );
  });

  it('blocks spectator switch in restricted rules without nearby vessels', () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', rank: 2 },
    };

    const vessel = {
      id: 'v-1',
      spaceId: 'space-1',
      position: { lat: 0, lon: 0 },
    };

    registerUserModeHandler({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      effectiveUsername: 'User',
      isPlayerOrHigher: jest.fn(() => true),
      hasAdminRole: jest.fn(() => false),
      globalState: { vessels: new Map([['v-1', vessel]]) },
      getVesselIdForUser: jest.fn(() => 'v-1'),
      ensureVesselForUser: jest.fn(),
      assignStationsForCrew: jest.fn(),
      detachUserFromCurrentVessel: jest.fn(),
      updateSocketVesselRoom: jest.fn(),
      toSimpleVesselState: jest.fn(),
      persistVesselToDb: jest.fn(),
      defaultSpaceId: 'space-1',
      aiControllers: new Set(),
      spaceMeta: { rankRequired: 1 },
      getRulesForSpace: jest.fn(() => ({ type: RulesetType.REALISM })),
    } as unknown as Parameters<typeof registerUserModeHandler>[0]);

    handlers['user:mode']({ mode: 'spectator' });

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Spectator mode is only allowed in port or near another vessel.',
    );
  });

  it('switches to player mode and broadcasts update', () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socketEmit = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: socketEmit,
      data: { userId: 'user-1', rank: 2 },
    };
    const broadcastEmit = jest.fn();
    const io = { to: jest.fn(() => ({ emit: broadcastEmit })) };
    const vessel = {
      id: 'v-1',
      spaceId: 'space-1',
      crewIds: new Set<string>(),
      crewNames: new Map<string, string>(),
      desiredMode: 'ai',
      mode: 'ai',
      lastCrewAt: 0,
      lastUpdate: 0,
    };

    const updateSocketVesselRoom = jest.fn();
    const persistVesselToDb = jest.fn();
    const assignStationsForCrew = jest.fn();
    const toSimpleVesselState = jest.fn(() => ({ id: 'v-1' }));
    const aiControllers = new Set(['v-1']);

    registerUserModeHandler({
      io,
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      effectiveUsername: 'User',
      isPlayerOrHigher: jest.fn(() => true),
      hasAdminRole: jest.fn(() => false),
      globalState: { vessels: new Map([['v-1', vessel]]) },
      getVesselIdForUser: jest.fn(() => 'v-1'),
      ensureVesselForUser: jest.fn(),
      assignStationsForCrew,
      detachUserFromCurrentVessel: jest.fn(),
      updateSocketVesselRoom,
      toSimpleVesselState,
      persistVesselToDb,
      defaultSpaceId: 'space-1',
      aiControllers,
      spaceMeta: { rankRequired: 1 },
      getRulesForSpace: jest.fn(() => ({ type: RulesetType.CASUAL })),
    } as unknown as Parameters<typeof registerUserModeHandler>[0]);

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1234);
    handlers['user:mode']({ mode: 'player' });

    expect(vessel.mode).toBe('player');
    expect(vessel.desiredMode).toBe('player');
    expect(vessel.crewIds.has('user-1')).toBe(true);
    expect(assignStationsForCrew).toHaveBeenCalledWith(
      vessel,
      'user-1',
      'User',
    );
    expect(aiControllers.has('v-1')).toBe(false);
    expect(updateSocketVesselRoom).toHaveBeenCalledWith(
      socket,
      'space-1',
      'v-1',
    );
    expect(persistVesselToDb).toHaveBeenCalled();
    expect(broadcastEmit).toHaveBeenCalledWith('simulation:update', {
      vessels: { 'v-1': { id: 'v-1' } },
      partial: true,
      timestamp: 1234,
    });
    nowSpy.mockRestore();
  });
});
