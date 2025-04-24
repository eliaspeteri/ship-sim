import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import apiRoutes from './api';
import {
  generateRandomWeather,
  getWeatherPattern,
  transitionWeather,
  getWeatherByCoordinates,
  WeatherPattern,
} from './weatherSystem';
import {
  verifySocketAuth,
  authenticateUser,
  registerAdminUser,
  UserAuth,
} from './authService';
import { socketHasPermission } from './middleware/authorization';

// Initialize Prisma client
const prisma = new PrismaClient();

// Type definitions for Socket.IO communication
interface SimulationUpdateData {
  vessels: Record<string, VesselState>;
  environment?: EnvironmentState;
  partial?: boolean;
  timestamp?: number;
}

interface VesselState {
  position: { x: number; y: number; z: number };
  orientation: { heading: number; roll: number; pitch: number };
  velocity: { surge: number; sway: number; heave: number };
  throttle: number;
  rudderAngle: number;
}

interface VesselJoinedData {
  userId: string;
  username: string;
  position: { x: number; y: number; z: number };
  orientation: { heading: number; roll: number; pitch: number };
}

interface VesselLeftData {
  userId: string;
}

interface VesselUpdateData {
  position?: { x: number; y: number; z: number };
  orientation?: { heading: number; roll: number; pitch: number };
  velocity?: { surge: number; sway: number; heave: number };
}

interface VesselControlData {
  throttle?: number;
  rudderAngle?: number;
}

interface EnvironmentState {
  wind: {
    speed: number;
    direction: number;
  };
  current: {
    speed: number;
    direction: number;
  };
  seaState: number;
}

// Type definitions for Socket.IO
type ServerToClientEvents = {
  'simulation:update': (data: SimulationUpdateData) => void;
  'vessel:joined': (data: VesselJoinedData) => void;
  'vessel:left': (data: VesselLeftData) => void;
  'environment:update': (data: EnvironmentState) => void;
  'chat:message': (data: {
    userId: string;
    username: string;
    message: string;
  }) => void;
  error: (error: string) => void;
};

type ClientToServerEvents = {
  'vessel:update': (data: VesselUpdateData) => void;
  'vessel:control': (data: VesselControlData) => void;
  'simulation:state': (data: { isRunning: boolean }) => void;
  'admin:weather': (data: {
    pattern?: string;
    coordinates?: { lat: number; lng: number };
  }) => void;
  'chat:message': (data: { message: string }) => void;
  'auth:login': (
    data: { username: string; password: string },
    callback: (response: {
      success: boolean;
      token?: string;
      username?: string;
      roles?: string[];
      error?: string;
    }) => void,
  ) => void;
  'auth:register': (
    data: { username: string; password: string },
    callback: (response: {
      success: boolean;
      token?: string;
      username?: string;
      roles?: string[];
      error?: string;
    }) => void,
  ) => void;
  'auth:logout': () => void;
};

// Define Socket.IO interface
interface InterServerEvents {
  // Custom inter-server events would go here if needed
  _placeholder?: boolean; // Placeholder to make TypeScript happy
}

interface SocketData extends UserAuth {
  // Additional socket data properties would go here if needed
  _socketSpecific?: boolean; // Placeholder to make TypeScript happy
}

// Application state
const globalState = {
  vessels: {} as Record<
    string,
    {
      position: { x: number; y: number; z: number };
      orientation: { heading: number; roll: number; pitch: number };
      velocity: { surge: number; sway: number; heave: number };
      throttle: number;
      rudderAngle: number;
    }
  >,
  environment: {
    wind: {
      speed: 5,
      direction: 0,
    },
    current: {
      speed: 0.5,
      direction: Math.PI / 4,
    },
    seaState: 3,
  },
};

// Weather system state
let weatherUpdateInterval: NodeJS.Timeout | null = null;
let randomWeatherEnabled = false;
let weatherTransitionInterval: NodeJS.Timeout | null = null;
let targetWeather: WeatherPattern | null = null;

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Handle Socket.IO connections
io.on('connection', async socket => {
  try {
    // Authenticate socket connection
    const authData = socket.handshake.auth;
    const userData = await verifySocketAuth(authData);

    if (!userData) {
      socket.disconnect();
      return;
    }

    // Store user data in socket
    const { userId, username, roles, permissions } = userData;
    socket.data = { userId, username, roles, permissions };

    console.info(
      `User connected: ${username} (${userId}) with roles: ${roles.join(', ')}`,
    );

    // Add vessel to global state if it doesn't exist
    if (!globalState.vessels[userId]) {
      // Try to load vessel state from database
      try {
        const savedState = await prisma.vesselState.findUnique({
          where: { userId },
        });

        if (savedState) {
          // Restore vessel state from database
          globalState.vessels[userId] = {
            position: {
              x: savedState.positionX,
              y: savedState.positionY,
              z: savedState.positionZ,
            },
            orientation: {
              heading: savedState.heading,
              roll: savedState.roll,
              pitch: savedState.pitch,
            },
            velocity: {
              surge: savedState.velocityX,
              sway: savedState.velocityY,
              heave: savedState.velocityZ,
            },
            throttle: savedState.throttle,
            rudderAngle: savedState.rudderAngle,
          };
        } else {
          // Create new vessel state
          globalState.vessels[userId] = {
            position: { x: 0, y: 0, z: 0 },
            orientation: { heading: 0, roll: 0, pitch: 0 },
            velocity: { surge: 0, sway: 0, heave: 0 },
            throttle: 0,
            rudderAngle: 0,
          };
        }
      } catch (error) {
        console.error(`Error loading vessel state for ${userId}:`, error);
        // Create default vessel state
        globalState.vessels[userId] = {
          position: { x: 0, y: 0, z: 0 },
          orientation: { heading: 0, roll: 0, pitch: 0 },
          velocity: { surge: 0, sway: 0, heave: 0 },
          throttle: 0,
          rudderAngle: 0,
        };
      }
    }

    // Notify other clients of new vessel
    socket.broadcast.emit('vessel:joined', {
      userId,
      username,
      position: globalState.vessels[userId].position,
      orientation: globalState.vessels[userId].orientation,
    });

    // Send initial state to new client
    socket.emit('simulation:update', {
      vessels: globalState.vessels,
      environment: globalState.environment,
    });

    // Handle vessel:update events
    socket.on('vessel:update', data => {
      if (!socketHasPermission(socket, 'vessel', 'update')) {
        socket.emit('error', 'Not authorized to update vessel state');
        return;
      }

      // Update global state
      if (globalState.vessels[userId]) {
        if (data.position) globalState.vessels[userId].position = data.position;
        if (data.orientation)
          globalState.vessels[userId].orientation = data.orientation;
        if (data.velocity) globalState.vessels[userId].velocity = data.velocity;
      }

      // Broadcast update to other clients (except sender)
      socket.broadcast.emit('simulation:update', {
        vessels: { [userId]: globalState.vessels[userId] },
        partial: true,
      });
    });

    // Handle vessel:control events
    socket.on('vessel:control', data => {
      if (!socketHasPermission(socket, 'vessel', 'control')) {
        socket.emit('error', 'Not authorized to control vessel');
        return;
      }

      // Update vessel control state
      if (globalState.vessels[userId]) {
        if (data.throttle !== undefined)
          globalState.vessels[userId].throttle = data.throttle;
        if (data.rudderAngle !== undefined)
          globalState.vessels[userId].rudderAngle = data.rudderAngle;
      }

      // In a multi-user scenario, we'd broadcast this to other users
      // But for now, we just log it
      console.info(`Control update from ${userId}:`, data);
    });

    // Handle simulation state changes
    socket.on('simulation:state', data => {
      if (!socketHasPermission(socket, 'simulation', 'control')) {
        socket.emit('error', 'Not authorized to control simulation');
        return;
      }

      console.info(`Simulation state update from ${userId}:`, data);
      // In a full implementation, this would affect the global simulation
    });

    // Handle admin weather control
    socket.on('admin:weather', data => {
      // Only users with environment:manage permission can change the weather
      if (!socketHasPermission(socket, 'environment', 'manage')) {
        socket.emit('error', 'Not authorized to change weather');
        return;
      }

      console.info(`Weather update from ${username}:`, data);

      if (data.pattern) {
        // Set specific weather pattern
        targetWeather = getWeatherPattern(data.pattern);
        startWeatherTransition();
        randomWeatherEnabled = false;
      } else if (data.coordinates) {
        // Get weather based on Earth coordinates
        const { lat, lng } = data.coordinates;
        targetWeather = getWeatherByCoordinates(lat, lng);
        startWeatherTransition();
        randomWeatherEnabled = false;
      }
    });

    // Handle chat messages
    socket.on('chat:message', data => {
      if (!socketHasPermission(socket, 'chat', 'send')) {
        socket.emit('error', 'Not authorized to send chat messages');
        return;
      }

      const message = data.message.trim();

      // Prevent empty or overly long messages
      if (!message || message.length > 500) {
        return;
      }

      // Broadcast message to all clients
      io.emit('chat:message', {
        userId,
        username,
        message,
      });
    });

    // Handle authentication requests
    socket.on('auth:login', async (data, callback) => {
      try {
        const { username, password } = data;

        // Authenticate user
        const authResult = await authenticateUser(username, password);

        if (!authResult) {
          callback({ success: false, error: 'Invalid username or password' });
          return;
        }

        // Update socket data with authenticated user info
        socket.data = authResult;

        // Return success with token and user info
        callback({
          success: true,
          token: authResult.token,
          username: authResult.username,
          roles: authResult.roles,
        });

        console.info(
          `User authenticated: ${authResult.username} (Roles: ${authResult.roles.join(', ')})`,
        );
      } catch (error) {
        console.error('Authentication error:', error);
        callback({ success: false, error: 'Authentication failed' });
      }
    });

    // Handle registration request (for testing only - would be restricted in production)
    socket.on('auth:register', async (data, callback) => {
      try {
        const { username, password } = data;

        // Register a new admin user
        const authResult = await registerAdminUser(username, password);

        if (!authResult) {
          callback({
            success: false,
            error: 'Registration failed. Username may be taken.',
          });
          return;
        }

        // Update socket data with authenticated user info
        socket.data = authResult;

        // Return success with token and user info
        callback({
          success: true,
          token: authResult.token,
          username: authResult.username,
          roles: authResult.roles,
        });

        console.info(`Admin user registered: ${authResult.username}`);
      } catch (error) {
        console.error('Registration error:', error);
        callback({ success: false, error: 'Registration failed' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.info(`User disconnected: ${username} (${userId})`);

      // Notify other clients of vessel departure
      socket.broadcast.emit('vessel:left', { userId });

      // In a production app, we'd persist the vessel state here
      // but keep it in memory for some time in case they reconnect
    });
  } catch (error) {
    console.error('Error handling socket connection:', error);
    socket.disconnect();
  }
});

// Start the server
server.listen(PORT, () => {
  console.info(`Server listening on port ${PORT}`);

  // Start simulation and persistence loops
  startSimulation();
});

// Start weather simulation (simplified)
function startSimulation() {
  // Update weather periodically (every 30 seconds)
  weatherUpdateInterval = setInterval(() => {
    if (randomWeatherEnabled) {
      // Generate random weather changes
      const weather = generateRandomWeather();
      updateWeather(weather);
    }
  }, 30000);

  // Persist state periodically (every 5 minutes)
  setInterval(
    () => {
      persistState();
    },
    5 * 60 * 1000,
  );

  console.info('Simulation started');
}

// Update global weather state and broadcast changes
function updateWeather(weather: WeatherPattern) {
  globalState.environment = {
    wind: {
      speed: weather.wind.speed,
      direction: weather.wind.direction,
    },
    current: {
      speed: weather.current.speed,
      direction: weather.current.direction,
    },
    seaState: weather.seaState,
  };

  io.emit('environment:update', globalState.environment);
}

// Start transition to target weather
function startWeatherTransition() {
  if (!targetWeather) return;

  if (weatherTransitionInterval) {
    clearInterval(weatherTransitionInterval);
  }

  const currentWeather = {
    name: 'Current Weather',
    wind: {
      speed: globalState.environment.wind.speed,
      direction: globalState.environment.wind.direction,
      gusting: false,
      gustFactor: 1.0,
    },
    current: {
      speed: globalState.environment.current.speed,
      direction: globalState.environment.current.direction,
      variability: 0.1,
    },
    seaState: globalState.environment.seaState,
    waterDepth: 100,
    waveHeight: 0.5,
    waveDirection: 0,
    waveLength: 50,
    visibility: 10,
    timeOfDay: 12,
    precipitation: 'none' as const,
    precipitationIntensity: 0,
  };

  // Transition over 2 minutes with updates every 5 seconds
  let progress = 0;
  weatherTransitionInterval = setInterval(() => {
    progress += 0.1; // 10% each time
    if (progress >= 1) {
      // Final update with exact target values
      updateWeather(targetWeather!);
      clearInterval(weatherTransitionInterval!);
      weatherTransitionInterval = null;
      return;
    }

    // Calculate intermediate values
    const intermediateWeather = transitionWeather(
      currentWeather,
      targetWeather!,
      progress,
    );
    updateWeather(intermediateWeather);
  }, 5000);
}

// Persist state to database
async function persistState() {
  try {
    // Save vessel states
    for (const [userId, vessel] of Object.entries(globalState.vessels)) {
      await prisma.vesselState.upsert({
        where: { userId },
        update: {
          positionX: vessel.position.x,
          positionY: vessel.position.y,
          positionZ: vessel.position.z,
          heading: vessel.orientation.heading,
          roll: vessel.orientation.roll,
          pitch: vessel.orientation.pitch,
          velocityX: vessel.velocity.surge,
          velocityY: vessel.velocity.sway,
          velocityZ: vessel.velocity.heave,
          updatedAt: new Date(),
        },
        create: {
          userId,
          positionX: vessel.position.x,
          positionY: vessel.position.y,
          positionZ: vessel.position.z,
          heading: vessel.orientation.heading,
          roll: vessel.orientation.roll,
          pitch: vessel.orientation.pitch,
          velocityX: vessel.velocity.surge,
          velocityY: vessel.velocity.sway,
          velocityZ: vessel.velocity.heave,
        },
      });
    }

    // Save environment state
    await prisma.environmentState.upsert({
      where: { id: 1 },
      update: {
        windSpeed: globalState.environment.wind.speed,
        windDirection: globalState.environment.wind.direction,
        currentSpeed: globalState.environment.current.speed,
        currentDirection: globalState.environment.current.direction,
        seaState: globalState.environment.seaState,
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        windSpeed: globalState.environment.wind.speed,
        windDirection: globalState.environment.wind.direction,
        currentSpeed: globalState.environment.current.speed,
        currentDirection: globalState.environment.current.direction,
        seaState: globalState.environment.seaState,
      },
    });

    console.info('State persisted to database');
  } catch (error) {
    console.error('Failed to persist state:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.info('Shutting down server...');

  // Clear intervals
  if (weatherUpdateInterval) clearInterval(weatherUpdateInterval);
  if (weatherTransitionInterval) clearInterval(weatherTransitionInterval);

  // Persist final state
  await persistState();

  // Close database connection
  await prisma.$disconnect();

  // Exit process
  process.exit(0);
});
