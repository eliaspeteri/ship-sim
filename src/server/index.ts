import 'dotenv/config';
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './api';
import jwt from 'jsonwebtoken';
import {
  getWeatherPattern,
  transitionWeather,
  getWeatherByCoordinates,
  WeatherPattern,
} from './weatherSystem';
import { socketHasPermission } from './middleware/authorization';
import { Role, expandRoles, permissionsForRoles } from './roles';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../types/socket.types';
import {
  SimpleVesselState,
  VesselControls,
  VesselPose,
  VesselState,
  VesselVelocity,
} from '../types/vessel.types';
import { latLonToXY, xyToLatLon } from '../lib/geo';
import { prisma } from '../lib/prisma';
import { RUDDER_STALL_ANGLE_RAD } from '../constants/vessel';

// Environment settings
const PRODUCTION = process.env.NODE_ENV === 'production';
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '';
const ADMIN_USERS = (process.env.ADMIN_USERS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const PERF_LOGGING_ENABLED = process.env.PERF_LOGGING === 'true' || !PRODUCTION;
const API_SLOW_WARN_MS = 200;
const BROADCAST_DRIFT_WARN_FACTOR = 1.5;
const MIN_PERSIST_INTERVAL_MS = 1000; // Throttle DB writes per vessel

type VesselMode = 'player' | 'ai';
type CoreVesselProperties = Pick<
  VesselState['properties'],
  'mass' | 'length' | 'beam' | 'draft'
>;
interface VesselRecord {
  id: string;
  ownerId: string | null;
  crewIds: Set<string>;
  mode: VesselMode;
  desiredMode: VesselMode;
  yawRate?: number;
  position: VesselPose['position'];
  orientation: VesselPose['orientation'];
  velocity: VesselVelocity;
  properties: CoreVesselProperties;
  controls: Pick<
    VesselControls,
    'throttle' | 'rudderAngle' | 'ballast' | 'bowThruster'
  >;
  lastUpdate: number;
}

const vesselPersistAt = new Map<string, number>();

async function persistVesselToDb(vessel: VesselRecord) {
  const now = Date.now();
  const lastPersist = vesselPersistAt.get(vessel.id) || 0;
  if (now - lastPersist < MIN_PERSIST_INTERVAL_MS) return;
  vesselPersistAt.set(vessel.id, now);

  const pos = withLatLon(vessel.position);
  try {
    await prisma.vessel.upsert({
      where: { id: vessel.id },
      update: {
        ownerId: vessel.ownerId ?? null,
        mode: vessel.mode,
        desiredMode: vessel.desiredMode || 'player',
        desiredMode: vessel.desiredMode || 'player',
        lat: pos.lat ?? 0,
        lon: pos.lon ?? 0,
        z: pos.z,
        heading: vessel.orientation.heading,
        roll: vessel.orientation.roll,
        pitch: vessel.orientation.pitch,
        surge: vessel.velocity.surge,
        sway: vessel.velocity.sway,
        heave: vessel.velocity.heave,
        yawRate: vessel.yawRate ?? 0,
        throttle: vessel.controls.throttle,
        rudderAngle: vessel.controls.rudderAngle,
        ballast: vessel.controls.ballast ?? 0.5,
        bowThruster: vessel.controls.bowThruster ?? 0,
        mass: vessel.properties.mass,
        length: vessel.properties.length,
        beam: vessel.properties.beam,
        draft: vessel.properties.draft,
        lastUpdate: new Date(vessel.lastUpdate),
        isAi: vessel.mode === 'ai',
      },
      create: {
        id: vessel.id,
        ownerId: vessel.ownerId ?? null,
        mode: vessel.mode,
        desiredMode: vessel.desiredMode || 'player',
        desiredMode: vessel.desiredMode || 'player',
        lat: pos.lat ?? 0,
        lon: pos.lon ?? 0,
        z: pos.z,
        heading: vessel.orientation.heading,
        roll: vessel.orientation.roll,
        pitch: vessel.orientation.pitch,
        surge: vessel.velocity.surge,
        sway: vessel.velocity.sway,
        heave: vessel.velocity.heave,
        yawRate: vessel.yawRate ?? 0,
        throttle: vessel.controls.throttle,
        rudderAngle: vessel.controls.rudderAngle,
        ballast: vessel.controls.ballast ?? 0.5,
        bowThruster: vessel.controls.bowThruster ?? 0,
        mass: vessel.properties.mass,
        length: vessel.properties.length,
        beam: vessel.properties.beam,
        draft: vessel.properties.draft,
        lastUpdate: new Date(vessel.lastUpdate),
        isAi: vessel.mode === 'ai',
      },
    });
  } catch (err) {
    console.error(`Failed to persist vessel ${vessel.id}`, err);
  }
}

async function loadVesselsFromDb() {
  const rows = await prisma.vessel.findMany();
  if (!rows.length) return;

  rows.forEach(row => {
    const xy = latLonToXY({ lat: row.lat, lon: row.lon });
    const vessel: VesselRecord = {
      id: row.id,
      ownerId: row.ownerId,
      crewIds: new Set<string>(),
      mode: (row.mode as VesselMode) || 'ai',
      desiredMode: (row.desiredMode as VesselMode) || 'player',
      position: {
        x: xy.x,
        y: xy.y,
        z: row.z,
        lat: row.lat,
        lon: row.lon,
      },
      orientation: {
        heading: row.heading,
        roll: row.roll,
        pitch: row.pitch,
      },
      velocity: {
        surge: row.surge,
        sway: row.sway,
        heave: row.heave,
      },
      yawRate: row.yawRate ?? 0,
      properties: {
        mass: row.mass,
        length: row.length,
        beam: row.beam,
        draft: row.draft,
      },
      controls: {
        throttle: row.throttle,
        rudderAngle: row.rudderAngle,
        ballast: row.ballast ?? 0.5,
        bowThruster: row.bowThruster ?? 0,
      },
      lastUpdate: row.lastUpdate.getTime(),
    };
    if (vessel.mode === 'player' && vessel.crewIds.size === 0) {
      vessel.mode = 'ai';
    }
    globalState.vessels.set(vessel.id, vessel);
    if (row.ownerId) {
      globalState.userLastVessel.set(row.ownerId, vessel.id);
    }
  });
  console.info(`Loaded ${rows.length} vessel(s) from database`);
}

function createDefaultAIVessel(id: string, position = { x: 0, y: 0, z: 0 }) {
  const latLon = xyToLatLon({ x: position.x, y: position.y });
  const vessel: VesselRecord = {
    id,
    ownerId: null,
    crewIds: new Set<string>(),
    mode: 'ai',
    desiredMode: 'ai',
    yawRate: 0,
    position: { ...position, lat: latLon.lat, lon: latLon.lon },
    orientation: { heading: 0, roll: 0, pitch: 0 },
    velocity: { surge: 0, sway: 0, heave: 0 },
    properties: {
      mass: 1_200_000,
      length: 150,
      beam: 24,
      draft: 7,
    },
    controls: { throttle: 0, rudderAngle: 0, ballast: 0.5, bowThruster: 0 },
    lastUpdate: Date.now(),
  };
  return vessel;
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

const clampSigned = (val: number, limit: number) =>
  Math.min(Math.max(val, -limit), limit);

const clampHeading = (rad: number) => {
  let h = rad % (Math.PI * 2);
  if (h < 0) h += Math.PI * 2;
  return h;
};

function stepAIVessel(v: VesselRecord, dt: number) {
  // Basic 2D integration mirroring the client WASM approximations
  const throttle = clamp(v.controls.throttle, -1, 1);
  const mass = v.properties.mass || 1_000_000;
  const length = v.properties.length || 120;
  const speedMag = Math.sqrt(v.velocity.surge ** 2 + v.velocity.sway ** 2);

  const thrust = SERVER_MAX_THRUST * throttle;
  const dragSurge = SERVER_DRAG * v.velocity.surge * Math.abs(v.velocity.surge);
  const dragSway = SERVER_DRAG * v.velocity.sway * Math.abs(v.velocity.sway);

  const stall =
    1 -
    Math.min(1, Math.abs(v.controls.rudderAngle) / SERVER_RUDDER_STALL) ** 2;
  const rudderForce =
    SERVER_RUDDER_COEF *
    v.controls.rudderAngle *
    speedMag *
    speedMag *
    Math.max(0, stall);
  const rudderMoment = rudderForce * length * SERVER_RUDDER_ARM;

  const Izz = mass * length * length * 0.1;
  const uDot = (thrust - dragSurge) / mass;
  const vDot =
    (-dragSway - SERVER_SWAY_DAMP * v.velocity.sway + rudderForce) / mass;
  const r = v.yawRate || 0;
  const rDot =
    (rudderMoment -
      SERVER_YAW_DAMP * r -
      SERVER_YAW_DAMP_QUAD * r * Math.abs(r)) /
    Izz;

  v.velocity.surge = clampSigned(
    v.velocity.surge + uDot * dt,
    SERVER_MAX_SPEED,
  );
  v.velocity.sway = clampSigned(
    v.velocity.sway + vDot * dt,
    SERVER_MAX_SPEED * 0.6,
  );

  const nextYawRate = clampSigned(r + rDot * dt, SERVER_MAX_YAW);
  v.yawRate = nextYawRate;
  v.orientation.heading = clampHeading(
    v.orientation.heading + nextYawRate * dt,
  );

  const cosH = Math.cos(v.orientation.heading);
  const sinH = Math.sin(v.orientation.heading);
  const worldU = v.velocity.surge * cosH - v.velocity.sway * sinH;
  const worldV = v.velocity.surge * sinH + v.velocity.sway * cosH;

  v.position.x += worldU * dt;
  v.position.y += worldV * dt;

  // Keep lat/lon in sync
  const ll = xyToLatLon({ x: v.position.x, y: v.position.y });
  v.position.lat = ll.lat;
  v.position.lon = ll.lon;
}

// Simple server-side integrator for AI/abandoned vessels
const SERVER_MAX_THRUST = 8e5;
const SERVER_DRAG = 0.8;
const SERVER_RUDDER_COEF = 200000;
const SERVER_RUDDER_STALL = 0.5;
const SERVER_RUDDER_ARM = 0.4;
const SERVER_YAW_DAMP = 0.5;
const SERVER_YAW_DAMP_QUAD = 1.2;
const SERVER_SWAY_DAMP = 0.6;
const SERVER_MAX_YAW = 0.8;
const SERVER_MAX_SPEED = 15;

const hasAdminRole = (socket: import('socket.io').Socket) =>
  (socket.data.roles || []).includes('admin') ||
  (socket.data.permissions || []).some(
    (p: { resource: string; action: string }) =>
      p.resource === '*' || p.action === '*',
  );

function takeOverAvailableAIVessel(
  userId: string,
  username: string,
): VesselRecord | null {
  const aiVessel = Array.from(globalState.vessels.values()).find(
    v => v.mode === 'ai' && v.crewIds.size === 0,
  );
  if (!aiVessel) return null;
  console.info(
    `Assigning user ${username} to available AI vessel ${aiVessel.id}`,
  );
  aiVessel.crewIds.add(userId);
  aiVessel.mode = 'player';
  aiVessel.ownerId = aiVessel.ownerId ?? userId;
  aiVessel.lastUpdate = Date.now();
  globalState.userLastVessel.set(userId, aiVessel.id);
  void persistVesselToDb(aiVessel);
  console.info(
    `Assigned ${username} (${userId}) to AI vessel ${aiVessel.id} (takeover)`,
  );
  return aiVessel;
}

function ensureVesselForUser(userId: string, username: string): VesselRecord {
  // Prefer last vessel if still present
  const lastId = globalState.userLastVessel.get(userId);
  if (lastId) {
    const lastVessel = globalState.vessels.get(lastId);
    if (lastVessel) {
      console.info(
        `Reassigning user ${username} to their last vessel ${lastId}`,
      );
      if (lastVessel.mode === 'player') {
        lastVessel.crewIds.add(userId);
      }
      return lastVessel;
    }
  }

  console.info(
    `No last vessel for user ${username}, searching for crew assignments.`,
  );

  // Otherwise find any vessel where user is crew
  const existing = Array.from(globalState.vessels.values()).find(v =>
    v.crewIds.has(userId),
  );
  if (existing) {
    console.info(
      `Reassigning user ${username} to existing crewed vessel ${existing.id}`,
    );
    if (existing.mode === 'player') {
      existing.crewIds.add(userId);
    }
    globalState.userLastVessel.set(userId, existing.id);
    return existing;
  }

  // Try to reuse a vessel owned by this user (persisted)
  const owned = Array.from(globalState.vessels.values()).find(
    v => v.ownerId === userId,
  );
  if (owned) {
    console.info(
      `Reassigning user ${username} to owned vessel ${owned.id} from persistence`,
    );
    owned.crewIds.add(userId);
    owned.mode = 'player';
    globalState.userLastVessel.set(userId, owned.id);
    return owned;
  }

  const aiTaken = takeOverAvailableAIVessel(userId, username);
  if (aiTaken) return aiTaken;

  console.info(`Creating new vessel for user ${username}.`);
  const vessel: VesselRecord = {
    id: userId,
    ownerId: userId,
    crewIds: new Set([userId]),
    mode: 'player',
    desiredMode: 'player',
    yawRate: 0,
    position: { x: 0, y: 0, z: 0 },
    orientation: { heading: 0, roll: 0, pitch: 0 },
    velocity: { surge: 0, sway: 0, heave: 0 },
    properties: {
      mass: 1_000_000,
      length: 120,
      beam: 20,
      draft: 6,
    },
    controls: { throttle: 0, rudderAngle: 0, ballast: 0.5, bowThruster: 0 },
    lastUpdate: Date.now(),
  };
  globalState.vessels.set(vessel.id, vessel);
  globalState.userLastVessel.set(userId, vessel.id);
  void persistVesselToDb(vessel);
  return vessel;
}

let weatherTransitionInterval: NodeJS.Timeout | null = null;
let targetWeather: WeatherPattern | null = null;

const getVesselIdForUser = (userId: string): string | undefined => {
  return globalState.userLastVessel.get(userId) || userId;
};

const withLatLon = (pos: VesselPose['position']) => {
  const hasLatLon = pos.lat !== undefined && pos.lon !== undefined;
  // If we already have lat/lon but they are still zero while x/y moved, recompute.
  if (
    hasLatLon &&
    (pos.x !== 0 || pos.y !== 0) &&
    pos.lat === 0 &&
    pos.lon === 0
  ) {
    const ll = xyToLatLon({ x: pos.x, y: pos.y });
    return { ...pos, lat: ll.lat, lon: ll.lon };
  }
  if (hasLatLon) return pos;
  const ll = xyToLatLon({ x: pos.x, y: pos.y });
  return { ...pos, lat: ll.lat, lon: ll.lon };
};

const toSimpleVesselState = (v: VesselRecord): SimpleVesselState => ({
  id: v.id,
  ownerId: v.ownerId,
  desiredMode: v.desiredMode,
  mode: v.mode,
  position: withLatLon(v.position),
  orientation: v.orientation,
  velocity: v.velocity,
  controls: v.controls,
  angularVelocity: { yaw: v.yawRate ?? 0 },
});

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
if (PERF_LOGGING_ENABLED) {
  // Simple request timing logger (warns on slow responses)
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      if (durationMs > API_SLOW_WARN_MS) {
        console.warn(
          `Slow API response: ${req.method} ${req.path} ${durationMs.toFixed(1)}ms status=${res.statusCode}`,
        );
      }
    });
    next();
  });
}

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

// --- Authentication Routes --- (legacy custom auth removed; use NextAuth)

// --- Vessels API (global state) ---
app.get('/vessels', (_req, res) => {
  const vessels = Array.from(globalState.vessels.values()).map(v => ({
    id: v.id,
    ownerId: v.ownerId,
    mode: v.mode,
    position: v.position,
    orientation: v.orientation,
    velocity: v.velocity,
    crewCount: v.crewIds.size,
    lastUpdate: v.lastUpdate,
  }));
  res.json({ vessels });
});

// --- API Routes ---
app.use('/api', apiRoutes);

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
io.use((socket, next) => {
  const cookies = parseCookies(socket.handshake.headers.cookie as string);
  const cookieToken =
    cookies['next-auth.session-token'] ||
    cookies['__Secure-next-auth.session-token'];
  const authPayload = socket.handshake.auth as
    | { token?: string; socketToken?: string; accessToken?: string }
    | undefined;
  const rawToken =
    authPayload?.socketToken ||
    authPayload?.token ||
    authPayload?.accessToken ||
    cookieToken;

  if (!NEXTAUTH_SECRET) {
    console.warn('NEXTAUTH_SECRET is missing; treating socket as guest');
  }

  if (rawToken && NEXTAUTH_SECRET) {
    try {
      const decoded = jwt.verify(rawToken, NEXTAUTH_SECRET) as {
        sub?: string;
        name?: string;
        email?: string;
        role?: string;
      };
      const userId =
        decoded.sub ||
        decoded.email ||
        `na_${Math.random().toString(36).slice(2, 8)}`;
      const username = decoded.name || decoded.email || 'NextAuthUser';
      const baseRole: Role = (decoded.role as Role) || 'player';
      const roles = expandRoles(
        Array.from(
          new Set([
            baseRole,
            ...(ADMIN_USERS.includes(userId) ||
            ADMIN_USERS.includes(username) ||
            (decoded.email && ADMIN_USERS.includes(decoded.email))
              ? (['admin'] as Role[])
              : []),
          ]),
        ) as Role[],
      );
      const permissions = permissionsForRoles(roles);
      socket.data = { userId, username, roles, permissions };
      return next();
    } catch (err) {
      console.warn(
        'Socket token verification failed; falling back to guest',
        err,
      );
    }
  }

  const tempUserId = `guest_${Math.random().toString(36).substring(2, 9)}`;
  const guestRoles = expandRoles(['guest']);
  const guestPermissions = permissionsForRoles(guestRoles);
  socket.data = {
    userId: tempUserId,
    username: 'Guest',
    roles: guestRoles,
    permissions: guestPermissions,
  };
  next();
});

io.on('connection', socket => {
  const { userId, username, roles } = socket.data;
  const effectiveUserId =
    userId || `guest_${Math.random().toString(36).substring(2, 9)}`;
  const effectiveUsername = username || 'Guest';
  const roleSet = new Set(roles || []);
  const isPlayerOrHigher = roleSet.has('player') || roleSet.has('admin');
  const isSpectatorOnly = roleSet.has('spectator') && !isPlayerOrHigher;
  const isGuest = !isPlayerOrHigher && !roleSet.has('spectator');

  let vessel: VesselRecord | null = null;
  if (isPlayerOrHigher) {
    vessel = ensureVesselForUser(effectiveUserId, effectiveUsername);
  }

  console.info(
    `Socket connected: ${effectiveUsername} (${effectiveUserId}) role=${isPlayerOrHigher ? 'player' : isSpectatorOnly ? 'spectator' : 'guest'}`,
  );

  // Notify others that this vessel is crewed
  if (vessel) {
    socket.broadcast.emit('vessel:joined', {
      userId: vessel.id,
      username: effectiveUsername,
      position: withLatLon(vessel.position),
      orientation: vessel.orientation,
    });
  }

  // Send initial snapshot
  socket.emit('simulation:update', {
    vessels: Object.fromEntries(
      Array.from(globalState.vessels.entries()).map(([id, v]) => [
        id,
        toSimpleVesselState(v),
      ]),
    ),
    environment: globalState.environment,
    timestamp: Date.now(),
  });

  // Handle vessel:update events (from client sim)
  socket.on('vessel:update', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    if (!currentUserId) {
      console.warn('Ignoring vessel:update from unidentified user');

      return;
    }
    if (!isPlayerOrHigher) {
      console.info('Ignoring vessel:update from non-player');
      return;
    }

    const vesselKey = getVesselIdForUser(currentUserId) || currentUserId;
    const vesselRecord = globalState.vessels.get(vesselKey);
    if (!vesselRecord) {
      console.warn('No vessel for user, creating on update', currentUserId);
      ensureVesselForUser(currentUserId, effectiveUsername);
    }
    const target = globalState.vessels.get(
      getVesselIdForUser(currentUserId) || currentUserId,
    );
    if (!target) return;

    if (data.position) {
      const nextPosition: VesselPose['position'] = {
        ...target.position,
        ...data.position,
      };

      if (data.position.lat !== undefined && data.position.lon !== undefined) {
        const xy = latLonToXY({
          lat: data.position.lat,
          lon: data.position.lon,
        });
        nextPosition.x = xy.x;
        nextPosition.y = xy.y;
        nextPosition.lat = data.position.lat;
        nextPosition.lon = data.position.lon;
      } else if (
        data.position.x !== undefined ||
        data.position.y !== undefined
      ) {
        const ll = xyToLatLon({
          x: nextPosition.x ?? 0,
          y: nextPosition.y ?? 0,
        });
        nextPosition.lat = ll.lat;
        nextPosition.lon = ll.lon;
      }

      target.position = nextPosition;
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
    if (data.angularVelocity && typeof data.angularVelocity.yaw === 'number') {
      target.yawRate = data.angularVelocity.yaw;
    }
    target.lastUpdate = Date.now();
    console.info(
      `Vessel update from ${username}: pos=(${target.position.x.toFixed(1)},${target.position.y.toFixed(1)}) heading=${target.orientation.heading.toFixed(2)}`,
    );
    void persistVesselToDb(target);

    socket.broadcast.emit('simulation:update', {
      vessels: {
        [target.id]: toSimpleVesselState(target),
      },
      partial: true,
      timestamp: target.lastUpdate,
    });
  });

  // Handle mode changes (player -> spectator -> player)
  socket.on('user:mode', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    const targetId = getVesselIdForUser(currentUserId) || currentUserId;
    const target = globalState.vessels.get(targetId);
    if (!target) return;

    if (data.mode === 'spectator') {
      target.crewIds.delete(currentUserId);
      if (target.crewIds.size === 0) {
        target.mode = 'ai';
        console.debug(`Vessel ${target.id} switched to AI mode (no crew)`);
      }
    } else {
      target.crewIds.add(currentUserId);
      target.mode = 'player';
      console.debug(`Vessel ${target.id} switched to Player mode (crew added)`);
    }
    target.lastUpdate = Date.now();
    void persistVesselToDb(target);
  });

  // Handle vessel:control events
  socket.on('vessel:control', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    if (!currentUserId) return;
    if (!isPlayerOrHigher) {
      console.info('Ignoring vessel:control from non-player');
      return;
    }

    const vesselKey = getVesselIdForUser(currentUserId) || currentUserId;
    const vesselRecord = globalState.vessels.get(vesselKey);
    if (!vesselRecord) {
      console.warn('No vessel for user, creating on control', currentUserId);
      ensureVesselForUser(currentUserId, effectiveUsername);
    }
    const target = globalState.vessels.get(
      getVesselIdForUser(currentUserId) || currentUserId,
    );
    if (!target) return;

    if (data.throttle !== undefined) {
      target.controls.throttle = clamp(data.throttle, -1, 1);
    }
    if (data.rudderAngle !== undefined) {
      target.controls.rudderAngle = clamp(
        data.rudderAngle,
        -RUDDER_STALL_ANGLE_RAD,
        RUDDER_STALL_ANGLE_RAD,
      );
    }
    target.lastUpdate = Date.now();

    /*     console.info(
      `Control applied for ${currentUserId}: throttle=${target.controls.throttle.toFixed(2)} rudder=${target.controls.rudderAngle.toFixed(2)}`,
    ); */
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

  // Admin: force vessel desired mode (ai/player)
  socket.on('admin:vesselMode', data => {
    if (!hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to change vessel mode');
      return;
    }
    const target = globalState.vessels.get(data.vesselId);
    if (!target) return;

    if (data.mode === 'ai') {
      target.desiredMode = 'ai';
      target.mode = 'ai';
      target.crewIds.clear();
    } else {
      target.desiredMode = 'player';
      target.mode = 'player';
      // crewIds unchanged; crew will rejoin on connect
    }
    target.lastUpdate = Date.now();
    void persistVesselToDb(target);
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
          // AI integrator will continue using existing controls/state
        }
      }
    }

    if (currentUserId) {
      socket.broadcast.emit('vessel:left', { userId: currentUserId });
    }
  });
});

async function ensureDefaultVesselExists() {
  if (globalState.vessels.size > 0) return;
  const aiVessel = createDefaultAIVessel('ai_default_1', {
    x: 0,
    y: 0,
    z: 0,
  });
  globalState.vessels.set(aiVessel.id, aiVessel);
  await persistVesselToDb(aiVessel);
  console.info(
    `Seeded default AI vessel ${aiVessel.id} at (${aiVessel.position.x}, ${aiVessel.position.y})`,
  );
}

async function startServer() {
  try {
    await loadVesselsFromDb();
    await ensureDefaultVesselExists();
    server.listen(PORT, () => {
      console.info(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

void startServer();

// Broadcast authoritative snapshots at a throttled rate (5Hz)
const BROADCAST_INTERVAL_MS = 200;
let lastBroadcastAt = Date.now();
setInterval(() => {
  if (!io) return;
  const now = Date.now();
  const drift = now - lastBroadcastAt;
  if (
    PERF_LOGGING_ENABLED &&
    drift > BROADCAST_INTERVAL_MS * BROADCAST_DRIFT_WARN_FACTOR
  ) {
    console.warn(
      `Simulation broadcast drifted: expected ${BROADCAST_INTERVAL_MS}ms, got ${drift}ms`,
    );
  }
  lastBroadcastAt = now;
  const dt = BROADCAST_INTERVAL_MS / 1000;

  // Advance AI vessels using substeps for stability
  const targetSubDt = 1 / 60; // ~60 Hz
  const steps = Math.max(1, Math.round(dt / targetSubDt));
  const subDt = dt / steps;
  for (const v of globalState.vessels.values()) {
    if (v.mode === 'ai') {
      for (let i = 0; i < steps; i++) {
        stepAIVessel(v, subDt);
      }
    }
  }

  const snapshot = Object.fromEntries(
    Array.from(globalState.vessels.entries()).map(([id, v]) => [
      id,
      toSimpleVesselState(v),
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
