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

// Socket.IO Client Manager
class SocketManager {
  private socket: ReturnType<typeof io> | null = null;
  private userId: string;
  private username: string = 'Anonymous';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;
  private authToken: string | null = null;

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
    // Update our store with data from other vessels
    Object.entries(data.vessels).forEach(([id, _vesselData]) => {
      // Skip updating our own vessel as that's handled by our local physics
      if (id !== this.userId) {
        // Here we would update the store for other vessels
        // This will be implemented when we add multi-user support
      }
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
