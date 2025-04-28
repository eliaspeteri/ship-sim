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
  refreshToken?: string;
  username?: string;
  isAdmin?: boolean;
  roles?: string[];
  error?: string;
}

// JWT token payload interface
interface JWTPayload {
  sub: string; // Subject (userId)
  username: string;
  roles: string[];
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
  type: 'access' | 'refresh'; // Token type
}

// Socket.IO Client Manager
class SocketManager {
  private socket: ReturnType<typeof io> | null = null;
  private userId: string;
  private isAdmin: boolean = false;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private username: string = 'Anonymous';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private stayLoggedIn: boolean = false; // Flag to determine if auto-refresh should occur
  private refreshingToken: boolean = false; // Flag to prevent multiple concurrent refresh attempts

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
        this.accessToken = auth.accessToken;
        this.refreshToken = auth.refreshToken;
        this.userId = auth.userId;
        this.username = auth.username;
        this.isAdmin = auth.isAdmin;
        this.stayLoggedIn = auth.stayLoggedIn || false;
        console.info(`Restored authentication for ${this.username}`);

        // Set up token refresh if stay logged in is enabled
        if (this.stayLoggedIn && this.accessToken) {
          this.setupTokenRefresh();
        }
      }
    } catch (error) {
      console.error('Failed to restore authentication from storage:', error);
    }
  }

  // Save authentication to storage
  private saveAuthToStorage(authData: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    username: string;
    isAdmin: boolean;
    stayLoggedIn?: boolean;
  }): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        'ship-sim-auth',
        JSON.stringify({
          ...authData,
          stayLoggedIn: this.stayLoggedIn,
        }),
      );
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
        token: this.accessToken,
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

  // Parse JWT token to get payload
  private parseJwtToken(token: string): JWTPayload | null {
    try {
      // Split the token into parts
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      // Decode the payload
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf8'),
      );

      return payload as JWTPayload;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  // Set up token refresh mechanism
  private setupTokenRefresh(): void {
    // Clear any existing refresh timer
    this.clearTokenRefreshTimer();

    // If not logged in or not set to stay logged in, don't schedule refresh
    if (!this.accessToken || !this.stayLoggedIn) return;

    try {
      // Parse token to get expiry time
      const payload = this.parseJwtToken(this.accessToken);
      if (!payload) {
        console.error('Failed to parse access token for refresh');
        return;
      }

      // Calculate time before the token expires (in milliseconds)
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const expiresIn = payload.exp - now;

      // If token is already expired, try to refresh it immediately
      if (expiresIn <= 0) {
        console.info('Access token expired, attempting immediate refresh');
        if (this.refreshToken) {
          void this.refreshTokenAsync().catch(err => {
            console.error('Failed to refresh expired token:', err);
          });
        }
        return;
      }

      // Schedule refresh at 85% of the token's lifetime
      // This gives us a good buffer before expiration
      const refreshTime = expiresIn * 0.85 * 1000; // Convert to milliseconds
      console.info(
        `Token refresh scheduled in ${Math.round(refreshTime / 1000 / 60)} minutes`,
      );

      this.tokenRefreshTimer = setTimeout(() => {
        if (this.refreshToken) {
          void this.refreshTokenAsync().catch(err => {
            console.error('Failed to refresh token:', err);
          });
        }
      }, refreshTime);
    } catch (error) {
      console.error('Error setting up token refresh:', error);
    }
  }

  // Clear token refresh timer
  private clearTokenRefreshTimer(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  // Refresh the authentication token
  async refreshTokenAsync(): Promise<boolean> {
    // Prevent multiple concurrent refresh attempts
    if (this.refreshingToken || !this.refreshToken || !this.stayLoggedIn) {
      return false;
    }

    this.refreshingToken = true;

    try {
      if (!this.socket?.connected) {
        console.warn('Cannot refresh token: socket not connected');
        this.refreshingToken = false;
        return false;
      }

      console.info('Attempting to refresh authentication token');

      return new Promise<boolean>(resolve => {
        if (!this.socket) {
          this.refreshingToken = false;
          resolve(false);
          return;
        }

        this.socket.emit(
          'auth:refresh',
          { refreshToken: this.refreshToken },
          (response: AuthResponse) => {
            if (response.success && response.token && response.refreshToken) {
              // Update auth tokens
              this.accessToken = response.token;
              this.refreshToken = response.refreshToken;

              // Save to localStorage
              this.saveAuthToStorage({
                accessToken: response.token,
                refreshToken: response.refreshToken,
                userId: this.userId,
                username: this.username,
                isAdmin: this.isAdmin,
                stayLoggedIn: this.stayLoggedIn,
              });

              console.info('Authentication token refreshed successfully');

              // Set up the next token refresh
              this.setupTokenRefresh();

              this.refreshingToken = false;
              resolve(true);
            } else {
              console.error('Failed to refresh token:', response.error);

              // If configured to stay logged in, notify the user their session expired
              if (this.stayLoggedIn) {
                useStore.getState().addEvent({
                  category: 'system',
                  type: 'auth',
                  message: 'Session expired. Please log in again.',
                  severity: 'warning',
                });
              }

              // Clear expired auth data
              this.accessToken = null;
              this.refreshToken = null;
              this.clearAuthFromStorage();
              window.dispatchEvent(new Event('session-expired'));

              this.refreshingToken = false;
              resolve(false);
            }
          },
        );
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.refreshingToken = false;
      return false;
    }
  }

  // Set if the user wants to stay logged in
  setStayLoggedIn(stayLoggedIn: boolean): void {
    this.stayLoggedIn = stayLoggedIn;

    if (this.accessToken) {
      // Update storage with the new preference
      this.saveAuthToStorage({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken || '',
        userId: this.userId,
        username: this.username,
        isAdmin: this.isAdmin,
        stayLoggedIn: this.stayLoggedIn,
      });

      // Set up token refresh if enabled
      if (stayLoggedIn) {
        this.setupTokenRefresh();
      } else {
        this.clearTokenRefreshTimer();
      }
    }
  }

  // Get stay logged in preference
  getStayLoggedIn(): boolean {
    return this.stayLoggedIn;
  }

  // Authenticate user with username and password
  async login(
    username: string,
    password: string,
    stayLoggedIn: boolean = false,
  ): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit(
        'auth:login',
        { username, password },
        (response: AuthResponse) => {
          if (response.success && response.token && response.refreshToken) {
            // Store the authentication info
            this.accessToken = response.token;
            this.refreshToken = response.refreshToken;
            this.username = response.username || username;
            this.isAdmin = response.roles?.includes('admin') || false;
            this.stayLoggedIn = stayLoggedIn;

            // Extract userId from token
            const tokenPayload = this.parseJwtToken(response.token);
            if (tokenPayload) {
              this.userId = tokenPayload.sub;
            }

            // Save to localStorage for persistence
            this.saveAuthToStorage({
              accessToken: response.token,
              refreshToken: response.refreshToken,
              userId: this.userId,
              username: this.username,
              isAdmin: this.isAdmin,
              stayLoggedIn: this.stayLoggedIn,
            });

            // Set up token refresh if stay logged in is enabled
            if (stayLoggedIn) {
              this.setupTokenRefresh();
            }

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
  async register(
    username: string,
    password: string,
    stayLoggedIn: boolean = false,
  ): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit(
        'auth:register',
        { username, password },
        (response: AuthResponse) => {
          if (response.success && response.token && response.refreshToken) {
            // Store the authentication info
            this.accessToken = response.token;
            this.refreshToken = response.refreshToken;
            this.username = response.username || username;
            this.isAdmin = response.roles?.includes('admin') || false;
            this.stayLoggedIn = stayLoggedIn;

            // Extract userId from token
            const tokenPayload = this.parseJwtToken(response.token);
            if (tokenPayload) {
              this.userId = tokenPayload.sub;
            }

            // Save to localStorage for persistence
            this.saveAuthToStorage({
              accessToken: response.token,
              refreshToken: response.refreshToken,
              userId: this.userId,
              username: this.username,
              isAdmin: this.isAdmin,
              stayLoggedIn: this.stayLoggedIn,
            });

            // Set up token refresh if stay logged in is enabled
            if (stayLoggedIn) {
              this.setupTokenRefresh();
            }

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
    this.accessToken = null;
    this.refreshToken = null;
    this.username = 'Anonymous';
    this.isAdmin = false;
    this.stayLoggedIn = false;

    // Clear token refresh timer if exists
    this.clearTokenRefreshTimer();

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
    return !!this.accessToken && !this.isTokenExpired();
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    if (!this.accessToken) return true;

    try {
      const payload = this.parseJwtToken(this.accessToken);
      if (!payload) return true;

      const isExpired = Math.floor(Date.now() / 1000) >= payload.exp;

      // If token is expired but we're set to stay logged in and have a refresh token,
      // try to refresh it
      if (isExpired && this.stayLoggedIn && this.refreshToken) {
        this.refreshTokenAsync().catch(() => {
          // Token refresh failed, stay logged out
        });
      }

      return isExpired;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  // Check if token will expire soon (within next 5 minutes)
  willTokenExpireSoon(): boolean {
    if (!this.accessToken) return false;

    try {
      const payload = this.parseJwtToken(this.accessToken);
      if (!payload) return false;

      // Check if token expires within the next 5 minutes
      const now = Math.floor(Date.now() / 1000);
      const expiresInSeconds = payload.exp - now;
      return expiresInSeconds > 0 && expiresInSeconds < 300; // 5 minutes in seconds
    } catch (error) {
      console.error('Error checking token expiry time:', error);
      return false;
    }
  }
}

// Export as singleton
export const socketManager = new SocketManager();

export default socketManager;
