import express from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { authenticateRequest, requireAuth } from './middleware/authentication';
import { requirePermission, requireRole } from './middleware/authorization';
import { VesselState, ShipType } from '../types/vessel.types';
import { EnvironmentState } from '../types/environment.types';
import { prisma } from '../lib/prisma';

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
    position: {
      x: dbState.positionX,
      y: dbState.positionY,
      z: dbState.positionZ,
    },
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
  };
}

interface UserSettings {
  id: number;
  userId: string;
  cameraMode: string;
  soundEnabled: boolean;
  showHUD: boolean;
  timeScale: number;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemoryEnvironmentState extends EnvironmentState {
  id: number;
}

const router = express.Router();

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

    const nextState: DBVesselState = {
      id: vesselStates[userId]?.id ?? Date.now(),
      userId,
      vesselId: null,
      positionX: position?.x ?? 0,
      positionY: position?.y ?? 0,
      positionZ: position?.z ?? 0,
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

const serializeSpace = (space: {
  id: string;
  name: string;
  visibility: string;
  inviteToken: string | null;
  passwordHash?: string | null;
  createdBy?: string | null;
}) => ({
  id: space.id,
  name: space.name,
  visibility: space.visibility,
  inviteToken: space.inviteToken || undefined,
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
        createdBy: req.user?.userId || null,
      },
    });
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
      },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to save known space', err);
    res.status(500).json({ error: 'Failed to save known space' });
  }
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
  const { cameraMode, soundEnabled, showHUD, timeScale } = req.body;

  const settings: UserSettings = {
    id: userSettingsStore[userId]?.id ?? Date.now(),
    userId,
    cameraMode: cameraMode || 'thirdPerson',
    soundEnabled: soundEnabled !== undefined ? soundEnabled : true,
    showHUD: showHUD !== undefined ? showHUD : true,
    timeScale: timeScale || 1.0,
    createdAt: userSettingsStore[userId]?.createdAt ?? new Date(),
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

export default router;
