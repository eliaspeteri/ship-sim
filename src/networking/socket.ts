import io from 'socket.io-client';
import useStore from '../store';
import {
  SimpleVesselState,
  VesselJoinedData,
  VesselLeftData,
  VesselUpdateData,
  VesselControlData,
} from '../types/vesselTypes';

// Define data interface types
interface SimulationUpdateData {
  timestamp: number;
  vessels: Record<string, SimpleVesselState>;
  environment: EnvironmentUpdateData;
}

interface EnvironmentUpdateData {
  wind: {
    speed: number;
    direction: number;
    gusting: boolean;
    gustFactor: number;
  };
  current: {
    speed: number;
    direction: number;
    variability: number;
  };
  seaState: number;
  waterDepth?: number;
  waveHeight?: number;
  waveDirection?: number;
  waveLength?: number;
  visibility?: number;
  timeOfDay?: number;
  precipitation?: 'none' | 'rain' | 'snow' | 'fog';
  precipitationIntensity?: number;
  name?: string;
}

interface ChatMessageData {
  userId: string;
  username: string;
  message: string;
}

// Authentication interfaces
interface AuthResponse {
  success: boolean;
  token?: string;
  username?: string;
  isAdmin?: boolean;
  error?: string;
}

// Socket.IO Client Manager
class SocketManager {
  private socket: ReturnType<typeof io> | null = null;
  private userId: string;
  private isAdmin: boolean = false;
  private authToken: string | null = null;
  private username: string = 'Anonymous';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.userId = this.generateUserId();

    // Try to restore auth from localStorage
    this.restoreAuthFromStorage();
  }

  // Restore authentication from storage if available
  private restoreAuthFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedAuth = localStorage.getItem('ship-sim-auth');
      if (storedAuth) {
        const auth = JSON.parse(storedAuth);
        this.authToken = auth.token;
        this.userId = auth.userId;
        this.username = auth.username;
        this.isAdmin = auth.isAdmin;
        console.info(`Restored authentication for ${this.username}`);
      }
    } catch (error) {
      console.error('Failed to restore authentication from storage:', error);
    }
  }

  // Save authentication to storage
  private saveAuthToStorage(authData: {
    token: string;
    userId: string;
    username: string;
    isAdmin: boolean;
  }): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('ship-sim-auth', JSON.stringify(authData));
      window.dispatchEvent(new Event('auth-changed'));
    } catch (error) {
      console.error('Failed to save authentication to storage:', error);
    }
  }

  // Clear authentication from storage
  private clearAuthFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('ship-sim-auth');
      window.dispatchEvent(new Event('auth-changed'));
    } catch (error) {
      console.error('Failed to clear authentication from storage:', error);
    }
  }

  // Connect to Socket.IO server
  connect(url: string = 'http://localhost:3001'): void {
    if (this.socket) {
      console.warn('Socket connection already exists. Disconnecting first.');
      this.disconnect();
    }

    console.info(`Connecting to Socket.IO server at ${url}`);

    this.socket = io(url, {
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      auth: {
        userId: this.userId,
        username: this.username,
        token: this.authToken,
      },
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  // Set up Socket.IO event listeners
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
      console.info(`New vessel joined: ${data.name} (${data.id})`);
      // Handle new vessel joining
    });

    this.socket.on('vessel:left', (data: VesselLeftData) => {
      console.info(`Vessel left: ${data.id}`);
      // Handle vessel leaving
    });

    this.socket.on('environment:update', (data: EnvironmentUpdateData) => {
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
  private handleEnvironmentUpdate(data: EnvironmentUpdateData): void {
    const store = useStore.getState();
    store.updateEnvironment(data);
  }

  // Send vessel state update to server
  sendVesselUpdate(): void {
    if (!this.socket?.connected) return;

    const { vessel } = useStore.getState();

    const updateData: VesselUpdateData = {
      id: this.userId,
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
      id: this.userId,
      throttle,
      rudderAngle,
    };

    this.socket.emit('vessel:control', controlData);
  }

  // Authenticate user with username and password
  async login(username: string, password: string): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit(
        'auth:login',
        { username, password },
        (response: AuthResponse) => {
          if (response.success && response.token) {
            // Store the authentication info
            this.authToken = response.token;
            this.username = response.username || username;
            this.isAdmin = response.isAdmin || false;

            // Save to localStorage for persistence
            this.saveAuthToStorage({
              token: response.token,
              userId: this.userId,
              username: this.username,
              isAdmin: this.isAdmin,
            });

            // Add login event to the event log
            useStore.getState().addEvent({
              category: 'system',
              type: 'auth',
              message: `Logged in as ${this.username}${
                this.isAdmin ? ' (admin)' : ''
              }`,
              severity: 'info',
            });

            resolve(response);
          } else {
            reject(new Error(response.error || 'Authentication failed'));
          }
        },
      );
    });
  }

  // Register a new user (admin for testing purposes)
  async register(username: string, password: string): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit(
        'auth:register',
        { username, password },
        (response: AuthResponse) => {
          if (response.success && response.token) {
            // Store the authentication info
            this.authToken = response.token;
            this.username = response.username || username;
            this.isAdmin = response.isAdmin || false;

            // Save to localStorage for persistence
            this.saveAuthToStorage({
              token: response.token,
              userId: this.userId,
              username: this.username,
              isAdmin: this.isAdmin,
            });

            // Add registration event to the event log
            useStore.getState().addEvent({
              category: 'system',
              type: 'auth',
              message: `Registered and logged in as ${this.username}${
                this.isAdmin ? ' (admin)' : ''
              }`,
              severity: 'info',
            });

            resolve(response);
          } else {
            reject(new Error(response.error || 'Registration failed'));
          }
        },
      );
    });
  }

  // Log out the current user
  logout(): void {
    if (this.socket?.connected) {
      this.socket.emit('auth:logout');
    }

    // Clear authentication data
    this.authToken = null;
    this.username = 'Anonymous';
    this.isAdmin = false;

    // Clear from storage
    this.clearAuthFromStorage();

    // Reconnect with cleared auth
    const currentSocket = this.socket;
    if (currentSocket?.connected) {
      this.disconnect();
      this.connect();
    }

    // Add logout event to the event log
    useStore.getState().addEvent({
      category: 'system',
      type: 'auth',
      message: 'Logged out',
      severity: 'info',
    });
  }

  // Send admin weather control command
  sendWeatherControl(
    pattern?: string,
    coordinates?: { lat: number; lng: number },
  ): void {
    if (!this.socket?.connected || !this.isAdmin) {
      console.warn('Cannot send weather control: not connected or not admin');
      return;
    }

    this.socket.emit('admin:weather', { pattern, coordinates });
  }

  // Enable random weather changes
  enableRandomWeather(): void {
    if (!this.socket?.connected || !this.isAdmin) {
      console.warn('Cannot enable random weather: not connected or not admin');
      return;
    }

    this.socket.emit('admin:weather', {});
  }

  // Update vessel position with both parameters properly prefixed with underscore
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

  // Check if we're connected to the server
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Check if current user is admin
  isAdminUser(): boolean {
    return this.isAdmin;
  }

  // Get current username
  getUsername(): string {
    return this.username;
  }

  // Check if user is authenticated with a token
  isAuthenticated(): boolean {
    return !!this.authToken;
  }
}

// Export as singleton
export const socketManager = new SocketManager();

export default socketManager;
