import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './api';
import {
  getWeatherPattern,
  transitionWeather,
  getWeatherByCoordinates,
  WeatherPattern,
} from './weatherSystem';
import {
  authenticateUser,
  registerAdminUser,
  UserAuth,
  refreshAuthToken,
  verifyAccessToken,
  invalidateRefreshToken, // Added: For logout
} from './authService';
import { authenticateRequest } from './middleware/authentication'; // Added: For /auth/status
import { socketHasPermission } from './middleware/authorization';
import { SimpleVesselState } from '../types/vessel.types';

// Environment settings
const PRODUCTION = process.env.NODE_ENV === 'production';
const COOKIE_DOMAIN =
  process.env.COOKIE_DOMAIN || (PRODUCTION ? undefined : 'localhost'); // Use undefined for default domain in prod
const SECURE_COOKIES = PRODUCTION; // Use secure cookies in production

// Type definitions for Socket.IO communication
interface SimulationUpdateData {
  vessels: Record<string, SimpleVesselState>;
  environment?: EnvironmentState;
  partial?: boolean;
  timestamp?: number;
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
      id: string; // Add id field to satisfy SimpleVesselState interface
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

let weatherTransitionInterval: NodeJS.Timeout | null = null;
let targetWeather: WeatherPattern | null = null;

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: PRODUCTION ? process.env.FRONTEND_URL || true : true, // Allow specific origin in prod
    credentials: true, // Crucial for cookies
  }),
);
app.use(express.json());
app.use(cookieParser()); // Crucial for reading cookies

// Auth cookie options
const accessTokenCookieOptions = {
  httpOnly: true, // Prevent client-side JS access
  secure: SECURE_COOKIES, // Send only over HTTPS in production
  sameSite: PRODUCTION ? 'strict' : 'lax', // CSRF protection
  domain: COOKIE_DOMAIN, // Set domain appropriately
  maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
  path: '/', // Accessible for all API routes
} as const;

const refreshTokenCookieOptions = {
  ...accessTokenCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/auth/refresh', // Only send for the refresh endpoint
} as const;

// --- Authentication Routes ---

// GET /auth/status - Check authentication status via access token cookie
app.get('/auth/status', authenticateRequest, (req: Request, res: Response) => {
  // authenticateRequest middleware attaches user data if token is valid
  if (req.user) {
    res.json({
      success: true,
      username: req.user.username,
      roles: req.user.roles,
      // Optionally send expiry if needed by client for UI hints
      // expiresIn: req.user.exp * 1000 // Convert seconds to milliseconds
    });
  } else {
    res.json({ success: false });
  }
});

// POST /auth/refresh - Refresh access token using refresh token cookie
app.post('/auth/refresh', (req, res, next) => {
  (async () => {
    const currentRefreshToken = req.cookies['refresh_token'];

    if (!currentRefreshToken) {
      console.warn('Refresh attempt without refresh token cookie.');
      return res
        .status(401)
        .json({ success: false, error: 'No refresh token provided' });
    }

    try {
      // Verify the refresh token AND get new tokens
      const newTokens = await refreshAuthToken(currentRefreshToken);

      if (!newTokens) {
        console.warn('Refresh attempt with invalid/expired refresh token.');
        // Clear potentially invalid cookies if refresh fails
        res.clearCookie('access_token', {
          ...accessTokenCookieOptions,
          path: '/',
        });
        res.clearCookie('refresh_token', {
          ...refreshTokenCookieOptions,
          path: '/auth/refresh',
        });
        return res
          .status(403)
          .json({ success: false, error: 'Invalid or expired refresh token' });
      }

      // Verify the *new* access token to get user data (needed for response)
      const tokenPayload = await verifyAccessToken(newTokens.accessToken);
      if (!tokenPayload) {
        // This case should ideally not happen if refreshAuthToken is correct
        console.error(
          'Failed to verify newly issued access token during refresh.',
        );
        res.clearCookie('access_token', {
          ...accessTokenCookieOptions,
          path: '/',
        });
        res.clearCookie('refresh_token', {
          ...refreshTokenCookieOptions,
          path: '/auth/refresh',
        });
        return res.status(500).json({
          success: false,
          error: 'Token verification failed after refresh',
        });
      }

      // Set the new tokens as HttpOnly cookies
      res.cookie(
        'access_token',
        newTokens.accessToken,
        accessTokenCookieOptions,
      );
      // Note: Refresh token might be rotated, so we set it again
      res.cookie(
        'refresh_token',
        newTokens.refreshToken,
        refreshTokenCookieOptions,
      );

      console.info(`Token refreshed for user: ${tokenPayload.username}`);
      // Return success and user info (NO TOKENS in body)
      return res.json({
        success: true,
        username: tokenPayload.username,
        roles: tokenPayload.roles,
        // Optionally send new expiry
        // expiresIn: tokenPayload.exp * 1000
      });
    } catch (error) {
      console.error('Error during token refresh:', error);
      // Clear potentially invalid cookies on error
      res.clearCookie('access_token', {
        ...accessTokenCookieOptions,
        path: '/',
      });
      res.clearCookie('refresh_token', {
        ...refreshTokenCookieOptions,
        path: '/auth/refresh',
      });
      return res.status(500).json({
        success: false,
        error: 'Internal server error during token refresh',
      });
    }
  })().catch(next);
});

// POST /auth/login - Authenticate user and set cookies
app.post('/auth/login', (req: Request, res: Response, next) => {
  (async () => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required',
        });
      }

      // Authenticate user (gets user data and tokens)
      const authResult = await authenticateUser(username, password);

      if (!authResult || !authResult.token || !authResult.refreshToken) {
        return res
          .status(401)
          .json({ success: false, error: 'Invalid credentials' });
      }

      // Set HttpOnly cookies
      res.cookie('access_token', authResult.token, accessTokenCookieOptions);
      res.cookie(
        'refresh_token',
        authResult.refreshToken,
        refreshTokenCookieOptions,
      );

      console.info(`User logged in: ${authResult.username}`);
      // Return success and user info (NO TOKENS in body)
      return res.json({
        success: true,
        username: authResult.username,
        roles: authResult.roles,
        // Optionally send expiry
        // expiresIn: authResult.expiresIn // Assuming authService provides this
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ success: false, error: 'Login failed' });
    }
  })().catch(next);
});

// POST /auth/register - Register user and set cookies
app.post('/auth/register', (req: Request, res: Response, next) => {
  (async () => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required',
        });
      }

      // Register new user (gets user data and tokens)
      const authResult = await registerAdminUser(username, password);

      if (!authResult || !authResult.token || !authResult.refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Registration failed (username might be taken)',
        });
      }

      // Set HttpOnly cookies
      res.cookie('access_token', authResult.token, accessTokenCookieOptions);
      res.cookie(
        'refresh_token',
        authResult.refreshToken,
        refreshTokenCookieOptions,
      );

      console.info(`User registered: ${authResult.username}`);
      // Return success and user info (NO TOKENS in body)
      return res.json({
        success: true,
        username: authResult.username,
        roles: authResult.roles,
        // Optionally send expiry
        // expiresIn: authResult.expiresIn
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res
        .status(500)
        .json({ success: false, error: 'Registration failed' });
    }
  })().catch(next);
});

// POST /auth/logout - Clear cookies and invalidate refresh token
app.post('/auth/logout', async (req: Request, res: Response) => {
  const currentRefreshToken = req.cookies['refresh_token'];

  // Attempt to invalidate the refresh token on the server-side
  if (currentRefreshToken) {
    try {
      await invalidateRefreshToken(currentRefreshToken);
      console.info('Refresh token invalidated on logout.');
    } catch (error) {
      console.error('Error invalidating refresh token during logout:', error);
      // Proceed with clearing cookies even if invalidation fails
    }
  }

  // Clear auth cookies - ensure options match how they were set
  res.clearCookie('access_token', { ...accessTokenCookieOptions, path: '/' });
  res.clearCookie('refresh_token', {
    ...refreshTokenCookieOptions,
    path: '/auth/refresh',
  });

  console.info('User logged out.');
  res.json({ success: true, message: 'Logged out successfully' });
});

// --- API Routes ---
app.use('/api', apiRoutes); // These routes should use authenticateRequest middleware internally or apply it

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData // SocketData might need adjustment if not storing auth info
>(server, {
  cors: {
    origin: PRODUCTION ? process.env.FRONTEND_URL || true : true,
    credentials: true, // Allow cookies for socket connection if needed (less common now)
  },
  // Consider cookie parsing for sockets if needed, requires extra setup
  // cookie: {
  //   name: "io",
  //   httpOnly: true,
  //   sameSite: "strict"
  // }
});

// Handle Socket.IO connections
io.on('connection', async socket => {
  // No direct authentication via socket handshake token anymore.
  // We associate the socket with a user based on their authenticated HTTP session
  // which is implicitly handled by the browser sending cookies with subsequent requests.
  // If specific socket events need auth, they might need to re-verify via a REST call
  // or a dedicated 'authenticate_socket' event after connection.
  // For now, we'll assign a temporary ID and guest role.
  // User info will be primarily managed via HTTP state.

  const tempUserId = `guest_${Math.random().toString(36).substring(2, 9)}`;
  const tempUsername = 'Guest';
  socket.data = {
    userId: tempUserId,
    username: tempUsername,
    roles: ['guest'],
    permissions: [
      /* default guest permissions */
    ],
  };

  console.info(`Socket connected: ${tempUsername} (${tempUserId})`);

  // Add vessel to global state if it doesn't exist (using tempUserId)
  if (!globalState.vessels[tempUserId]) {
    // Guests get a default state, not loaded from DB
    globalState.vessels[tempUserId] = {
      id: tempUserId,
      position: { x: 0, y: 0, z: 0 },
      orientation: { heading: 0, roll: 0, pitch: 0 },
      velocity: { surge: 0, sway: 0, heave: 0 },
      throttle: 0,
      rudderAngle: 0,
    };
  }

  // Notify other clients of new vessel (Guest)
  socket.broadcast.emit('vessel:joined', {
    userId: tempUserId,
    username: tempUsername,
    position: globalState.vessels[tempUserId].position,
    orientation: globalState.vessels[tempUserId].orientation,
  });

  // Send initial state to new client
  socket.emit('simulation:update', {
    vessels: globalState.vessels, // Send all vessels, including the new guest
    environment: globalState.environment,
  });

  // Handle vessel:update events
  socket.on('vessel:update', data => {
    // Re-evaluate permission check: Does a guest update their own state?
    // Or does this require an authenticated user context?
    // For now, assume guest can update their temporary vessel state.
    const currentUserId = socket.data.userId; // Use the ID from socket data
    if (!currentUserId) return; // Should not happen

    // Update global state for this socket's user ID
    if (globalState.vessels[currentUserId]) {
      if (data.position)
        globalState.vessels[currentUserId].position = data.position;
      if (data.orientation)
        globalState.vessels[currentUserId].orientation = data.orientation;
      if (data.velocity)
        globalState.vessels[currentUserId].velocity = data.velocity;

      // Broadcast update to other clients (except sender)
      socket.broadcast.emit('simulation:update', {
        vessels: { [currentUserId]: globalState.vessels[currentUserId] },
        partial: true,
      });
    }
  });

  // Handle vessel:control events
  socket.on('vessel:control', data => {
    // Similar permission consideration as vessel:update
    const currentUserId = socket.data.userId;
    if (!currentUserId) return;

    // Update vessel control state
    if (globalState.vessels[currentUserId]) {
      if (data.throttle !== undefined)
        globalState.vessels[currentUserId].throttle = data.throttle;
      if (data.rudderAngle !== undefined)
        globalState.vessels[currentUserId].rudderAngle = data.rudderAngle;

      // Log control update
      console.info(
        `Control update from ${socket.data.username} (${currentUserId}):`,
        data,
      );
      // Broadcast if needed in multi-user scenario
    }
  });

  // Handle simulation state changes
  socket.on('simulation:state', data => {
    // This likely requires admin privileges. The check needs context.
    // A simple check on socket.data.roles might be insufficient if roles
    // aren't updated after HTTP login. Consider fetching user roles via API if needed.
    if (!socketHasPermission(socket, 'simulation', 'control')) {
      // Check might need adjustment
      socket.emit('error', 'Not authorized to control simulation');
      return;
    }
    console.info(`Simulation state update from ${socket.data.username}:`, data);
    // Apply global simulation change
  });

  // Handle admin weather control
  socket.on('admin:weather', data => {
    // Similar permission check considerations as simulation:state
    if (!socketHasPermission(socket, 'environment', 'manage')) {
      // Check might need adjustment
      socket.emit('error', 'Not authorized to change weather');
      return;
    }

    console.info(`Weather update from ${socket.data.username}:`, data);

    if (data.pattern) {
      targetWeather = getWeatherPattern(data.pattern);
      // Start weather transition from current to target with progress 0
      transitionWeather(
        globalState.environment as WeatherPattern,
        targetWeather,
        0,
      );
    } else if (data.coordinates) {
      targetWeather = getWeatherByCoordinates(
        data.coordinates.lat,
        data.coordinates.lng,
      );
      // Start weather transition from current to target with progress 0
      transitionWeather(
        globalState.environment as WeatherPattern,
        targetWeather,
        0,
      );
    } else {
      // Default to enabling random weather if no specific pattern/coords
      if (weatherTransitionInterval) {
        clearInterval(weatherTransitionInterval);
        weatherTransitionInterval = null;
      }
      targetWeather = null;
      console.info('Random weather enabled.');
    }
  });

  // Handle chat messages
  socket.on('chat:message', data => {
    // Permission check - guests might be allowed to chat
    if (!socketHasPermission(socket, 'chat', 'send')) {
      // Check might need adjustment
      socket.emit('error', 'Not authorized to send chat messages');
      return;
    }

    const message = data.message.trim();
    if (!message || message.length > 500) return; // Basic validation

    // Broadcast message with user info from socket.data
    io.emit('chat:message', {
      userId: socket.data.userId || 'unknown',
      username: socket.data.username || 'Guest',
      message,
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const currentUserId = socket.data.userId;
    const currentUsername = socket.data.username;
    console.info(`Socket disconnected: ${currentUsername} (${currentUserId})`);

    // Remove guest vessel state on disconnect
    if (currentUserId && currentUserId.startsWith('guest_')) {
      delete globalState.vessels[currentUserId];
      console.info(`Removed guest vessel state for ${currentUserId}`);
    }
    // For authenticated users, state might persist based on DB logic

    // Notify other clients of vessel departure
    if (currentUserId) {
      socket.broadcast.emit('vessel:left', { userId: currentUserId });
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.info(`Server listening on port ${PORT}`);
});

// Export the app and io for potential testing or extension
export { app, io };
