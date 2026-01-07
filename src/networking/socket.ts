import io from 'socket.io-client';
import type * as SocketIOClient from 'socket.io-client';
import useStore from '../store';
import { SimpleVesselState } from '../types/vessel.types';
import { EnvironmentState } from '../types/environment.types';
import {
  ChatHistoryResponse,
  ChatMessageData,
  SimulationUpdateData,
  VesselTeleportData,
  VesselControlData,
  VesselJoinedData,
  VesselLeftData,
  VesselUpdateData,
} from '../types/socket.types';

const CHAT_HISTORY_PAGE_SIZE = 20;

type ClientSocket = ReturnType<typeof io> & {
  auth?: {
    token?: string | null;
    userId?: string | null;
    username?: string | null;
  };
};

type ClientConnectOpts = Partial<SocketIOClient.ConnectOpts> & {
  withCredentials?: boolean;
  auth?: {
    userId?: string | null;
    username?: string | null;
    token?: string | null;
    spaceId?: string | null;
  };
};

const hasVesselChanged = (
  prev: SimpleVesselState | undefined,
  next: SimpleVesselState,
): boolean => {
  if (!prev) return true;

  const posChanged =
    prev.position.x !== next.position.x ||
    prev.position.y !== next.position.y ||
    prev.position.z !== next.position.z ||
    prev.position.lat !== next.position.lat ||
    prev.position.lon !== next.position.lon;
  const orientationChanged =
    prev.orientation.heading !== next.orientation.heading ||
    prev.orientation.roll !== next.orientation.roll ||
    prev.orientation.pitch !== next.orientation.pitch;
  const velocityChanged =
    prev.velocity.surge !== next.velocity.surge ||
    prev.velocity.sway !== next.velocity.sway ||
    prev.velocity.heave !== next.velocity.heave;
  const controlsChanged =
    (prev.controls?.throttle ?? 0) !== (next.controls?.throttle ?? 0) ||
    (prev.controls?.rudderAngle ?? 0) !== (next.controls?.rudderAngle ?? 0);

  return (
    prev.id !== next.id ||
    prev.ownerId !== next.ownerId ||
    posChanged ||
    orientationChanged ||
    velocityChanged ||
    controlsChanged
  );
};

// Socket.IO Client Manager
class SocketManager {
  private socket: ClientSocket | null = null;
  private userId: string;
  private username: string = 'Anonymous';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;
  private authToken: string | null = null;
  private lastUrl: string = 'http://localhost:3001';
  private spaceId: string = 'global';
  private hasHydratedSelf = false;
  private lastSelfSnapshot: SimpleVesselState | null = null;
  private selfHydrateResolvers: Array<(vessel: SimpleVesselState) => void> = [];
  private chatHistoryLoading: Set<string> = new Set();

  constructor() {
    this.userId = this.generateUserId();
  }

  // Connect to Socket.IO server
  connect(url: string = 'http://localhost:3001'): void {
    if (this.socket?.connected) {
      return; // Already connected or in progress
    }
    this.lastUrl = url;

    if (this.socket) {
      // Clean up any old instance before reconnecting
      this.disconnect();
    }

    console.info(`Connecting to Socket.IO server at ${url}`);

    // Reset hydration marker on new connection
    this.hasHydratedSelf = false;
    this.lastSelfSnapshot = null;
    this.selfHydrateResolvers = [];
    useStore.getState().setCurrentVesselId(null);

    const options: ClientConnectOpts = {
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      withCredentials: true,
      auth: {
        userId: this.userId,
        username: this.username,
        token: this.authToken || undefined,
        spaceId: this.spaceId,
      },
    };

    this.socket = io(url, options) as ClientSocket;

    // Set up event listeners
    this.setupEventListeners();
  }

  switchSpace(spaceId: string): void {
    this.setSpaceId(spaceId);
    const url = this.lastUrl || 'http://localhost:3001';
    this.disconnect();
    this.connect(url);
  }

  // Setup Socket.IO event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.info('Socket.IO connection established');
      this.connectionAttempts = 0;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.requestChatHistory('global');
    });

    this.socket.on('disconnect', (reason: string) => {
      console.info(`Socket.IO disconnected: ${reason}`);

      // Handle reconnection for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, manual reconnect needed
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket.IO connection error:', error);
      this.attemptReconnect();
    });

    // Simulation events
    this.socket.on('simulation:update', (data: SimulationUpdateData) => {
      this.handleSimulationUpdate(data);
    });

    this.socket.on('vessel:teleport', (data: VesselTeleportData) => {
      this.handleVesselTeleport(data);
    });

    this.socket.on('vessel:joined', (data: VesselJoinedData) => {
      console.info(`New vessel joined: ${data.username} (${data.userId})`);
      // Handle new vessel joining
    });

    this.socket.on('vessel:left', (data: VesselLeftData) => {
      console.info(`Vessel left: ${data.userId}`);
      // Handle vessel leaving
    });

    this.socket.on('environment:update', (data: EnvironmentState) => {
      this.handleEnvironmentUpdate(data);
    });

    this.socket.on('chat:message', (data: ChatMessageData) => {
      useStore.getState().addChatMessage({
        id: data.id,
        userId: data.userId,
        username: data.username,
        message: data.message,
        timestamp: data.timestamp || Date.now(),
        channel: data.channel || 'global',
      });
      if (data.userId === 'system') {
        useStore.getState().addEvent({
          category: 'system',
          type: 'notification',
          message: `${data.username}: ${data.message}`,
          severity: 'info',
        });
      }
    });

    this.socket.on('chat:history', (data: ChatHistoryResponse) => {
      const channel = data?.channel || 'global';
      const normalizedChannel =
        channel && channel.startsWith('vessel:')
          ? `vessel:${channel.split(':')[1]?.split('_')[0] || ''}`
          : channel;
      const messages: ChatMessageData[] = Array.isArray(data?.messages)
        ? data.messages
        : [];
      const store = useStore.getState();
      const normalizedMessages = messages.map((msg: ChatMessageData) => ({
        id: msg.id,
        userId: msg.userId,
        username: msg.username,
        message: msg.message,
        timestamp: msg.timestamp || Date.now(),
        channel: msg.channel || normalizedChannel,
      }));
      if (data?.reset) {
        if (normalizedMessages.length > 0) {
          store.replaceChannelMessages(normalizedChannel, normalizedMessages);
        } else {
          // If the server returned no messages on reset, keep existing ones but mark loaded.
          store.setChatHistoryMeta(normalizedChannel, {
            hasMore: data?.hasMore ?? false,
            loaded: true,
          });
        }
      } else if (normalizedMessages.length > 0) {
        store.mergeChatMessages(normalizedMessages);
      }
      if (data?.hasMore !== undefined) {
        store.setChatHistoryMeta(normalizedChannel, {
          hasMore: data.hasMore,
          loaded: true,
        });
      }
      this.chatHistoryLoading.delete(normalizedChannel);
    });

    this.socket.on('error', (error: unknown) => {
      console.error('Socket.IO error:', error);
      const store = useStore.getState();
      const message =
        typeof error === 'string'
          ? error
          : error instanceof Error
            ? error.message
            : 'Connection error';
      store.setNotice({ type: 'error', message });
    });
  }

  // Handle simulation updates from server
  private handleSimulationUpdate(data: SimulationUpdateData): void {
    const store = useStore.getState();
    if (data.self?.roles) {
      store.setRoles(data.self.roles);
    }
    if (data.self?.spaceId) {
      store.setSpaceId(data.self.spaceId);
      this.setSpaceId(data.self.spaceId);
    } else if (data.spaceId) {
      store.setSpaceId(data.spaceId);
      this.setSpaceId(data.spaceId);
    }
    if (data.environment) {
      store.updateEnvironment(data.environment);
    }
    if (data.chatHistory) {
      store.setChatMessages(
        data.chatHistory.map(msg => ({
          userId: msg.userId,
          username: msg.username,
          message: msg.message,
          timestamp: msg.timestamp || Date.now(),
          channel: msg.channel || 'global',
        })),
      );
      const perChannel = new Map<string, number>();
      data.chatHistory.forEach(msg => {
        const channel = msg.channel || 'global';
        perChannel.set(channel, (perChannel.get(channel) || 0) + 1);
      });
      perChannel.forEach((count, channel) => {
        store.setChatHistoryMeta(channel, {
          hasMore: count >= CHAT_HISTORY_PAGE_SIZE,
          loaded: true,
        });
      });
    }
    const currentOthers = store.otherVessels || {};
    const nextOthers = data.partial ? { ...currentOthers } : {};
    let changed = false;

    Object.entries(data.vessels).forEach(([id, vesselData]) => {
      const isSelf =
        id === this.userId ||
        id === store.currentVesselId ||
        vesselData.ownerId === this.userId ||
        (Array.isArray(vesselData.crewIds) &&
          vesselData.crewIds.includes(this.userId));
      if (isSelf) {
        if (store.currentVesselId !== id) {
          store.setCurrentVesselId(id);
        }
        if (!this.hasHydratedSelf) {
          this.hasHydratedSelf = true;
          store.setCurrentVesselId(id);
          this.lastSelfSnapshot = vesselData;
          this.selfHydrateResolvers.forEach(resolve => resolve(vesselData));
          this.selfHydrateResolvers = [];
        }
        if (vesselData.crewIds || vesselData.crewNames) {
          store.setCrew({
            ids: vesselData.crewIds,
            names: vesselData.crewNames,
          });
        }
        store.updateVessel({
          position: vesselData.position,
          orientation: vesselData.orientation,
          velocity: vesselData.velocity,
          angularVelocity: vesselData.angularVelocity
            ? {
                ...store.vessel.angularVelocity,
                ...vesselData.angularVelocity,
              }
            : undefined,
          controls: vesselData.controls
            ? {
                ...store.vessel.controls,
                throttle:
                  vesselData.controls.throttle ??
                  store.vessel.controls?.throttle ??
                  0,
                rudderAngle:
                  vesselData.controls.rudderAngle ??
                  store.vessel.controls?.rudderAngle ??
                  0,
                ballast:
                  vesselData.controls.ballast ??
                  store.vessel.controls?.ballast ??
                  0.5,
                bowThruster:
                  vesselData.controls.bowThruster ??
                  store.vessel.controls?.bowThruster ??
                  0,
              }
            : store.vessel.controls,
          helm: vesselData.helm,
        });
        const desired = vesselData.desiredMode || vesselData.mode;
        if (desired === 'ai') {
          store.setMode('spectator');
        }
        return;
      }

      const prev = nextOthers[id];
      if (hasVesselChanged(prev, vesselData)) {
        nextOthers[id] = vesselData;
        changed = true;
        if (
          id === store.currentVesselId &&
          (vesselData.crewIds || vesselData.crewNames || vesselData.helm)
        ) {
          store.setCrew({
            ids: vesselData.crewIds,
            names: vesselData.crewNames,
          });
          if (vesselData.helm) {
            store.updateVessel({ helm: vesselData.helm });
          }
        }
      }
    });

    if (!data.partial) {
      const removed =
        Object.keys(currentOthers).length !== Object.keys(nextOthers).length ||
        Object.keys(currentOthers).some(id => !(id in nextOthers));
      changed = changed || removed;
    }

    if (changed || !data.partial) {
      store.setOtherVessels(nextOthers);
    }
  }

  private handleVesselTeleport(data: VesselTeleportData): void {
    if (!data?.vesselId || !data.position) return;
    const store = useStore.getState();
    const currentId = store.currentVesselId;
    if (!currentId) return;
    const normalized = data.vesselId.split('_')[0];
    if (normalized !== currentId) return;
    void import('../simulation')
      .then(({ getSimulationLoop }) => {
        getSimulationLoop().teleportVessel({
          x: data.position.x,
          y: data.position.y,
          z: data.position.z,
        });
      })
      .catch(error => {
        console.error('Failed to teleport vessel:', error);
      });
  }

  // Await the first self snapshot after connect; resolves immediately if already hydrated
  waitForSelfSnapshot(): Promise<SimpleVesselState> {
    if (this.lastSelfSnapshot) return Promise.resolve(this.lastSelfSnapshot);
    return new Promise(resolve => {
      this.selfHydrateResolvers.push(resolve);
    });
  }

  // Handle environment updates from server
  private handleEnvironmentUpdate(data: EnvironmentState): void {
    const store = useStore.getState();
    store.updateEnvironment(data);
  }

  // Send vessel state update to server
  sendVesselUpdate(): void {
    if (!this.socket?.connected) return;

    const { vessel } = useStore.getState();

    const updateData: VesselUpdateData = {
      userId: this.userId,
      position: vessel.position,
      orientation: vessel.orientation,
      velocity: vessel.velocity,
      angularVelocity: vessel.angularVelocity,
    };

    this.socket.emit('vessel:update', updateData);
  }

  // Send vessel control update to server
  sendControlUpdate(
    throttle: number,
    rudderAngle: number,
    ballast?: number,
  ): void {
    if (!this.socket?.connected) return;

    const controlData: VesselControlData = {
      userId: this.userId,
      throttle,
      rudderAngle,
      ballast,
    };

    this.socket.emit('vessel:control', controlData);
  }

  requestNewVessel(position?: {
    x?: number;
    y?: number;
    lat?: number;
    lon?: number;
  }): void {
    if (!this.socket?.connected) return;
    this.socket.emit('vessel:create', position);
  }

  requestHelm(action: 'claim' | 'release'): void {
    if (!this.socket?.connected) return;
    this.socket.emit('vessel:helm', { action });
  }

  sendChatMessage(message: string, channel = 'global'): void {
    if (!this.socket?.connected) return;
    const targetChannel = this.buildSpaceChannel(channel);
    this.socket.emit('chat:message', { message, channel: targetChannel });
  }

  requestChatHistory(channel: string, before?: number, limit = 20): void {
    if (!this.socket?.connected) return;
    const normalizedChannel = this.buildSpaceChannel(channel);
    if (!before) {
      const store = useStore.getState();
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

  // Update vessel position
  updateVesselPosition(
    _position: { x: number; y: number; z: number },
    _vesselData: SimpleVesselState,
  ) {
    // Function implementation
  }

  // Notify server about local mode changes (player/spectator)
  notifyModeChange(mode: 'player' | 'spectator'): void {
    if (!this.socket?.connected) return;
    this.socket.emit('user:mode', { mode });
  }

  sendAdminVesselMove(
    vesselId: string,
    position: { x?: number; y?: number; lat?: number; lon?: number },
  ): void {
    if (!this.socket?.connected) return;
    this.socket.emit('admin:vessel:move', { vesselId, position });
  }

  private buildSpaceChannel(channel?: string): string {
    const storeSpace = useStore.getState().spaceId;
    const space = (storeSpace || this.spaceId || 'global').trim().toLowerCase();
    const raw = (channel || 'global').trim();
    if (raw.startsWith('space:')) return raw;
    if (raw.startsWith('vessel:')) {
      const [, rest] = raw.split(':');
      const [id] = rest.split('_');
      return `space:${space}:vessel:${id}`;
    }
    return `space:${space}:${raw || 'global'}`;
  }

  // Attempt to reconnect to server
  private attemptReconnect(): void {
    if (this.reconnectTimer) return;

    this.connectionAttempts++;

    if (this.connectionAttempts > this.maxReconnectAttempts) {
      console.error(
        'Max reconnection attempts reached. Please refresh the page.',
      );
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000);
    console.info(`Attempting to reconnect in ${delay / 1000} seconds...`);

    this.reconnectTimer = setTimeout(() => {
      console.info(`Reconnection attempt ${this.connectionAttempts}`);
      this.socket?.connect();
      this.reconnectTimer = null;
    }, delay);
  }

  // Disconnect from Socket.IO server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Generate a unique user ID
  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substring(2, 9);
  }

  // Allow setting an external auth token for the socket (e.g., NextAuth JWT)
  setAuthToken(token: string, userId?: string, username?: string): void {
    this.authToken = token;
    this.userId = userId || this.userId;
    this.username = username || this.username;
    const store = useStore.getState();
    this.spaceId = store.spaceId || this.spaceId;
    if (this.socket) {
      this.socket.auth = {
        token: this.authToken,
        userId: this.userId,
        username: this.username,
        spaceId: this.spaceId,
      };
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

  // Check if we're connected to the server
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get current username from localStorage
  getUsername(): string {
    try {
      const storedAuth = localStorage.getItem('ship-sim-auth');
      if (storedAuth) {
        const auth = JSON.parse(storedAuth);
        return auth.username || 'Anonymous';
      }
    } catch (error) {
      console.error('Error getting username:', error);
    }
    return 'Anonymous';
  }

  // Send admin weather control command
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

    const store = useStore.getState();
    const isAdmin = store.roles.includes('admin');

    if (!isAdmin) {
      console.warn('Cannot send weather control: not admin');
      return;
    }

    if (typeof options === 'string') {
      this.socket.emit('admin:weather', { pattern: options, mode: 'manual' });
      return;
    }

    const { pattern, coordinates, mode } = options;
    this.socket.emit('admin:weather', {
      pattern,
      coordinates,
      mode: mode || 'manual',
    });
  }

  // Enable random weather changes
  enableRandomWeather(): void {
    if (!this.socket?.connected) {
      console.warn('Cannot enable random weather: not connected');
      return;
    }

    this.sendWeatherControl({ mode: 'auto' });
  }
}

// Export as singleton
export const socketManager = new SocketManager();

export default socketManager;
