import { randomUUID } from 'crypto';

export type LogLevel = 'info' | 'warn' | 'error';

export type LogEntry = {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: string;
  message: string;
  meta?: Record<string, unknown>;
};

const MAX_LOGS = 500;
const logBuffer: LogEntry[] = [];

export const recordLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
  logBuffer.push({
    id: randomUUID(),
    timestamp: Date.now(),
    ...entry,
  });
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.splice(0, logBuffer.length - MAX_LOGS);
  }
};

export const getLogs = (opts?: {
  since?: number;
  limit?: number;
}): LogEntry[] => {
  const limit = Math.min(opts?.limit ?? 200, MAX_LOGS);
  const since = opts?.since ?? 0;
  return logBuffer.filter(entry => entry.timestamp >= since).slice(-limit);
};

export const clearLogs = () => {
  logBuffer.length = 0;
};
