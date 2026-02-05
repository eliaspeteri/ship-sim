import { registerStationHandlers } from '../../../../src/server/socketHandlers/stations';

describe('registerStationHandlers', () => {
  it('rejects helm change for non-crew', () => {
    const handlers: Record<string, any> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User' },
    };
    const vessel = {
      id: 'v-1',
      spaceId: 'space-1',
      crewIds: new Set<string>(),
      crewNames: new Map<string, string>(),
    };

    registerStationHandlers({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      effectiveUsername: 'User',
      globalState: { vessels: new Map([['v-1', vessel]]) },
      getVesselIdForUser: jest.fn(() => 'v-1'),
      updateStationAssignment: jest.fn(),
      hasAdminRole: jest.fn(() => false),
      toSimpleVesselState: jest.fn(),
      persistVesselToDb: jest.fn(),
      defaultSpaceId: 'space-1',
    } as any);

    handlers['vessel:helm']({ action: 'claim' });

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'You are not crew on this vessel',
    );
  });

  it('updates station assignment and emits simulation update', () => {
    const handlers: Record<string, any> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User' },
    };
    const vessel = {
      id: 'v-1',
      spaceId: 'space-1',
      crewIds: new Set<string>(['user-1']),
      crewNames: new Map<string, string>(),
      lastUpdate: 0,
    };
    const updateStationAssignment = jest.fn(() => ({ ok: true }));
    const persistVesselToDb = jest.fn();

    registerStationHandlers({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      effectiveUsername: 'User',
      globalState: { vessels: new Map([['v-1', vessel]]) },
      getVesselIdForUser: jest.fn(() => 'v-1'),
      updateStationAssignment,
      hasAdminRole: jest.fn(() => false),
      toSimpleVesselState: jest.fn(() => ({ id: 'v-1' })),
      persistVesselToDb,
      defaultSpaceId: 'space-1',
    } as any);

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(999);
    handlers['vessel:station']({ station: 'engine', action: 'claim' });

    expect(updateStationAssignment).toHaveBeenCalledWith(
      vessel,
      'engine',
      'claim',
      'user-1',
      'User',
      false,
    );
    expect(persistVesselToDb).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('simulation:update', {
      vessels: { 'v-1': { id: 'v-1' } },
      partial: true,
      timestamp: 999,
    });
    nowSpy.mockRestore();
  });
});
