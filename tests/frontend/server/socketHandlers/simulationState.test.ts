import { registerSimulationStateHandler } from '../../../../src/server/socketHandlers/simulationState';

describe('registerSimulationStateHandler', () => {
  it('rejects non-admin updates', () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { username: 'user-1' },
    };

    registerSimulationStateHandler({
      socket,
      hasAdminRole: jest.fn(() => false),
    } as unknown as Parameters<typeof registerSimulationStateHandler>[0]);

    handlers['simulation:state']({ paused: true });

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Not authorized to control simulation',
    );
  });

  it('accepts admin updates', () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { username: 'admin' },
    };

    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    registerSimulationStateHandler({
      socket,
      hasAdminRole: jest.fn(() => true),
    } as unknown as Parameters<typeof registerSimulationStateHandler>[0]);

    handlers['simulation:state']({ paused: true });

    expect(socket.emit).not.toHaveBeenCalledWith(
      'error',
      'Not authorized to control simulation',
    );
    expect(infoSpy).toHaveBeenCalled();
    infoSpy.mockRestore();
  });
});
