import io from 'socket.io-client';
import {
  createDefaultSocketStoreAdapter,
  SocketStoreAdapter,
} from './adapters/socketStoreAdapter';
import { SimpleVesselState } from '../types/vessel.types';
import { ClientConnectOpts, ClientSocket } from './socket/types';
import {
  attemptReconnect,
  clearReconnectTimer,
  startLatencySampling,
  startResyncWatcher,
  stopLatencySampling,
  stopResyncWatcher,
} from './socket/lifecycle';
import {
  buildPositionPayload,
  buildSpaceChannel,
  canSendWeatherControl,
  detectControlDiff,
  emitRepairRequest,
  sendControlUpdate,
  sendVesselUpdate,
} from './socket/outboundCommands';
import {
  handleEnvironmentUpdate,
  handleSimulationUpdate,
  handleVesselTeleport,
  SimulationHandlerState,
} from './socket/simulationHandlers';
import { registerSocketHandlers } from './socket/registerHandlers';

type ConnectionState = {
  socket: ClientSocket | null;
  reconnectTimer: NodeJS.Timeout | null;
  latencyTimer: NodeJS.Timeout | null;
  resyncTimer: NodeJS.Timeout | null;
  lastSimulationUpdateAt: number;
  connectionAttempts: number;
  maxReconnectAttempts: number;
};

type SocketManagerDeps = {
  storeAdapter: SocketStoreAdapter;
  ioClient: typeof io;
};

const createDefaultDeps = (): SocketManagerDeps => ({
  storeAdapter: createDefaultSocketStoreAdapter(),
  ioClient: io,
});

const createSocketUserId = (): string =>
  `user_${Math.random().toString(36).substring(2, 9)}`;

class SocketManager {
  private readonly deps: SocketManagerDeps;

  private connection: ConnectionState = {
    socket: null,
    reconnectTimer: null,
    latencyTimer: null,
    resyncTimer: null,
    lastSimulationUpdateAt: 0,
    connectionAttempts: 0,
    maxReconnectAttempts: 5,
  };

  private userId: string;
  private username = 'Anonymous';
  private authToken: string | null = null;
  private lastUrl = 'http://localhost:3001';
  private spaceId = 'global';
  private initialMode: 'player' | 'spectator' = 'player';
  private autoJoin = true;
  private chatHistoryLoading = new Set<string>();
  private connectResolvers: Array<() => void> = [];
  private connectionStatusListeners = new Set<(connected: boolean) => void>();
  private simulationState: SimulationHandlerState = {
    userId: '',
    hasHydratedSelf: false,
    lastSelfSnapshot: null,
    selfHydrateResolvers: [],
    lastSelfVesselId: null,
    lastSimulationTimestamp: 0,
    lastSimulationUpdateAt: 0,
  };
  private lastControlSent: {
    throttle?: number;
    rudderAngle?: number;
    ballast?: number;
    timestamp: number;
  } = { timestamp: 0 };

  constructor(deps: SocketManagerDeps) {
    this.deps = deps;
    this.userId = createSocketUserId();
    this.simulationState.userId = this.userId;
  }

  private getStoreState() {
    return this.deps.storeAdapter.getState();
  }

  private get socket(): ClientSocket | null {
    return this.connection.socket;
  }

  private set socket(socket: ClientSocket | null) {
    this.connection.socket = socket;
  }

  connect(url = 'http://localhost:3001'): void {
    if (this.socket?.connected) return;

    this.lastUrl = url;
    if (this.socket) {
      this.disconnect();
    }

    console.info(`Connecting to Socket.IO server at ${url}`);

    this.simulationState = {
      ...this.simulationState,
      userId: this.userId,
      hasHydratedSelf: false,
      lastSelfSnapshot: null,
      selfHydrateResolvers: [],
      lastSelfVesselId: null,
      lastSimulationTimestamp: 0,
      lastSimulationUpdateAt: Date.now(),
    };

    this.getStoreState().setCurrentVesselId(null);

    const options: ClientConnectOpts = {
      reconnectionAttempts: this.connection.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      withCredentials: true,
      auth: {
        userId: this.userId,
        username: this.username,
        token: this.authToken || undefined,
        spaceId: this.spaceId,
        mode: this.initialMode,
        autoJoin: this.autoJoin,
      },
    };

    this.socket = this.deps.ioClient(url, options) as ClientSocket;
    this.setupEventListeners();
  }

  switchSpace(spaceId: string): void {
    this.setSpaceId(spaceId);
    this.simulationState.lastSimulationTimestamp = 0;
    this.simulationState.lastSimulationUpdateAt = Date.now();
    const url = this.lastUrl || 'http://localhost:3001';
    this.disconnect();
    this.connect(url);
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    registerSocketHandlers({
      socket: this.socket,
      requestChatHistory: this.requestChatHistory.bind(this),
      startLatencySampling: () =>
        startLatencySampling(this.connection, this.socket),
      stopLatencySampling: () => stopLatencySampling(this.connection),
      startResyncWatcher: () => {
        this.connection.lastSimulationUpdateAt =
          this.simulationState.lastSimulationUpdateAt;
        startResyncWatcher(this.connection, this.socket);
      },
      stopResyncWatcher: () => stopResyncWatcher(this.connection),
      notifyModeChange: this.notifyModeChange.bind(this),
      getInitialMode: () => this.initialMode,
      shouldAutoJoin: () => this.autoJoin,
      resolveConnectionWaiters: () => {
        this.connection.connectionAttempts = 0;
        clearReconnectTimer(this.connection);
        const resolvers = this.connectResolvers.splice(0);
        resolvers.forEach(resolve => resolve());
      },
      attemptReconnect: () =>
        attemptReconnect(this.connection, () => {
          this.socket?.connect();
        }),
      handleSimulationUpdate: data => {
        handleSimulationUpdate(
          this.simulationState,
          {
            getStoreState: this.getStoreState.bind(this),
            setSpaceId: this.setSpaceId.bind(this),
            setJoinPreference: this.setJoinPreference.bind(this),
            updateState: updater => {
              updater(this.simulationState);
            },
          },
          data,
        );
        this.connection.lastSimulationUpdateAt =
          this.simulationState.lastSimulationUpdateAt;
      },
      handleVesselTeleport: data =>
        handleVesselTeleport(this.getStoreState.bind(this), data),
      handleEnvironmentUpdate: data =>
        handleEnvironmentUpdate(this.getStoreState.bind(this), data),
      setJoinPreference: (mode, autoJoin) =>
        this.setJoinPreference(mode, autoJoin),
      switchSpace: spaceId => this.switchSpace(spaceId),
      clearChatHistoryLoading: channel => {
        this.chatHistoryLoading.delete(channel);
      },
      getStoreState: this.getStoreState.bind(this),
      setConnectionStatus: connected => {
        this.notifyConnectionStatus(connected);
      },
    });
  }

  private notifyConnectionStatus(connected: boolean): void {
    this.connectionStatusListeners.forEach(listener => listener(connected));
  }

  waitForSelfSnapshot(): Promise<SimpleVesselState> {
    if (this.simulationState.lastSelfSnapshot) {
      return Promise.resolve(this.simulationState.lastSelfSnapshot);
    }
    return new Promise(resolve => {
      this.simulationState.selfHydrateResolvers.push(resolve);
    });
  }

  sendVesselUpdate(): void {
    if (!this.socket?.connected) return;
    sendVesselUpdate(this.socket, this.userId, this.getStoreState().vessel);
  }

  sendControlUpdate(
    throttle?: number,
    rudderAngle?: number,
    ballast?: number,
  ): void {
    if (!this.socket?.connected) return;
    if (
      throttle === undefined &&
      rudderAngle === undefined &&
      ballast === undefined
    ) {
      console.info('No control changes to send');
      return;
    }

    const changes = detectControlDiff(this.lastControlSent, {
      throttle,
      rudderAngle,
      ballast,
    });

    if (
      !changes.hasThrottleChange &&
      !changes.hasRudderChange &&
      !changes.hasBallastChange
    ) {
      return;
    }

    sendControlUpdate(this.socket, this.userId, {
      throttle,
      rudderAngle,
      ballast,
    });

    this.lastControlSent = {
      throttle: changes.hasThrottleChange
        ? throttle
        : this.lastControlSent.throttle,
      rudderAngle: changes.hasRudderChange
        ? rudderAngle
        : this.lastControlSent.rudderAngle,
      ballast: changes.hasBallastChange
        ? ballast
        : this.lastControlSent.ballast,
      timestamp: performance.now(),
    };

    console.info('Control update sent successfully');
  }

  requestNewVessel(position?: {
    x?: number;
    y?: number;
    lat?: number;
    lon?: number;
  }): void {
    if (!this.socket?.connected) return;
    this.socket.emit('vessel:create', buildPositionPayload(position));
  }

  requestJoinVessel(vesselId?: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('vessel:join', vesselId ? { vesselId } : undefined);
  }

  requestHelm(action: 'claim' | 'release'): void {
    if (!this.socket?.connected) return;
    this.socket.emit('vessel:helm', { action });
  }

  requestStation(
    station: 'helm' | 'engine' | 'radio',
    action: 'claim' | 'release',
  ): void {
    if (!this.socket?.connected) return;
    this.socket.emit('vessel:station', { station, action });
  }

  requestRepair(vesselId?: string): void {
    if (!this.socket?.connected) return;
    emitRepairRequest(this.socket, vesselId, this.getStoreState.bind(this));
  }

  sendChatMessage(message: string, channel = 'global'): void {
    if (!this.socket?.connected) return;
    const targetChannel = buildSpaceChannel(
      channel,
      this.getStoreState().spaceId,
      this.spaceId,
    );
    this.socket.emit('chat:message', { message, channel: targetChannel });
  }

  requestChatHistory(channel: string, before?: number, limit = 20): void {
    if (!this.socket?.connected) return;
    const normalizedChannel = buildSpaceChannel(
      channel,
      this.getStoreState().spaceId,
      this.spaceId,
    );
    if (!before) {
      const store = this.getStoreState();
      const meta = store.chatHistoryMeta[normalizedChannel || channel];
      const hasMessages =
        store.chatMessages.filter(
          msg =>
            (msg.channel || 'global') === normalizedChannel ||
            msg.channel === channel,
        ).length > 0;
      if (meta?.loaded || hasMessages) {
        store.setChatHistoryMeta(normalizedChannel || channel, {
          hasMore: meta?.hasMore ?? false,
          loaded: true,
        });
        return;
      }
      if (this.chatHistoryLoading.has(normalizedChannel || channel)) {
        return;
      }
      this.chatHistoryLoading.add(normalizedChannel || channel);
    }
    this.socket.emit('chat:history', {
      channel: normalizedChannel || channel,
      before,
      limit,
    });
  }

  requestSeamarksNearby(payload: {
    lat: number;
    lon: number;
    radiusMeters: number;
    bbox: { south: number; west: number; north: number; east: number };
    bboxKey: string;
    limit?: number;
  }): void {
    this.socket?.emit('seamarks:nearby', payload);
  }

  sendClientLog(entry: {
    level: 'info' | 'warn' | 'error';
    source: string;
    message: string;
    meta?: Record<string, unknown>;
  }): void {
    if (!this.socket?.connected) return;
    this.socket.emit('client:log', entry);
  }

  notifyModeChange(mode: 'player' | 'spectator'): void {
    if (!this.socket?.connected) return;
    this.socket.emit('user:mode', { mode });
  }

  sendAdminVesselMove(
    vesselId: string,
    position: { x?: number; y?: number; lat?: number; lon?: number },
  ): void {
    if (!this.socket?.connected) return;
    this.socket.emit('admin:vessel:move', {
      vesselId,
      position: buildPositionPayload(position),
    });
  }

  sendAdminVesselMode(vesselId: string, mode: 'player' | 'ai'): void {
    if (!this.socket?.connected) return;
    this.socket.emit('admin:vesselMode', { vesselId, mode });
  }

  sendAdminVesselStop(vesselId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('admin:vessel:stop', { vesselId });
  }

  sendAdminVesselRemove(vesselId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('admin:vessel:remove', { vesselId });
  }

  sendAdminKick(userId: string, reason?: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('admin:kick', { userId, reason });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    stopLatencySampling(this.connection);
    stopResyncWatcher(this.connection);
    clearReconnectTimer(this.connection);
  }

  setAuthToken(token: string, userId?: string, username?: string): void {
    this.authToken = token;
    this.userId = userId || this.userId;
    this.simulationState.userId = this.userId;
    this.username = username || this.username;
    this.spaceId = this.getStoreState().spaceId || this.spaceId;
    if (this.socket) {
      this.socket.auth = {
        token: this.authToken,
        userId: this.userId,
        username: this.username,
        spaceId: this.spaceId,
        mode: this.initialMode,
        autoJoin: this.autoJoin,
      };
    }
  }

  refreshAuth(token?: string | null, userId?: string, username?: string): void {
    this.authToken = token ?? null;
    if (userId !== undefined) {
      this.userId = userId || this.userId;
      this.simulationState.userId = this.userId;
    }
    if (username !== undefined) {
      this.username = username || this.username;
    }
    this.spaceId = this.getStoreState().spaceId || this.spaceId;
    if (this.socket) {
      this.socket.auth = {
        ...(this.socket.auth || {}),
        token: this.authToken,
        userId: this.userId,
        username: this.username,
        spaceId: this.spaceId,
        mode: this.initialMode,
        autoJoin: this.autoJoin,
      };
      this.socket.emit('user:auth', {
        token: this.authToken,
        userId: this.userId,
        username: this.username,
      });
    }
  }

  setSpaceId(spaceId: string): void {
    this.spaceId = spaceId || 'global';
    if (this.socket) {
      this.socket.auth = {
        ...(this.socket.auth || {}),
        spaceId: this.spaceId,
      };
    }
  }

  setJoinPreference(mode: 'player' | 'spectator', autoJoin = true): void {
    this.initialMode = mode;
    this.autoJoin = autoJoin;
    if (this.socket) {
      this.socket.auth = {
        ...(this.socket.auth || {}),
        mode: this.initialMode,
        autoJoin: this.autoJoin,
      };
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  subscribeConnectionStatus(
    listener: (connected: boolean) => void,
  ): () => void {
    this.connectionStatusListeners.add(listener);
    listener(this.isConnected());
    return () => {
      this.connectionStatusListeners.delete(listener);
    };
  }

  waitForConnection(): Promise<void> {
    if (this.socket?.connected) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.connectResolvers.push(resolve);
    });
  }

  getUsername(): string {
    try {
      const storedAuth = localStorage.getItem('ship-sim-auth');
      if (storedAuth) {
        const auth = JSON.parse(storedAuth) as { username?: string };
        return auth.username || 'Anonymous';
      }
    } catch (error) {
      console.error('Error getting username:', error);
    }
    return 'Anonymous';
  }

  sendWeatherControl(
    options:
      | string
      | {
          pattern?: string;
          coordinates?: { lat: number; lng: number };
          mode?: 'auto' | 'manual';
        },
  ): void {
    if (!this.socket?.connected) {
      console.warn('Cannot send weather control: not connected');
      return;
    }

    if (!canSendWeatherControl(this.getStoreState.bind(this))) {
      console.warn('Cannot send weather control: not admin');
      return;
    }

    if (typeof options === 'string') {
      this.socket.emit('admin:weather', { pattern: options, mode: 'manual' });
      return;
    }

    this.socket.emit('admin:weather', {
      pattern: options.pattern,
      coordinates: options.coordinates,
      mode: options.mode || 'manual',
    });
  }

  enableRandomWeather(): void {
    if (!this.socket?.connected) {
      console.warn('Cannot enable random weather: not connected');
      return;
    }

    this.sendWeatherControl({ mode: 'auto' });
  }
}

export const createSocketManager = (
  overrides: Partial<SocketManagerDeps> = {},
): SocketManager => {
  const defaults = createDefaultDeps();
  return new SocketManager({ ...defaults, ...overrides });
};

export const socketManager = createSocketManager();
