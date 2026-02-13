import 'dotenv/config';
import express from 'express';
import http from 'http';
import { URL } from 'url';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from '../api';
import jwt from 'jsonwebtoken';
import {
  applyWeatherPattern,
  getWeatherPattern,
  WeatherPattern,
} from '../weatherSystem';
import { Role, expandRoles, permissionsForRoles } from '../roles';
import {
  ChatMessageData,
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../../types/socket.types';
import {
  SimpleVesselState,
  VesselControls,
  VesselPose,
  VesselState,
  VesselVelocity,
} from '../../types/vessel.types';
import { EnvironmentState } from '../../types/environment.types';
import type { DeepPartial } from '../../types/utility';
import {
  getDefaultRules,
  mapToRulesetType,
  Rules,
} from '../../types/rules.types';
import {
  ensurePosition,
  mergePosition,
  distanceMeters,
  positionFromLatLon,
  positionFromXY,
} from '../../lib/position';
import { prisma } from '../../lib/prisma';
import { RUDDER_MAX_ANGLE_RAD } from '../../constants/vessel';
import {
  recordMetric,
  setConnectedClients,
  updateSpaceMetrics,
} from '../metrics';
import { getBathymetryDepth, loadBathymetry } from '../bathymetry';
import {
  getEconomyProfile,
  applyEconomyAdjustment,
  updateEconomyForVessel,
} from '../economy';
import { seedDefaultMissions, updateMissionAssignments } from '../missions';
import { seedCareerDefinitions } from '../careers';
import {
  ensureCargoAvailability,
  ensurePassengerAvailability,
  sweepExpiredCargo,
  sweepExpiredPassengers,
  updateCargoDeliveries,
  updatePassengerDeliveries,
} from '../logistics';
import { recordLog } from '../observability';
import { loadSeamarks } from '../seamarks';
import { computeTideState } from '../../lib/tides';
import { updateFailureState, FailureState } from '../failureModel';
import { DamageState, DEFAULT_DAMAGE_STATE } from '../../lib/damage';
import {
  applyCollisionDamage,
  applyFailureWear,
  applyGroundingDamage,
  mergeDamageState,
} from '../damageModel';
import { applyFailureControlLimits } from '../../lib/failureControls';
import {
  buildHydrodynamics,
  resolveVesselTemplate,
  warmVesselCatalog,
} from '../vesselCatalog';
import { registerVesselUpdateHandler } from '../socketHandlers/vesselUpdate';
import { registerUserModeHandler } from '../socketHandlers/userMode';
import { registerVesselControlHandler } from '../socketHandlers/vesselControl';
import { registerVesselRepairHandler } from '../socketHandlers/vesselRepair';
import { registerSimulationStateHandler } from '../socketHandlers/simulationState';
import { registerSimulationResyncHandler } from '../socketHandlers/simulationResync';
import { registerLatencyPingHandler } from '../socketHandlers/latencyPing';
import { registerClientLogHandler } from '../socketHandlers/clientLog';
import { registerVesselStorageHandler } from '../socketHandlers/vesselStorage';
import { registerVesselSaleHandler } from '../socketHandlers/vesselSale';
import { registerVesselJoinHandler } from '../socketHandlers/vesselJoin';
import { registerVesselLeaseHandler } from '../socketHandlers/vesselLease';
import { registerEconomyHandlers } from '../socketHandlers/economy';
import { registerCargoHandlers } from '../socketHandlers/cargo';
import { registerStationHandlers } from '../socketHandlers/stations';
import { registerAdminHandlers } from '../socketHandlers/admin';
import { registerChatHandlers } from '../socketHandlers/chat';
import { registerAdminWeatherHandler } from '../socketHandlers/adminWeather';
import { registerSeamarksHandler } from '../socketHandlers/seamarks';
import { registerDisconnectHandler } from '../socketHandlers/disconnect';
import type { SocketHandlerContext } from '../socketHandlers/context';

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

const parseAllowedOrigins = ({
  production,
  rawOrigins = process.env.FRONTEND_ORIGINS || process.env.FRONTEND_URL || '',
}: {
  production: boolean;
  rawOrigins?: string;
}): string[] => {
  const raw = rawOrigins;
  const configuredOrigins = raw
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  if (!configuredOrigins.length) {
    if (production) {
      throw new Error(
        'Missing FRONTEND_ORIGINS/FRONTEND_URL in production. Refusing permissive CORS fallback.',
      );
    }
    return ['http://localhost:3000', 'http://127.0.0.1:3000'];
  }

  const validOrigins = configuredOrigins.filter(origin => {
    try {
      const parsed = new URL(origin);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  });

  if (production && validOrigins.length === 0) {
    throw new Error(
      'Invalid FRONTEND_ORIGINS/FRONTEND_URL in production. Expected absolute http(s) origins.',
    );
  }

  return validOrigins;
};
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
  rulesetType?: string | null;
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
> &
  Partial<
    Omit<VesselState['properties'], 'mass' | 'length' | 'beam' | 'draft'>
  >;
export interface VesselRecord {
  id: string;
  spaceId?: string;
  ownerId: string | null;
  status?: string;
  storagePortId?: string | null;
  storedAt?: number | null;
  chartererId?: string | null;
  leaseeId?: string | null;
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
  templateId?: string | null;
  position: VesselPose['position'];
  orientation: VesselPose['orientation'];
  velocity: VesselVelocity;
  properties: CoreVesselProperties;
  hydrodynamics?: VesselState['hydrodynamics'];
  physics?: VesselState['physics'];
  render?: VesselState['render'];
  controls: Pick<
    VesselControls,
    'throttle' | 'rudderAngle' | 'ballast' | 'bowThruster'
  >;
  failureState?: FailureState;
  damageState?: DamageState;
  lastUpdate: number;
}

const WEATHER_AUTO_INTERVAL_MS = 5 * 60 * 1000;
const vesselPersistAt = new Map<string, number>();
const environmentPersistAt = new Map<string, number>();
const activeUserSockets = new Map<string, string>();
let nextAutoWeatherAt = Date.now() + WEATHER_AUTO_INTERVAL_MS;
let lastMissionUpdateAt = 0;

export const currentUtcTimeOfDay = () => {
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
  rulesetType?: string | null;
  rules?: Record<string, unknown> | null;
  createdBy?: string | null;
}): SpaceMeta => ({
  id: space.id,
  name: space.name,
  visibility: space.visibility,
  kind: space.kind || 'free',
  rankRequired: space.rankRequired ?? 1,
  rulesetType: space.rulesetType ?? null,
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
    name: spaceId === 'global' ? 'Global Ocean' : spaceId,
    visibility: 'public',
    kind: 'free',
    rankRequired: 1,
    rulesetType: 'CASUAL',
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

const resolveChargeUserId = (vessel: VesselRecord) =>
  vessel.chartererId || vessel.leaseeId || vessel.ownerId || undefined;

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
  const realismRules = getRulesForSpace(spaceId);
  const damageEnabled = realismRules.realism?.damage === true;
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
        if (damageEnabled) {
          const relSpeed = Math.hypot(
            (a.velocity.surge ?? 0) - (b.velocity.surge ?? 0),
            (a.velocity.sway ?? 0) - (b.velocity.sway ?? 0),
          );
          const severity = Math.min(1, relSpeed / 6);
          a.damageState = applyCollisionDamage(
            mergeDamageState(a.damageState),
            severity,
          );
          b.damageState = applyCollisionDamage(
            mergeDamageState(b.damageState),
            severity,
          );
        }
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
        status: vessel.status || 'active',
        storagePortId: vessel.storagePortId ?? null,
        storedAt: vessel.storedAt ? new Date(vessel.storedAt) : null,
        chartererId: vessel.chartererId ?? null,
        leaseeId: vessel.leaseeId ?? null,
        templateId: vessel.templateId ?? null,
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
        hullIntegrity: vessel.damageState?.hullIntegrity ?? 1,
        engineHealth: vessel.damageState?.engineHealth ?? 1,
        steeringHealth: vessel.damageState?.steeringHealth ?? 1,
        electricalHealth: vessel.damageState?.electricalHealth ?? 1,
        floodingDamage: vessel.damageState?.floodingDamage ?? 0,
      },
      create: {
        id: vessel.id,
        spaceId: vessel.spaceId || DEFAULT_SPACE_ID,
        ownerId: vessel.ownerId ?? null,
        status: vessel.status || 'active',
        storagePortId: vessel.storagePortId ?? null,
        storedAt: vessel.storedAt ? new Date(vessel.storedAt) : null,
        chartererId: vessel.chartererId ?? null,
        leaseeId: vessel.leaseeId ?? null,
        templateId: vessel.templateId ?? null,
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
        hullIntegrity: vessel.damageState?.hullIntegrity ?? 1,
        engineHealth: vessel.damageState?.engineHealth ?? 1,
        steeringHealth: vessel.damageState?.steeringHealth ?? 1,
        electricalHealth: vessel.damageState?.electricalHealth ?? 1,
        floodingDamage: vessel.damageState?.floodingDamage ?? 0,
      },
    });
  } catch (err) {
    console.error(`Failed to persist vessel ${vessel.id}`, err);
  }
}

const buildVesselRecordFromRow = (row: {
  id: string;
  spaceId?: string | null;
  ownerId?: string | null;
  status?: string | null;
  storagePortId?: string | null;
  storedAt?: Date | null;
  chartererId?: string | null;
  leaseeId?: string | null;
  mode?: string | null;
  desiredMode?: string | null;
  lastCrewAt?: Date | null;
  lat: number;
  lon: number;
  z: number;
  heading: number;
  roll: number;
  pitch: number;
  surge: number;
  sway: number;
  heave: number;
  yawRate?: number | null;
  throttle: number;
  rudderAngle: number;
  ballast?: number | null;
  bowThruster?: number | null;
  mass: number;
  length: number;
  beam: number;
  draft: number;
  hullIntegrity?: number | null;
  engineHealth?: number | null;
  steeringHealth?: number | null;
  electricalHealth?: number | null;
  floodingDamage?: number | null;
  lastUpdate: Date;
  templateId?: string | null;
}): VesselRecord => {
  const template = resolveVesselTemplate(row.templateId ?? null);
  return {
    id: row.id,
    spaceId: row.spaceId || DEFAULT_SPACE_ID,
    ownerId: row.ownerId ?? null,
    status: row.status || 'active',
    storagePortId: row.storagePortId ?? null,
    storedAt: row.storedAt ? row.storedAt.getTime() : null,
    chartererId: row.chartererId ?? null,
    leaseeId: row.leaseeId ?? null,
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
    templateId: template.id,
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
      name: template.name,
      type: template.shipType,
      templateId: template.id,
      modelPath: template.modelPath ?? null,
      mass: row.mass,
      length: row.length,
      beam: row.beam,
      draft: row.draft,
      blockCoefficient: template.properties.blockCoefficient,
      maxSpeed: template.properties.maxSpeed,
    },
    hydrodynamics: buildHydrodynamics(template),
    physics: template.physics,
    render: template.render,
    controls: {
      throttle: row.throttle,
      rudderAngle: row.rudderAngle,
      ballast: row.ballast ?? 0.5,
      bowThruster: row.bowThruster ?? 0,
    },
    failureState: {
      engineFailure: false,
      steeringFailure: false,
      floodingLevel: 0,
      engineFailureAt: null,
      steeringFailureAt: null,
    },
    damageState: mergeDamageState({
      hullIntegrity: row.hullIntegrity ?? 1,
      engineHealth: row.engineHealth ?? 1,
      steeringHealth: row.steeringHealth ?? 1,
      electricalHealth: row.electricalHealth ?? 1,
      floodingDamage: row.floodingDamage ?? 0,
    }),
    lastUpdate: row.lastUpdate.getTime(),
  };
};

async function loadVesselsFromDb() {
  const rows = await prisma.vessel.findMany();
  if (!rows.length) return;

  rows.forEach((row: Parameters<typeof buildVesselRecordFromRow>[0]) => {
    const vessel = buildVesselRecordFromRow(row);
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
      const env = applyWeatherPattern(spaceId, pattern, globalState);
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
      tideHeight: 0,
      tideRange: 0,
      tidePhase: 0,
      tideTrend: 'rising',
      name: row.name || spaceId,
    };
    const tide = computeTideState({ timestampMs: Date.now(), spaceId });
    env.tideHeight = tide.height;
    env.tideRange = tide.range;
    env.tidePhase = tide.phase;
    env.tideTrend = tide.trend;
    globalState.environmentBySpace.set(spaceId, env);
    environmentPersistAt.set(spaceId, Date.now());
    console.info(`Loaded weather state for space ${row.spaceId}`);
  } catch (err) {
    console.warn('Failed to load weather state; using defaults', err);
  }
}

void seedCareerDefinitions().catch(err => {
  console.warn('Failed to seed career definitions', err);
});

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
  payload: Partial<VesselPose['position']> & {
    position?: Partial<VesselPose['position']>;
    templateId?: string;
  } = {},
  spaceId: string = DEFAULT_SPACE_ID,
): VesselRecord {
  const template = resolveVesselTemplate(payload.templateId);
  const nextPosition = ensurePosition(payload.position || payload);
  const vessel: VesselRecord = {
    id: `${userId}_${Date.now()}`,
    spaceId,
    ownerId: userId,
    status: 'active',
    storagePortId: null,
    storedAt: null,
    chartererId: null,
    leaseeId: null,
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
    templateId: template.id,
    position: nextPosition,
    orientation: { heading: 0, roll: 0, pitch: 0 },
    velocity: { surge: 0, sway: 0, heave: 0 },
    properties: {
      name: template.name,
      type: template.shipType,
      templateId: template.id,
      modelPath: template.modelPath ?? null,
      mass: template.properties.mass,
      length: template.properties.length,
      beam: template.properties.beam,
      draft: template.properties.draft,
      blockCoefficient: template.properties.blockCoefficient,
      maxSpeed: template.properties.maxSpeed,
    },
    hydrodynamics: buildHydrodynamics(template),
    physics: template.physics,
    render: template.render,
    controls: { throttle: 0, rudderAngle: 0, ballast: 0.5, bowThruster: 0 },
    failureState: {
      engineFailure: false,
      steeringFailure: false,
      floodingLevel: 0,
      engineFailureAt: null,
      steeringFailureAt: null,
    },
    damageState: { ...DEFAULT_DAMAGE_STATE },
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
  tideHeight: 0,
  tideRange: 0,
  tidePhase: 0,
  tideTrend: 'rising',
  name,
});

const applyEnvironmentOverrides = (
  spaceId: string,
  overrides: DeepPartial<EnvironmentState>,
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

const updateTideForSpace = (spaceId: string, now: number) => {
  const env = getEnvironmentForSpace(spaceId);
  const tide = computeTideState({
    timestampMs: now,
    spaceId,
    rangeOverride: env.tideRange,
  });
  const changed =
    Math.abs((env.tideHeight ?? 0) - tide.height) > 1e-4 ||
    Math.abs((env.tideRange ?? 0) - tide.range) > 1e-4 ||
    Math.abs((env.tidePhase ?? 0) - tide.phase) > 1e-4 ||
    env.tideTrend !== tide.trend;
  if (!changed) return false;
  env.tideHeight = tide.height;
  env.tideRange = tide.range;
  env.tidePhase = tide.phase;
  env.tideTrend = tide.trend;
  return true;
};

// Application state
const globalState = {
  vessels: new Map<string, VesselRecord>(),
  userLastVessel: new Map<string, string>(),
  environmentBySpace: new Map<string, EnvironmentState>([
    [DEFAULT_SPACE_ID, getDefaultEnvironment()],
  ]),
};

export const getEnvironmentForSpace = (spaceId: string): EnvironmentState => {
  const existing = globalState.environmentBySpace.get(spaceId);
  if (existing) return existing;
  const env = getDefaultEnvironment(spaceId);
  globalState.environmentBySpace.set(spaceId, env);
  return env;
};

export const getRulesForSpace = (spaceId: string): Rules => {
  const meta = spaceMetaCache.get(spaceId);
  if (meta?.rulesetType) {
    return getDefaultRules(mapToRulesetType(meta.rulesetType));
  }
  if (meta?.rules) return meta.rules as Rules;
  return getDefaultRules(mapToRulesetType('CASUAL'));
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

const aiControllers = new Map<string, { heading: number; speed: number }>();

function stepAIVessel(v: VesselRecord, dt: number) {
  // Simplified AI: bleed velocity to a stop with no roll/pitch/heave.
  const position = positionFromLatLon({
    lat: v.position.lat,
    lon: v.position.lon,
    z: v.position.z,
  });

  v.controls.throttle = 0;
  v.controls.rudderAngle = 0;
  v.yawRate = 0;
  v.orientation.heading = clampHeading(v.orientation.heading || 0);
  v.orientation.roll = 0;
  v.orientation.pitch = 0;

  const decay = Math.exp(-AI_STOP_DAMPING * dt);
  v.velocity.surge *= decay;
  v.velocity.sway *= decay;
  v.velocity.heave = 0;
  if (Math.abs(v.velocity.surge) < AI_STOP_EPS) v.velocity.surge = 0;
  if (Math.abs(v.velocity.sway) < AI_STOP_EPS) v.velocity.sway = 0;

  const cosH = Math.cos(v.orientation.heading);
  const sinH = Math.sin(v.orientation.heading);
  const worldU = v.velocity.surge * cosH - v.velocity.sway * sinH;
  const worldV = v.velocity.surge * sinH + v.velocity.sway * cosH;

  const nextX = (position.x ?? 0) + worldU * dt;
  const nextY = (position.y ?? 0) + worldV * dt;

  v.position = positionFromXY({ x: nextX, y: nextY, z: position.z });
}

// Simple server-side integrator for AI/abandoned vessels
const AI_STOP_DAMPING = 0.6;
const AI_STOP_EPS = 0.01;

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
      v.status !== 'stored' &&
      v.status !== 'repossession' &&
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
        v.status !== 'stored' &&
        v.status !== 'repossession' &&
        v.status !== 'auction' &&
        v.status !== 'sale' &&
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
): VesselRecord | undefined {
  // Prefer last vessel if still present
  const lastId = globalState.userLastVessel.get(userSpaceKey(userId, spaceId));
  if (lastId) {
    const lastVessel = globalState.vessels.get(lastId);
    if (lastVessel && (lastVessel.spaceId || DEFAULT_SPACE_ID) === spaceId) {
      if (
        lastVessel.status === 'stored' ||
        lastVessel.status === 'repossession' ||
        lastVessel.status === 'auction'
      ) {
        return undefined;
      }
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

    return undefined;
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
    v =>
      (v.ownerId === userId ||
        v.leaseeId === userId ||
        v.chartererId === userId) &&
      (v.spaceId || DEFAULT_SPACE_ID) === spaceId,
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

  return undefined;
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
): Promise<{ messages: ChatMessageData[]; hasMore: boolean }> => {
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
    .map(
      (r: {
        id: string;
        userId: string;
        username: string;
        message: string;
        createdAt: Date;
      }) => ({
        id: r.id,
        userId: r.userId,
        username: r.username,
        message: r.message,
        timestamp: r.createdAt.getTime(),
        channel,
      }),
    )
    .reverse();
  return { messages, hasMore };
};

const toSimpleVesselState = (v: VesselRecord): SimpleVesselState => {
  const mergedPosition = mergePosition(v.position);
  const env = getEnvironmentForSpace(v.spaceId || DEFAULT_SPACE_ID);
  const tideHeight = env.tideHeight ?? 0;
  const waterDepth = Math.max(
    0,
    (getBathymetryDepth(mergedPosition.lat, mergedPosition.lon) ?? 0) +
      tideHeight,
  );
  const failureState = v.failureState
    ? {
        engineFailure: v.failureState.engineFailure,
        steeringFailure: v.failureState.steeringFailure,
        floodingLevel: v.failureState.floodingLevel,
      }
    : undefined;
  const damageState = v.damageState
    ? {
        hullIntegrity: v.damageState.hullIntegrity,
        engineHealth: v.damageState.engineHealth,
        steeringHealth: v.damageState.steeringHealth,
        electricalHealth: v.damageState.electricalHealth,
        floodingDamage: v.damageState.floodingDamage,
      }
    : undefined;
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
    properties: v.properties,
    hydrodynamics: v.hydrodynamics,
    physics: v.physics,
    render: v.render,
    angularVelocity: { yaw: v.yawRate ?? 0 },
    waterDepth,
    failureState,
    damageState,
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
const allowedOrigins = parseAllowedOrigins({ production: PRODUCTION });

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
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
  return cookieHeader.split(';').reduce((acc, part) => {
    const token = part.trim();
    if (!token) {
      return acc;
    }

    const splitAt = token.indexOf('=');
    if (splitAt <= 0) {
      return acc;
    }

    const key = token.slice(0, splitAt).trim();
    if (!key) {
      return acc;
    }

    const rawValue = token.slice(splitAt + 1);
    try {
      acc[key] = decodeURIComponent(rawValue);
    } catch {
      // Malformed cookie fragments should not abort auth handshake processing.
      acc[key] = rawValue;
    }
    return acc;
  }, {} as Record<string, string>);
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
    origin: allowedOrigins,
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

  let vessel: VesselRecord | undefined = undefined;
  if (isPlayerOrHigher && !wantsSpectator) {
    vessel = ensureVesselForUser(effectiveUserId, effectiveUsername, spaceId);
    if (vessel) {
      socket.data.mode = 'player';
    } else {
      socket.data.mode = 'spectator';
      socket.data.autoJoin = false;
    }
  } else {
    socket.data.mode = 'spectator';
  }

  console.info(
    `Socket connected: ${effectiveUsername} (${effectiveUserId}) role=${isPlayerOrHigher ? 'player' : isSpectatorOnly ? 'spectator' : 'guest'} space=${spaceId}`,
  );
  if (effectiveUserId) {
    const existingSocketId = activeUserSockets.get(effectiveUserId);
    if (existingSocketId && existingSocketId !== socket.id) {
      activeUserSockets.set(effectiveUserId, socket.id);
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.emit(
          'error',
          'You were signed in elsewhere. This session is now spectator-only.',
        );
        existingSocket.disconnect(true);
      }
    } else {
      activeUserSockets.set(effectiveUserId, socket.id);
    }
  }
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

  const buildVesselRecordFromRowAdapter = (row: unknown): VesselRecord =>
    buildVesselRecordFromRow(
      row as Parameters<typeof buildVesselRecordFromRow>[0],
    );

  const createNewVesselForUserAdapter = (
    userId: string,
    username: string,
    payload: unknown,
    spaceId: string,
  ): VesselRecord =>
    createNewVesselForUser(
      userId,
      username,
      payload as Parameters<typeof createNewVesselForUser>[2],
      spaceId,
    );

  const updateStationAssignmentAdapter = (
    vessel: VesselRecord,
    station: 'helm' | 'engine' | 'radio',
    action: string,
    userId: string,
    username: string,
    isAdmin: boolean,
  ): { ok: true } | { ok: false; message?: string } => {
    const result = updateStationAssignment(
      vessel,
      station,
      action as 'claim' | 'release',
      userId,
      username,
      isAdmin,
    );
    return result.ok ? { ok: true } : result;
  };

  const handlerContext: SocketHandlerContext = {
    io,
    socket,
    spaceId,
    effectiveUserId,
    effectiveUsername,
    roleSet,
    isPlayerOrHigher: () =>
      (socket.data.roles || []).includes('player') ||
      (socket.data.roles || []).includes('admin'),
    isSpectatorOnly,
    isGuest,
    spaceMeta: {
      rankRequired: spaceMeta.rankRequired,
      rulesetType: spaceMeta.rulesetType,
      rules: spaceMeta.rules,
      name: spaceMeta.name,
      visibility: spaceMeta.visibility,
      kind: spaceMeta.kind,
    },
    globalState,
    getVesselIdForUser,
    ensureVesselForUser,
    buildVesselRecordFromRow: buildVesselRecordFromRowAdapter,
    findVesselInSpace,
    findJoinableVessel,
    userSpaceKey,
    maxCrew: MAX_CREW,
    createNewVesselForUser: createNewVesselForUserAdapter,
    updateStationAssignment: updateStationAssignmentAdapter,
    resolveChatChannel,
    normalizeVesselId,
    loadChatHistory,
    getActiveMute,
    getSpaceIdForSocket,
    assignStationsForCrew,
    detachUserFromCurrentVessel,
    updateSocketVesselRoom,
    toSimpleVesselState,
    persistVesselToDb,
    persistEnvironmentToDb,
    defaultSpaceId: DEFAULT_SPACE_ID,
    aiControllers,
    hasAdminRole,
    clamp,
    clampSigned,
    clampHeading,
    rudderMaxAngleRad: RUDDER_MAX_ANGLE_RAD,
    resolveChargeUserId,
    getRulesForSpace,
    syncUserSocketsEconomy,
    economyLedger,
    chatHistoryPageSize: CHAT_HISTORY_PAGE_SIZE,
    isSpaceHost,
    weather: {
      getMode: () => weatherMode,
      setMode: mode => {
        weatherMode = mode;
      },
      getTarget: () => targetWeather,
      setTarget: pattern => {
        targetWeather = pattern;
      },
      getNextAuto: () => nextAutoWeatherAt,
      setNextAuto: value => {
        nextAutoWeatherAt = value;
      },
    },
    getEnvironmentForSpace,
    currentUtcTimeOfDay,
    weatherAutoIntervalMs: WEATHER_AUTO_INTERVAL_MS,
    activeUserSockets,
  };

  // Send initial snapshot with recent chat history
  void (async () => {
    let chatHistory: ChatMessageData[] = [];
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
            return [] as ChatMessageData[];
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
        vesselId: vessel?.id || socket.data.vesselId,
      },
      spaceInfo: {
        id: spaceMeta.id,
        name: spaceMeta.name,
        visibility: spaceMeta.visibility,
        kind: spaceMeta.kind,
        rankRequired: spaceMeta.rankRequired,
        rules: spaceMeta.rulesetType
          ? getDefaultRules(mapToRulesetType(spaceMeta.rulesetType))
          : spaceMeta.rules,
        role: socket.data.spaceRole || 'member',
      },
      chatHistory,
    });
  })();

  registerVesselUpdateHandler(handlerContext);

  registerUserModeHandler(handlerContext);

  const buildGuestIdentity = () => {
    const guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
    const guestRoles = expandRoles(['guest']);
    const guestPermissions = permissionsForRoles(guestRoles);
    return {
      userId: guestId,
      username: 'Guest',
      roles: guestRoles,
      permissions: guestPermissions,
      rank: 0,
      credits: 0,
      experience: 0,
      safetyScore: 1,
      spaceRole: 'member' as const,
    };
  };

  socket.on('user:auth', async data => {
    const prevUserId = socket.data.userId || effectiveUserId;
    const prevUsername = socket.data.username || effectiveUsername;
    const rawToken = data?.token || null;
    const currentSpace = socket.data.spaceId || spaceId || DEFAULT_SPACE_ID;

    if (!rawToken || !NEXTAUTH_SECRET) {
      if (prevUserId) {
        detachUserFromCurrentVessel(prevUserId, currentSpace);
        updateSocketVesselRoom(socket, currentSpace, null);
        socket.leave(`user:${prevUserId}`);
      }
      const guest = buildGuestIdentity();
      socket.data.userId = guest.userId;
      socket.data.username = guest.username;
      socket.data.roles = guest.roles;
      socket.data.permissions = guest.permissions;
      socket.data.mode = 'spectator';
      socket.data.autoJoin = false;
      socket.data.rank = guest.rank;
      socket.data.credits = guest.credits;
      socket.data.experience = guest.experience;
      socket.data.safetyScore = guest.safetyScore;
      socket.data.spaceRole = guest.spaceRole;
      socket.join(`user:${guest.userId}`);
      if (prevUserId && activeUserSockets.get(prevUserId) === socket.id) {
        activeUserSockets.delete(prevUserId);
      }
      socket.emit('simulation:update', {
        vessels: {},
        partial: true,
        timestamp: Date.now(),
        self: {
          userId: guest.userId,
          roles: guest.roles as Role[],
          rank: guest.rank,
          credits: guest.credits,
          experience: guest.experience,
          safetyScore: guest.safetyScore,
          spaceId: currentSpace,
          mode: 'spectator',
          vesselId: undefined,
        },
      });
      return;
    }

    try {
      const decoded = jwt.verify(rawToken, NEXTAUTH_SECRET) as {
        sub?: string;
        name?: string;
        email?: string;
        role?: string;
      };
      const nextUserId =
        decoded.sub ||
        decoded.email ||
        data?.userId ||
        prevUserId ||
        `na_${Math.random().toString(36).slice(2, 8)}`;
      const nextUsername =
        decoded.name || decoded.email || data?.username || prevUsername;
      const baseRole: Role = (decoded.role as Role) || 'player';
      const roles = expandRoles(
        Array.from(
          new Set([
            baseRole,
            ...(ADMIN_USERS.includes(nextUserId) ||
            ADMIN_USERS.includes(nextUsername) ||
            (decoded.email && ADMIN_USERS.includes(decoded.email))
              ? (['admin'] as Role[])
              : []),
          ]),
        ) as Role[],
      );
      const permissions = permissionsForRoles(roles);
      const account =
        (await getEconomyProfile(nextUserId).catch(() => null)) ||
        DEFAULT_ECONOMY_PROFILE;
      const spaceRole = await getSpaceRole(nextUserId, currentSpace);
      const ban = await getActiveBan(nextUserId, nextUsername, currentSpace);
      if (ban) {
        socket.emit('error', `Banned: ${ban.reason || 'Access denied'}`);
        socket.disconnect(true);
        return;
      }

      if (prevUserId && prevUserId !== nextUserId) {
        detachUserFromCurrentVessel(prevUserId, currentSpace);
        updateSocketVesselRoom(socket, currentSpace, null);
        socket.leave(`user:${prevUserId}`);
      }

      socket.data.userId = nextUserId;
      socket.data.username = nextUsername;
      socket.data.roles = roles;
      socket.data.permissions = permissions;
      socket.data.rank = account.rank;
      socket.data.credits = account.credits;
      socket.data.experience = account.experience;
      socket.data.safetyScore = account.safetyScore;
      socket.data.spaceRole = spaceRole;
      socket.join(`user:${nextUserId}`);

      if (prevUserId && activeUserSockets.get(prevUserId) === socket.id) {
        activeUserSockets.delete(prevUserId);
      }
      activeUserSockets.set(nextUserId, socket.id);

      socket.emit('simulation:update', {
        vessels: {},
        partial: true,
        timestamp: Date.now(),
        self: {
          userId: nextUserId,
          roles,
          rank: account.rank,
          credits: account.credits,
          experience: account.experience,
          safetyScore: account.safetyScore,
          spaceId: currentSpace,
          mode: socket.data.mode || 'spectator',
          vesselId: socket.data.vesselId,
        },
      });
    } catch (err) {
      socket.emit('error', 'Authentication expired');
      console.error(err);
      if (prevUserId) {
        detachUserFromCurrentVessel(prevUserId, currentSpace);
        updateSocketVesselRoom(socket, currentSpace, null);
        socket.leave(`user:${prevUserId}`);
      }
      const guest = buildGuestIdentity();
      socket.data.userId = guest.userId;
      socket.data.username = guest.username;
      socket.data.roles = guest.roles;
      socket.data.permissions = guest.permissions;
      socket.data.mode = 'spectator';
      socket.data.autoJoin = false;
      socket.data.rank = guest.rank;
      socket.data.credits = guest.credits;
      socket.data.experience = guest.experience;
      socket.data.safetyScore = guest.safetyScore;
      socket.data.spaceRole = guest.spaceRole;
      socket.join(`user:${guest.userId}`);
      if (prevUserId && activeUserSockets.get(prevUserId) === socket.id) {
        activeUserSockets.delete(prevUserId);
      }
    }
  });

  // Handle vessel:control events
  registerVesselControlHandler(handlerContext);

  registerVesselRepairHandler(handlerContext);

  socket.on('disconnect', () => {
    if (effectiveUserId) {
      const current = activeUserSockets.get(effectiveUserId);
      if (current === socket.id) {
        activeUserSockets.delete(effectiveUserId);
      }
    }
  });

  // Handle simulation state changes
  registerSimulationStateHandler(handlerContext);
  registerSimulationResyncHandler(handlerContext);
  registerLatencyPingHandler(handlerContext);
  registerClientLogHandler(handlerContext);

  registerVesselJoinHandler(handlerContext);

  registerVesselStorageHandler(handlerContext);

  registerVesselSaleHandler(handlerContext);

  registerVesselLeaseHandler(handlerContext);

  registerEconomyHandlers(handlerContext);

  registerCargoHandlers(handlerContext);

  registerStationHandlers(handlerContext);

  registerAdminHandlers(handlerContext);

  registerChatHandlers(handlerContext);

  registerAdminWeatherHandler(handlerContext);

  registerSeamarksHandler(handlerContext);

  registerDisconnectHandler(handlerContext);
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
const BROADCAST_INTERVAL_MS = 200;

let environmentEventInterval: ReturnType<typeof setInterval> | null = null;
let broadcastInterval: ReturnType<typeof setInterval> | null = null;

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
        env = applyWeatherPattern(spaceId, pattern, globalState);
      }
      if (event.payload) {
        env = applyEnvironmentOverrides(
          spaceId,
          event.payload as DeepPartial<EnvironmentState>,
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
          event.endPayload as DeepPartial<EnvironmentState>,
        );
      } else {
        const pattern = getWeatherPattern();
        pattern.timeOfDay = env.timeOfDay ?? currentUtcTimeOfDay();
        env = applyWeatherPattern(spaceId, pattern, globalState);
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
    await loadSeamarks();
    await warmVesselCatalog();
    await loadVesselsFromDb();
    await loadEnvironmentFromDb(DEFAULT_SPACE_ID);
    const spaces = await prisma.space.findMany({ select: { id: true } });
    await Promise.all(
      spaces.map((space: { id: string }) =>
        seedDefaultMissions(space.id).catch(() => null),
      ),
    );
    await Promise.all(
      spaces.map((space: { id: string }) =>
        refreshSpaceMeta(space.id).catch(() => null),
      ),
    );
    server.listen(PORT, () => {
      console.info(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  void startServer();
  startRuntimeLoops();
}

function startRuntimeLoops() {
  if (!environmentEventInterval) {
    environmentEventInterval = setInterval(() => {
      void processEnvironmentEvents();
    }, ENV_EVENT_POLL_MS);
  }
  if (!broadcastInterval) {
    broadcastInterval = setInterval(() => {
      void broadcastTick();
    }, BROADCAST_INTERVAL_MS);
  }
}

function stopRuntimeLoops() {
  if (environmentEventInterval) {
    clearInterval(environmentEventInterval);
    environmentEventInterval = null;
  }
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
}

// Broadcast authoritative snapshots at a throttled rate (5Hz)
let lastBroadcastAt = Date.now();
const broadcastTick = async () => {
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
      applyWeatherPattern(DEFAULT_SPACE_ID, autoPattern, globalState);
      nextAutoWeatherAt = now + WEATHER_AUTO_INTERVAL_MS;
      environmentChanged = true;
      console.info(
        `Auto weather applied (${autoPattern.name}); next at ${new Date(nextAutoWeatherAt).toISOString()}`,
      );
    }
  }
  for (const sid of globalState.environmentBySpace.keys()) {
    updateTideForSpace(sid, now);
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

    const sid = v.spaceId || DEFAULT_SPACE_ID;
    const rules = getRulesForSpace(sid);
    if (rules.realism.failures) {
      const env = getEnvironmentForSpace(sid);
      const tideHeight = env.tideHeight ?? 0;
      const mergedPosition = mergePosition(v.position);
      const waterDepth = Math.max(
        0,
        (getBathymetryDepth(mergedPosition.lat, mergedPosition.lon) ?? 0) +
          tideHeight,
      );
      const speed = Math.hypot(v.velocity.surge, v.velocity.sway);
      const failureUpdate = updateFailureState({
        state: v.failureState,
        dt,
        nowMs: now,
        throttle: v.controls.throttle,
        rudderAngle: v.controls.rudderAngle,
        speed,
        waterDepth,
        draft: v.properties.draft,
        failuresEnabled: true,
      });
      v.failureState = failureUpdate.state;
      if (rules.realism.damage) {
        const currentDamage = mergeDamageState(v.damageState);
        v.damageState = applyFailureWear(
          currentDamage,
          failureUpdate.triggered.engineFailure,
          failureUpdate.triggered.steeringFailure,
        );
        if (
          Number.isFinite(waterDepth) &&
          Number.isFinite(v.properties.draft) &&
          waterDepth <= v.properties.draft + 0.1
        ) {
          const severity = Math.min(1, Math.max(0.2, speed / 5));
          v.damageState = applyGroundingDamage(v.damageState, dt, severity);
        }
      }
      if (failureUpdate.triggered.engineFailure) {
        recordLog({
          level: 'warn',
          source: 'failure',
          message: 'Engine failure triggered',
          meta: { vesselId: v.id, spaceId: sid },
        });
      }
      if (failureUpdate.triggered.steeringFailure) {
        recordLog({
          level: 'warn',
          source: 'failure',
          message: 'Steering failure triggered',
          meta: { vesselId: v.id, spaceId: sid },
        });
      }
      if (failureUpdate.triggered.flooding) {
        recordLog({
          level: 'warn',
          source: 'failure',
          message: 'Flooding detected',
          meta: { vesselId: v.id, spaceId: sid },
        });
      }
      if (failureUpdate.triggered.engineRecovered) {
        recordLog({
          level: 'info',
          source: 'failure',
          message: 'Engine failure cleared',
          meta: { vesselId: v.id, spaceId: sid },
        });
      }
      if (failureUpdate.triggered.steeringRecovered) {
        recordLog({
          level: 'info',
          source: 'failure',
          message: 'Steering failure cleared',
          meta: { vesselId: v.id, spaceId: sid },
        });
      }
      const limitedControls = applyFailureControlLimits(
        v.controls,
        v.failureState,
        v.damageState,
      );
      v.controls = {
        ...v.controls,
        ...limitedControls,
      };
    }
  }
  recordMetric('ai', Date.now() - aiStart);

  // Broadcast per space
  const vesselsBySpace = new Map<
    string,
    Record<string, ReturnType<typeof toSimpleVesselState>>
  >();
  const vesselCountsBySpace = new Map<
    string,
    { total: number; ai: number; player: number }
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
    const counts = vesselCountsBySpace.get(sid) || {
      total: 0,
      ai: 0,
      player: 0,
    };
    counts.total += 1;
    if (v.mode === 'ai') counts.ai += 1;
    if (v.mode === 'player') counts.player += 1;
    vesselCountsBySpace.set(sid, counts);
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

  const spaceIds = new Set<string>([
    ...globalState.environmentBySpace.keys(),
    ...spaceMetaCache.keys(),
    ...vesselsBySpace.keys(),
  ]);
  const spaceMetrics = Array.from(spaceIds).map(spaceId => {
    const counts = vesselCountsBySpace.get(spaceId) || {
      total: 0,
      ai: 0,
      player: 0,
    };
    const spaceRoom = io.sockets.adapter.rooms.get(`space:${spaceId}`);
    const connected = spaceRoom ? spaceRoom.size : 0;
    const meta = spaceMetaCache.get(spaceId);
    return {
      spaceId,
      name: meta?.name || spaceId,
      connected,
      vessels: counts.total,
      aiVessels: counts.ai,
      playerVessels: counts.player,
      lastBroadcastAt: now,
      updatedAt: now,
    };
  });
  updateSpaceMetrics(spaceMetrics);

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
      void updateCargoDeliveries({ vessels: vesselMap });
      void updatePassengerDeliveries({ vessels: vesselMap });
    }
  }

  void ensureCargoAvailability(now);
  void ensurePassengerAvailability(now);
  void sweepExpiredCargo(now);
  void sweepExpiredPassengers(now);

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
};

// Export the app and io for potential testing or extension
export const __test__ = {
  parseCookies,
  parseAllowedOrigins,
  getSpaceMeta,
  refreshSpaceMeta,
  getSpaceRole,
  applyEnvironmentOverrides,
  updateTideForSpace,
  getDefaultEnvironment,
  updateStationAssignment,
  assignStationsForCrew,
  detachUserFromCurrentVessel,
  updateSocketVesselRoom,
  resolveChatChannel,
  findJoinableVessel,
  takeOverAvailableAIVessel,
  ensureVesselForUser,
  getActiveBan,
  getActiveMute,
  buildVesselRecordFromRow,
  loadEnvironmentFromDb,
  loadVesselsFromDb,
  ensureDefaultSpaceExists,
  processEnvironmentEvents,
  broadcastTick,
  startServer,
  startRuntimeLoops,
  stopRuntimeLoops,
  globalState,
  spaceMetaCache,
  canTriggerCooldown,
  applyColregsRules,
  setNextAutoWeatherAt: (value: number) => {
    nextAutoWeatherAt = value;
  },
  setWeatherMode: (value: 'manual' | 'auto') => {
    weatherMode = value;
  },
  setLastBroadcastAt: (value: number) => {
    lastBroadcastAt = value;
  },
};
export { app, io };
