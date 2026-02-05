import {
  recordMetric,
  serverMetrics,
  setConnectedClients,
  updateSpaceMetrics,
} from '../../../src/server/metrics';

const resetMetrics = () => {
  Object.assign(serverMetrics.api, { lastMs: 0, avgMs: 0, maxMs: 0, count: 0 });
  Object.assign(serverMetrics.broadcast, {
    lastMs: 0,
    avgMs: 0,
    maxMs: 0,
    count: 0,
  });
  Object.assign(serverMetrics.ai, { lastMs: 0, avgMs: 0, maxMs: 0, count: 0 });
  Object.assign(serverMetrics.socketLatency, {
    lastMs: 0,
    avgMs: 0,
    maxMs: 0,
    count: 0,
  });
  serverMetrics.sockets.connected = 0;
  serverMetrics.spaces = {};
};

afterEach(() => {
  resetMetrics();
});

describe('server metrics', () => {
  it('records metric buckets with rolling average', () => {
    recordMetric('api', 100);
    recordMetric('api', 300);

    expect(serverMetrics.api.count).toBe(2);
    expect(serverMetrics.api.lastMs).toBe(300);
    expect(serverMetrics.api.maxMs).toBe(300);
    expect(serverMetrics.api.avgMs).toBeCloseTo(200, 5);
  });

  it('updates connected client counts', () => {
    setConnectedClients(5);
    expect(serverMetrics.sockets.connected).toBe(5);
  });

  it('updates space metrics by space id', () => {
    const now = Date.now();
    updateSpaceMetrics([
      {
        spaceId: 'global',
        name: 'Global Ocean',
        connected: 2,
        vessels: 3,
        aiVessels: 1,
        playerVessels: 2,
        lastBroadcastAt: now,
        updatedAt: now,
      },
    ]);

    expect(serverMetrics.spaces.global.name).toBe('Global Ocean');
    expect(serverMetrics.spaces.global.connected).toBe(2);
    expect(serverMetrics.spaces.global.vessels).toBe(3);
  });
});
