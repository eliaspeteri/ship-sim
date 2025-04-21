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

// Initialize Prisma client
const prisma = new PrismaClient();

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
};

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  userId: string;
  username?: string;
  vesselType?: string;
  isAdmin?: boolean;
}

// Define data interface types
interface SimulationUpdateData {
  timestamp: number;
  vessels: Record<string, VesselState>;
  environment: EnvironmentState;
}

interface VesselState {
  id: string;
  position: { x: number; y: number; z: number };
  orientation: { heading: number; roll: number; pitch: number };
  velocity: { surge: number; sway: number; heave: number };
}

interface EnvironmentState {
  wind: {
    speed: number;
    direction: number;
    gusting?: boolean;
    gustFactor?: number;
  };
  current: {
    speed: number;
    direction: number;
    variability?: number;
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

// Weather system variables
let targetWeather: WeatherPattern | null = null;
let currentWeatherTick = 0;
const WEATHER_TRANSITION_TICKS = 600; // 60 seconds at 10 ticks/s
// Using underscore prefix to indicate intentionally unused variable for future use
let _weatherUpdateInterval: NodeJS.Timeout | null = null;
let randomWeatherEnabled = true;

// Global state to track connected vessels and environment
const globalState = {
  vessels: {} as Record<string, VesselState>,
  environment: getWeatherPattern('moderate') as EnvironmentState,
  lastUpdate: Date.now(),
  lastWeatherChange: Date.now(),
  weatherTransitionStart: Date.now(),
};

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
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

// Socket.IO connection handler
io.on('connection', socket => {
  const userId =
    socket.handshake.auth.userId ||
    `user_${Math.random().toString(36).substring(2, 9)}`;
  console.info(`Socket connected: ${userId}`);

  // Check if the user is an admin
  const isAdmin = socket.handshake.auth.isAdmin === true;

  // Set the socket data
  socket.data.userId = userId;
  socket.data.username = socket.handshake.auth.username || 'Anonymous';
  socket.data.vesselType = socket.handshake.auth.vesselType || 'default';
  socket.data.isAdmin = isAdmin;

  // Add user to global state
  globalState.vessels[userId] = {
    id: userId,
    position: { x: 0, y: 0, z: 0 },
    orientation: { heading: 0, roll: 0, pitch: 0 },
    velocity: { surge: 0, sway: 0, heave: 0 },
  };

  // Notify all clients about the new vessel
  io.emit('vessel:joined', {
    id: userId,
    name: socket.handshake.auth.username || 'Anonymous',
    vesselType: socket.handshake.auth.vesselType || 'default',
  });

  // Send current environment state to the new client
  socket.emit('environment:update', globalState.environment);

  // Listen for vessel updates from client
  socket.on('vessel:update', data => {
    if (data.id !== userId) {
      // Ignore updates for other vessels (security measure)
      return;
    }

    // Update vessel state
    if (data.position) globalState.vessels[userId].position = data.position;
    if (data.orientation)
      globalState.vessels[userId].orientation = data.orientation;
    if (data.velocity) globalState.vessels[userId].velocity = data.velocity;

    // Periodic state persistence to database (every 5 minutes)
    const now = Date.now();
    if (now - globalState.lastUpdate > 5 * 60 * 1000) {
      persistState();
      globalState.lastUpdate = now;
    }
  });

  // Listen for vessel control updates
  socket.on('vessel:control', data => {
    if (data.id !== userId) {
      // Ignore updates for other vessels (security measure)
      return;
    }

    // In a multi-user scenario, we'd broadcast this to other users
    // But for now, we just log it
    console.info(`Control update from ${userId}:`, data);
  });

  // Handle simulation state changes
  socket.on('simulation:state', data => {
    console.info(`Simulation state update from ${userId}:`, data);
    // In a full implementation, this would affect the global simulation
  });

  // Handle admin weather control
  socket.on('admin:weather', data => {
    // Only admins can change the weather
    if (!socket.data.isAdmin) {
      socket.emit('error', 'Not authorized to change weather');
      return;
    }

    console.info(`Weather update from admin ${userId}:`, data);

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
    } else {
      // Enable random weather
      randomWeatherEnabled = true;
      scheduleRandomWeather();
    }

    // Notify all clients about the weather change
    io.emit('chat:message', {
      userId: 'system',
      username: 'Weather System',
      message: `Weather is changing to ${targetWeather?.name || 'a random pattern'}`,
    });
  });

  // Handle chat messages
  socket.on(
    'chat:message',
    (
      data, // Broadcast chat message to all clients
    ) =>
      // Broadcast chat message to all clients
      io.emit('chat:message', {
        userId,
        username: socket.handshake.auth.username || 'Anonymous',
        message: data.message,
      }),
  );

  // Handle disconnection
  socket.on('disconnect', () => {
    console.info(`Socket disconnected: ${userId}`);

    // Remove user from global state
    delete globalState.vessels[userId];

    // Notify all clients about the vessel leaving
    io.emit('vessel:left', { id: userId });

    // Persist state on disconnection
    persistState();
  });
});

// Start the weather system
function startWeatherSystem() {
  // Schedule initial random weather if enabled
  if (randomWeatherEnabled) {
    scheduleRandomWeather();
  }

  // Update weather every 100ms (for smooth transitions)
  _weatherUpdateInterval = setInterval(() => updateWeather(), 100);
}

// Schedule a random weather change
function scheduleRandomWeather() {
  // Random interval between 5-15 minutes
  const delay = 5 * 60 * 1000 + Math.random() * 10 * 60 * 1000;

  setTimeout(() => {
    // Only change if random weather is still enabled
    if (randomWeatherEnabled) {
      console.info('Generating new random weather pattern');
      targetWeather = generateRandomWeather();
      startWeatherTransition();

      // Notify all clients
      io.emit('chat:message', {
        userId: 'system',
        username: 'Weather System',
        message: `Weather is changing to ${targetWeather.name}`,
      });

      // Schedule the next change
      scheduleRandomWeather();
    }
  }, delay);
}

// Start weather transition
function startWeatherTransition() {
  currentWeatherTick = 0;
  globalState.weatherTransitionStart = Date.now();
}

// Update weather (called every tick)
function updateWeather() {
  // Skip if no target weather or already at target
  if (!targetWeather || currentWeatherTick >= WEATHER_TRANSITION_TICKS) {
    return;
  }

  // Calculate progress (0-1)
  currentWeatherTick++;
  const progress = currentWeatherTick / WEATHER_TRANSITION_TICKS;

  // Transition to target weather
  const transitionedWeather = transitionWeather(
    globalState.environment as WeatherPattern,
    targetWeather,
    progress,
  );

  // Update global state
  globalState.environment = transitionedWeather;

  // Broadcast environment update to all clients
  io.emit('environment:update', globalState.environment);

  // If transition complete, clear target
  if (currentWeatherTick >= WEATHER_TRANSITION_TICKS) {
    console.info(`Weather transition to ${targetWeather.name} complete`);

    // If using random weather, schedule the next change
    if (randomWeatherEnabled) {
      globalState.lastWeatherChange = Date.now();
    }
  }
}

// Broadcast updates to all clients every 100ms
setInterval(() => {
  io.emit('simulation:update', {
    timestamp: Date.now(),
    vessels: globalState.vessels,
    environment: globalState.environment,
  });
}, 100);

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

// Start server
server.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`);
  // Start the weather system after server is running
  startWeatherSystem();
});

export default server;
