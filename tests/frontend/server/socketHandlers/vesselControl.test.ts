import { registerVesselControlHandler } from '../../../../src/server/socketHandlers/vesselControl';
import { applyFailureControlLimits } from '../../../../src/lib/failureControls';

jest.mock('../../../../src/lib/failureControls', () => ({
  applyFailureControlLimits: jest.fn(),
}));

describe('registerVesselControlHandler', () => {
  it('rejects control from non-player', () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1' },
    };

    registerVesselControlHandler({
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      effectiveUsername: 'User',
      isPlayerOrHigher: jest.fn(() => false),
      globalState: { vessels: new Map() },
      getVesselIdForUser: jest.fn(),
      ensureVesselForUser: jest.fn(),
      hasAdminRole: jest.fn(() => false),
      clamp: jest.fn((value: number) => value),
      rudderMaxAngleRad: 1,
      defaultSpaceId: 'space-1',
    } as unknown as Parameters<typeof registerVesselControlHandler>[0]);

    handlers['vessel:control']({ throttle: 0.5 });

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Not authorized to control a vessel',
    );
  });

  it('applies control changes and failure limits', () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
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
      helmUserId: 'user-1',
      engineUserId: null,
      controls: { throttle: 0, rudderAngle: 0, ballast: 0 },
      lastUpdate: 0,
      failureState: {},
      damageState: {},
    };

    (applyFailureControlLimits as jest.Mock).mockReturnValue({
      throttle: 0.2,
    });

    const clamp = jest.fn((value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max),
    );

    registerVesselControlHandler({
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      effectiveUsername: 'User',
      isPlayerOrHigher: jest.fn(() => true),
      globalState: { vessels: new Map([['v-1', vessel]]) },
      getVesselIdForUser: jest.fn(() => 'v-1'),
      ensureVesselForUser: jest.fn(),
      hasAdminRole: jest.fn(() => false),
      clamp,
      rudderMaxAngleRad: 0.5,
      defaultSpaceId: 'space-1',
    } as unknown as Parameters<typeof registerVesselControlHandler>[0]);

    handlers['vessel:control']({
      throttle: 2,
      rudderAngle: 2,
      ballast: 2,
    });

    expect(vessel.controls.throttle).toBe(0.2);
    expect(vessel.controls.rudderAngle).toBe(0.5);
    expect(vessel.controls.ballast).toBe(1);
    expect(applyFailureControlLimits).toHaveBeenCalled();
  });
});
