import { registerSimulationResyncHandler } from '../../../../src/server/socketHandlers/simulationResync';

describe('registerSimulationResyncHandler', () => {
  it('emits full simulation update payload', () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: {
        userId: 'user-1',
        roles: ['player'],
        mode: 'player',
        rank: 2,
        credits: 10,
        experience: 5,
        safetyScore: 3,
        spaceRole: 'host',
      },
    };

    const vessel = { id: 'v-1', spaceId: 'space-1' };
    const globalState = {
      vessels: new Map([['v-1', vessel]]),
    };

    const toSimpleVesselState = jest.fn(() => ({ id: 'v-1' }));
    const getEnvironmentForSpace = jest.fn(() => ({ seaState: 2 }));
    const getRulesForSpace = jest.fn(() => ({ type: 'casual' }));

    registerSimulationResyncHandler({
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'fallback',
      effectiveUsername: 'Fallback',
      spaceMeta: {
        name: 'Test Space',
        visibility: 'public',
        kind: 'sandbox',
        rankRequired: 1,
      },
      globalState,
      toSimpleVesselState,
      defaultSpaceId: 'space-1',
      getEnvironmentForSpace,
      getRulesForSpace,
    } as unknown as Parameters<typeof registerSimulationResyncHandler>[0]);

    handlers['simulation:resync']();

    expect(socket.emit).toHaveBeenCalledWith(
      'simulation:update',
      expect.objectContaining({
        vessels: { 'v-1': { id: 'v-1' } },
        environment: { seaState: 2 },
        spaceId: 'space-1',
        spaceInfo: expect.objectContaining({
          id: 'space-1',
          name: 'Test Space',
          role: 'host',
        }),
        self: expect.objectContaining({
          userId: 'user-1',
          roles: ['player'],
          mode: 'player',
        }),
      }),
    );
  });
});
