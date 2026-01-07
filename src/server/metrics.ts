export type MetricBucket = {
  lastMs: number;
  avgMs: number;
  maxMs: number;
  count: number;
};

export type ServerMetrics = {
  api: MetricBucket;
  broadcast: MetricBucket;
  ai: MetricBucket;
  sockets: { connected: number };
  updatedAt: number;
};

const createBucket = (): MetricBucket => ({
  lastMs: 0,
  avgMs: 0,
  maxMs: 0,
  count: 0,
});

export const serverMetrics: ServerMetrics = {
  api: createBucket(),
  broadcast: createBucket(),
  ai: createBucket(),
  sockets: { connected: 0 },
  updatedAt: Date.now(),
};

export const recordMetric = (bucket: keyof ServerMetrics, ms: number) => {
  const target = serverMetrics[bucket];
  if (!target || typeof target !== 'object' || !('count' in target)) return;
  const metric = target as MetricBucket;
  metric.lastMs = ms;
  metric.maxMs = Math.max(metric.maxMs, ms);
  metric.avgMs =
    metric.count === 0 ? ms : metric.avgMs + (ms - metric.avgMs) / (metric.count + 1);
  metric.count += 1;
  serverMetrics.updatedAt = Date.now();
};

export const setConnectedClients = (count: number) => {
  serverMetrics.sockets.connected = count;
  serverMetrics.updatedAt = Date.now();
};
