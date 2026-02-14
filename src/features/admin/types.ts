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
  spaces: Record<
    string,
    {
      spaceId: string;
      name: string;
      connected: number;
      vessels: number;
      aiVessels: number;
      playerVessels: number;
      lastBroadcastAt: number;
      updatedAt: number;
    }
  >;
  updatedAt: number;
};

export type LogEntry = {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  meta?: Record<string, unknown>;
};

export type ModerationEntry = {
  id: string;
  userId?: string | null;
  username?: string | null;
  reason?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
};
