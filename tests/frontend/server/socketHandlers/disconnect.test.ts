import { setConnectedClients } from '../../../../src/server/metrics';
import { registerDisconnectHandler } from '../../../../src/server/socketHandlers/disconnect';

jest.mock('../../../../src/server/metrics', () => ({
  setConnectedClients: jest.fn(),
}));

describe('registerDisconnectHandler', () => {
  it('clears crew assignment and broadcasts leave', () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const emitSpy = jest.fn();
    const socket = {
      id: 'socket-1',
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      to: jest.fn(() => ({ emit: emitSpy })),
      data: {
        userId: 'user-1',
        username: 'User One',
        roles: ['player'],
      },
    };

    const vesselRecord: {
      id: string;
      crewIds: Set<string>;
      crewNames: Map<string, string>;
      helmUserId: string | null;
      helmUsername: string | null;
      engineUserId: string | null;
      engineUsername: string | null;
      radioUserId: string | null;
      radioUsername: string | null;
      mode: string;
      desiredMode: string;
      lastCrewAt: number;
    } = {
      id: 'v-1',
      crewIds: new Set(['user-1']),
      crewNames: new Map([['user-1', 'User One']]),
      helmUserId: 'user-1',
      helmUsername: 'User One',
      engineUserId: 'user-1',
      engineUsername: 'User One',
      radioUserId: 'user-1',
      radioUsername: 'User One',
      mode: 'player',
      desiredMode: 'ai',
      lastCrewAt: 0,
    };

    const globalState = {
      vessels: new Map([['v-1', vesselRecord]]),
    };

    const activeUserSockets = new Map<string, string>([['user-1', 'socket-1']]);

    const getVesselIdForUser = jest.fn(() => 'v-1');
    const io = { engine: { clientsCount: 2 } };

    registerDisconnectHandler({
      io,
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'fallback',
      effectiveUsername: 'Fallback',
      getVesselIdForUser,
      globalState,
      activeUserSockets,
    } as unknown as Parameters<typeof registerDisconnectHandler>[0]);

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(12345);
    handlers.disconnect();

    expect(setConnectedClients).toHaveBeenCalledWith(2);
    expect(vesselRecord.crewIds.size).toBe(0);
    expect(vesselRecord.helmUserId).toBeNull();
    expect(vesselRecord.engineUserId).toBeNull();
    expect(vesselRecord.radioUserId).toBeNull();
    expect(vesselRecord.mode).toBe('ai');
    expect(vesselRecord.lastCrewAt).toBe(12345);
    expect(emitSpy).toHaveBeenCalledWith('vessel:left', { userId: 'user-1' });
    nowSpy.mockRestore();
  });

  it('does nothing when another socket is active', () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      id: 'socket-1',
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      to: jest.fn(() => ({ emit: jest.fn() })),
      data: {
        userId: 'user-1',
        username: 'User One',
        roles: ['player'],
      },
    };

    const globalState = {
      vessels: new Map(),
    };
    const activeUserSockets = new Map<string, string>([['user-1', 'other']]);

    registerDisconnectHandler({
      io: { engine: { clientsCount: 0 } },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'fallback',
      effectiveUsername: 'Fallback',
      getVesselIdForUser: jest.fn(),
      globalState,
      activeUserSockets,
    } as unknown as Parameters<typeof registerDisconnectHandler>[0]);

    handlers.disconnect();

    expect(setConnectedClients).toHaveBeenCalled();
    expect(socket.to).not.toHaveBeenCalled();
  });
});
