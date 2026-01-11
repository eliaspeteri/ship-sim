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
import {
  ensurePosition,
  mergePosition,
  distanceMeters,
  positionFromLatLon,
  positionFromXY,
  bodyVelocityFromWorld,
  speedFromWorldVelocity,
} from '../lib/position';
import { prisma } from '../lib/prisma';
import { RUDDER_MAX_ANGLE_RAD } from '../constants/vessel';
import { recordMetric, setConnectedClients } from './metrics';
import { getBathymetryDepth, loadBathymetry } from './bathymetry';
import {
  getEconomyProfile,
  applyEconomyAdjustment,
  updateEconomyForVessel,
} from './economy';
import { seedDefaultMissions, updateMissionAssignments } from './missions';
import { recordLog } from './observability';

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
const COLLISION_DISTANCE_M = 50;
const NEAR_MISS_DISTANCE_M = 200;
const COLLISION_COOLDOWN_MS = 30_000;
const NEAR_MISS_COOLDOWN_MS = 15_000;
const SPEED_VIOLATION_COOLDOWN_MS = 20_000;

type SpaceMeta = {
  id: string;
  name: string;
  visibility: string;
  kind: string;
  rankRequired: number;
  rules?: Record<string, unknown> | null;
  createdBy?: string | null;
};

const spaceMetaCache = new Map<string, SpaceMeta>();
export const economyLedger = new Map<
  string,
  { lastChargeAt: number; accrued: number; lastPortId?: string }
>();
const colregsCooldown = new Map<string, number>();
const DEFAULT_ECONOMY_PROFILE = {
  rank: 1,
  experience: 0,
  credits: 0,
  safetyScore: 1,
};

type VesselMode = 'player' | 'ai';
type CoreVesselProperties = Pick<
  VesselState['properties'],
  'mass' | 'length' | 'beam' | 'draft'
>;
export interface VesselRecord {
  id: string;
  spaceId?: string;
  ownerId: string | null;
  crewIds: Set<string>;
  crewNames: Map<string, string>;
  helmUserId?: string | null;
  helmUsername?: string | null;
  engineUserId?: string | null;
  engineUsername?: string | null;
  radioUserId?: string | null;
  radioUsername?: string | null;
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
let lastMissionUpdateAt = 0;

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

const toSpaceMeta = (space: {
  id: string;
  name: string;
  visibility: string;
  kind?: string | null;
  rankRequired?: number | null;
  rules?: Record<string, unknown> | null;
  createdBy?: string | null;
}): SpaceMeta => ({
  id: space.id,
  name: space.name,
  visibility: space.visibility,
  kind: space.kind || 'free',
  rankRequired: space.rankRequired ?? 1,
  rules: space.rules ?? null,
  createdBy: space.createdBy || null,
});

const getSpaceMeta = async (spaceId: string): Promise<SpaceMeta> => {
  const cached = spaceMetaCache.get(spaceId);
  if (cached) return cached;
  try {
    const record = await prisma.space.findUnique({ where: { id: spaceId } });
    if (record) {
      const meta = toSpaceMeta(record as SpaceMeta);
      spaceMetaCache.set(spaceId, meta);
      return meta;
    }
  } catch (err) {
    console.warn('Failed to load space metadata', err);
  }
  const fallback: SpaceMeta = {
    id: spaceId,
    name: spaceId,
    visibility: 'public',
    kind: 'free',
    rankRequired: 1,
    rules: null,
    createdBy: null,
  };
  spaceMetaCache.set(spaceId, fallback);
  return fallback;
};

const refreshSpaceMeta = async (spaceId: string) => {
  spaceMetaCache.delete(spaceId);
  return getSpaceMeta(spaceId);
};

const getSpaceRole = async (userId: string | undefined, spaceId: string) => {
  if (!userId) return 'member' as const;
  const meta = await getSpaceMeta(spaceId);
  if (meta.createdBy && meta.createdBy === userId) return 'host' as const;
  try {
    const access = await prisma.spaceAccess.findUnique({
      where: { userId_spaceId: { userId, spaceId } },
      select: { role: true },
    });
    if (access?.role === 'host') return 'host' as const;
  } catch (err) {
    console.warn('Failed to resolve space role', err);
  }
  return 'member' as const;
};

const resolveChargeUserId = (vessel: VesselRecord) => {
  if (vessel.ownerId) return vessel.ownerId;
};

export const syncUserSocketsEconomy = async (
  userId: string,
  profile: {
    rank: number;
    experience: number;
    credits: number;
    safetyScore: number;
  },
) => {
  try {
    const sockets = await io.in(`user:${userId}`).fetchSockets();
    sockets.forEach(socket => {
      socket.data.rank = profile.rank;
      socket.data.experience = profile.experience;
      socket.data.credits = profile.credits;
      socket.data.safetyScore = profile.safetyScore;
    });
  } catch (err) {
    console.warn('Failed to sync user economy to sockets', err);
  }
};

const canTriggerCooldown = (key: string, now: number, cooldown: number) => {
  const last = colregsCooldown.get(key) || 0;
  if (now - last < cooldown) return false;
  colregsCooldown.set(key, now);
  return true;
};

const applyColregsRules = async (spaceId: string, now: number) => {
  const meta = spaceMetaCache.get(spaceId);
  const rules = meta?.rules as
    | {
        colregs?: boolean;
        collisionPenalty?: number;
        nearMissPenalty?: number;
        maxSpeed?: number;
      }
    | undefined;
  if (!rules?.colregs) return;
  const vessels = Array.from(globalState.vessels.values()).filter(
    v => (v.spaceId || DEFAULT_SPACE_ID) === spaceId && v.mode === 'player',
  );
  if (vessels.length < 1) return;

  for (const vessel of vessels) {
    if (!rules.maxSpeed) continue;
    const speedMs = Math.sqrt(
      vessel.velocity.surge ** 2 + vessel.velocity.sway ** 2,
    );
    const speedKnots = speedMs * 1.94384;
    if (speedKnots <= rules.maxSpeed) continue;
    const chargeUserId = resolveChargeUserId(vessel);
    if (!chargeUserId) continue;
    const key = `speed:${spaceId}:${vessel.id}`;
    if (!canTriggerCooldown(key, now, SPEED_VIOLATION_COOLDOWN_MS)) continue;
    const penalty = rules.nearMissPenalty || 100;
    const profile = await applyEconomyAdjustment({
      userId: chargeUserId,
      vesselId: vessel.id,
      deltaCredits: -penalty,
      deltaSafetyScore: -0.05,
      reason: 'speed_violation',
      meta: { speedKnots, maxSpeed: rules.maxSpeed },
    });
    io.to(`user:${chargeUserId}`).emit('economy:update', profile);
    void syncUserSocketsEconomy(chargeUserId, profile);
    recordLog({
      level: 'warn',
      source: 'colregs',
      message: 'Speed violation',
      meta: { vesselId: vessel.id, speedKnots, limit: rules.maxSpeed },
    });
  }

  for (let i = 0; i < vessels.length; i++) {
    for (let j = i + 1; j < vessels.length; j++) {
      const a = vessels[i];
      const b = vessels[j];
      const dist = distanceMeters(a.position, b.position);
      const pairKey = [a.id, b.id].sort().join(':');
      if (dist <= COLLISION_DISTANCE_M) {
        if (
          !canTriggerCooldown(
            `collision:${spaceId}:${pairKey}`,
            now,
            COLLISION_COOLDOWN_MS,
          )
        ) {
          continue;
        }
        const penalty = rules.collisionPenalty || 500;
        const chargeA = resolveChargeUserId(a);
        const chargeB = resolveChargeUserId(b);
        if (chargeA) {
          const profile = await applyEconomyAdjustment({
            userId: chargeA,
            vesselId: a.id,
            deltaCredits: -penalty,
            deltaSafetyScore: -0.15,
            reason: 'collision',
            meta: { otherVessel: b.id, distance: dist },
          });
          io.to(`user:${chargeA}`).emit('economy:update', profile);
          void syncUserSocketsEconomy(chargeA, profile);
        }
        if (chargeB) {
          const profile = await applyEconomyAdjustment({
            userId: chargeB,
            vesselId: b.id,
            deltaCredits: -penalty,
            deltaSafetyScore: -0.15,
            reason: 'collision',
            meta: { otherVessel: a.id, distance: dist },
          });
          io.to(`user:${chargeB}`).emit('economy:update', profile);
          void syncUserSocketsEconomy(chargeB, profile);
        }
        recordLog({
          level: 'warn',
          source: 'colregs',
          message: 'Collision detected',
          meta: { vessels: [a.id, b.id], distance: dist },
        });
      } else if (dist <= NEAR_MISS_DISTANCE_M) {
        if (
          !canTriggerCooldown(
            `nearmiss:${spaceId}:${pairKey}`,
            now,
            NEAR_MISS_COOLDOWN_MS,
          )
        ) {
          continue;
        }
        const penalty = rules.nearMissPenalty || 150;
        const chargeA = resolveChargeUserId(a);
        const chargeB = resolveChargeUserId(b);
        if (chargeA) {
          const profile = await applyEconomyAdjustment({
            userId: chargeA,
            vesselId: a.id,
            deltaCredits: -penalty,
            deltaSafetyScore: -0.05,
            reason: 'near_miss',
            meta: { otherVessel: b.id, distance: dist },
          });
          io.to(`user:${chargeA}`).emit('economy:update', profile);
          void syncUserSocketsEconomy(chargeA, profile);
        }
        if (chargeB) {
          const profile = await applyEconomyAdjustment({
            userId: chargeB,
            vesselId: b.id,
            deltaCredits: -penalty,
            deltaSafetyScore: -0.05,
            reason: 'near_miss',
            meta: { otherVessel: a.id, distance: dist },
          });
          io.to(`user:${chargeB}`).emit('economy:update', profile);
          void syncUserSocketsEconomy(chargeB, profile);
        }
        recordLog({
          level: 'info',
          source: 'colregs',
          message: 'Near miss detected',
          meta: { vessels: [a.id, b.id], distance: dist },
        });
      }
    }
  }
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

export async function persistVesselToDb(
  vessel: VesselRecord,
  opts: { force?: boolean } = {},
) {
  const now = Date.now();
  const lastPersist = vesselPersistAt.get(vessel.id) || 0;
  if (!opts.force && now - lastPersist < MIN_PERSIST_INTERVAL_MS) return;
  vesselPersistAt.set(vessel.id, now);

  const pos = mergePosition(vessel.position);
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
    const vessel: VesselRecord = {
      id: row.id,
      spaceId:
        (row as unknown as { spaceId?: string }).spaceId || DEFAULT_SPACE_ID,
      ownerId: row.ownerId,
      crewIds: new Set<string>(),
      crewNames: new Map<string, string>(),
      helmUserId: null,
      helmUsername: null,
      engineUserId: null,
      engineUsername: null,
      radioUserId: null,
      radioUsername: null,
      mode: (row.mode as VesselMode) || 'ai',
      desiredMode: (row.desiredMode as VesselMode) || 'player',
      lastCrewAt: row.lastCrewAt?.getTime() || Date.now(),
      position: positionFromLatLon({ lat: row.lat, lon: row.lon, z: row.z }),
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

function createNewVesselForUser(
  userId: string,
  username: string,
  position: Partial<VesselPose['position']> = {},
  spaceId: string = DEFAULT_SPACE_ID,
): VesselRecord {
  const nextPosition = ensurePosition(position);
  const vessel: VesselRecord = {
    id: `${userId}_${Date.now()}`,
    spaceId,
    ownerId: userId,
    crewIds: new Set<string>([userId]),
    crewNames: new Map<string, string>([[userId, username]]),
    helmUserId: userId,
    helmUsername: username,
    engineUserId: userId,
    engineUsername: username,
    radioUserId: userId,
    radioUsername: username,
    mode: 'player',
    desiredMode: 'player',
    lastCrewAt: Date.now(),
    position: nextPosition,
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
  if (vessel.helmUserId === userId) {
    vessel.helmUserId = null;
    vessel.helmUsername = null;
  }
  if (vessel.engineUserId === userId) {
    vessel.engineUserId = null;
    vessel.engineUsername = null;
  }
  if (vessel.radioUserId === userId) {
    vessel.radioUserId = null;
    vessel.radioUsername = null;
  }
  vessel.lastCrewAt = Date.now();
  if (vessel.crewIds.size === 0) {
    vessel.mode = vessel.desiredMode === 'ai' ? 'ai' : 'ai';
    vessel.desiredMode = vessel.mode;
  }
  void persistVesselToDb(vessel, { force: true });
}

function assignStationsForCrew(
  vessel: VesselRecord,
  userId: string,
  username: string,
) {
  if (!vessel.helmUserId) {
    vessel.helmUserId = userId;
    vessel.helmUsername = username;
  }
  if (!vessel.engineUserId) {
    vessel.engineUserId = userId;
    vessel.engineUsername = username;
  }
  if (!vessel.radioUserId) {
    vessel.radioUserId = userId;
    vessel.radioUsername = username;
  }
}

const STATION_KEYS = {
  helm: { id: 'helmUserId', name: 'helmUsername' },
  engine: { id: 'engineUserId', name: 'engineUsername' },
  radio: { id: 'radioUserId', name: 'radioUsername' },
} as const;

function updateStationAssignment(
  vessel: VesselRecord,
  station: keyof typeof STATION_KEYS,
  action: 'claim' | 'release',
  userId: string,
  username: string,
  isAdminOverride = false,
): { ok: boolean; message?: string } {
  const keys = STATION_KEYS[station];
  const currentId = vessel[keys.id];
  const currentName = vessel[keys.name];

  if (action === 'claim') {
    if (currentId && currentId !== userId && !isAdminOverride) {
      return {
        ok: false,
        message: `${station} station held by ${currentName || currentId}`,
      };
    }
    vessel[keys.id] = userId;
    vessel[keys.name] = username;
    return { ok: true };
  }

  if (currentId && currentId !== userId && !isAdminOverride) {
    return { ok: false, message: `You do not hold the ${station} station` };
  }
  vessel[keys.id] = null;
  vessel[keys.name] = null;
  return { ok: true };
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

const applyEnvironmentOverrides = (
  spaceId: string,
  overrides: Partial<EnvironmentState>,
): EnvironmentState => {
  const env = getEnvironmentForSpace(spaceId);
  const next: EnvironmentState = {
    ...env,
    ...overrides,
    wind: {
      ...env.wind,
      ...(overrides.wind || {}),
    },
    current: {
      ...env.current,
      ...(overrides.current || {}),
    },
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

const normalizeSignedAngle = (rad: number) => {
  let angle = (rad + Math.PI) % (Math.PI * 2);
  if (angle < 0) angle += Math.PI * 2;
  return angle - Math.PI;
};

const aiControllers = new Map<string, { heading: number; speed: number }>();

function stepAIVessel(v: VesselRecord, dt: number) {
  // Basic 2D integration mirroring the client WASM approximations
  const currentHeading = v.orientation.heading || 0;
  const throttle = clamp(v.controls.throttle, -1, 1);
  const mass = v.properties.mass || 1_000_000;
  const length = v.properties.length || 120;
  const position = positionFromLatLon({
    lat: v.position.lat,
    lon: v.position.lon,
    z: v.position.z,
  });
  const speedMag = Math.sqrt(v.velocity.surge ** 2 + v.velocity.sway ** 2);

  const controller = aiControllers.get(v.id) || {
    heading: currentHeading,
    speed: Math.max(2, speedMag),
  };
  aiControllers.set(v.id, controller);

  const headingError = normalizeSignedAngle(
    controller.heading - currentHeading,
  );
  v.controls.rudderAngle = clamp(
    headingError * 0.8,
    -SERVER_RUDDER_STALL,
    SERVER_RUDDER_STALL,
  );
  const speedError = controller.speed - speedMag;
  v.controls.throttle = clamp(throttle + speedError * 0.05, 0, 0.8);

  const thrust = SERVER_MAX_THRUST * v.controls.throttle;
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

  const nextX = (position.x ?? 0) + worldU * dt;
  const nextY = (position.y ?? 0) + worldV * dt;

  v.position = positionFromXY({ x: nextX, y: nextY, z: position.z });
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
  assignStationsForCrew(aiVessel, userId, username);
  aiVessel.mode = 'player';
  aiControllers.delete(aiVessel.id);
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
        assignStationsForCrew(lastVessel, userId, username);
        aiControllers.delete(lastVessel.id);
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
      assignStationsForCrew(existing, userId, username);
      aiControllers.delete(existing.id);
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
    assignStationsForCrew(joinable, userId, username);
    joinable.mode = 'player';
    aiControllers.delete(joinable.id);
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
    assignStationsForCrew(owned, userId, username);
    owned.mode = 'player';
    aiControllers.delete(owned.id);
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
    helmUserId: userId,
    helmUsername: username,
    engineUserId: userId,
    engineUsername: username,
    radioUserId: userId,
    radioUsername: username,
    mode: 'player',
    desiredMode: 'player',
    lastCrewAt: Date.now(),
    yawRate: 0,
    position: ensurePosition({ lat: 0, lon: 0, z: 0 }),
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

async function isSpaceHost(userId: string | undefined, spaceId: string) {
  if (!userId) return false;
  return (await getSpaceRole(userId, spaceId)) === 'host';
}

async function getActiveBan(
  userId: string | undefined,
  username: string | undefined,
  spaceId: string,
) {
  if (!userId && !username) return null;
  const now = new Date();
  try {
    return await prisma.ban.findFirst({
      where: {
        spaceId: { in: [spaceId, DEFAULT_SPACE_ID] },
        ...(userId || username
          ? {
              OR: [
                ...(userId ? [{ userId }] : []),
                ...(username ? [{ username }] : []),
              ],
            }
          : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
  } catch (err) {
    console.warn('Failed to check bans', err);
    return null;
  }
}

async function getActiveMute(
  userId: string | undefined,
  username: string | undefined,
  spaceId: string,
) {
  if (!userId && !username) return null;
  const now = new Date();
  try {
    return await prisma.mute.findFirst({
      where: {
        spaceId: { in: [spaceId, DEFAULT_SPACE_ID] },
        ...(userId || username
          ? {
              OR: [
                ...(userId ? [{ userId }] : []),
                ...(username ? [{ username }] : []),
              ],
            }
          : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
  } catch (err) {
    console.warn('Failed to check mutes', err);
    return null;
  }
}

function updateSocketVesselRoom(
  socket: import('socket.io').Socket,
  spaceId: string,
  vesselId?: string | null,
) {
  const current = socket.data.vesselId;
  if (current) {
    socket.leave(`space:${spaceId}:vessel:${current}`);
  }
  const normalized = vesselId ? vesselChannelId(vesselId) || vesselId : null;
  if (normalized) {
    socket.join(`space:${spaceId}:vessel:${normalized}`);
    socket.data.vesselId = normalized;
  } else {
    socket.data.vesselId = undefined;
  }
}

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

const toSimpleVesselState = (v: VesselRecord): SimpleVesselState => {
  const mergedPosition = mergePosition(v.position);
  const waterDepth = getBathymetryDepth(mergedPosition.lat, mergedPosition.lon);
  return {
    id: v.id,
    ownerId: v.ownerId,
    crewIds: Array.from(v.crewIds),
    crewCount: v.crewIds.size,
    crewNames:
      v.crewNames.size > 0
        ? Object.fromEntries(Array.from(v.crewNames.entries()))
        : undefined,
    helm: { userId: v.helmUserId ?? null, username: v.helmUsername ?? null },
    stations: {
      helm: { userId: v.helmUserId ?? null, username: v.helmUsername ?? null },
      engine: {
        userId: v.engineUserId ?? null,
        username: v.engineUsername ?? null,
      },
      radio: {
        userId: v.radioUserId ?? null,
        username: v.radioUsername ?? null,
      },
    },
    desiredMode: v.desiredMode,
    mode: v.mode,
    lastCrewAt: v.lastCrewAt,
    position: mergedPosition,
    orientation: v.orientation,
    velocity: v.velocity,
    controls: v.controls,
    angularVelocity: { yaw: v.yawRate ?? 0 },
    waterDepth,
  };
};

const findVesselInSpace = (
  vesselId: string,
  spaceId: string,
): VesselRecord | null => {
  const direct = globalState.vessels.get(vesselId);
  if (direct && (direct.spaceId || DEFAULT_SPACE_ID) === spaceId) {
    return direct;
  }
  const normalized = vesselChannelId(vesselId);
  if (!normalized) return null;
  return (
    Array.from(globalState.vessels.values()).find(
      v =>
        vesselChannelId(v.id) === normalized &&
        (v.spaceId || DEFAULT_SPACE_ID) === spaceId,
    ) || null
  );
};

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
        recordLog({
          level: 'warn',
          source: 'api',
          message: 'Slow API response',
          meta: {
            method: req.method,
            path: req.path,
            durationMs,
            statusCode: res.statusCode,
          },
        });
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
io.use(async (socket, next) => {
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
        mode?: 'player' | 'spectator';
        autoJoin?: boolean;
      }
    | undefined;
  const rawToken =
    authPayload?.socketToken ||
    authPayload?.token ||
    authPayload?.accessToken ||
    cookieToken;
  const spaceIdFromHandshake = authPayload?.spaceId;
  const requestedMode =
    authPayload?.mode === 'spectator' ? 'spectator' : 'player';
  const autoJoin =
    typeof authPayload?.autoJoin === 'boolean' ? authPayload.autoJoin : true;

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
      const account =
        (await getEconomyProfile(userId).catch(() => null)) ||
        DEFAULT_ECONOMY_PROFILE;
      const spaceRole = await getSpaceRole(userId, spaceId);
      socket.data = {
        userId,
        username,
        roles,
        permissions,
        spaceId,
        mode: requestedMode,
        autoJoin,
        rank: account.rank,
        credits: account.credits,
        experience: account.experience,
        safetyScore: account.safetyScore,
        spaceRole,
      };
      const ban = await getActiveBan(userId, username, spaceId);
      if (ban) {
        return next(new Error(`Banned: ${ban.reason || 'Access denied'}`));
      }
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
    mode: 'spectator',
    autoJoin: false,
    rank: 0,
    credits: 0,
    experience: 0,
    safetyScore: 1,
    spaceRole: 'member',
  };
  const ban = await getActiveBan(undefined, undefined, spaceId);
  if (ban) {
    return next(new Error(`Banned: ${ban.reason || 'Access denied'}`));
  }
  next();
});

io.on('connection', async socket => {
  const { userId, username, roles, spaceId: socketSpaceId } = socket.data;
  const spaceId = socketSpaceId || DEFAULT_SPACE_ID;
  const effectiveUserId =
    userId || `guest_${Math.random().toString(36).substring(2, 9)}`;
  const effectiveUsername = username || 'Guest';
  if (socket.data.rank === undefined && effectiveUserId) {
    const account =
      (await getEconomyProfile(effectiveUserId).catch(() => null)) ||
      DEFAULT_ECONOMY_PROFILE;
    socket.data.rank = account.rank;
    socket.data.credits = account.credits;
    socket.data.experience = account.experience;
    socket.data.safetyScore = account.safetyScore;
  }
  if (!socket.data.spaceRole) {
    socket.data.spaceRole = await getSpaceRole(effectiveUserId, spaceId);
  }
  const spaceMeta = await getSpaceMeta(spaceId);
  const roleSet = new Set(roles || []);
  const isPlayerOrHigher = roleSet.has('player') || roleSet.has('admin');
  const isSpectatorOnly = roleSet.has('spectator') && !isPlayerOrHigher;
  const isGuest = !isPlayerOrHigher && !roleSet.has('spectator');
  const requestedMode = socket.data.mode || 'player';
  const autoJoin = !(socket.data.autoJoin === false);
  const rankEligible = (socket.data.rank ?? 1) >= (spaceMeta.rankRequired ?? 1);
  const wantsSpectator =
    requestedMode === 'spectator' ||
    !autoJoin ||
    isSpectatorOnly ||
    isGuest ||
    !rankEligible;

  setConnectedClients(io.engine.clientsCount);

  let vessel: VesselRecord | null = null;
  if (isPlayerOrHigher && !wantsSpectator) {
    vessel = ensureVesselForUser(effectiveUserId, effectiveUsername, spaceId);
    socket.data.mode = 'player';
  } else {
    socket.data.mode = 'spectator';
  }

  console.info(
    `Socket connected: ${effectiveUsername} (${effectiveUserId}) role=${isPlayerOrHigher ? 'player' : isSpectatorOnly ? 'spectator' : 'guest'} space=${spaceId}`,
  );
  if (!rankEligible && isPlayerOrHigher) {
    socket.emit(
      'error',
      `Rank ${socket.data.rank ?? 1} required to join ${spaceMeta.name}`,
    );
  }

  socket.join(`space:${spaceId}`);
  socket.join(`space:${spaceId}:global`);
  socket.join(`user:${effectiveUserId}`);
  updateSocketVesselRoom(socket, spaceId, vessel?.id);

  // Load and send environment for this space on connect
  await loadEnvironmentFromDb(spaceId);
  socket.emit('environment:update', getEnvironmentForSpace(spaceId));

  // Notify others that this vessel is crewed
  if (vessel) {
    socket.to(`space:${spaceId}`).emit('vessel:joined', {
      userId: vessel.id,
      username: effectiveUsername,
      position: mergePosition(vessel.position),
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
      self: {
        userId: effectiveUserId,
        roles: roles || ['guest'],
        rank: socket.data.rank ?? DEFAULT_ECONOMY_PROFILE.rank,
        credits: socket.data.credits ?? DEFAULT_ECONOMY_PROFILE.credits,
        experience:
          socket.data.experience ?? DEFAULT_ECONOMY_PROFILE.experience,
        safetyScore:
          socket.data.safetyScore ?? DEFAULT_ECONOMY_PROFILE.safetyScore,
        spaceId,
        mode: (socket.data as { mode?: 'player' | 'spectator' }).mode,
      },
      spaceInfo: {
        id: spaceMeta.id,
        name: spaceMeta.name,
        visibility: spaceMeta.visibility,
        kind: spaceMeta.kind,
        rankRequired: spaceMeta.rankRequired,
        rules: spaceMeta.rules ?? null,
        role: socket.data.spaceRole || 'member',
      },
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
    if ((socket.data as { mode?: string }).mode === 'spectator') {
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
    const canSendUpdates =
      hasAdminRole(socket) ||
      target.helmUserId === currentUserId ||
      target.ownerId === currentUserId;
    if (!canSendUpdates) {
      return;
    }

    if (data.position) {
      target.position = mergePosition(target.position, data.position);
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
    if (data.position) {
      const dt = (Date.now() - prevUpdate) / 1000;
      if (dt > 0.1) {
        const nextPosition = mergePosition(target.position);
        const dx = (nextPosition.x ?? 0) - (prevPosition.x ?? 0);
        const dy = (nextPosition.y ?? 0) - (prevPosition.y ?? 0);
        const world = { x: dx / dt, y: dy / dt };
        const derivedSpeed = speedFromWorldVelocity(world);
        const reportedSpeed = data.velocity
          ? Math.hypot(data.velocity.surge, data.velocity.sway)
          : 0;
        if (
          Number.isFinite(derivedSpeed) &&
          derivedSpeed > 0.05 &&
          reportedSpeed < 0.01
        ) {
          const derivedBody = bodyVelocityFromWorld(
            target.orientation.heading,
            world,
          );
          target.velocity = {
            ...target.velocity,
            ...derivedBody,
            heave: data.velocity?.heave ?? target.velocity.heave,
          };
        }
      }
    }
    if (data.angularVelocity && typeof data.angularVelocity.yaw === 'number') {
      target.yawRate = data.angularVelocity.yaw;
    }
    target.lastUpdate = Date.now();
    console.info(
      `Vessel update from ${username}: pos=(${(target.position.x ?? 0).toFixed(1)},${(target.position.y ?? 0).toFixed(1)}) heading=${target.orientation.heading.toFixed(2)}`,
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
    const rankEligible =
      (socket.data.rank ?? 1) >= (spaceMeta.rankRequired ?? 1);

    if (wantsPlayer && !isPlayerOrHigher) {
      socket.emit('error', 'Your role does not permit player mode');
      return;
    }
    if (wantsPlayer && !rankEligible) {
      socket.emit(
        'error',
        `Rank ${spaceMeta.rankRequired ?? 1} required for this space`,
      );
      return;
    }

    if (data.mode === 'spectator') {
      detachUserFromCurrentVessel(currentUserId, spaceId);
      updateSocketVesselRoom(socket, spaceId, null);
      socket.data.mode = 'spectator';
      return;
    }

    const targetId =
      getVesselIdForUser(currentUserId, spaceId) || currentUserId;
    let target = globalState.vessels.get(targetId);
    if (!target && wantsPlayer) {
      target = ensureVesselForUser(currentUserId, effectiveUsername, spaceId);
    }
    if (!target || (target.spaceId || DEFAULT_SPACE_ID) !== spaceId) return;

    target.crewIds.add(currentUserId);
    target.crewNames.set(currentUserId, effectiveUsername);
    assignStationsForCrew(target, currentUserId, effectiveUsername);
    target.desiredMode = 'player';
    target.mode = 'player';
    aiControllers.delete(target.id);
    target.lastCrewAt = Date.now();
    target.lastUpdate = Date.now();
    updateSocketVesselRoom(socket, spaceId, target.id);
    socket.data.mode = 'player';
    void persistVesselToDb(target, { force: true });

    io.to(`space:${spaceId}`).emit('simulation:update', {
      vessels: { [target.id]: toSimpleVesselState(target) },
      partial: true,
      timestamp: Date.now(),
    });
  });

  // Handle vessel:control events
  socket.on('vessel:control', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    if (!currentUserId) return;
    if (!isPlayerOrHigher) {
      socket.emit('error', 'Not authorized to control a vessel');
      return;
    }
    if ((socket.data as { mode?: string }).mode === 'spectator') {
      socket.emit('error', 'Spectator mode cannot control vessels');
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

    const isHelm = target.helmUserId === currentUserId;
    const isEngine = target.engineUserId === currentUserId;
    const isAdmin = hasAdminRole(socket);
    const engineAvailable = !target.engineUserId || isEngine || isAdmin;

    if (data.rudderAngle !== undefined && !isHelm && !isAdmin) {
      socket.emit(
        'error',
        target.helmUserId
          ? `Helm held by ${target.helmUsername || target.helmUserId}`
          : 'Claim the helm to steer',
      );
      return;
    }

    if (
      (data.throttle !== undefined || data.ballast !== undefined) &&
      !engineAvailable
    ) {
      socket.emit(
        'error',
        target.engineUserId
          ? `Engine station held by ${target.engineUsername || target.engineUserId}`
          : 'Claim the engine station to adjust throttle/ballast',
      );
      return;
    }

    if (data.throttle !== undefined) {
      target.controls.throttle = clamp(data.throttle, -1, 1);
    }
    if (data.rudderAngle !== undefined) {
      target.controls.rudderAngle = clamp(
        data.rudderAngle,
        -RUDDER_MAX_ANGLE_RAD,
        RUDDER_MAX_ANGLE_RAD,
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

  socket.on('latency:ping', data => {
    if (!data || typeof data.sentAt !== 'number') return;
    socket.emit('latency:pong', {
      sentAt: data.sentAt,
      serverAt: Date.now(),
    });
    recordMetric('socketLatency', Date.now() - data.sentAt);
  });

  socket.on('client:log', data => {
    if (!data || typeof data.message !== 'string') return;
    recordLog({
      level: data.level || 'info',
      source: data.source || 'client',
      message: data.message,
      meta: {
        ...((data.meta as Record<string, unknown>) || {}),
        userId: socket.data.userId || 'unknown',
        spaceId: socket.data.spaceId || DEFAULT_SPACE_ID,
      },
    });
  });

  socket.on('vessel:join', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    const currentUsername = socket.data.username || effectiveUsername;
    const rankEligible =
      (socket.data.rank ?? 1) >= (spaceMeta.rankRequired ?? 1);
    if (!isPlayerOrHigher) {
      socket.emit('error', 'Not authorized to join a vessel');
      return;
    }
    if (!rankEligible) {
      socket.emit(
        'error',
        `Rank ${spaceMeta.rankRequired ?? 1} required for this space`,
      );
      return;
    }
    const targetId =
      typeof data?.vesselId === 'string' ? data.vesselId : undefined;
    let target = targetId ? findVesselInSpace(targetId, spaceId) : null;
    if (!target) {
      target = findJoinableVessel(currentUserId, spaceId);
    }
    if (!target) {
      socket.emit('error', 'No joinable vessels available');
      return;
    }
    if (target.crewIds.size >= MAX_CREW) {
      socket.emit('error', 'Selected vessel is at max crew');
      return;
    }

    detachUserFromCurrentVessel(currentUserId, spaceId);
    target.crewIds.add(currentUserId);
    target.crewNames.set(currentUserId, currentUsername);
    assignStationsForCrew(target, currentUserId, currentUsername);
    target.mode = 'player';
    aiControllers.delete(target.id);
    target.desiredMode = 'player';
    target.spaceId = spaceId;
    target.lastCrewAt = Date.now();
    target.lastUpdate = Date.now();
    globalState.userLastVessel.set(
      userSpaceKey(currentUserId, spaceId),
      target.id,
    );
    updateSocketVesselRoom(socket, spaceId, target.id);
    socket.data.mode = 'player';
    void persistVesselToDb(target, { force: true });

    io.to(`space:${spaceId}`).emit('simulation:update', {
      vessels: { [target.id]: toSimpleVesselState(target) },
      partial: true,
      timestamp: Date.now(),
    });
  });

  socket.on('vessel:create', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    const currentUsername = socket.data.username || effectiveUsername;
    const rankEligible =
      (socket.data.rank ?? 1) >= (spaceMeta.rankRequired ?? 1);
    if (!isPlayerOrHigher) {
      socket.emit('error', 'Not authorized to create a vessel');
      return;
    }
    if (!rankEligible) {
      socket.emit(
        'error',
        `Rank ${spaceMeta.rankRequired ?? 1} required for this space`,
      );
      return;
    }
    detachUserFromCurrentVessel(currentUserId, spaceId);
    const newVessel = createNewVesselForUser(
      currentUserId,
      currentUsername,
      data || {},
      spaceId,
    );
    globalState.vessels.set(newVessel.id, newVessel);
    globalState.userLastVessel.set(
      userSpaceKey(currentUserId, spaceId),
      newVessel.id,
    );
    updateSocketVesselRoom(socket, spaceId, newVessel.id);
    socket.data.mode = 'player';
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
    const result = updateStationAssignment(
      vessel,
      'helm',
      data.action,
      currentUserId,
      currentUsername,
      hasAdminRole(socket),
    );
    if (!result.ok) {
      socket.emit('error', result.message || 'Unable to change helm');
      return;
    }
    vessel.lastUpdate = Date.now();
    void persistVesselToDb(vessel, { force: true });
    io.to(`space:${spaceId}`).emit('simulation:update', {
      vessels: { [vessel.id]: toSimpleVesselState(vessel) },
      partial: true,
      timestamp: Date.now(),
    });
  });

  socket.on('vessel:station', data => {
    const currentUserId = socket.data.userId || effectiveUserId;
    const currentUsername = socket.data.username || effectiveUsername;
    const vesselKey =
      getVesselIdForUser(currentUserId, spaceId) || currentUserId;
    const vessel = globalState.vessels.get(vesselKey);
    if (!vessel || (vessel.spaceId || DEFAULT_SPACE_ID) !== spaceId) return;
    if (!vessel.crewIds.has(currentUserId) && !hasAdminRole(socket)) {
      socket.emit('error', 'You are not crew on this vessel');
      return;
    }
    const station =
      data.station === 'engine' || data.station === 'radio'
        ? data.station
        : 'helm';
    const result = updateStationAssignment(
      vessel,
      station,
      data.action,
      currentUserId,
      currentUsername,
      hasAdminRole(socket),
    );
    if (!result.ok) {
      socket.emit('error', result.message || 'Unable to change station');
      return;
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

  socket.on('admin:vessel:stop', data => {
    if (!hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to stop vessels');
      return;
    }
    if (!data?.vesselId) {
      socket.emit('error', 'Missing vessel id');
      return;
    }
    const spaceId = getSpaceIdForSocket(socket);
    const target = findVesselInSpace(data.vesselId, spaceId);
    if (!target) {
      socket.emit('error', 'Vessel not found');
      return;
    }
    target.controls = {
      ...target.controls,
      throttle: 0,
      rudderAngle: 0,
      bowThruster: 0,
    };
    target.velocity = { surge: 0, sway: 0, heave: 0 };
    target.yawRate = 0;
    target.lastUpdate = Date.now();
    void persistVesselToDb(target, { force: true });
    io.to(`space:${spaceId}`).emit('simulation:update', {
      vessels: { [target.id]: toSimpleVesselState(target) },
      partial: true,
      timestamp: Date.now(),
    });
  });

  socket.on('admin:kick', async data => {
    if (!hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to kick users');
      return;
    }
    if (!data?.userId) {
      socket.emit('error', 'Missing user id for kick');
      return;
    }
    try {
      const sockets = await io.fetchSockets();
      const reason = data.reason || 'Removed by admin';
      sockets.forEach(targetSocket => {
        if (targetSocket.data.userId === data.userId) {
          targetSocket.emit('error', reason);
          targetSocket.disconnect(true);
        }
      });
      console.info(`Admin kick executed for ${data.userId}`);
    } catch (err) {
      console.error('Failed to kick user', err);
      socket.emit('error', 'Failed to kick user');
    }
  });

  socket.on('admin:vessel:remove', async data => {
    if (!hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to remove vessels');
      return;
    }
    if (!data?.vesselId) {
      socket.emit('error', 'Missing vessel id');
      return;
    }
    const spaceId = getSpaceIdForSocket(socket);
    const target = findVesselInSpace(data.vesselId, spaceId);
    if (!target) {
      socket.emit('error', 'Vessel not found');
      return;
    }
    aiControllers.delete(target.id);
    economyLedger.delete(target.id);
    globalState.vessels.delete(target.id);
    for (const [key, vesselId] of globalState.userLastVessel.entries()) {
      if (vesselId === target.id) {
        globalState.userLastVessel.delete(key);
      }
    }
    try {
      await prisma.vessel.delete({ where: { id: target.id } });
    } catch (err) {
      console.warn('Failed to delete vessel record', err);
    }
    console.info(`Admin removed vessel ${target.id} from space ${spaceId}`);
  });

  socket.on('admin:vessel:move', data => {
    if (!hasAdminRole(socket)) {
      socket.emit('error', 'Not authorized to move vessels');
      return;
    }
    if (!data?.vesselId) {
      socket.emit('error', 'Missing vessel id');
      return;
    }
    const spaceId = getSpaceIdForSocket(socket);
    const target = findVesselInSpace(data.vesselId, spaceId);
    if (!target) {
      socket.emit('error', 'Vessel not found');
      return;
    }
    console.info(
      `Admin move request from ${socket.data.username || 'unknown'} for vessel ${data.vesselId}`,
      data.position,
    );

    const next = data.position;
    if (
      !next ||
      (next.lat === undefined &&
        next.lon === undefined &&
        next.x === undefined &&
        next.y === undefined)
    ) {
      socket.emit('error', 'Missing position data');
      return;
    }

    target.position = mergePosition(target.position, next);

    target.velocity = { surge: 0, sway: 0, heave: 0 };
    target.yawRate = 0;
    target.controls = {
      ...target.controls,
      throttle: 0,
      rudderAngle: 0,
      bowThruster: 0,
    };
    target.lastUpdate = Date.now();
    void persistVesselToDb(target, { force: true });
    io.to(`space:${spaceId}`).emit('vessel:teleport', {
      vesselId: target.id,
      position: target.position,
      reset: true,
    });
    io.to(`space:${spaceId}`).emit('simulation:update', {
      vessels: { [target.id]: toSimpleVesselState(target) },
      partial: true,
      timestamp: Date.now(),
    });
  });

  // Handle admin weather control
  socket.on('admin:weather', async data => {
    const spaceId = getSpaceIdForSocket(socket);
    const isHost = await isSpaceHost(socket.data.userId, spaceId);
    if (!hasAdminRole(socket) && !isHost) {
      socket.emit('error', 'Not authorized to change weather');
      return;
    }

    const mode = data.mode === 'auto' ? 'auto' : 'manual';

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

    const mute = await getActiveMute(
      socket.data.userId,
      socket.data.username,
      spaceId,
    );
    if (mute) {
      socket.emit('error', mute.reason || 'You are muted in this space');
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
    setConnectedClients(io.engine.clientsCount);

    if (!isGuest) {
      const vesselId =
        currentUserId && getVesselIdForUser(currentUserId, spaceId);
      const vesselRecord = vesselId
        ? globalState.vessels.get(vesselId)
        : undefined;
      if (vesselRecord) {
        vesselRecord.crewIds.delete(currentUserId);
        if (vesselRecord.helmUserId === currentUserId) {
          vesselRecord.helmUserId = null;
          vesselRecord.helmUsername = null;
        }
        if (vesselRecord.engineUserId === currentUserId) {
          vesselRecord.engineUserId = null;
          vesselRecord.engineUsername = null;
        }
        if (vesselRecord.radioUserId === currentUserId) {
          vesselRecord.radioUserId = null;
          vesselRecord.radioUsername = null;
        }
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
      create: {
        id: DEFAULT_SPACE_ID,
        name: 'Global',
        visibility: 'public',
        kind: 'free',
        rankRequired: 1,
      },
    });
    await refreshSpaceMeta(DEFAULT_SPACE_ID);
  } catch (err) {
    console.warn('Failed to ensure default space exists', err);
  }
}

const ENV_EVENT_POLL_MS = 10000;

async function processEnvironmentEvents() {
  try {
    const now = new Date();
    const events = await prisma.environmentEvent.findMany({
      where: {
        enabled: true,
        executedAt: null,
        runAt: { lte: now },
      },
      orderBy: { runAt: 'asc' },
    });
    if (!events.length) return;

    for (const event of events) {
      const spaceId = event.spaceId || DEFAULT_SPACE_ID;
      const currentEnv = getEnvironmentForSpace(spaceId);
      const restorePayload =
        event.endAt && !event.endPayload
          ? JSON.parse(JSON.stringify(currentEnv))
          : null;
      let env = currentEnv;
      if (event.pattern) {
        const pattern = getWeatherPattern(event.pattern);
        pattern.timeOfDay = env.timeOfDay ?? currentUtcTimeOfDay();
        env = applyWeatherPattern(spaceId, pattern);
      }
      if (event.payload) {
        env = applyEnvironmentOverrides(
          spaceId,
          event.payload as Partial<EnvironmentState>,
        );
      }
      if (event.name) {
        env = { ...env, name: event.name };
        globalState.environmentBySpace.set(spaceId, env);
      }
      io.to(`space:${spaceId}`).emit('environment:update', env);
      await prisma.environmentEvent.update({
        where: { id: event.id },
        data: {
          executedAt: now,
          ...(restorePayload ? { endPayload: restorePayload } : {}),
        },
      });
      void persistEnvironmentToDb({ force: true, spaceId });
      console.info(
        `Applied scheduled environment event ${event.id} for space ${spaceId}`,
      );
    }

    const ending = await prisma.environmentEvent.findMany({
      where: {
        enabled: true,
        endedAt: null,
        endAt: { lte: now },
        executedAt: { not: null },
      },
      orderBy: { endAt: 'asc' },
    });

    for (const event of ending) {
      const spaceId = event.spaceId || DEFAULT_SPACE_ID;
      let env = getEnvironmentForSpace(spaceId);
      if (event.endPayload) {
        env = applyEnvironmentOverrides(
          spaceId,
          event.endPayload as Partial<EnvironmentState>,
        );
      } else {
        const pattern = getWeatherPattern();
        pattern.timeOfDay = env.timeOfDay ?? currentUtcTimeOfDay();
        env = applyWeatherPattern(spaceId, pattern);
      }
      io.to(`space:${spaceId}`).emit('environment:update', env);
      await prisma.environmentEvent.update({
        where: { id: event.id },
        data: { endedAt: now, enabled: false },
      });
      void persistEnvironmentToDb({ force: true, spaceId });
      console.info(
        `Ended scheduled environment event ${event.id} for space ${spaceId}`,
      );
    }
  } catch (err) {
    console.warn('Failed to process environment events', err);
  }
}

async function startServer() {
  try {
    await ensureDefaultSpaceExists();
    await loadBathymetry();
    await loadVesselsFromDb();
    await loadEnvironmentFromDb(DEFAULT_SPACE_ID);
    const spaces = await prisma.space.findMany({ select: { id: true } });
    await Promise.all(
      spaces.map(space => seedDefaultMissions(space.id).catch(() => null)),
    );
    await Promise.all(
      spaces.map(space => refreshSpaceMeta(space.id).catch(() => null)),
    );
    server.listen(PORT, () => {
      console.info(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

void startServer();

setInterval(() => {
  void processEnvironmentEvents();
}, ENV_EVENT_POLL_MS);

// Broadcast authoritative snapshots at a throttled rate (5Hz)
const BROADCAST_INTERVAL_MS = 200;
let lastBroadcastAt = Date.now();
setInterval(() => {
  if (!io) return;
  const broadcastStart = Date.now();
  const now = Date.now();
  const drift = now - lastBroadcastAt;
  if (
    PERF_LOGGING_ENABLED &&
    drift > BROADCAST_INTERVAL_MS * BROADCAST_DRIFT_WARN_FACTOR
  ) {
    console.warn(
      `Simulation broadcast drifted: expected ${BROADCAST_INTERVAL_MS}ms, got ${drift}ms`,
    );
    recordLog({
      level: 'warn',
      source: 'broadcast',
      message: 'Simulation broadcast drifted',
      meta: { expectedMs: BROADCAST_INTERVAL_MS, driftMs: drift },
    });
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
  const aiStart = Date.now();
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
  recordMetric('ai', Date.now() - aiStart);

  // Broadcast per space
  const vesselsBySpace = new Map<
    string,
    Record<string, ReturnType<typeof toSimpleVesselState>>
  >();
  const positionsBySpace = new Map<
    string,
    Map<
      string,
      { position: { lat: number; lon: number }; ownerId?: string | null }
    >
  >();
  for (const [id, v] of globalState.vessels.entries()) {
    const sid = v.spaceId || DEFAULT_SPACE_ID;
    if (!vesselsBySpace.has(sid)) vesselsBySpace.set(sid, {});
    vesselsBySpace.get(sid)![id] = toSimpleVesselState(v);
    if (!positionsBySpace.has(sid)) positionsBySpace.set(sid, new Map());
    const pos = mergePosition(v.position);
    positionsBySpace.get(sid)!.set(id, {
      position: { lat: pos.lat, lon: pos.lon },
      ownerId: v.ownerId,
    });
  }

  for (const [sid, vessels] of vesselsBySpace.entries()) {
    const env = getEnvironmentForSpace(sid);
    const meta = spaceMetaCache.get(sid);
    io.to(`space:${sid}`).emit('simulation:update', {
      vessels,
      environment: env,
      timestamp: Date.now(),
      spaceId: sid,
      spaceInfo: meta
        ? {
            id: meta.id,
            name: meta.name,
            visibility: meta.visibility,
            kind: meta.kind,
            rankRequired: meta.rankRequired,
            rules: meta.rules ?? null,
          }
        : undefined,
    });
  }

  if (now - lastMissionUpdateAt > 1000) {
    lastMissionUpdateAt = now;
    for (const [sid, vesselMap] of positionsBySpace.entries()) {
      void updateMissionAssignments({
        spaceId: sid,
        vessels: vesselMap,
        emitUpdate: (userId, assignment) => {
          io.to(`user:${userId}`).emit('mission:update', assignment);
        },
        emitEconomyUpdate: (userId, profile) => {
          io.to(`user:${userId}`).emit('economy:update', profile);
          void syncUserSocketsEconomy(userId, profile);
        },
      });
    }
  }

  for (const sid of positionsBySpace.keys()) {
    void applyColregsRules(sid, now);
  }

  for (const vessel of globalState.vessels.values()) {
    void updateEconomyForVessel(vessel, now, io);
  }

  if (environmentChanged) {
    for (const sid of globalState.environmentBySpace.keys()) {
      void persistEnvironmentToDb({ spaceId: sid });
    }
  }
  recordMetric('broadcast', Date.now() - broadcastStart);
}, BROADCAST_INTERVAL_MS);

// Export the app and io for potential testing or extension
export { app, io };
