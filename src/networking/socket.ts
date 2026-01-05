import io from 'socket.io-client';
import useStore from '../store';
import { SimpleVesselState } from '../types/vessel.types';
import { EnvironmentState } from '../types/environment.types';
import {
  ChatMessageData,
  SimulationUpdateData,
  VesselControlData,
  VesselJoinedData,
  VesselLeftData,
  VesselUpdateData,
} from '../types/socket.types';

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
  private socket: ReturnType<typeof io> | null = null;
  private userId: string;
  private username: string = 'Anonymous';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;
  private authToken: string | null = null;
  private hasHydratedSelf = false;
  private lastSelfSnapshot: SimpleVesselState | null = null;
  private selfHydrateResolvers: Array<(vessel: SimpleVesselState) => void> = [];

  constructor() {
    this.userId = this.generateUserId();
  }

  // Connect to Socket.IO server
  connect(url: string = 'http://localhost:3001'): void {
    if (this.socket?.connected) {
      return; // Already connected or in progress
    }

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

    this.socket = io(url, {
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      withCredentials: true as unknown as boolean,
      auth: {
        userId: this.userId,
        username: this.username,
        token: this.authToken || undefined,
      },
    });

    // Set up event listeners
    this.setupEventListeners();
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
      // Add to event log for now
      if (data.userId === 'system') {
        useStore.getState().addEvent({
          category: 'system',
          type: 'notification',
          message: `${data.username}: ${data.message}`,
          severity: 'info',
        });
      }
    });

    this.socket.on('error', (error: unknown) => {
      console.error('Socket.IO error:', error);
    });
  }

  // Handle simulation updates from server
  private handleSimulationUpdate(data: SimulationUpdateData): void {
    const store = useStore.getState();
    const currentOthers = store.otherVessels || {};
    const nextOthers = data.partial ? { ...currentOthers } : {};
    let changed = false;

    Object.entries(data.vessels).forEach(([id, vesselData]) => {
        const isSelf =
          id === this.userId ||
          id === store.currentVesselId ||
          vesselData.ownerId === this.userId;
        if (isSelf) {
          if (!this.hasHydratedSelf) {
            this.hasHydratedSelf = true;
            store.setCurrentVesselId(id);
            this.lastSelfSnapshot = vesselData;
            this.selfHydrateResolvers.forEach(resolve => resolve(vesselData));
            this.selfHydrateResolvers = [];
            store.updateVessel({
              position: vesselData.position,
              orientation: vesselData.orientation,
              velocity: vesselData.velocity,
              angularVelocity: vesselData.angularVelocity,
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
            });
            if (vesselData.mode === 'ai') {
              store.setMode('spectator');
            } else if (vesselData.mode === 'player') {
              store.setMode('player');
            }
          }
          return;
        }

      const prev = nextOthers[id];
      if (hasVesselChanged(prev, vesselData)) {
        nextOthers[id] = vesselData;
        changed = true;
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
  sendControlUpdate(throttle: number, rudderAngle: number): void {
    if (!this.socket?.connected) return;

    const controlData: VesselControlData = {
      userId: this.userId,
      throttle,
      rudderAngle,
    };

    this.socket.emit('vessel:control', controlData);
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
    if (this.socket) {
      this.socket.auth = {
        token: this.authToken,
        userId: this.userId,
        username: this.username,
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
    pattern?: string,
    coordinates?: { lat: number; lng: number },
  ): void {
    if (!this.socket?.connected) {
      console.warn('Cannot send weather control: not connected');
      return;
    }

    // Check if user is admin from localStorage
    let isAdmin = false;
    try {
      const storedAuth = localStorage.getItem('ship-sim-auth');
      if (storedAuth) {
        const auth = JSON.parse(storedAuth);
        isAdmin = auth.isAdmin || false;
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }

    if (!isAdmin) {
      console.warn('Cannot send weather control: not admin');
      return;
    }

    this.socket.emit('admin:weather', { pattern, coordinates });
  }

  // Enable random weather changes
  enableRandomWeather(): void {
    if (!this.socket?.connected) {
      console.warn('Cannot enable random weather: not connected');
      return;
    }

    // Check if user is admin from localStorage
    let isAdmin = false;
    try {
      const storedAuth = localStorage.getItem('ship-sim-auth');
      if (storedAuth) {
        const auth = JSON.parse(storedAuth);
        isAdmin = auth.isAdmin || false;
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }

    if (!isAdmin) {
      console.warn('Cannot enable random weather: not admin');
      return;
    }

    this.socket.emit('admin:weather', {});
  }
}

// Export as singleton
export const socketManager = new SocketManager();

export default socketManager;
