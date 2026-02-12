import { ClientSocket, RESYNC_POLL_MS, RESYNC_STALE_MS } from './types';

type TimerState = {
  latencyTimer: NodeJS.Timeout | null;
  resyncTimer: NodeJS.Timeout | null;
  reconnectTimer: NodeJS.Timeout | null;
  connectionAttempts: number;
  maxReconnectAttempts: number;
  lastSimulationUpdateAt: number;
};

export const startLatencySampling = (
  state: TimerState,
  socket: ClientSocket | null,
): void => {
  if (!socket || state.latencyTimer) return;
  state.latencyTimer = setInterval(() => {
    if (!socket.connected) return;
    socket.emit('latency:ping', { sentAt: Date.now() });
  }, 5000);
};

export const stopLatencySampling = (state: TimerState): void => {
  if (state.latencyTimer) {
    clearInterval(state.latencyTimer);
    state.latencyTimer = null;
  }
};

export const startResyncWatcher = (
  state: TimerState,
  socket: ClientSocket | null,
): void => {
  if (state.resyncTimer) return;
  state.lastSimulationUpdateAt = Date.now();
  state.resyncTimer = setInterval(() => {
    if (!socket?.connected) return;
    const now = Date.now();
    if (now - state.lastSimulationUpdateAt < RESYNC_STALE_MS) return;
    state.lastSimulationUpdateAt = now;
    socket.emit('simulation:resync', { reason: 'stale' });
  }, RESYNC_POLL_MS);
};

export const stopResyncWatcher = (state: TimerState): void => {
  if (state.resyncTimer) {
    clearInterval(state.resyncTimer);
    state.resyncTimer = null;
  }
};

export const attemptReconnect = (
  state: TimerState,
  reconnect: () => void,
): void => {
  if (state.reconnectTimer) return;

  state.connectionAttempts += 1;

  if (state.connectionAttempts > state.maxReconnectAttempts) {
    console.error(
      'Max reconnection attempts reached. Please refresh the page.',
    );
    return;
  }

  const delay = Math.min(1000 * Math.pow(2, state.connectionAttempts), 30000);
  console.info(`Attempting to reconnect in ${delay / 1000} seconds...`);

  state.reconnectTimer = setTimeout(() => {
    console.info(`Reconnection attempt ${state.connectionAttempts}`);
    reconnect();
    state.reconnectTimer = null;
  }, delay);
};

export const clearReconnectTimer = (state: TimerState): void => {
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }
};
