import { registerVesselUpdateHandler } from '../../../../src/server/socketHandlers/vesselUpdate';

describe('registerVesselUpdateHandler', () => {
  it('updates vessel state and emits simulation update', () => {
    const handlers: Record<string, any> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      to: jest.fn(() => ({ emit: emitSpy })),
      data: { userId: 'user-1' },
    };

    const vessel = {
      id: 'v-1',
      spaceId: 'space-1',
      ownerId: 'user-1',
      helmUserId: 'user-1',
      position: { lat: 0, lon: 0, z: 0 },
      orientation: { heading: 0, roll: 0, pitch: 0 },
      velocity: { surge: 0, sway: 0, heave: 0 },
      yawRate: 0,
      lastUpdate: 0,
    };

    const persistVesselToDb = jest.fn();
    const toSimpleVesselState = jest.fn(() => ({ id: 'v-1' }));

    registerVesselUpdateHandler({
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      effectiveUsername: 'User',
      isPlayerOrHigher: jest.fn(() => true),
      globalState: { vessels: new Map([['v-1', vessel]]) },
      getVesselIdForUser: jest.fn(() => 'v-1'),
      ensureVesselForUser: jest.fn(),
      hasAdminRole: jest.fn(() => false),
      clampHeading: jest.fn((value: number) => value),
      persistVesselToDb,
      toSimpleVesselState,
      defaultSpaceId: 'space-1',
    } as any);

    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1000);
    handlers['vessel:update']({
      position: { x: 100, y: 0, z: 0 },
      orientation: { heading: 1 },
      velocity: { surge: 0, sway: 0, heave: 0 },
      angularVelocity: { yaw: 0.2 },
    });

    expect(vessel.orientation.heading).toBe(1);
    expect(vessel.yawRate).toBe(0.2);
    expect(vessel.velocity.surge).toBeGreaterThan(0);
    expect(persistVesselToDb).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith(
      'simulation:update',
      expect.objectContaining({
        vessels: { 'v-1': { id: 'v-1' } },
        partial: true,
        timestamp: vessel.lastUpdate,
      }),
    );
    nowSpy.mockRestore();
  });
});
