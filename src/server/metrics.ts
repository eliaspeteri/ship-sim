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
  socketLatency: MetricBucket;
  sockets: { connected: number };
  spaces: Record<string, SpaceMetric>;
  updatedAt: number;
};

export type SpaceMetric = {
  spaceId: string;
  name: string;
  connected: number;
  vessels: number;
  aiVessels: number;
  playerVessels: number;
  lastBroadcastAt: number;
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
  socketLatency: createBucket(),
  sockets: { connected: 0 },
  spaces: {},
  updatedAt: Date.now(),
};

export const recordMetric = (bucket: keyof ServerMetrics, ms: number) => {
  const target = serverMetrics[bucket];
  if (typeof target !== 'object' || !('count' in target)) return;
  const metric = target as MetricBucket;
  metric.lastMs = ms;
  metric.maxMs = Math.max(metric.maxMs, ms);
  metric.avgMs =
    metric.count === 0
      ? ms
      : metric.avgMs + (ms - metric.avgMs) / (metric.count + 1);
  metric.count += 1;
  serverMetrics.updatedAt = Date.now();
};

export const setConnectedClients = (count: number) => {
  serverMetrics.sockets.connected = count;
  serverMetrics.updatedAt = Date.now();
};

export const updateSpaceMetrics = (metrics: SpaceMetric[]) => {
  const next: Record<string, SpaceMetric> = {};
  for (const metric of metrics) {
    next[metric.spaceId] = metric;
  }
  serverMetrics.spaces = next;
  serverMetrics.updatedAt = Date.now();
};
