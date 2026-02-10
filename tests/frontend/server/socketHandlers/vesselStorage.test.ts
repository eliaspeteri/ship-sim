import { registerVesselStorageHandler } from '../../../../src/server/socketHandlers/vesselStorage';
import { resolvePortForPosition } from '../../../../src/server/economy';

jest.mock('../../../../src/server/economy', () => ({
  resolvePortForPosition: jest.fn(),
}));

describe('registerVesselStorageHandler', () => {
  it('rejects storing when not in port', () => {
    const handlers: Record<string, any> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1' },
    };
    const vessel = {
      id: 'v-1',
      spaceId: 'space-1',
      ownerId: 'user-1',
      status: 'active',
      storagePortId: null,
      position: { lat: 0, lon: 0 },
      velocity: { surge: 0, sway: 0 },
      controls: { throttle: 1, rudderAngle: 0.2, bowThruster: 0.1 },
      crewIds: new Set(['user-1']),
      crewNames: new Map([['user-1', 'User']]),
    };

    (resolvePortForPosition as jest.Mock).mockReturnValue(null);

    registerVesselStorageHandler({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map([['v-1', vessel]]) },
      getVesselIdForUser: jest.fn(() => 'v-1'),
      hasAdminRole: jest.fn(() => false),
      persistVesselToDb: jest.fn(),
      toSimpleVesselState: jest.fn(),
      defaultSpaceId: 'space-1',
    } as any);

    handlers['vessel:storage']({ action: 'store' });

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Vessel must be in port to store',
    );
  });

  it('stores vessel and broadcasts update', () => {
    const handlers: Record<string, any> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1' },
    };
    const vessel = {
      id: 'v-1',
      spaceId: 'space-1',
      ownerId: 'user-1',
      status: 'active',
      storagePortId: null,
      position: { lat: 0, lon: 0 },
      velocity: { surge: 0, sway: 0 },
      controls: { throttle: 1, rudderAngle: 0.2, bowThruster: 0.1 },
      crewIds: new Set(['user-1']),
      crewNames: new Map([['user-1', 'User']]),
    };

    (resolvePortForPosition as jest.Mock).mockReturnValue({ id: 'port-1' });

    const persistVesselToDb = jest.fn();
    const toSimpleVesselState = jest.fn(() => ({ id: 'v-1' }));
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(123);

    registerVesselStorageHandler({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map([['v-1', vessel]]) },
      getVesselIdForUser: jest.fn(() => 'v-1'),
      hasAdminRole: jest.fn(() => false),
      persistVesselToDb,
      toSimpleVesselState,
      defaultSpaceId: 'space-1',
    } as any);

    handlers['vessel:storage']({ action: 'store' });

    expect(vessel.status).toBe('stored');
    expect(vessel.storagePortId).toBe('port-1');
    expect(vessel.controls.throttle).toBe(0);
    expect(persistVesselToDb).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('simulation:update', {
      vessels: { 'v-1': { id: 'v-1' } },
      partial: true,
      timestamp: 123,
    });
    nowSpy.mockRestore();
  });

  it('activates stored vessel', () => {
    const handlers: Record<string, any> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1' },
    };
    const vessel = {
      id: 'v-1',
      spaceId: 'space-1',
      ownerId: 'user-1',
      position: { lat: 0, lon: 0 },
      velocity: { surge: 0, sway: 0 },
      status: 'stored',
      storagePortId: 'port-1',
      storedAt: 1,
      desiredMode: 'ai',
      controls: { throttle: 0, rudderAngle: 0, bowThruster: 0 },
      crewIds: new Set(['user-1']),
      crewNames: new Map([['user-1', 'User']]),
    };

    registerVesselStorageHandler({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map([['v-1', vessel]]) },
      getVesselIdForUser: jest.fn(() => 'v-1'),
      hasAdminRole: jest.fn(() => false),
      persistVesselToDb: jest.fn(),
      toSimpleVesselState: jest.fn(() => ({ id: 'v-1' })),
      defaultSpaceId: 'space-1',
    } as any);

    handlers['vessel:storage']({ action: 'activate' });

    expect(vessel.status).toBe('active');
    expect(vessel.storagePortId).toBeNull();
  });
});
