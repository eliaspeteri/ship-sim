import io from 'socket.io-client';
import useStore from '../store';

// Define event types
type _ServerToClientEvents = {
  'simulation:update': (data: SimulationUpdateData) => void;
  'vessel:joined': (data: VesselJoinedData) => void;
  'vessel:left': (data: VesselLeftData) => void;
  'environment:update': (data: EnvironmentUpdateData) => void;
  error: (error: string) => void;
};

type _ClientToServerEvents = {
  'vessel:update': (data: VesselUpdateData) => void;
  'vessel:control': (data: VesselControlData) => void;
  'simulation:state': (data: { isRunning: boolean }) => void;
  'chat:message': (data: { message: string }) => void;
};

// Define data interface types
interface SimulationUpdateData {
  timestamp: number;
  vessels: Record<string, VesselState>;
  environment: {
    wind: { speed: number; direction: number };
    current: { speed: number; direction: number };
    seaState: number;
  };
}

interface VesselState {
  id: string;
  position: { x: number; y: number; z: number };
  orientation: { heading: number; roll: number; pitch: number };
  velocity: { surge: number; sway: number; heave: number };
}

interface VesselJoinedData {
  id: string;
  name: string;
  vesselType: string;
}

interface VesselLeftData {
  id: string;
}

interface VesselUpdateData {
  id: string;
  position?: { x: number; y: number; z: number };
  orientation?: { heading: number; roll: number; pitch: number };
  velocity?: { surge: number; sway: number; heave: number };
}

interface VesselControlData {
  id: string;
  throttle?: number;
  rudderAngle?: number;
}

interface EnvironmentUpdateData {
  wind: {
    speed: number;
    direction: number;
    gusting: boolean;
    gustFactor: number;
  };
  current: { speed: number; direction: number; variability: number };
  seaState: number;
}

// Socket.IO Client Manager
class SocketManager {
  // Use any type for now to avoid TypeScript errors
  private socket: any = null;
  private userId: string;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.userId = this.generateUserId();
  }

  // Connect to Socket.IO server
  connect(url: string = 'http://localhost:3001'): void {
    if (this.socket) {
      console.warn('Socket connection already exists. Disconnecting first.');
      this.disconnect();
    }

    console.log(`Connecting to Socket.IO server at ${url}`);

    this.socket = io(url, {
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      auth: {
        userId: this.userId,
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
      console.log('Socket.IO connection established');
      this.connectionAttempts = 0;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log(`Socket.IO disconnected: ${reason}`);

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
      console.log(`New vessel joined: ${data.name} (${data.id})`);
      // Handle new vessel joining
    });

    this.socket.on('vessel:left', (data: VesselLeftData) => {
      console.log(`Vessel left: ${data.id}`);
      // Handle vessel leaving
    });

    this.socket.on('environment:update', (data: EnvironmentUpdateData) => {
      this.handleEnvironmentUpdate(data);
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

  // Update vessel position with both parameters properly prefixed with underscore
  updateVesselPosition(_position: any, _vesselData: any) {
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
    console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);

    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnection attempt ${this.connectionAttempts}`);
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
}

// Export as singleton
export const socketManager = new SocketManager();

export default socketManager;
