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
  refreshAuthToken,
  verifyAccessToken,
  invalidateRefreshToken,
  TokenPayload,
} from './authService';
import { authenticateRequest } from './middleware/authentication'; // Added: For /auth/status
import { socketHasPermission } from './middleware/authorization';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../types/socket.types';

// Environment settings
const PRODUCTION = process.env.NODE_ENV === 'production';
const COOKIE_DOMAIN =
  process.env.COOKIE_DOMAIN || (PRODUCTION ? undefined : 'localhost'); // Use undefined for default domain in prod
const SECURE_COOKIES = PRODUCTION; // Use secure cookies in production

type VesselMode = 'player' | 'ai';
interface VesselRecord {
  id: string;
  ownerId: string | null;
  crewIds: Set<string>;
  mode: VesselMode;
  position: { x: number; y: number; z: number };
  orientation: { heading: number; roll: number; pitch: number };
  velocity: { surge: number; sway: number; heave: number };
  properties: {
    mass: number;
    length: number;
    beam: number;
    draft: number;
  };
  controls: {
    throttle: number;
    rudderAngle: number;
  };
  lastUpdate: number;
}

// Application state
const globalState = {
  vessels: new Map<string, VesselRecord>(),
  userLastVessel: new Map<string, string>(),
  environment: {
    wind: {
      speed: 5,
      direction: 0,
      gustFactor: 1.5,
      gusting: false,
    },
    current: {
      speed: 0.5,
      direction: Math.PI / 4,
      variability: 0,
    },
    seaState: 3,
    timeOfDay: 12, // 12 PM
  },
};

const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

const clampHeading = (rad: number) => {
  let h = rad % (Math.PI * 2);
  if (h < 0) h += Math.PI * 2;
  return h;
};

const hasAdminRole = (socket: import('socket.io').Socket) =>
  (socket.data.roles || []).includes('admin') ||
  (socket.data.permissions || []).some(
    (p: { resource: string; action: string }) =>
      p.resource === '*' || p.action === '*',
  );

function ensureVesselForUser(userId: string, _username: string): VesselRecord {
  // Prefer last vessel if still present
  const lastId = globalState.userLastVessel.get(userId);
  if (lastId) {
    const lastVessel = globalState.vessels.get(lastId);
    if (lastVessel) {
      lastVessel.crewIds.add(userId);
      lastVessel.mode = 'player';
      return lastVessel;
    }
  }

  // Otherwise find any vessel where user is crew
  const existing = Array.from(globalState.vessels.values()).find(v =>
    v.crewIds.has(userId),
  );
  if (existing) {
    existing.crewIds.add(userId);
    existing.mode = 'player';
    globalState.userLastVessel.set(userId, existing.id);
    return existing;
  }

  const vessel: VesselRecord = {
    id: userId,
    ownerId: userId,
    crewIds: new Set([userId]),
    mode: 'player',
    position: { x: 0, y: 0, z: 0 },
    orientation: { heading: 0, roll: 0, pitch: 0 },
    velocity: { surge: 0, sway: 0, heave: 0 },
    properties: {
      mass: 1_000_000,
      length: 120,
      beam: 20,
      draft: 6,
    },
    controls: { throttle: 0, rudderAngle: 0 },
    lastUpdate: Date.now(),
  };
  globalState.vessels.set(vessel.id, vessel);
  globalState.userLastVessel.set(userId, vessel.id);
  return vessel;
}

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

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce(
    (acc, part) => {
      const [key, ...rest] = part.trim().split('=');
      acc[key] = decodeURIComponent(rest.join('='));
      return acc;
    },
    {} as Record<string, string>,
  );
}

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
    console.info(
      `Login attempt. ${JSON.stringify(
        {
          body: req.body,
          cookies: req.cookies,
          headers: req.headers,
          method: req.method,
          url: req.url,
        },
        null,
        2,
      )}`,
    );
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
io.use(async (socket, next) => {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie as string);
  const token =
    cookies['access_token'] ||
    (socket.handshake.auth &&
      (socket.handshake.auth as { token?: string; accessToken?: string })
        .token) ||
      (socket.handshake.auth &&
        (socket.handshake.auth as { token?: string; accessToken?: string })
          .accessToken);

    // Require verified access token to elevate beyond guest
    if (token) {
      const payload = (await verifyAccessToken(token)) as TokenPayload | null;
      if (payload) {
        socket.data = {
          userId: payload.userId,
          username: payload.username,
          roles: payload.roles,
          permissions: payload.permissions,
        };
        return next();
      }
      console.warn('Socket auth failed token verification; falling back to guest');
    }

    const tempUserId = `guest_${Math.random().toString(36).substring(2, 9)}`;
    socket.data = {
      userId: tempUserId,
      username: 'Guest',
      roles: ['guest'],
      permissions: [],
    };
    next();
  } catch (err) {
    console.error('Socket auth error:', err);
    next(err as Error);
  }
});

io.on('connection', socket => {
  const { userId, username, roles } = socket.data;
  const effectiveUserId =
    userId || `guest_${Math.random().toString(36).substring(2, 9)}`;
  const effectiveUsername = username || 'Guest';
  const isGuest = (roles || []).includes('guest');

  let vessel: VesselRecord | null = null;
  if (!isGuest) {
    vessel = ensureVesselForUser(effectiveUserId, effectiveUsername);
  }

  console.info(
    `Socket connected: ${effectiveUsername} (${effectiveUserId}) role=${isGuest ? 'guest' : 'player'}`,
  );

  // Notify others that this vessel is crewed
  if (vessel) {
    socket.broadcast.emit('vessel:joined', {
      userId: vessel.id,
      username: effectiveUsername,
      position: vessel.position,
      orientation: vessel.orientation,
    });
  }

  // Send initial snapshot
  socket.emit('simulation:update', {
    vessels: Object.fromEntries(
      Array.from(globalState.vessels.entries()).map(([id, v]) => [
        id,
        {
          id,
          position: v.position,
          orientation: v.orientation,
          velocity: v.velocity,
        },
      ]),
    ),
    environment: globalState.environment,
    timestamp: Date.now(),
  });

  // Handle vessel:update events (from client sim)
  socket.on('vessel:update', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    if (!currentUserId) return;
    if (isGuest) {
      console.info('Ignoring vessel:update from guest');
      return;
    }

    const vesselRecord = globalState.vessels.get(currentUserId);
    if (!vesselRecord) {
      console.warn('No vessel for user, creating on update', currentUserId);
      ensureVesselForUser(currentUserId, effectiveUsername);
    }
    const target = globalState.vessels.get(currentUserId);
    if (!target) return;

    if (data.position) {
      target.position = data.position;
    }
    if (data.orientation) {
      target.orientation = {
        ...target.orientation,
        ...data.orientation,
        heading: clampHeading(data.orientation.heading),
      };
    }
    if (data.velocity) {
      target.velocity = data.velocity;
    }
    target.lastUpdate = Date.now();

    socket.broadcast.emit('simulation:update', {
      vessels: {
        [currentUserId]: {
          id: target.id,
          position: target.position,
          orientation: target.orientation,
          velocity: target.velocity,
        },
      },
      partial: true,
      timestamp: target.lastUpdate,
    });

    console.info(
      `Update from ${currentUserId}: pos=(${target.position.x.toFixed(1)},${target.position.y.toFixed(1)}) heading=${target.orientation.heading.toFixed(2)}`,
    );
  });

  // Handle vessel:control events
  socket.on('vessel:control', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    if (!currentUserId) return;
    if (isGuest) {
      console.info('Ignoring vessel:control from guest');
      return;
    }

    const vesselRecord = globalState.vessels.get(currentUserId);
    if (!vesselRecord) {
      console.warn('No vessel for user, creating on control', currentUserId);
      ensureVesselForUser(currentUserId, effectiveUsername);
    }
    const target = globalState.vessels.get(currentUserId);
    if (!target) return;

    if (data.throttle !== undefined) {
      target.controls.throttle = clamp(data.throttle, -1, 1);
    }
    if (data.rudderAngle !== undefined) {
      target.controls.rudderAngle = clamp(data.rudderAngle, -0.6, 0.6);
    }
    target.lastUpdate = Date.now();

    console.info(
      `Control applied for ${currentUserId}: throttle=${target.controls.throttle.toFixed(2)} rudder=${target.controls.rudderAngle.toFixed(2)}`,
    );
  });

  // Handle simulation state changes
  socket.on('simulation:state', data => {
    if (!hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to control simulation');
      return;
    }
    console.info(`Simulation state update from ${socket.data.username}:`, data);
    // Future: apply global sim changes
  });

  // Handle admin weather control
  socket.on('admin:weather', data => {
    if (!hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to change weather');
      return;
    }

    console.info(`Weather update from ${socket.data.username}:`, data);

    if (data.pattern) {
      targetWeather = getWeatherPattern(data.pattern);
      transitionWeather(
        globalState.environment as WeatherPattern,
        targetWeather,
        0,
      );
      io.emit('environment:update', globalState.environment);
    } else if (data.coordinates) {
      targetWeather = getWeatherByCoordinates(
        data.coordinates.lat,
        data.coordinates.lng,
      );
      transitionWeather(
        globalState.environment as WeatherPattern,
        targetWeather,
        0,
      );
      io.emit('environment:update', globalState.environment);
    } else {
      if (weatherTransitionInterval) {
        clearInterval(weatherTransitionInterval);
        weatherTransitionInterval = null;
      }
      targetWeather = null;
      io.emit('environment:update', globalState.environment);
    }
  });

  // Handle chat messages
  socket.on('chat:message', data => {
    if (!socketHasPermission(socket, 'chat', 'send')) {
      socket.emit('error', 'Not authorized to send chat messages');
      return;
    }

    const message = (data.message || '').trim();
    if (!message || message.length > 500) return;

    io.emit('chat:message', {
      userId: socket.data.userId || 'unknown',
      username: socket.data.username || 'Guest',
      message,
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const currentUserId = socket.data.userId || effectiveUserId;
    const currentUsername = socket.data.username || effectiveUsername;
    console.info(`Socket disconnected: ${currentUsername} (${currentUserId})`);

    if (!isGuest) {
      const vesselRecord = currentUserId
        ? globalState.vessels.get(currentUserId)
        : undefined;
      if (vesselRecord) {
        vesselRecord.crewIds.delete(currentUserId);
        if (vesselRecord.crewIds.size === 0) {
          vesselRecord.mode = 'ai';
          // Keep last controls/state; AI logic will use it later
        }
      }
    }

    if (currentUserId) {
      socket.broadcast.emit('vessel:left', { userId: currentUserId });
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.info(`Server listening on port ${PORT}`);
});

// Broadcast authoritative snapshots at a throttled rate (5Hz)
const BROADCAST_INTERVAL_MS = 200;
setInterval(() => {
  if (!io) return;
  const snapshot = Object.fromEntries(
    Array.from(globalState.vessels.entries()).map(([id, v]) => [
      id,
      {
        id,
        position: v.position,
        orientation: v.orientation,
        velocity: v.velocity,
      },
    ]),
  );
  io.emit('simulation:update', {
    vessels: snapshot,
    environment: globalState.environment,
    timestamp: Date.now(),
  });
}, BROADCAST_INTERVAL_MS);

// Export the app and io for potential testing or extension
export { app, io };
