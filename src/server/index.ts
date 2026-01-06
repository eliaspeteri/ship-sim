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
import { EnvironmentState } from '../types/environment.types';
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
const MAX_CREW = parseInt(process.env.MAX_CREW || '4', 10) || 4;
const PERF_LOGGING_ENABLED = process.env.PERF_LOGGING === 'true' || !PRODUCTION;
const API_SLOW_WARN_MS = 200;
const BROADCAST_DRIFT_WARN_FACTOR = 1.5;
const MIN_PERSIST_INTERVAL_MS = 1000; // Throttle DB writes per vessel
const ENV_PERSIST_INTERVAL_MS = 30000;
const AI_GRACE_MS = parseInt(process.env.AI_GRACE_MS || '30000', 10) || 30000; // default 30s
const CHAT_HISTORY_PAGE_SIZE = 20;
const GLOBAL_SPACE_ID = 'global';
const DEFAULT_SPACE_ID = process.env.DEFAULT_SPACE_ID || GLOBAL_SPACE_ID;

type VesselMode = 'player' | 'ai';
type CoreVesselProperties = Pick<
  VesselState['properties'],
  'mass' | 'length' | 'beam' | 'draft'
>;
interface VesselRecord {
  id: string;
  spaceId?: string;
  ownerId: string | null;
  crewIds: Set<string>;
  crewNames: Map<string, string>;
  helmUserId?: string | null;
  helmUsername?: string | null;
  mode: VesselMode;
  desiredMode: VesselMode;
  lastCrewAt: number;
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

const WEATHER_AUTO_INTERVAL_MS = 5 * 60 * 1000;
const vesselPersistAt = new Map<string, number>();
const environmentPersistAt = new Map<string, number>();
let nextAutoWeatherAt = Date.now() + WEATHER_AUTO_INTERVAL_MS;

const currentUtcTimeOfDay = () => {
  const now = new Date();
  return (
    (now.getUTCHours() +
      now.getUTCMinutes() / 60 +
      now.getUTCSeconds() / 3600 +
      now.getUTCMilliseconds() / 3_600_000) %
    24
  );
};

const userSpaceKey = (userId: string, spaceId: string) =>
  `${spaceId || DEFAULT_SPACE_ID}:${userId}`;

const normalizeVesselId = (id?: string | null): string | undefined =>
  id || undefined;
const vesselChannelId = (id?: string | null): string | undefined =>
  id ? id.split('_')[0] || id : undefined;

const getVesselIdForUser = (
  userId: string,
  spaceId: string,
): string | undefined => {
  const stored = globalState.userLastVessel.get(userSpaceKey(userId, spaceId));
  return stored || userId || undefined;
};

const getSpaceIdForSocket = (socket: import('socket.io').Socket): string =>
  socket.data.spaceId || DEFAULT_SPACE_ID;

async function persistVesselToDb(
  vessel: VesselRecord,
  opts: { force?: boolean } = {},
) {
  const now = Date.now();
  const lastPersist = vesselPersistAt.get(vessel.id) || 0;
  if (!opts.force && now - lastPersist < MIN_PERSIST_INTERVAL_MS) return;
  vesselPersistAt.set(vessel.id, now);

  const pos = withLatLon(vessel.position);
  try {
    await prisma.vessel.upsert({
      where: { id: vessel.id },
      update: {
        spaceId: vessel.spaceId || DEFAULT_SPACE_ID,
        ownerId: vessel.ownerId ?? null,
        mode: vessel.mode,
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
        lastCrewAt: new Date(vessel.lastCrewAt || vessel.lastUpdate),
      },
      create: {
        id: vessel.id,
        spaceId: vessel.spaceId || DEFAULT_SPACE_ID,
        ownerId: vessel.ownerId ?? null,
        mode: vessel.mode,
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
        lastCrewAt: new Date(vessel.lastCrewAt || vessel.lastUpdate),
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
      spaceId:
        (row as unknown as { spaceId?: string }).spaceId || DEFAULT_SPACE_ID,
      ownerId: row.ownerId,
      crewIds: new Set<string>(),
      crewNames: new Map<string, string>(),
      mode: (row.mode as VesselMode) || 'ai',
      desiredMode: (row.desiredMode as VesselMode) || 'player',
      lastCrewAt: row.lastCrewAt?.getTime() || Date.now(),
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
      globalState.userLastVessel.set(
        userSpaceKey(row.ownerId, vessel.spaceId || DEFAULT_SPACE_ID),
        vessel.id,
      );
    }
  });
  console.info(`Loaded ${rows.length} vessel(s) from database`);
}

async function loadEnvironmentFromDb(spaceId = DEFAULT_SPACE_ID) {
  try {
    const row = await prisma.weatherState.findUnique({
      where: { id: spaceId },
    });
    if (!row) {
      const pattern = getWeatherPattern();
      pattern.timeOfDay = currentUtcTimeOfDay();
      const env = applyWeatherPattern(spaceId, pattern);
      env.name = 'Auto weather';
      globalState.environmentBySpace.set(spaceId, env);
      await persistEnvironmentToDb({ force: true, spaceId });
      return;
    }

    const env: EnvironmentState = {
      wind: {
        speed: row.windSpeed,
        direction: row.windDirection,
        gusting: row.windGusting,
        gustFactor: row.windGustFactor,
      },
      current: {
        speed: row.currentSpeed,
        direction: row.currentDirection,
        variability: row.currentVariability,
      },
      seaState: row.seaState,
      waterDepth: row.waterDepth ?? undefined,
      visibility: row.visibility ?? undefined,
      timeOfDay: row.timeOfDay ?? currentUtcTimeOfDay(),
      precipitation:
        (row.precipitation as EnvironmentState['precipitation']) || 'none',
      precipitationIntensity: row.precipitationIntensity ?? 0,
      name: row.name || spaceId,
    };
    globalState.environmentBySpace.set(spaceId, env);
    environmentPersistAt.set(spaceId, Date.now());
    console.info(`Loaded weather state for space ${row.spaceId}`);
  } catch (err) {
    console.warn('Failed to load weather state; using defaults', err);
  }
}

async function persistEnvironmentToDb(
  opts: { force?: boolean; spaceId?: string } = {},
) {
  const now = Date.now();
  const spaceId = opts.spaceId || DEFAULT_SPACE_ID;
  const lastPersist = environmentPersistAt.get(spaceId) || 0;
  if (!opts.force && now - lastPersist < ENV_PERSIST_INTERVAL_MS) {
    return;
  }
  const env = getEnvironmentForSpace(spaceId);
  environmentPersistAt.set(spaceId, now);
  try {
    await prisma.weatherState.upsert({
      where: { id: spaceId },
      update: {
        spaceId,
        name: env.name || spaceId,
        windSpeed: env.wind.speed,
        windDirection: env.wind.direction,
        windGusting: env.wind.gusting,
        windGustFactor: env.wind.gustFactor,
        currentSpeed: env.current.speed,
        currentDirection: env.current.direction,
        currentVariability: env.current.variability,
        seaState: Math.round(env.seaState),
        waterDepth: env.waterDepth ?? null,
        visibility: env.visibility ?? null,
        timeOfDay: env.timeOfDay ?? currentUtcTimeOfDay(),
        precipitation: env.precipitation || 'none',
        precipitationIntensity: env.precipitationIntensity ?? 0,
      },
      create: {
        id: spaceId,
        spaceId,
        name: env.name || spaceId,
        windSpeed: env.wind.speed,
        windDirection: env.wind.direction,
        windGusting: env.wind.gusting,
        windGustFactor: env.wind.gustFactor,
        currentSpeed: env.current.speed,
        currentDirection: env.current.direction,
        currentVariability: env.current.variability,
        seaState: Math.round(env.seaState),
        waterDepth: env.waterDepth ?? null,
        visibility: env.visibility ?? null,
        timeOfDay: env.timeOfDay ?? currentUtcTimeOfDay(),
        precipitation: env.precipitation || 'none',
        precipitationIntensity: env.precipitationIntensity ?? 0,
      },
    });
  } catch (err) {
    console.error('Failed to persist weather state', err);
  }
}

function createDefaultAIVessel(id: string, position = { x: 0, y: 0, z: 0 }) {
  const latLon = xyToLatLon({ x: position.x, y: position.y });
  const vessel: VesselRecord = {
    id,
    spaceId: DEFAULT_SPACE_ID,
    ownerId: null,
    crewIds: new Set<string>(),
    crewNames: new Map<string, string>(),
    mode: 'ai',
    desiredMode: 'ai',
    lastCrewAt: Date.now(),
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

function createNewVesselForUser(
  userId: string,
  username: string,
  position = { x: 0, y: 0, z: 0 },
  spaceId: string = DEFAULT_SPACE_ID,
): VesselRecord {
  const latLon = xyToLatLon({ x: position.x, y: position.y });
  const vessel: VesselRecord = {
    id: `${userId}_${Date.now()}`,
    spaceId,
    ownerId: userId,
    crewIds: new Set<string>([userId]),
    crewNames: new Map<string, string>([[userId, username]]),
    helmUserId: userId,
    helmUsername: username,
    mode: 'player',
    desiredMode: 'player',
    lastCrewAt: Date.now(),
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

function detachUserFromCurrentVessel(userId: string, spaceId: string): void {
  const vessel = Array.from(globalState.vessels.values()).find(
    v =>
      v.crewIds.has(userId) &&
      (v.spaceId || DEFAULT_SPACE_ID) === (spaceId || DEFAULT_SPACE_ID),
  );
  if (!vessel) return;
  vessel.crewIds.delete(userId);
  vessel.crewNames.delete(userId);
  vessel.lastCrewAt = Date.now();
  if (vessel.crewIds.size === 0) {
    vessel.mode = vessel.desiredMode === 'ai' ? 'ai' : 'ai';
    vessel.desiredMode = vessel.mode;
  }
  void persistVesselToDb(vessel, { force: true });
}

const getDefaultEnvironment = (name = 'Global'): EnvironmentState => ({
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
  waterDepth: 100,
  visibility: 10,
  timeOfDay: currentUtcTimeOfDay(),
  precipitation: 'none',
  precipitationIntensity: 0,
  name,
});

const applyWeatherPattern = (
  spaceId: string,
  pattern: WeatherPattern,
): EnvironmentState => {
  const env = getEnvironmentForSpace(spaceId);
  const next: EnvironmentState = {
    wind: {
      speed: pattern.wind.speed,
      direction: pattern.wind.direction,
      gusting: pattern.wind.gusting,
      gustFactor: pattern.wind.gustFactor,
    },
    current: {
      speed: pattern.current.speed,
      direction: pattern.current.direction,
      variability: pattern.current.variability,
    },
    seaState: Math.round(pattern.seaState),
    waterDepth: pattern.waterDepth,
    visibility: pattern.visibility,
    timeOfDay: pattern.timeOfDay ?? env.timeOfDay ?? currentUtcTimeOfDay(),
    precipitation: pattern.precipitation,
    precipitationIntensity: pattern.precipitationIntensity,
    name: pattern.name || 'Weather',
  };
  globalState.environmentBySpace.set(spaceId, next);
  return next;
};

// Application state
const globalState = {
  vessels: new Map<string, VesselRecord>(),
  userLastVessel: new Map<string, string>(),
  environmentBySpace: new Map<string, EnvironmentState>([
    [DEFAULT_SPACE_ID, getDefaultEnvironment()],
  ]),
};

const getEnvironmentForSpace = (spaceId: string): EnvironmentState => {
  const existing = globalState.environmentBySpace.get(spaceId);
  if (existing) return existing;
  const env = getDefaultEnvironment(spaceId);
  globalState.environmentBySpace.set(spaceId, env);
  return env;
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
  spaceId: string,
): VesselRecord | null {
  const aiVessel = Array.from(globalState.vessels.values()).find(
    v =>
      v.mode === 'ai' &&
      v.crewIds.size === 0 &&
      (v.spaceId || DEFAULT_SPACE_ID) === spaceId,
  );
  if (!aiVessel) return null;
  console.info(
    `Assigning user ${username} to available AI vessel ${aiVessel.id}`,
  );
  aiVessel.crewIds.add(userId);
  aiVessel.crewNames.set(userId, username);
  aiVessel.mode = 'player';
  aiVessel.ownerId = aiVessel.ownerId ?? userId;
  aiVessel.spaceId = spaceId;
  aiVessel.lastUpdate = Date.now();
  globalState.userLastVessel.set(userSpaceKey(userId, spaceId), aiVessel.id);
  void persistVesselToDb(aiVessel);
  console.info(
    `Assigned ${username} (${userId}) to AI vessel ${aiVessel.id} (takeover)`,
  );
  return aiVessel;
}

function findJoinableVessel(
  userId: string,
  spaceId: string,
): VesselRecord | null {
  // Join a vessel that already has crew and room left
  const joinable = Array.from(globalState.vessels.values())
    .filter(
      v =>
        (v.spaceId || DEFAULT_SPACE_ID) === spaceId &&
        v.mode === 'player' &&
        v.crewIds.size > 0 &&
        v.crewIds.size < MAX_CREW &&
        !v.crewIds.has(userId),
    )
    .sort((a, b) => a.crewIds.size - b.crewIds.size);
  return joinable[0] || null;
}

function ensureVesselForUser(
  userId: string,
  username: string,
  spaceId: string,
): VesselRecord {
  // Prefer last vessel if still present
  const lastId = globalState.userLastVessel.get(userSpaceKey(userId, spaceId));
  if (lastId) {
    const lastVessel = globalState.vessels.get(lastId);
    if (lastVessel && (lastVessel.spaceId || DEFAULT_SPACE_ID) === spaceId) {
      console.info(
        `Reassigning user ${username} to their last vessel ${lastId}`,
      );
      // Restore desired mode; if player, add crew back
      lastVessel.mode = lastVessel.desiredMode || 'player';
      if (lastVessel.mode === 'player') {
        lastVessel.crewIds.add(userId);
        lastVessel.crewNames.set(userId, username);
      }
      lastVessel.spaceId = spaceId;
      return lastVessel;
    }
  }

  console.info(
    `No last vessel for user ${username}, searching for crew assignments.`,
  );

  // Otherwise find any vessel where user is crew
  const existing = Array.from(globalState.vessels.values()).find(
    v => v.crewIds.has(userId) && (v.spaceId || DEFAULT_SPACE_ID) === spaceId,
  );
  if (existing) {
    console.info(
      `Reassigning user ${username} to existing crewed vessel ${existing.id}`,
    );
    existing.mode = existing.desiredMode || existing.mode;
    if (existing.mode === 'player') {
      existing.crewIds.add(userId);
      existing.crewNames.set(userId, username);
    }
    existing.spaceId = spaceId;
    globalState.userLastVessel.set(userSpaceKey(userId, spaceId), existing.id);
    return existing;
  }

  const joinable = findJoinableVessel(userId, spaceId);
  if (joinable) {
    console.info(
      `Joining user ${username} to shared vessel ${joinable.id} (${joinable.crewIds.size}/${MAX_CREW})`,
    );
    joinable.crewIds.add(userId);
    joinable.crewNames.set(userId, username);
    joinable.mode = 'player';
    joinable.spaceId = spaceId;
    globalState.userLastVessel.set(userSpaceKey(userId, spaceId), joinable.id);
    return joinable;
  }

  // Try to reuse a vessel owned by this user (persisted)
  const owned = Array.from(globalState.vessels.values()).find(
    v => v.ownerId === userId && (v.spaceId || DEFAULT_SPACE_ID) === spaceId,
  );
  if (owned) {
    console.info(
      `Reassigning user ${username} to owned vessel ${owned.id} from persistence`,
    );
    owned.crewIds.add(userId);
    owned.crewNames.set(userId, username);
    owned.mode = 'player';
    owned.spaceId = spaceId;
    globalState.userLastVessel.set(userSpaceKey(userId, spaceId), owned.id);
    return owned;
  }

  const aiTaken = takeOverAvailableAIVessel(userId, username, spaceId);
  if (aiTaken) return aiTaken;

  console.info(`Creating new vessel for user ${username}.`);
  const vessel: VesselRecord = {
    id: userId,
    spaceId,
    ownerId: userId,
    crewIds: new Set([userId]),
    crewNames: new Map([[userId, username]]),
    mode: 'player',
    desiredMode: 'player',
    lastCrewAt: Date.now(),
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
  globalState.userLastVessel.set(userSpaceKey(userId, spaceId), vessel.id);
  void persistVesselToDb(vessel);
  return vessel;
}

let targetWeather: WeatherPattern | null = null;
let weatherMode: 'manual' | 'auto' = 'auto';

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

const resolveChatChannel = (
  requestedChannel: string | undefined,
  vesselId: string | undefined,
  spaceId: string,
): string => {
  const space = spaceId || DEFAULT_SPACE_ID;
  if (requestedChannel && requestedChannel.startsWith('space:')) {
    const parts = requestedChannel.split(':');
    if (parts[1] !== space) {
      return `space:${space}:global`;
    }
    return requestedChannel;
  }
  const normalizedVesselId = vesselChannelId(vesselId);
  const vesselChannel = normalizedVesselId
    ? `space:${space}:vessel:${normalizedVesselId}`
    : null;
  if (requestedChannel && requestedChannel.startsWith('vessel:')) {
    return vesselChannel || `space:${space}:global`;
  }
  if (requestedChannel === 'global') {
    return `space:${space}:global`;
  }
  return vesselChannel || `space:${space}:global`;
};

const loadChatHistory = async (
  channel: string,
  before?: number,
  limit = CHAT_HISTORY_PAGE_SIZE,
): Promise<{
  messages: {
    id: string;
    userId: string;
    username: string;
    message: string;
    timestamp: number;
    channel: string;
  }[];
  hasMore: boolean;
}> => {
  const take = Math.min(Math.max(limit, 1), 50);
  const spaceId = channel.startsWith('space:') ? channel.split(':')[1] : null;
  const rows = await prisma.chatMessage.findMany({
    where: {
      channel,
      ...(spaceId ? { spaceId } : {}),
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: take + 1,
  });
  const hasMore = rows.length > take;
  console.info(
    `Loaded ${Math.min(rows.length, take)} chat messages for channel ${channel} (hasMore: ${hasMore})`,
  );
  const messages = rows
    .slice(0, take)
    .map(r => ({
      id: r.id,
      userId: r.userId,
      username: r.username,
      message: r.message,
      timestamp: r.createdAt.getTime(),
      channel,
    }))
    .reverse();
  return { messages, hasMore };
};

const toSimpleVesselState = (v: VesselRecord): SimpleVesselState => ({
  id: v.id,
  ownerId: v.ownerId,
  crewIds: Array.from(v.crewIds),
  crewCount: v.crewIds.size,
  crewNames:
    v.crewNames.size > 0
      ? Object.fromEntries(Array.from(v.crewNames.entries()))
      : undefined,
  helm: { userId: v.helmUserId ?? null, username: v.helmUsername ?? null },
  desiredMode: v.desiredMode,
  mode: v.mode,
  lastCrewAt: v.lastCrewAt,
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
    | {
        token?: string;
        socketToken?: string;
        accessToken?: string;
        spaceId?: string;
      }
    | undefined;
  const rawToken =
    authPayload?.socketToken ||
    authPayload?.token ||
    authPayload?.accessToken ||
    cookieToken;
  const spaceIdFromHandshake = authPayload?.spaceId;

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
      const spaceId = spaceIdFromHandshake || DEFAULT_SPACE_ID;
      socket.data = { userId, username, roles, permissions, spaceId };
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
  const spaceId = spaceIdFromHandshake || DEFAULT_SPACE_ID;
  socket.data = {
    userId: tempUserId,
    username: 'Guest',
    roles: guestRoles,
    permissions: guestPermissions,
    spaceId,
  };
  next();
});

io.on('connection', async socket => {
  const { userId, username, roles, spaceId: socketSpaceId } = socket.data;
  const spaceId = socketSpaceId || DEFAULT_SPACE_ID;
  const effectiveUserId =
    userId || `guest_${Math.random().toString(36).substring(2, 9)}`;
  const effectiveUsername = username || 'Guest';
  const roleSet = new Set(roles || []);
  const isPlayerOrHigher = roleSet.has('player') || roleSet.has('admin');
  const isSpectatorOnly = roleSet.has('spectator') && !isPlayerOrHigher;
  const isGuest = !isPlayerOrHigher && !roleSet.has('spectator');

  let vessel: VesselRecord | null = null;
  if (isPlayerOrHigher) {
    vessel = ensureVesselForUser(effectiveUserId, effectiveUsername, spaceId);
  }

  console.info(
    `Socket connected: ${effectiveUsername} (${effectiveUserId}) role=${isPlayerOrHigher ? 'player' : isSpectatorOnly ? 'spectator' : 'guest'} space=${spaceId}`,
  );

  const normalizedVesselId = vesselChannelId(vessel?.id);
  socket.data.vesselId = normalizedVesselId || vessel?.id;
  socket.join(`space:${spaceId}`);
  socket.join(`space:${spaceId}:global`);
  if (normalizedVesselId) {
    socket.join(`space:${spaceId}:vessel:${normalizedVesselId}`);
  }

  // Load and send environment for this space on connect
  await loadEnvironmentFromDb(spaceId);
  socket.emit('environment:update', getEnvironmentForSpace(spaceId));

  // Notify others that this vessel is crewed
  if (vessel) {
    socket.to(`space:${spaceId}`).emit('vessel:joined', {
      userId: vessel.id,
      username: effectiveUsername,
      position: withLatLon(vessel.position),
      orientation: vessel.orientation,
    });
  }

  // Send initial snapshot with recent chat history
  void (async () => {
    let chatHistory: {
      id: string;
      userId: string;
      username: string;
      message: string;
      timestamp: number;
      channel: string;
    }[] = [];
    try {
      const channelsToLoad = [`space:${spaceId}:global`];
      const vesselIdForChat =
        socket.data.vesselId || vesselChannelId(vessel?.id);
      if (vesselIdForChat) {
        channelsToLoad.push(`space:${spaceId}:vessel:${vesselIdForChat}`);
      }
      const results = await Promise.all(
        channelsToLoad.map(async channel => {
          try {
            console.info(`Loading chat history for channel ${channel}`);
            const { messages } = await loadChatHistory(
              channel,
              undefined,
              CHAT_HISTORY_PAGE_SIZE,
            );
            return messages;
          } catch (err) {
            console.warn(`Failed to load chat history for ${channel}`, err);
            return [] as typeof chatHistory;
          }
        }),
      );
      chatHistory = results.flat().sort((a, b) => a.timestamp - b.timestamp);
    } catch (err) {
      console.warn('Failed to load chat history', err);
    }

    const vesselsInSpace = Object.fromEntries(
      Array.from(globalState.vessels.entries())
        .filter(
          ([, v]) =>
            (v.spaceId || DEFAULT_SPACE_ID) === (spaceId || DEFAULT_SPACE_ID),
        )
        .map(([id, v]) => [id, toSimpleVesselState(v)]),
    );

    socket.emit('simulation:update', {
      vessels: vesselsInSpace,
      environment: globalState.environmentBySpace.get(spaceId),
      timestamp: Date.now(),
      self: { userId: effectiveUserId, roles: roles || ['guest'], spaceId },
      chatHistory,
    });
  })();

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

    const vesselKey =
      getVesselIdForUser(currentUserId, spaceId) || currentUserId;
    const vesselRecord = globalState.vessels.get(vesselKey);
    if (
      !vesselRecord ||
      (vesselRecord.spaceId || DEFAULT_SPACE_ID) !== spaceId
    ) {
      console.warn('No vessel for user, creating on update', currentUserId);
      ensureVesselForUser(currentUserId, effectiveUsername, spaceId);
    }
    const target = globalState.vessels.get(
      getVesselIdForUser(currentUserId, spaceId) || currentUserId,
    );
    if (!target || (target.spaceId || DEFAULT_SPACE_ID) !== spaceId) return;

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

    socket.to(`space:${spaceId}`).emit('simulation:update', {
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
    const wantsPlayer = data.mode === 'player';

    if (wantsPlayer && !isPlayerOrHigher) {
      socket.emit('error', 'Your role does not permit player mode');
      return;
    }

    const targetId =
      getVesselIdForUser(currentUserId, spaceId) || currentUserId;
    let target = globalState.vessels.get(targetId);
    if (!target && wantsPlayer) {
      target = ensureVesselForUser(currentUserId, effectiveUsername, spaceId);
    }
    if (!target || (target.spaceId || DEFAULT_SPACE_ID) !== spaceId) return;

    if (data.mode === 'spectator') {
      // Keep crew membership/controls; AI_GRACE_MS will handle idle vessels.
    } else {
      target.crewIds.add(currentUserId);
      target.desiredMode = 'player';
      target.mode = 'player';
      console.info(`Vessel ${target.id} switched to Player mode (crew added)`);
    }
    target.lastCrewAt = Date.now();
    target.lastUpdate = Date.now();
    void persistVesselToDb(target, { force: true });
  });

  // Handle vessel:control events
  socket.on('vessel:control', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    if (!currentUserId) return;
    if (!isPlayerOrHigher) {
      socket.emit('error', 'Not authorized to control a vessel');
      return;
    }

    const vesselKey =
      getVesselIdForUser(currentUserId, spaceId) || currentUserId;
    const vesselRecord = globalState.vessels.get(vesselKey);
    if (
      !vesselRecord ||
      (vesselRecord.spaceId || DEFAULT_SPACE_ID) !== spaceId
    ) {
      console.warn('No vessel for user, creating on control', currentUserId);
      ensureVesselForUser(currentUserId, effectiveUsername, spaceId);
    }
    const target = globalState.vessels.get(
      getVesselIdForUser(currentUserId, spaceId) || currentUserId,
    );
    if (!target || (target.spaceId || DEFAULT_SPACE_ID) !== spaceId) return;

    if (!target.helmUserId || target.helmUserId !== currentUserId) {
      socket.emit(
        'error',
        target.helmUserId
          ? `Helm held by ${target.helmUsername || target.helmUserId}`
          : 'Claim the helm to steer',
      );
      return;
    }

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
    if (data.ballast !== undefined) {
      target.controls.ballast = clamp(data.ballast, 0, 1);
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

  socket.on('vessel:create', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    const currentUsername = socket.data.username || effectiveUsername;
    if (!isPlayerOrHigher) {
      socket.emit('error', 'Not authorized to create a vessel');
      return;
    }
    detachUserFromCurrentVessel(currentUserId, spaceId);
    let position = { x: 0, y: 0, z: 0 };
    if (data?.lat !== undefined && data?.lon !== undefined) {
      const xy = latLonToXY({ lat: data.lat, lon: data.lon });
      position = { x: xy.x, y: xy.y, z: 0 };
    } else if (data?.x !== undefined && data?.y !== undefined) {
      position = { x: data.x, y: data.y, z: 0 };
    }

    const newVessel = createNewVesselForUser(
      currentUserId,
      currentUsername,
      position,
      spaceId,
    );
    globalState.vessels.set(newVessel.id, newVessel);
    globalState.userLastVessel.set(
      userSpaceKey(currentUserId, spaceId),
      newVessel.id,
    );
    void persistVesselToDb(newVessel, { force: true });
    io.to(`space:${spaceId}`).emit('simulation:update', {
      vessels: { [newVessel.id]: toSimpleVesselState(newVessel) },
      partial: true,
      timestamp: Date.now(),
    });
    console.info(
      `Created new vessel ${newVessel.id} for ${currentUsername} (${currentUserId})`,
    );
  });

  socket.on('vessel:helm', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    const currentUsername = socket.data.username || effectiveUsername;
    const vesselKey =
      getVesselIdForUser(currentUserId, spaceId) || currentUserId;
    const vessel = globalState.vessels.get(vesselKey);
    if (!vessel || (vessel.spaceId || DEFAULT_SPACE_ID) !== spaceId) return;
    if (!vessel.crewIds.has(currentUserId)) {
      socket.emit('error', 'You are not crew on this vessel');
      return;
    }
    if (data.action === 'claim') {
      vessel.helmUserId = currentUserId;
      vessel.helmUsername = currentUsername;
    } else {
      vessel.helmUserId = null;
      vessel.helmUsername = null;
    }
    vessel.lastUpdate = Date.now();
    void persistVesselToDb(vessel, { force: true });
    io.to(`space:${spaceId}`).emit('simulation:update', {
      vessels: { [vessel.id]: toSimpleVesselState(vessel) },
      partial: true,
      timestamp: Date.now(),
    });
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
    void persistVesselToDb(target, { force: true });
  });

  // Handle admin weather control
  socket.on('admin:weather', data => {
    if (!hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to change weather');
      return;
    }

    const mode = data.mode === 'auto' ? 'auto' : 'manual';
    const spaceId = getSpaceIdForSocket(socket);

    if (mode === 'auto') {
      weatherMode = 'auto';
      targetWeather = null;
      const pattern = getWeatherPattern();
      pattern.timeOfDay = currentUtcTimeOfDay();
      const env = applyWeatherPattern(spaceId, pattern);
      nextAutoWeatherAt = Date.now() + WEATHER_AUTO_INTERVAL_MS;
      io.to(`space:${spaceId}`).emit('environment:update', env);
      void persistEnvironmentToDb({ force: true, spaceId });
      console.info(
        `Weather set to auto by ${socket.data.username}; next change at ${new Date(nextAutoWeatherAt).toISOString()}`,
      );
      return;
    }

    weatherMode = 'manual';
    if (data.pattern) {
      targetWeather = getWeatherPattern(data.pattern);
      const env = applyWeatherPattern(spaceId, targetWeather);
      io.to(`space:${spaceId}`).emit('environment:update', env);
      void persistEnvironmentToDb({ force: true, spaceId });
      console.info(
        `Weather preset '${data.pattern}' applied by ${socket.data.username}`,
      );
    } else if (data.coordinates) {
      targetWeather = getWeatherByCoordinates(
        data.coordinates.lat,
        data.coordinates.lng,
      );
      const env = applyWeatherPattern(spaceId, targetWeather);
      io.to(`space:${spaceId}`).emit('environment:update', env);
      void persistEnvironmentToDb({ force: true, spaceId });
      console.info(
        `Weather from coordinates applied by ${socket.data.username} (${data.coordinates.lat}, ${data.coordinates.lng})`,
      );
    } else {
      io.to(`space:${spaceId}`).emit(
        'environment:update',
        getEnvironmentForSpace(spaceId),
      );
    }
  });

  // Handle chat messages
  socket.on('chat:message', async data => {
    if (!socketHasPermission(socket, 'chat', 'send')) {
      socket.emit('error', 'Not authorized to send chat messages');
      return;
    }

    const message = (data.message || '').trim();
    if (!message || message.length > 500) return;

    const currentVesselId = normalizeVesselId(
      getVesselIdForUser(socket.data.userId || effectiveUserId, spaceId),
    );
    const channel = resolveChatChannel(data.channel, currentVesselId, spaceId);
    const payload = {
      id: '',
      userId: socket.data.userId || 'unknown',
      username: socket.data.username || 'Guest',
      message,
      timestamp: Date.now(),
      channel,
    };

    try {
      const row = await prisma.chatMessage.create({
        data: {
          userId: payload.userId,
          username: payload.username,
          message: payload.message,
          spaceId: spaceId || DEFAULT_SPACE_ID,
          channel: payload.channel,
        },
      });
      payload.id = row.id;
      payload.timestamp = row.createdAt.getTime();
    } catch (err) {
      console.warn('Failed to persist chat message', err);
    }

    const room =
      channel && channel.startsWith('space:')
        ? channel
        : `space:${spaceId}:global`;
    io.to(room).emit('chat:message', payload);
  });

  socket.on('chat:history', async data => {
    const currentVesselId = normalizeVesselId(
      getVesselIdForUser(socket.data.userId || effectiveUserId, spaceId),
    );
    const channel = resolveChatChannel(data?.channel, currentVesselId, spaceId);
    const before = typeof data?.before === 'number' ? data.before : undefined;
    const limit =
      typeof data?.limit === 'number' && !Number.isNaN(data.limit)
        ? Math.min(Math.max(Math.floor(data.limit), 1), 50)
        : CHAT_HISTORY_PAGE_SIZE;
    try {
      console.info(
        `Loading chat history for channel ${channel} before ${before} limit ${limit}`,
      );
      const { messages, hasMore } = await loadChatHistory(
        channel,
        before,
        limit,
      );
      socket.emit('chat:history', {
        channel,
        messages,
        hasMore,
        reset: !before,
      });
    } catch (err) {
      console.warn('Failed to load chat history', err);
      socket.emit('chat:history', {
        channel,
        messages: [],
        hasMore: false,
        reset: !before,
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const currentUserId = socket.data.userId || effectiveUserId;
    const currentUsername = socket.data.username || effectiveUsername;
    console.info(`Socket disconnected: ${currentUsername} (${currentUserId})`);

    if (!isGuest) {
      const vesselId =
        currentUserId && getVesselIdForUser(currentUserId, spaceId);
      const vesselRecord = vesselId
        ? globalState.vessels.get(vesselId)
        : undefined;
      if (vesselRecord) {
        vesselRecord.crewIds.delete(currentUserId);
        if (vesselRecord.crewIds.size === 0) {
          vesselRecord.mode = vesselRecord.desiredMode || 'player';
          vesselRecord.lastCrewAt = Date.now();
          // AI integrator will continue using existing controls/state if desiredMode is ai
        }
      }
    }

    if (currentUserId) {
      socket
        .to(`space:${spaceId}`)
        .emit('vessel:left', { userId: currentUserId });
    }
  });
});

async function ensureDefaultSpaceExists() {
  try {
    await prisma.space.upsert({
      where: { id: DEFAULT_SPACE_ID },
      update: { name: 'Global', visibility: 'public' },
      create: { id: DEFAULT_SPACE_ID, name: 'Global', visibility: 'public' },
    });
  } catch (err) {
    console.warn('Failed to ensure default space exists', err);
  }
}

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
    await ensureDefaultSpaceExists();
    await loadVesselsFromDb();
    await loadEnvironmentFromDb(DEFAULT_SPACE_ID);
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
  let environmentChanged = false;
  const env = getEnvironmentForSpace(DEFAULT_SPACE_ID);
  if (weatherMode === 'auto') {
    const nextTime = currentUtcTimeOfDay();
    if (Math.abs((env.timeOfDay ?? 0) - nextTime) > 1e-3) {
      env.timeOfDay = nextTime;
      environmentChanged = true;
    }
    if (now >= nextAutoWeatherAt) {
      const autoPattern = getWeatherPattern();
      autoPattern.timeOfDay = currentUtcTimeOfDay();
      applyWeatherPattern(DEFAULT_SPACE_ID, autoPattern);
      nextAutoWeatherAt = now + WEATHER_AUTO_INTERVAL_MS;
      environmentChanged = true;
      console.info(
        `Auto weather applied (${autoPattern.name}); next at ${new Date(nextAutoWeatherAt).toISOString()}`,
      );
    }
  }

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
    // Grace-period promotion to AI for empty player vessels
    if (
      v.mode === 'player' &&
      v.crewIds.size === 0 &&
      v.desiredMode === 'player' &&
      now - v.lastCrewAt > AI_GRACE_MS
    ) {
      v.mode = 'ai';
      v.lastUpdate = now;
      void persistVesselToDb(v, { force: true });
    }
    if (
      v.mode === 'player' &&
      v.crewIds.size === 0 &&
      v.desiredMode === 'ai' &&
      now - v.lastCrewAt > 0
    ) {
      v.mode = 'ai';
      v.lastUpdate = now;
      void persistVesselToDb(v, { force: true });
    }
  }

  // Broadcast per space
  const vesselsBySpace = new Map<
    string,
    Record<string, ReturnType<typeof toSimpleVesselState>>
  >();
  for (const [id, v] of globalState.vessels.entries()) {
    const sid = v.spaceId || DEFAULT_SPACE_ID;
    if (!vesselsBySpace.has(sid)) vesselsBySpace.set(sid, {});
    vesselsBySpace.get(sid)![id] = toSimpleVesselState(v);
  }

  for (const [sid, vessels] of vesselsBySpace.entries()) {
    const env = getEnvironmentForSpace(sid);
    io.to(`space:${sid}`).emit('simulation:update', {
      vessels,
      environment: env,
      timestamp: Date.now(),
      spaceId: sid,
    });
  }

  if (environmentChanged) {
    for (const sid of globalState.environmentBySpace.keys()) {
      void persistEnvironmentToDb({ spaceId: sid });
    }
  }
}, BROADCAST_INTERVAL_MS);

// Export the app and io for potential testing or extension
export { app, io };
