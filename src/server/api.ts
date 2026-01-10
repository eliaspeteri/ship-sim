import express from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { authenticateRequest, requireAuth } from './middleware/authentication';
import { requirePermission, requireRole } from './middleware/authorization';
import type { Role } from './roles';
import { VesselState, ShipType } from '../types/vessel.types';
import { EnvironmentState } from '../types/environment.types';
import { prisma } from '../lib/prisma';
import { ensurePosition, positionFromXY } from '../lib/position';
import { recordMetric, serverMetrics } from './metrics';
import { getEconomyProfile } from './economy';
import type {
  MissionAssignmentData,
  MissionDefinition,
} from '../types/mission.types';
import { seedDefaultMissions } from './missions';
import { clearLogs, getLogs } from './observability';
import { getScenarios } from '../lib/scenarios';
import { Rules } from '../types/rules.types';

// First, define proper types for the database models
interface DBVesselState {
  id: number;
  userId: string;
  vesselId?: number | null;
  positionX: number;
  positionY: number;
  positionZ: number;
  heading: number;
  roll: number;
  pitch: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  mass: number | null;
  length: number | null;
  beam: number | null;
  draft: number | null;
  throttle: number;
  rudderAngle: number;
  createdAt: Date;
  updatedAt: Date;
}

// Conversion helpers for transforming between DB and unified models
function dbVesselStateToUnified(dbState: DBVesselState): VesselState {
  return {
    position: positionFromXY({
      x: dbState.positionX,
      y: dbState.positionY,
      z: dbState.positionZ,
    }),
    orientation: {
      heading: dbState.heading,
      roll: dbState.roll,
      pitch: dbState.pitch,
    },
    velocity: {
      surge: dbState.velocityX,
      sway: dbState.velocityY,
      heave: dbState.velocityZ,
    },
    angularVelocity: { yaw: 0, roll: 0, pitch: 0 },
    controls: {
      throttle: dbState.throttle,
      rudderAngle: dbState.rudderAngle,
      ballast: 0.5, // Default value
    },
    properties: {
      name: 'Unknown Vessel',
      type: ShipType.DEFAULT,
      mass: dbState.mass || 50000,
      length: dbState.length || 200,
      beam: dbState.beam || 32,
      draft: dbState.draft || 12,
      blockCoefficient: 0.8,
      maxSpeed: 25,
    },
    engineState: {
      rpm: 0,
      fuelLevel: 1.0,
      fuelConsumption: 0,
      temperature: 25,
      oilPressure: 5.0,
      load: 0,
      running: false,
      hours: 0,
    },
    electricalSystem: {
      mainBusVoltage: 440,
      generatorOutput: 0,
      batteryLevel: 1.0,
      powerConsumption: 50,
      generatorRunning: true,
    },
    stability: {
      metacentricHeight: 2.0,
      centerOfGravity: { x: 0, y: 0, z: 6.0 },
      trim: 0,
      list: 0,
    },
    alarms: {
      engineOverheat: false,
      lowOilPressure: false,
      lowFuel: false,
      fireDetected: false,
      collisionAlert: false,
      stabilityWarning: false,
      generatorFault: false,
      blackout: false,
      otherAlarms: {},
    },
    hydrodynamics: {
      rudderForceCoefficient: 0,
      rudderStallAngle: 0,
      rudderMaxAngle: 0,
      dragCoefficient: 0,
      yawDamping: 0,
      yawDampingQuad: 0,
      swayDamping: 0,
      maxThrust: 0,
      rollDamping: 0,
      pitchDamping: 0,
      heaveStiffness: 0,
      heaveDamping: 0,
    },
  };
}

interface UserSettings {
  id: number;
  userId: string;
  cameraMode: string;
  soundEnabled: boolean;
  showHUD: boolean;
  timeScale: number;
  units: 'metric' | 'imperial' | 'nautical';
  speedUnit: 'knots' | 'kmh' | 'mph';
  distanceUnit: 'nm' | 'km' | 'mi';
  timeZoneMode: 'auto' | 'manual';
  timeZone: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemoryEnvironmentState extends EnvironmentState {
  id: number;
}

const router = express.Router();
const DEFAULT_SPACE_ID = process.env.DEFAULT_SPACE_ID || 'global';

const canManageSpace = async (
  req: { user?: { userId: string; roles: string[] } },
  spaceId: string,
) => {
  if (req.user?.roles?.includes('admin')) return true;
  if (!req.user?.userId) return false;
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { createdBy: true },
  });
  if (space?.createdBy && space.createdBy === req.user.userId) return true;
  const access = await prisma.spaceAccess.findUnique({
    where: {
      userId_spaceId: { userId: req.user.userId, spaceId },
    },
    select: { role: true },
  });
  return access?.role === 'host';
};

const vesselStates: Record<string, DBVesselState> = {};
const userSettingsStore: Record<string, UserSettings> = {};
let environmentState: InMemoryEnvironmentState = {
  id: 1,
  wind: { speed: 5, direction: 0, gusting: false, gustFactor: 1 },
  current: { speed: 0.5, direction: Math.PI / 4, variability: 0 },
  seaState: 3,
  timeOfDay: 12,
};

// Apply authentication middleware to all routes
router.use(authenticateRequest);
router.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    recordMetric('api', Date.now() - start);
  });
  next();
});

// GET /api/vessels
router.get(
  '/vessels',
  requireAuth,
  requirePermission('vessel', 'list'),
  async (req, res) => {
    res.json(Object.values(vesselStates));
  },
);

// GET /api/vessels/:userId
router.get('/vessels/:userId', requireAuth, function (req, res) {
  const { userId } = req.params;

  const dbVesselState = vesselStates[userId];
  if (!dbVesselState) {
    res.status(404).json({ error: 'Vessel state not found' });
    return;
  }
  const vesselState = dbVesselStateToUnified(dbVesselState);
  res.json(vesselState);
});

// POST /api/vessels/:userId
router.post(
  '/vessels/:userId',
  requireAuth,
  requirePermission('vessel', 'update'),
  function (req, res) {
    const { userId } = req.params;
    const { position, orientation, velocity, properties } = req.body;
    const nextPosition = ensurePosition(position);

    const nextState: DBVesselState = {
      id: vesselStates[userId]?.id ?? Date.now(),
      userId,
      vesselId: null,
      positionX: nextPosition.x ?? 0,
      positionY: nextPosition.y ?? 0,
      positionZ: nextPosition.z ?? 0,
      heading: orientation?.heading ?? 0,
      roll: orientation?.roll ?? 0,
      pitch: orientation?.pitch ?? 0,
      velocityX: velocity?.surge ?? 0,
      velocityY: velocity?.sway ?? 0,
      velocityZ: velocity?.heave ?? 0,
      mass: properties?.mass ?? 50000,
      length: properties?.length ?? 50,
      beam: properties?.beam ?? 10,
      draft: properties?.draft ?? 3,
      throttle: vesselStates[userId]?.throttle ?? 0,
      rudderAngle: vesselStates[userId]?.rudderAngle ?? 0,
      createdAt: vesselStates[userId]?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    vesselStates[userId] = nextState;
    res.json(nextState);
  },
);

// DELETE /api/vessels/:userId
router.delete(
  '/vessels/:userId',
  requireAuth,
  requirePermission('vessel', 'delete'),
  function (req, res) {
    const { userId } = req.params;

    if (!vesselStates[userId]) {
      res.status(404).json({ error: 'Vessel state not found' });
      return;
    }
    delete vesselStates[userId];
    res.json({ message: 'Vessel state deleted successfully' });
  },
);

// GET /api/environment
/**
 * Returns the current environment state in API format.
 */
router.get('/environment', function (req, res) {
  res.json(environmentState);
});

// POST /api/environment
router.post(
  '/environment',
  requireAuth,
  requirePermission('environment', 'update'),
  function (req, res) {
    const { wind, current, seaState } = req.body;

    environmentState = {
      ...environmentState,
      wind: {
        speed: wind?.speed ?? environmentState.wind.speed,
        direction: wind?.direction ?? environmentState.wind.direction,
        gusting: false,
        gustFactor: 1,
      },
      current: {
        speed: current?.speed ?? environmentState.current.speed,
        direction: current?.direction ?? environmentState.current.direction,
        variability: 0,
      },
      seaState: seaState ?? environmentState.seaState,
    };
    res.json(environmentState);
  },
);

// Environment scheduling (space owner or admin)
router.get('/environment/events', requireAuth, async (req, res) => {
  const spaceId =
    typeof req.query.spaceId === 'string'
      ? req.query.spaceId
      : DEFAULT_SPACE_ID;
  if (!(await canManageSpace(req, spaceId))) {
    res
      .status(403)
      .json({ error: 'Not authorized to view environment events' });
    return;
  }
  try {
    const events = await prisma.environmentEvent.findMany({
      where: { spaceId },
      orderBy: { runAt: 'asc' },
    });
    res.json({ events });
  } catch (err) {
    console.error('Failed to fetch environment events', err);
    res.status(500).json({ error: 'Failed to fetch environment events' });
  }
});

router.post('/environment/events', requireAuth, async (req, res) => {
  const spaceId =
    typeof req.body?.spaceId === 'string' ? req.body.spaceId : DEFAULT_SPACE_ID;
  if (!(await canManageSpace(req, spaceId))) {
    res
      .status(403)
      .json({ error: 'Not authorized to schedule environment events' });
    return;
  }
  const runAt = new Date(req.body?.runAt);
  const endAt = req.body?.endAt ? new Date(req.body.endAt) : null;
  if (!runAt || Number.isNaN(runAt.getTime())) {
    res.status(400).json({ error: 'runAt must be a valid date' });
    return;
  }
  if (endAt && Number.isNaN(endAt.getTime())) {
    res.status(400).json({ error: 'endAt must be a valid date' });
    return;
  }
  if (endAt && endAt <= runAt) {
    res.status(400).json({ error: 'endAt must be after runAt' });
    return;
  }
  if (!req.body?.pattern && !req.body?.payload) {
    res.status(400).json({ error: 'pattern or payload is required' });
    return;
  }
  try {
    const event = await prisma.environmentEvent.create({
      data: {
        spaceId,
        name: req.body?.name || null,
        pattern: req.body?.pattern || null,
        payload: req.body?.payload || null,
        runAt,
        endAt,
        enabled: req.body?.enabled !== false,
        createdBy: req.user?.userId || null,
      },
    });
    res.status(201).json(event);
  } catch (err) {
    console.error('Failed to create environment event', err);
    res.status(500).json({ error: 'Failed to create environment event' });
  }
});

router.delete('/environment/events/:eventId', requireAuth, async (req, res) => {
  const eventId = req.params.eventId;
  try {
    const event = await prisma.environmentEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    if (!(await canManageSpace(req, event.spaceId))) {
      res.status(403).json({ error: 'Not authorized to delete this event' });
      return;
    }
    await prisma.environmentEvent.delete({ where: { id: eventId } });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete environment event', err);
    res.status(500).json({ error: 'Failed to delete environment event' });
  }
});

// Missions & economy
router.get(
  '/missions',
  requireAuth,
  requirePermission('mission', 'list'),
  async (req, res) => {
    const spaceId =
      typeof req.query.spaceId === 'string'
        ? req.query.spaceId
        : DEFAULT_SPACE_ID;
    const rank = req.user?.rank ?? 1;
    try {
      const missions = (await prisma.mission.findMany({
        where: {
          spaceId,
          active: true,
          ...(req.user?.roles?.includes('admin')
            ? {}
            : { requiredRank: { lte: rank } }),
        },
        orderBy: { createdAt: 'asc' },
      })) as MissionDefinition[];
      res.json({ missions });
    } catch (err) {
      console.error('Failed to fetch missions', err);
      res.status(500).json({ error: 'Failed to fetch missions' });
    }
  },
);

router.post(
  '/missions/:missionId/assign',
  requireAuth,
  requirePermission('mission', 'assign'),
  async (req, res) => {
    const { missionId } = req.params;
    try {
      const mission = (await prisma.mission.findUnique({
        where: { id: missionId },
      })) as MissionDefinition | null;
      if (!mission || !mission.active) {
        res.status(404).json({ error: 'Mission not found' });
        return;
      }
      const rank = req.user?.rank ?? 1;
      if (!req.user?.roles?.includes('admin') && rank < mission.requiredRank) {
        res.status(403).json({ error: 'Rank too low for this mission' });
        return;
      }
      const existing = (await prisma.missionAssignment.findFirst({
        where: {
          userId: req.user!.userId,
          status: { in: ['assigned', 'in_progress'] },
        },
      })) as MissionAssignmentData | null;
      if (existing) {
        res.json({ assignment: { ...existing, mission } });
        return;
      }
      const assignment = await prisma.missionAssignment.create({
        data: {
          missionId,
          userId: req.user!.userId,
          vesselId: req.body?.vesselId || null,
          status: 'assigned',
          progress: { stage: 'pickup' },
        },
      });
      res.status(201).json({ assignment: { ...assignment, mission } });
    } catch (err) {
      console.error('Failed to assign mission', err);
      res.status(500).json({ error: 'Failed to assign mission' });
    }
  },
);

router.get(
  '/missions/assignments',
  requireAuth,
  requirePermission('mission', 'list'),
  async (req, res) => {
    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined;
    const statusList = status ? status.split(',') : undefined;
    try {
      const assignments = await prisma.missionAssignment.findMany({
        where: {
          userId: req.user!.userId,
          ...(statusList ? { status: { in: statusList } } : {}),
        },
        include: { mission: true },
        orderBy: { startedAt: 'desc' },
      });
      res.json({ assignments });
    } catch (err) {
      console.error('Failed to fetch mission assignments', err);
      res.status(500).json({ error: 'Failed to fetch mission assignments' });
    }
  },
);

router.post('/scenarios/:scenarioId/start', requireAuth, async (req, res) => {
  const { scenarioId } = req.params;
  const scenario = getScenarios().find(item => item.id === scenarioId);
  if (!scenario) {
    res.status(404).json({ error: 'Scenario not found' });
    return;
  }
  const rank = req.user?.rank ?? 1;
  if (!req.user?.roles?.includes('admin') && rank < scenario.rankRequired) {
    res.status(403).json({ error: 'Rank too low for this scenario' });
    return;
  }
  try {
    const name = `${scenario.name} (${req.user?.userId?.slice(0, 6) || 'pilot'})`;
    const space = await prisma.space.create({
      data: {
        name,
        visibility: 'private',
        kind: 'scenario',
        rankRequired: scenario.rankRequired,
        rules: scenario.rules,
        createdBy: req.user?.userId || null,
      },
    });
    await prisma.spaceAccess.create({
      data: {
        userId: req.user!.userId,
        spaceId: space.id,
        role: 'host',
        inviteToken: space.inviteToken || null,
      },
    });
    if (scenario.weatherPattern || scenario.environmentOverrides) {
      await prisma.environmentEvent.create({
        data: {
          spaceId: space.id,
          name: scenario.name,
          pattern: scenario.weatherPattern || null,
          payload: scenario.environmentOverrides || null,
          runAt: new Date(),
          enabled: true,
          createdBy: req.user?.userId || null,
        },
      });
    }
    res.status(201).json({
      space: serializeSpace(space),
      scenario,
    });
  } catch (err) {
    console.error('Failed to start scenario', err);
    res.status(500).json({ error: 'Failed to start scenario' });
  }
});

router.get(
  '/economy/summary',
  requireAuth,
  requirePermission('economy', 'read'),
  async (req, res) => {
    try {
      const profile = await getEconomyProfile(req.user!.userId);
      const transactions = await prisma.economyTransaction.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      res.json({ profile, transactions });
    } catch (err) {
      console.error('Failed to load economy summary', err);
      res.status(500).json({ error: 'Failed to load economy summary' });
    }
  },
);

router.get(
  '/economy/transactions',
  requireAuth,
  requirePermission('economy', 'read'),
  async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 50) || 50, 200);
    try {
      const transactions = await prisma.economyTransaction.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      res.json({ transactions });
    } catch (err) {
      console.error('Failed to fetch transactions', err);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  },
);

const normalizeRules = (value: unknown): Rules | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Rules;
};

const serializeSpace = (space: {
  id: string;
  name: string;
  visibility: string;
  inviteToken: string | null;
  passwordHash?: string | null;
  kind?: string | null;
  rankRequired?: number | null;
  rules?: unknown;
  createdBy?: string | null;
}) => ({
  id: space.id,
  name: space.name,
  visibility: space.visibility,
  inviteToken: space.inviteToken || undefined,
  kind: space.kind || 'free',
  rankRequired: space.rankRequired ?? 1,
  rules: normalizeRules(space.rules),
  createdBy: space.createdBy || undefined,
});

const mergeSpaces = (
  base: ReturnType<typeof serializeSpace>[],
  extra: ReturnType<typeof serializeSpace>[],
) => {
  const map = new Map<string, ReturnType<typeof serializeSpace>>();
  [...base, ...extra].forEach(s => map.set(s.id, s));
  return Array.from(map.values());
};

// GET /api/spaces - list public spaces or fetch private via invite token
router.get('/spaces', async (req, res) => {
  const inviteToken =
    typeof req.query.inviteToken === 'string'
      ? req.query.inviteToken.trim()
      : undefined;
  const password =
    typeof req.query.password === 'string' ? req.query.password : undefined;
  const includeKnown =
    typeof req.query.includeKnown === 'string' &&
    ['1', 'true', 'yes'].includes(req.query.includeKnown.toLowerCase());

  try {
    // Fetch public spaces first
    const publicSpaces = await prisma.space.findMany({
      where: { visibility: 'public' },
      orderBy: { createdAt: 'asc' },
    });

    const collected: ReturnType<typeof serializeSpace>[] =
      publicSpaces.map(serializeSpace);

    // Include known spaces for the current user
    if (includeKnown && req.user?.userId) {
      const known = await prisma.spaceAccess.findMany({
        where: { userId: req.user.userId },
        select: { spaceId: true },
      });
      const ids = known.map(k => k.spaceId).filter(Boolean);
      if (ids.length > 0) {
        const knownSpaces = await prisma.space.findMany({
          where: { id: { in: ids } },
        });
        knownSpaces.map(serializeSpace).forEach(s => collected.push(s));
      }
    }

    // If invite token was provided, fetch/authorize it
    if (inviteToken) {
      const space = await prisma.space.findUnique({
        where: { inviteToken },
      });
      if (!space) {
        res.status(404).json({ error: 'Space not found' });
        return;
      }
      if (space.visibility === 'private' && space.passwordHash) {
        if (!password) {
          res
            .status(403)
            .json({ error: 'Password required', requiresPassword: true });
          return;
        }
        const ok = await bcrypt.compare(password, space.passwordHash);
        if (!ok) {
          res
            .status(403)
            .json({ error: 'Invalid password', requiresPassword: true });
          return;
        }
      }
      collected.push(serializeSpace(space));
    }

    res.json({ spaces: mergeSpaces([], collected) });
  } catch (err) {
    console.error('Failed to fetch spaces', err);
    res.status(500).json({ error: 'Failed to fetch spaces' });
  }
});

// POST /api/spaces - create a new space
router.post('/spaces', requireAuth, async (req, res) => {
  const name = (req.body?.name || '').trim();
  if (!name) {
    res.status(400).json({ error: 'Space name is required' });
    return;
  }
  const visibility = req.body?.visibility === 'private' ? 'private' : 'public';
  const requestedKind = req.body?.kind;
  const kind =
    req.user?.roles?.includes('admin') &&
    (requestedKind === 'tutorial' || requestedKind === 'scenario')
      ? requestedKind
      : 'free';
  const rankRequiredRaw = Number(req.body?.rankRequired ?? 1);
  const rankRequired = Number.isFinite(rankRequiredRaw)
    ? Math.max(1, Math.round(rankRequiredRaw))
    : 1;
  const rules =
    req.user?.roles?.includes('admin') && req.body?.rules
      ? req.body.rules
      : null;
  const password =
    typeof req.body?.password === 'string' ? req.body.password : undefined;
  const inviteToken =
    (typeof req.body?.inviteToken === 'string' &&
      req.body.inviteToken.trim()) ||
    randomUUID();

  try {
    if (visibility === 'public') {
      const existing = await prisma.space.findFirst({
        where: { visibility: 'public', name },
      });
      if (existing) {
        res.status(409).json({ error: 'Public space name must be unique' });
        return;
      }
    }
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const space = await prisma.space.create({
      data: {
        name,
        visibility,
        inviteToken,
        passwordHash,
        kind,
        rankRequired,
        rules,
        createdBy: req.user?.userId || null,
      },
    });
    await seedDefaultMissions(space.id).catch(err => {
      console.warn('Failed to seed default missions', err);
    });
    if (req.user?.userId) {
      await prisma.spaceAccess.upsert({
        where: {
          userId_spaceId: { userId: req.user.userId, spaceId: space.id },
        },
        update: { role: 'host', inviteToken: space.inviteToken || null },
        create: {
          userId: req.user.userId,
          spaceId: space.id,
          inviteToken: space.inviteToken || null,
          role: 'host',
        },
      });
    }
    res.status(201).json(serializeSpace(space));
  } catch (err) {
    console.error('Failed to create space', err);
    res.status(500).json({ error: 'Failed to create space' });
  }
});

// POST /api/spaces/known - upsert a known space for the user
router.post('/spaces/known', requireAuth, async (req, res) => {
  const { spaceId, inviteToken } = req.body || {};
  if (!spaceId || typeof spaceId !== 'string') {
    res.status(400).json({ error: 'spaceId is required' });
    return;
  }
  try {
    const space = await prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) {
      res.status(404).json({ error: 'Space not found' });
      return;
    }
    await prisma.spaceAccess.upsert({
      where: { userId_spaceId: { userId: req.user!.userId, spaceId } },
      update: { inviteToken: inviteToken || space.inviteToken || null },
      create: {
        userId: req.user!.userId,
        spaceId,
        inviteToken: inviteToken || space.inviteToken || null,
        role: 'member',
      },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to save known space', err);
    res.status(500).json({ error: 'Failed to save known space' });
  }
});

// GET /api/spaces/mine - list spaces created by the current user
router.get('/spaces/mine', requireAuth, async (req, res) => {
  try {
    const spaces = await prisma.space.findMany({
      where: { createdBy: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      spaces: spaces.map(space => ({
        ...serializeSpace(space),
        createdAt: space.createdAt,
        updatedAt: space.updatedAt,
        passwordProtected: Boolean(space.passwordHash),
      })),
    });
  } catch (err) {
    console.error('Failed to fetch user spaces', err);
    res.status(500).json({ error: 'Failed to fetch user spaces' });
  }
});

// GET /api/spaces/manage - list spaces for management (admin can view all)
router.get('/spaces/manage', requireAuth, async (req, res) => {
  const scope = typeof req.query.scope === 'string' ? req.query.scope : 'mine';
  const isAdmin = req.user?.roles?.includes('admin');
  const where =
    scope === 'all' && isAdmin ? {} : { createdBy: req.user!.userId };
  try {
    const spaces = await prisma.space.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    if (spaces.length === 0) {
      res.json({ spaces: [] });
      return;
    }
    const spaceIds = spaces.map(space => space.id);
    const activeSince = new Date(Date.now() - 2 * 60 * 1000);
    const [vesselCounts, activeCounts] = await Promise.all([
      prisma.vessel.groupBy({
        by: ['spaceId'],
        _count: { _all: true },
        where: { spaceId: { in: spaceIds } },
      }),
      prisma.vessel.groupBy({
        by: ['spaceId'],
        _count: { _all: true },
        where: {
          spaceId: { in: spaceIds },
          lastUpdate: { gt: activeSince },
        },
      }),
    ]);
    const vesselCountMap = new Map(
      vesselCounts.map(entry => [entry.spaceId, entry._count._all]),
    );
    const activeCountMap = new Map(
      activeCounts.map(entry => [entry.spaceId, entry._count._all]),
    );
    res.json({
      spaces: spaces.map(space => ({
        ...serializeSpace(space),
        createdAt: space.createdAt,
        updatedAt: space.updatedAt,
        passwordProtected: Boolean(space.passwordHash),
        totalVessels: vesselCountMap.get(space.id) ?? 0,
        activeVessels: activeCountMap.get(space.id) ?? 0,
      })),
    });
  } catch (err) {
    console.error('Failed to fetch managed spaces', err);
    res.status(500).json({ error: 'Failed to fetch managed spaces' });
  }
});

// PATCH /api/spaces/:spaceId - update a space (owner only)
router.patch('/spaces/:spaceId', requireAuth, async (req, res) => {
  const { spaceId } = req.params;
  try {
    const space = await prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) {
      res.status(404).json({ error: 'Space not found' });
      return;
    }
    if (!(await canManageSpace(req, spaceId))) {
      res.status(403).json({ error: 'Not authorized to edit this space' });
      return;
    }

    const name =
      typeof req.body?.name === 'string' ? req.body.name.trim() : undefined;
    const visibility =
      req.body?.visibility === 'private' ? 'private' : req.body?.visibility;
    const password =
      typeof req.body?.password === 'string' ? req.body.password : undefined;
    const clearPassword = req.body?.clearPassword === true;
    const regenerateInvite = req.body?.regenerateInvite === true;
    const requestedKind = req.body?.kind;
    const requestedRank = Number(req.body?.rankRequired);
    const requestedRules = req.body?.rules;

    const nextVisibility =
      visibility === 'public' || visibility === 'private'
        ? visibility
        : space.visibility;
    const nextName = name || space.name;

    if (nextVisibility === 'public') {
      const existing = await prisma.space.findFirst({
        where: {
          visibility: 'public',
          name: nextName,
          NOT: { id: spaceId },
        },
      });
      if (existing) {
        res.status(409).json({ error: 'Public space name must be unique' });
        return;
      }
    }

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (nextVisibility !== space.visibility)
      updates.visibility = nextVisibility;
    if (regenerateInvite) updates.inviteToken = randomUUID();
    if (password && password.trim().length > 0) {
      updates.passwordHash = await bcrypt.hash(password, 10);
    } else if (clearPassword) {
      updates.passwordHash = null;
    }
    if (
      req.user?.roles?.includes('admin') &&
      (requestedKind === 'free' ||
        requestedKind === 'tutorial' ||
        requestedKind === 'scenario')
    ) {
      updates.kind = requestedKind;
    }
    if (req.user?.roles?.includes('admin') && Number.isFinite(requestedRank)) {
      updates.rankRequired = Math.max(1, Math.round(requestedRank));
    }
    if (requestedRules && (await canManageSpace(req, spaceId))) {
      updates.rules = requestedRules;
    }

    if (Object.keys(updates).length === 0) {
      res.json(serializeSpace(space));
      return;
    }

    const updated = await prisma.space.update({
      where: { id: spaceId },
      data: updates,
    });
    res.json(serializeSpace(updated));
  } catch (err) {
    console.error('Failed to update space', err);
    res.status(500).json({ error: 'Failed to update space' });
  }
});

// DELETE /api/spaces/:spaceId - delete a space (owner only)
router.delete('/spaces/:spaceId', requireAuth, async (req, res) => {
  const { spaceId } = req.params;
  if (spaceId === DEFAULT_SPACE_ID) {
    res.status(400).json({ error: 'Default space cannot be deleted' });
    return;
  }
  try {
    const space = await prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) {
      res.status(404).json({ error: 'Space not found' });
      return;
    }
    if (!(await canManageSpace(req, spaceId))) {
      res.status(403).json({ error: 'Not authorized to delete this space' });
      return;
    }
    const activeSince = new Date(Date.now() - 2 * 60 * 1000);
    const activeVesselCount = await prisma.vessel.count({
      where: { spaceId, lastUpdate: { gt: activeSince } },
    });
    if (activeVesselCount > 0) {
      res.status(409).json({
        error: 'Space has active vessels; wait until it is empty',
      });
      return;
    }
    const vesselCount = await prisma.vessel.count({
      where: { spaceId },
    });
    if (vesselCount > 0) {
      res
        .status(409)
        .json({ error: 'Space has vessels; remove them before deleting' });
      return;
    }
    await prisma.spaceAccess.deleteMany({ where: { spaceId } });
    await prisma.weatherState.deleteMany({ where: { spaceId } });
    await prisma.space.delete({ where: { id: spaceId } });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete space', err);
    res.status(500).json({ error: 'Failed to delete space' });
  }
});

// GET /api/metrics - basic server metrics (auth required)
router.get('/metrics', requireAuth, (_req, res) => {
  res.json(serverMetrics);
});

// GET /api/logs - aggregated logs (admin only)
router.get('/logs', requireAuth, requireRole(['admin']), (req, res) => {
  const since = Number(req.query.since ?? 0);
  const limit = Number(req.query.limit ?? 200);
  res.json({ logs: getLogs({ since, limit }) });
});

// DELETE /api/logs - clear log buffer (admin only)
router.delete('/logs', requireAuth, requireRole(['admin']), (_req, res) => {
  clearLogs();
  res.json({ success: true });
});

// GET /api/settings/:userId
router.get('/settings/:userId', requireAuth, function (req, res) {
  const { userId } = req.params;

  const settings = userSettingsStore[userId];
  if (!settings) {
    res.status(404).json({ error: 'Settings not found' });
    return;
  }
  res.json(settings);
});

// POST /api/settings/:userId
router.post('/settings/:userId', requireAuth, function (req, res) {
  const { userId } = req.params;
  const {
    cameraMode,
    soundEnabled,
    showHUD,
    timeScale,
    units,
    speedUnit,
    distanceUnit,
    timeZoneMode,
    timeZone,
  } = req.body;
  const existing = userSettingsStore[userId];

  const settings: UserSettings = {
    id: existing?.id ?? Date.now(),
    userId,
    cameraMode: cameraMode || existing?.cameraMode || 'thirdPerson',
    soundEnabled:
      soundEnabled !== undefined
        ? soundEnabled
        : (existing?.soundEnabled ?? true),
    showHUD: showHUD !== undefined ? showHUD : (existing?.showHUD ?? true),
    timeScale: timeScale || existing?.timeScale || 1.0,
    units:
      units === 'imperial' || units === 'nautical'
        ? units
        : existing?.units || 'metric',
    speedUnit:
      speedUnit === 'kmh' || speedUnit === 'mph' || speedUnit === 'knots'
        ? speedUnit
        : existing?.speedUnit || 'knots',
    distanceUnit:
      distanceUnit === 'km' || distanceUnit === 'mi' || distanceUnit === 'nm'
        ? distanceUnit
        : existing?.distanceUnit || 'nm',
    timeZoneMode: timeZoneMode === 'manual' ? 'manual' : 'auto',
    timeZone:
      typeof timeZone === 'string' && timeZone.trim().length > 0
        ? timeZone.trim()
        : existing?.timeZone || 'UTC',
    createdAt: existing?.createdAt ?? new Date(),
    updatedAt: new Date(),
  };
  userSettingsStore[userId] = settings;
  res.json(settings);
});

// GET /api/stats
router.get(
  '/stats',
  requireAuth,
  requireRole(['admin', 'instructor']),
  function (req, res) {
    const latest = Object.values(vesselStates).reduce<DBVesselState | null>(
      (current, next) => {
        if (!current) return next;
        return next.updatedAt > current.updatedAt ? next : current;
      },
      null,
    );
    res.json({
      vesselCount: Object.keys(vesselStates).length,
      lastUpdate: latest?.updatedAt || null,
    });
  },
);

// Moderation endpoints (admin only)
router.get(
  '/admin/moderation',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    const spaceId =
      typeof req.query.spaceId === 'string'
        ? req.query.spaceId
        : DEFAULT_SPACE_ID;
    try {
      const [bans, mutes] = await Promise.all([
        prisma.ban.findMany({
          where: { spaceId },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.mute.findMany({
          where: { spaceId },
          orderBy: { createdAt: 'desc' },
        }),
      ]);
      res.json({ bans, mutes });
    } catch (err) {
      console.error('Failed to load moderation list', err);
      res.status(500).json({ error: 'Failed to load moderation list' });
    }
  },
);

router.patch(
  '/admin/users/:userId/role',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    const { userId } = req.params;
    const nextRole = req.body?.role as Role | undefined;
    const allowed: Role[] = ['guest', 'spectator', 'player', 'admin'];
    if (!nextRole || !allowed.includes(nextRole)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: nextRole },
      });
      res.json({ id: updated.id, role: updated.role });
    } catch (err) {
      console.error('Failed to update user role', err);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  },
);

router.post(
  '/admin/bans',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    const { userId, username, spaceId, reason, expiresAt } = req.body || {};
    if (!userId && !username) {
      res.status(400).json({ error: 'userId or username is required' });
      return;
    }
    try {
      const ban = await prisma.ban.create({
        data: {
          userId: userId || null,
          username: username || null,
          spaceId: spaceId || DEFAULT_SPACE_ID,
          reason: reason || null,
          createdBy: req.user?.userId || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
      res.status(201).json(ban);
    } catch (err) {
      console.error('Failed to create ban', err);
      res.status(500).json({ error: 'Failed to create ban' });
    }
  },
);

router.delete(
  '/admin/bans/:banId',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      await prisma.ban.delete({ where: { id: req.params.banId } });
      res.json({ success: true });
    } catch (err) {
      console.error('Failed to delete ban', err);
      res.status(500).json({ error: 'Failed to delete ban' });
    }
  },
);

router.post(
  '/admin/mutes',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    const { userId, username, spaceId, reason, expiresAt } = req.body || {};
    if (!userId && !username) {
      res.status(400).json({ error: 'userId or username is required' });
      return;
    }
    try {
      const mute = await prisma.mute.create({
        data: {
          userId: userId || null,
          username: username || null,
          spaceId: spaceId || DEFAULT_SPACE_ID,
          reason: reason || null,
          createdBy: req.user?.userId || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
      res.status(201).json(mute);
    } catch (err) {
      console.error('Failed to create mute', err);
      res.status(500).json({ error: 'Failed to create mute' });
    }
  },
);

router.delete(
  '/admin/mutes/:muteId',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      await prisma.mute.delete({ where: { id: req.params.muteId } });
      res.json({ success: true });
    } catch (err) {
      console.error('Failed to delete mute', err);
      res.status(500).json({ error: 'Failed to delete mute' });
    }
  },
);

export default router;
