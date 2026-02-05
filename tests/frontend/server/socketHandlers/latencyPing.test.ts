import { registerLatencyPingHandler } from '../../../../src/server/socketHandlers/latencyPing';
import { recordMetric } from '../../../../src/server/metrics';

jest.mock('../../../../src/server/metrics', () => ({
  recordMetric: jest.fn(),
}));

describe('registerLatencyPingHandler', () => {
  it('responds with pong and records latency', () => {
    const handlers: Record<string, any> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: {},
    };

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);
    registerLatencyPingHandler({ socket } as any);

    handlers['latency:ping']({ sentAt: 900 });

    expect(socket.emit).toHaveBeenCalledWith('latency:pong', {
      sentAt: 900,
      serverAt: 1000,
    });
    expect(recordMetric).toHaveBeenCalledWith('socketLatency', 100);
    nowSpy.mockRestore();
  });

  it('ignores invalid payloads', () => {
    const handlers: Record<string, any> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: {},
    };

    registerLatencyPingHandler({ socket } as any);

    handlers['latency:ping']({});
    expect(socket.emit).not.toHaveBeenCalled();
  });
});
