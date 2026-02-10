import express from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { authenticateRequest, requireAuth } from './middleware/authentication';
import { requirePermission, requireRole } from './middleware/authorization';
import type { Role } from './roles';
import { VesselState, ShipType } from '../types/vessel.types';
import { EnvironmentState } from '../types/environment.types';
import { prisma } from '../lib/prisma';
import {
  ensurePosition,
  positionFromLatLon,
  positionFromXY,
} from '../lib/position';
import { recordMetric, serverMetrics } from './metrics';
import { recordLog } from './observability';
import { buildRulesetAuditEntry } from '../lib/rulesetAudit';
import {
  ECONOMY_PORTS,
  getEconomyProfile,
  getVesselCargoCapacityTons,
  getVesselPassengerCapacity,
  estimateCargoCapacityTons,
  estimatePassengerCapacity,
  resolvePortForPosition,
} from './economy';
import { computeTurnaroundDelayMs, getPortCongestion } from './logistics';
import type {
  MissionAssignmentData,
  MissionDefinition,
} from '../types/mission.types';
import { seedDefaultMissions } from './missions';
import { clearLogs, getLogs } from './observability';
import { getScenarios } from '../lib/scenarios';
import { Rules } from '../types/rules.types';
import {
  CAREERS,
  getExamDefinitions,
  ensureUserCareers,
  issueLicense,
} from './careers';
import { getVesselCatalog, resolveVesselTemplate } from './vesselCatalog';

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
    physics: {
      model: 'displacement',
      schemaVersion: 1,
    },
  };
}

interface UserSettings {
  id: number;
  userId: string;
  soundEnabled: boolean;
  units: 'metric' | 'imperial' | 'nautical';
  speedUnit: 'knots' | 'kmh' | 'mph';
  distanceUnit: 'nm' | 'km' | 'mi';
  timeZoneMode: 'auto' | 'manual';
  timeZone: string;
  notificationLevel: 'all' | 'mentions' | 'none';
  interfaceDensity: 'comfortable' | 'compact';
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
  tideHeight: 0,
  tideRange: 0,
  tidePhase: 0,
  tideTrend: 'rising',
};

const SHIPYARD_USER_ID = 'system_shipyard';
const DEFAULT_CHARTER_TERM_HOURS = 48;
const DEFAULT_LEASE_TERM_HOURS = 168;
const MAX_TERM_HOURS = 24 * 30;

const ensureShipyardUser = async () => {
  const existing = await prisma.user.findUnique({
    where: { id: SHIPYARD_USER_ID },
  });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      id: SHIPYARD_USER_ID,
      name: 'Shipyard',
      role: 'system',
      credits: 0,
    },
  });
};

const resolvePortById = (portId?: string | null) =>
  ECONOMY_PORTS.find(port => port.id === portId) || ECONOMY_PORTS[0];

const buildVesselCreateData = ({
  id,
  templateId,
  spaceId,
  ownerId,
  status,
  storagePortId,
  storedAt,
  chartererId,
  leaseeId,
  portId,
}: {
  id: string;
  templateId: string;
  spaceId: string;
  ownerId: string | null;
  status: string;
  storagePortId?: string | null;
  storedAt?: Date | null;
  chartererId?: string | null;
  leaseeId?: string | null;
  portId?: string | null;
}) => {
  const template = resolveVesselTemplate(templateId);
  const port = resolvePortById(portId);
  const position = port?.position || positionFromXY({ x: 0, y: 0 });
  const now = new Date();
  const storedAtValue = status === 'stored' ? (storedAt ?? now) : null;
  return {
    id,
    spaceId,
    ownerId,
    status,
    storagePortId: storagePortId ?? port?.id ?? null,
    storedAt: storedAtValue,
    chartererId: chartererId ?? null,
    leaseeId: leaseeId ?? null,
    templateId: template.id,
    mode: 'ai',
    desiredMode: 'player',
    lastCrewAt: now,
    lat: position.lat ?? 0,
    lon: position.lon ?? 0,
    z: position.z ?? 0,
    heading: 0,
    roll: 0,
    pitch: 0,
    surge: 0,
    sway: 0,
    heave: 0,
    throttle: 0,
    rudderAngle: 0,
    ballast: 0.5,
    bowThruster: 0,
    yawRate: 0,
    mass: template.properties.mass,
    length: template.properties.length,
    beam: template.properties.beam,
    draft: template.properties.draft,
    lastUpdate: now,
    isAi: true,
    hullIntegrity: 1,
    engineHealth: 1,
    steeringHealth: 1,
    electricalHealth: 1,
    floodingDamage: 0,
  };
};

// GET /api/vessels
router.get('/vessels', async (req, res) => {
  try {
    const vessels = await prisma.vessel.findMany({
      orderBy: { lastUpdate: 'desc' },
    });
    res.json(
      vessels.map(
        (vessel: {
          id: string;
          spaceId: string;
          ownerId: string | null;
          mode: string;
          isAi: boolean;
          lastUpdate?: Date | null;
          lat: number;
          lon: number;
        }) => ({
          id: vessel.id,
          spaceId: vessel.spaceId,
          ownerId: vessel.ownerId,
          mode: vessel.mode,
          isAi: vessel.isAi,
          lastUpdate: vessel.lastUpdate?.getTime?.() ?? null,
          position: {
            lat: vessel.lat,
            lon: vessel.lon,
          },
        }),
      ),
    );
  } catch (err) {
    console.error('Failed to load vessels', err);
    res.status(500).json({ error: 'Failed to load vessels' });
  }
});

// GET /api/vessels/by-id/:vesselId
router.get('/vessels/by-id/:vesselId', async (req, res) => {
  const { vesselId } = req.params;
  try {
    const vessel = await prisma.vessel.findUnique({ where: { id: vesselId } });
    if (!vessel) {
      res.status(404).json({ error: 'Vessel not found' });
      return;
    }
    res.json({
      vessel: {
        id: vessel.id,
        spaceId: vessel.spaceId,
        ownerId: vessel.ownerId,
        mode: vessel.mode,
        desiredMode: vessel.desiredMode,
        lastCrewAt: vessel.lastCrewAt?.getTime?.() ?? null,
        position: {
          lat: vessel.lat,
          lon: vessel.lon,
          z: vessel.z,
        },
        orientation: {
          heading: vessel.heading,
          roll: vessel.roll,
          pitch: vessel.pitch,
        },
        velocity: {
          surge: vessel.surge,
          sway: vessel.sway,
          heave: vessel.heave,
        },
        controls: {
          throttle: vessel.throttle,
          rudderAngle: vessel.rudderAngle,
          ballast: vessel.ballast ?? 0.5,
          bowThruster: vessel.bowThruster ?? 0,
        },
        properties: {
          mass: vessel.mass,
          length: vessel.length,
          beam: vessel.beam,
          draft: vessel.draft,
        },
        yawRate: vessel.yawRate ?? 0,
        lastUpdate: vessel.lastUpdate?.getTime?.() ?? null,
        isAi: vessel.isAi,
      },
    });
  } catch (err) {
    console.error('Failed to fetch vessel by id', err);
    res.status(500).json({ error: 'Failed to fetch vessel' });
  }
});

// Apply authentication middleware to all routes
router.use(authenticateRequest);
router.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    recordMetric('api', Date.now() - start);
  });
  next();
});

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
          payload: scenario.environmentOverrides
            ? (scenario.environmentOverrides as Prisma.InputJsonValue)
            : undefined,
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

const toVesselPosition = (vessel: { lat: number; lon: number; z: number }) =>
  positionFromLatLon({ lat: vessel.lat, lon: vessel.lon, z: vessel.z || 0 });

const loadUserFleet = async (userId: string) =>
  prisma.vessel.findMany({
    where: {
      OR: [{ ownerId: userId }, { leaseeId: userId }, { chartererId: userId }],
    },
    orderBy: { lastUpdate: 'desc' },
  });

router.get(
  '/economy/dashboard',
  requireAuth,
  requirePermission('economy', 'read'),
  async (req, res) => {
    try {
      const profile = await getEconomyProfile(req.user!.userId);
      const fleet = await loadUserFleet(req.user!.userId);
      const activeVessel = fleet[0];
      const currentPort = activeVessel
        ? resolvePortForPosition(toVesselPosition(activeVessel))
        : null;
      const congestion = await getPortCongestion();
      const congestionMap = new Map(
        congestion.map(item => [item.portId, item.congestion]),
      );
      const ports = await Promise.all(
        ECONOMY_PORTS.map(async port => {
          const listed = await prisma.cargoLot.count({
            where: { portId: port.id, status: 'listed' },
          });
          const pax = await prisma.passengerContract.count({
            where: { originPortId: port.id, status: 'listed' },
          });
          return {
            ...port,
            listedCargo: listed,
            listedPassengers: pax,
            congestion: congestionMap.get(port.id) ?? 0,
          };
        }),
      );
      const loans = await prisma.loan.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
      });
      const insurance = await prisma.insurancePolicy.findMany({
        where: { ownerId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
      });
      const leases = await prisma.vesselLease.findMany({
        where: {
          OR: [{ ownerId: req.user!.userId }, { lesseeId: req.user!.userId }],
        },
        orderBy: { createdAt: 'desc' },
      });
      const sales = await prisma.vesselSale.findMany({
        where: {
          OR: [{ sellerId: req.user!.userId }, { buyerId: req.user!.userId }],
        },
        orderBy: { createdAt: 'desc' },
      });
      const passengerContracts = await prisma.passengerContract.findMany({
        where: {
          OR: [{ operatorId: req.user!.userId }, { status: 'listed' }],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      const missions = await prisma.mission.findMany({
        where: { spaceId: req.user?.spaceId || 'global', active: true },
        orderBy: { rewardCredits: 'desc' },
        take: 10,
      });

      res.json({
        profile,
        currentPort,
        ports,
        fleet,
        loans,
        insurance,
        leases,
        sales,
        passengerContracts,
        missions,
      });
    } catch (err) {
      console.error('Failed to load economy dashboard', err);
      res.status(500).json({ error: 'Failed to load economy dashboard' });
    }
  },
);

router.get(
  '/economy/ports',
  requireAuth,
  requirePermission('economy', 'read'),
  async (_req, res) => {
    try {
      const congestion = await getPortCongestion();
      const congestionMap = new Map(
        congestion.map(item => [item.portId, item.congestion]),
      );
      const ports = await Promise.all(
        ECONOMY_PORTS.map(async port => {
          const listed = await prisma.cargoLot.count({
            where: { portId: port.id, status: 'listed' },
          });
          const pax = await prisma.passengerContract.count({
            where: { originPortId: port.id, status: 'listed' },
          });
          return {
            ...port,
            listedCargo: listed,
            listedPassengers: pax,
            congestion: congestionMap.get(port.id) ?? 0,
          };
        }),
      );
      res.json({ ports });
    } catch (err) {
      console.error('Failed to load ports', err);
      res.status(500).json({ error: 'Failed to load ports' });
    }
  },
);

router.get('/economy/vessels/catalog', requireAuth, async (_req, res) => {
  try {
    const { entries } = getVesselCatalog();
    const vessels = entries.map(entry => ({
      ...entry,
      capacities: {
        cargoTons: estimateCargoCapacityTons(entry.properties.mass),
        passengers: estimatePassengerCapacity(entry.properties.length),
      },
    }));
    res.json({ vessels });
  } catch (err) {
    console.error('Failed to load vessel catalog', err);
    res.status(500).json({ error: 'Failed to load vessel catalog' });
  }
});

router.post('/economy/vessels/purchase', requireAuth, async (req, res) => {
  try {
    const templateId =
      typeof req.body?.templateId === 'string' ? req.body.templateId : null;
    const portId =
      typeof req.body?.portId === 'string' ? req.body.portId : null;
    const spaceId =
      typeof req.body?.spaceId === 'string' ? req.body.spaceId : 'global';
    if (!templateId) {
      res.status(400).json({ error: 'Missing vessel template' });
      return;
    }
    const catalog = getVesselCatalog();
    const template = catalog.byId.get(templateId);
    if (!template) {
      res.status(404).json({ error: 'Unknown vessel template' });
      return;
    }
    const price = template.commerce?.purchasePrice ?? 0;
    if (!price) {
      res.status(400).json({ error: 'Vessel not available for purchase' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { credits: true, rank: true },
    });
    if ((user?.rank ?? 1) < (template.commerce?.minRank ?? 1)) {
      res.status(403).json({ error: 'Rank too low for this vessel' });
      return;
    }
    if ((user?.credits ?? 0) < price) {
      res.status(400).json({ error: 'Insufficient credits' });
      return;
    }
    const vesselId = randomUUID();
    const vesselData = buildVesselCreateData({
      id: vesselId,
      templateId: template.id,
      spaceId,
      ownerId: req.user!.userId,
      status: 'stored',
      storagePortId: portId,
      portId,
    });
    await prisma.$transaction(async tx => {
      const txClient = tx as unknown as typeof prisma;
      await txClient.user.update({
        where: { id: req.user!.userId },
        data: { credits: { decrement: price } },
      });
      await txClient.vessel.create({ data: vesselData });
    });
    res.json({ vesselId, templateId: template.id });
  } catch (err) {
    console.error('Failed to purchase vessel', err);
    res.status(500).json({ error: 'Failed to purchase vessel' });
  }
});

router.post('/economy/vessels/lease', requireAuth, async (req, res) => {
  try {
    const templateId =
      typeof req.body?.templateId === 'string' ? req.body.templateId : null;
    const leaseType = req.body?.type === 'lease' ? 'lease' : 'charter';
    const portId =
      typeof req.body?.portId === 'string' ? req.body.portId : null;
    const spaceId =
      typeof req.body?.spaceId === 'string' ? req.body.spaceId : 'global';
    const requestedTerm =
      typeof req.body?.termHours === 'number' ? req.body.termHours : null;
    const termHours = Math.min(
      Math.max(
        1,
        requestedTerm ??
          (leaseType === 'lease'
            ? DEFAULT_LEASE_TERM_HOURS
            : DEFAULT_CHARTER_TERM_HOURS),
      ),
      MAX_TERM_HOURS,
    );
    if (!templateId) {
      res.status(400).json({ error: 'Missing vessel template' });
      return;
    }
    const catalog = getVesselCatalog();
    const template = catalog.byId.get(templateId);
    if (!template) {
      res.status(404).json({ error: 'Unknown vessel template' });
      return;
    }
    const rate =
      leaseType === 'lease'
        ? template.commerce?.leaseRatePerHour
        : template.commerce?.charterRatePerHour;
    if (!rate) {
      res.status(400).json({ error: 'Vessel not available for lease' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { rank: true },
    });
    if ((user?.rank ?? 1) < (template.commerce?.minRank ?? 1)) {
      res.status(403).json({ error: 'Rank too low for this vessel' });
      return;
    }
    const shipyard = await ensureShipyardUser();
    const vesselId = randomUUID();
    const vesselData = buildVesselCreateData({
      id: vesselId,
      templateId: template.id,
      spaceId,
      ownerId: shipyard.id,
      status: leaseType === 'lease' ? 'leased' : 'chartered',
      storagePortId: portId,
      portId,
      chartererId: leaseType === 'charter' ? req.user!.userId : null,
      leaseeId: leaseType === 'lease' ? req.user!.userId : null,
    });
    const lease = await prisma.$transaction(async tx => {
      const txClient = tx as unknown as typeof prisma;
      await txClient.vessel.create({ data: vesselData });
      return txClient.vesselLease.create({
        data: {
          vesselId,
          ownerId: shipyard.id,
          lesseeId: req.user!.userId,
          type: leaseType,
          ratePerHour: rate,
          revenueShare:
            leaseType === 'lease' ? (template.commerce?.revenueShare ?? 0) : 0,
          status: 'active',
          startedAt: new Date(),
          endsAt: new Date(Date.now() + termHours * 60 * 60 * 1000),
        },
      });
    });
    res.json({ leaseId: lease.id, vesselId, templateId: template.id });
  } catch (err) {
    console.error('Failed to create lease', err);
    res.status(500).json({ error: 'Failed to create lease' });
  }
});

router.get(
  '/economy/cargo',
  requireAuth,
  requirePermission('economy', 'read'),
  async (req, res) => {
    try {
      const portId =
        typeof req.query.portId === 'string' ? req.query.portId : undefined;
      const vesselId =
        typeof req.query.vesselId === 'string' ? req.query.vesselId : undefined;
      const where = portId ? { portId, status: 'listed' } : undefined;
      const cargo = await prisma.cargoLot.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      if (vesselId) {
        const vessel = await prisma.vessel.findUnique({
          where: { id: vesselId },
        });
        if (vessel) {
          const loaded = await prisma.cargoLot.aggregate({
            where: { vesselId, status: 'loaded' },
            _sum: { weightTons: true },
          });
          const capacityTons = getVesselCargoCapacityTons({
            id: vessel.id,
            spaceId: vessel.spaceId || 'global',
            ownerId: vessel.ownerId ?? null,
            status: vessel.status || 'active',
            storagePortId: vessel.storagePortId ?? null,
            storedAt: vessel.storedAt?.getTime() || null,
            chartererId: vessel.chartererId ?? null,
            leaseeId: vessel.leaseeId ?? null,
            crewIds: new Set<string>(),
            crewNames: new Map<string, string>(),
            mode: (vessel.mode as 'player' | 'ai') || 'ai',
            desiredMode: (vessel.desiredMode as 'player' | 'ai') || 'player',
            lastCrewAt: vessel.lastCrewAt?.getTime() || Date.now(),
            position: toVesselPosition(vessel),
            orientation: {
              heading: vessel.heading,
              roll: vessel.roll,
              pitch: vessel.pitch,
            },
            velocity: {
              surge: vessel.surge,
              sway: vessel.sway,
              heave: vessel.heave,
            },
            properties: {
              mass: vessel.mass,
              length: vessel.length,
              beam: vessel.beam,
              draft: vessel.draft,
            },
            controls: {
              throttle: vessel.throttle,
              rudderAngle: vessel.rudderAngle,
              ballast: vessel.ballast ?? 0.5,
              bowThruster: vessel.bowThruster ?? 0,
            },
            lastUpdate: vessel.lastUpdate.getTime(),
          });
          res.json({
            cargo,
            capacityTons,
            loadedTons: loaded._sum.weightTons ?? 0,
          });
          return;
        }
      }
      res.json({ cargo });
    } catch (err) {
      console.error('Failed to load cargo', err);
      res.status(500).json({ error: 'Failed to load cargo' });
    }
  },
);

router.post('/economy/cargo/assign', requireAuth, async (req, res) => {
  try {
    const { cargoId, vesselId } = req.body || {};
    if (!cargoId || !vesselId) {
      res.status(400).json({ error: 'Missing cargo or vessel id' });
      return;
    }
    const cargo = await prisma.cargoLot.findUnique({ where: { id: cargoId } });
    if (!cargo || (cargo.ownerId && cargo.ownerId !== req.user!.userId)) {
      res.status(404).json({ error: 'Cargo not found' });
      return;
    }
    if (cargo.status !== 'listed') {
      res.status(400).json({ error: 'Cargo not available' });
      return;
    }
    if (cargo.expiresAt && cargo.expiresAt.getTime() < Date.now()) {
      res.status(400).json({ error: 'Cargo offer expired' });
      return;
    }
    const vessel = await prisma.vessel.findUnique({ where: { id: vesselId } });
    if (!vessel) {
      res.status(404).json({ error: 'Vessel not found' });
      return;
    }
    const port = resolvePortForPosition(toVesselPosition(vessel));
    if (!port || (cargo.portId && cargo.portId !== port.id)) {
      res.status(400).json({ error: 'Vessel must be in the cargo port' });
      return;
    }
    const loaded = await prisma.cargoLot.aggregate({
      where: { vesselId, status: { in: ['loaded', 'loading'] } },
      _sum: { weightTons: true },
    });
    const capacityTons = getVesselCargoCapacityTons({
      id: vessel.id,
      spaceId: vessel.spaceId || 'global',
      ownerId: vessel.ownerId ?? null,
      status: vessel.status || 'active',
      storagePortId: vessel.storagePortId ?? null,
      storedAt: vessel.storedAt?.getTime() || null,
      chartererId: vessel.chartererId ?? null,
      leaseeId: vessel.leaseeId ?? null,
      crewIds: new Set<string>(),
      crewNames: new Map<string, string>(),
      mode: (vessel.mode as 'player' | 'ai') || 'ai',
      desiredMode: (vessel.desiredMode as 'player' | 'ai') || 'player',
      lastCrewAt: vessel.lastCrewAt?.getTime() || Date.now(),
      position: toVesselPosition(vessel),
      orientation: {
        heading: vessel.heading,
        roll: vessel.roll,
        pitch: vessel.pitch,
      },
      velocity: { surge: vessel.surge, sway: vessel.sway, heave: vessel.heave },
      properties: {
        mass: vessel.mass,
        length: vessel.length,
        beam: vessel.beam,
        draft: vessel.draft,
      },
      controls: {
        throttle: vessel.throttle,
        rudderAngle: vessel.rudderAngle,
        ballast: vessel.ballast ?? 0.5,
        bowThruster: vessel.bowThruster ?? 0,
      },
      lastUpdate: vessel.lastUpdate.getTime(),
    });
    const currentWeight = loaded._sum.weightTons ?? 0;
    if (currentWeight + (cargo.weightTons ?? 0) > capacityTons) {
      res.status(400).json({ error: 'Cargo exceeds vessel capacity' });
      return;
    }
    const congestion = await getPortCongestion();
    const portCongestion =
      congestion.find(item => item.portId === port.id)?.congestion ?? 0;
    const readyAt = new Date(
      Date.now() + computeTurnaroundDelayMs(portCongestion),
    );
    await prisma.cargoLot.update({
      where: { id: cargo.id },
      data: {
        vesselId,
        carrierId: req.user!.userId,
        status: 'loading',
        readyAt,
        portId: null,
      },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to assign cargo', err);
    res.status(500).json({ error: 'Failed to assign cargo' });
  }
});

router.post('/economy/cargo/release', requireAuth, async (req, res) => {
  try {
    const { cargoId } = req.body || {};
    if (!cargoId) {
      res.status(400).json({ error: 'Missing cargo id' });
      return;
    }
    const cargo = await prisma.cargoLot.findUnique({ where: { id: cargoId } });
    if (!cargo || (cargo.ownerId && cargo.ownerId !== req.user!.userId)) {
      res.status(404).json({ error: 'Cargo not found' });
      return;
    }
    await prisma.cargoLot.update({
      where: { id: cargo.id },
      data: { vesselId: null, status: 'delivered', portId: null },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to release cargo', err);
    res.status(500).json({ error: 'Failed to release cargo' });
  }
});

router.get('/economy/passengers', requireAuth, async (req, res) => {
  try {
    const portId =
      typeof req.query.portId === 'string' ? req.query.portId : undefined;
    const vesselId =
      typeof req.query.vesselId === 'string' ? req.query.vesselId : undefined;
    const where = portId
      ? { originPortId: portId, status: 'listed' }
      : undefined;
    const contracts = await prisma.passengerContract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    if (vesselId) {
      const vessel = await prisma.vessel.findUnique({
        where: { id: vesselId },
      });
      if (vessel) {
        const onboard = await prisma.passengerContract.aggregate({
          where: { vesselId, status: 'in_progress' },
          _sum: { paxCount: true },
        });
        const capacity = getVesselPassengerCapacity({
          id: vessel.id,
          spaceId: vessel.spaceId || 'global',
          ownerId: vessel.ownerId ?? null,
          status: vessel.status || 'active',
          storagePortId: vessel.storagePortId ?? null,
          storedAt: vessel.storedAt?.getTime() || null,
          chartererId: vessel.chartererId ?? null,
          leaseeId: vessel.leaseeId ?? null,
          crewIds: new Set<string>(),
          crewNames: new Map<string, string>(),
          mode: (vessel.mode as 'player' | 'ai') || 'ai',
          desiredMode: (vessel.desiredMode as 'player' | 'ai') || 'player',
          lastCrewAt: vessel.lastCrewAt?.getTime() || Date.now(),
          position: toVesselPosition(vessel),
          orientation: {
            heading: vessel.heading,
            roll: vessel.roll,
            pitch: vessel.pitch,
          },
          velocity: {
            surge: vessel.surge,
            sway: vessel.sway,
            heave: vessel.heave,
          },
          properties: {
            mass: vessel.mass,
            length: vessel.length,
            beam: vessel.beam,
            draft: vessel.draft,
          },
          controls: {
            throttle: vessel.throttle,
            rudderAngle: vessel.rudderAngle,
            ballast: vessel.ballast ?? 0.5,
            bowThruster: vessel.bowThruster ?? 0,
          },
          lastUpdate: vessel.lastUpdate.getTime(),
        });
        res.json({
          contracts,
          capacity,
          onboard: onboard._sum.paxCount ?? 0,
        });
        return;
      }
    }
    res.json({ contracts });
  } catch (err) {
    console.error('Failed to load passenger contracts', err);
    res.status(500).json({ error: 'Failed to load passenger contracts' });
  }
});

router.post('/economy/passengers/accept', requireAuth, async (req, res) => {
  try {
    const { contractId, vesselId } = req.body || {};
    if (!contractId || !vesselId) {
      res.status(400).json({ error: 'Missing contract or vessel id' });
      return;
    }
    const contract = await prisma.passengerContract.findUnique({
      where: { id: contractId },
    });
    if (!contract || contract.status !== 'listed') {
      res.status(404).json({ error: 'Passenger contract not available' });
      return;
    }
    if (contract.expiresAt && contract.expiresAt.getTime() < Date.now()) {
      res.status(400).json({ error: 'Passenger contract expired' });
      return;
    }
    const vessel = await prisma.vessel.findUnique({ where: { id: vesselId } });
    if (!vessel) {
      res.status(404).json({ error: 'Vessel not found' });
      return;
    }
    const port = resolvePortForPosition(toVesselPosition(vessel));
    if (!port || port.id !== contract.originPortId) {
      res.status(400).json({ error: 'Vessel must be at the origin port' });
      return;
    }
    const onboard = await prisma.passengerContract.aggregate({
      where: { vesselId, status: { in: ['in_progress', 'boarding'] } },
      _sum: { paxCount: true },
    });
    const capacity = getVesselPassengerCapacity({
      id: vessel.id,
      spaceId: vessel.spaceId || 'global',
      ownerId: vessel.ownerId ?? null,
      status: vessel.status || 'active',
      storagePortId: vessel.storagePortId ?? null,
      storedAt: vessel.storedAt?.getTime() || null,
      chartererId: vessel.chartererId ?? null,
      leaseeId: vessel.leaseeId ?? null,
      crewIds: new Set<string>(),
      crewNames: new Map<string, string>(),
      mode: (vessel.mode as 'player' | 'ai') || 'ai',
      desiredMode: (vessel.desiredMode as 'player' | 'ai') || 'player',
      lastCrewAt: vessel.lastCrewAt?.getTime() || Date.now(),
      position: toVesselPosition(vessel),
      orientation: {
        heading: vessel.heading,
        roll: vessel.roll,
        pitch: vessel.pitch,
      },
      velocity: { surge: vessel.surge, sway: vessel.sway, heave: vessel.heave },
      properties: {
        mass: vessel.mass,
        length: vessel.length,
        beam: vessel.beam,
        draft: vessel.draft,
      },
      controls: {
        throttle: vessel.throttle,
        rudderAngle: vessel.rudderAngle,
        ballast: vessel.ballast ?? 0.5,
        bowThruster: vessel.bowThruster ?? 0,
      },
      lastUpdate: vessel.lastUpdate.getTime(),
    });
    const current = onboard._sum.paxCount ?? 0;
    if (current + contract.paxCount > capacity) {
      res.status(400).json({ error: 'Passenger load exceeds capacity' });
      return;
    }
    const congestion = await getPortCongestion();
    const portCongestion =
      congestion.find(item => item.portId === port.id)?.congestion ?? 0;
    const readyAt = new Date(
      Date.now() + computeTurnaroundDelayMs(portCongestion),
    );
    const updated = await prisma.passengerContract.update({
      where: { id: contract.id },
      data: {
        vesselId,
        operatorId: req.user!.userId,
        status: 'boarding',
        readyAt,
      },
    });
    res.json({ contract: updated });
  } catch (err) {
    console.error('Failed to accept passenger contract', err);
    res.status(500).json({ error: 'Failed to accept passenger contract' });
  }
});

router.get('/economy/fleet', requireAuth, async (req, res) => {
  try {
    const fleet = await loadUserFleet(req.user!.userId);
    res.json({ fleet });
  } catch (err) {
    console.error('Failed to load fleet', err);
    res.status(500).json({ error: 'Failed to load fleet' });
  }
});

router.get('/economy/loans', requireAuth, async (req, res) => {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ loans });
  } catch (err) {
    console.error('Failed to load loans', err);
    res.status(500).json({ error: 'Failed to load loans' });
  }
});

router.post('/economy/loans/request', requireAuth, async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: 'Invalid loan amount' });
      return;
    }
    const rank = req.user?.rank ?? 1;
    const maxLoan = 5000 + rank * 2000;
    const existing = await prisma.loan.aggregate({
      where: { userId: req.user!.userId, status: 'active' },
      _sum: { balance: true },
    });
    const activeBalance = existing._sum.balance ?? 0;
    if (activeBalance + amount > maxLoan) {
      res.status(400).json({ error: 'Loan request exceeds available credit' });
      return;
    }
    const termDays =
      Number.isFinite(req.body?.termDays) && Number(req.body.termDays) > 0
        ? Number(req.body.termDays)
        : 14;
    const interestRate =
      Number.isFinite(req.body?.interestRate) &&
      Number(req.body.interestRate) > 0
        ? Number(req.body.interestRate)
        : 0.08;
    const loan = await prisma.loan.create({
      data: {
        userId: req.user!.userId,
        principal: amount,
        balance: amount,
        interestRate,
        issuedAt: new Date(),
        dueAt: new Date(Date.now() + termDays * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { credits: { increment: amount } },
    });
    res.json({ loan });
  } catch (err) {
    console.error('Failed to issue loan', err);
    res.status(500).json({ error: 'Failed to issue loan' });
  }
});

router.post('/economy/loans/repay', requireAuth, async (req, res) => {
  try {
    const loanId = req.body?.loanId;
    const amount = Number(req.body?.amount);
    if (!loanId || !Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: 'Invalid repayment' });
      return;
    }
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan || loan.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Loan not found' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { credits: true },
    });
    const available = user?.credits ?? 0;
    const payAmount = Math.min(amount, loan.balance, available);
    if (payAmount <= 0) {
      res.status(400).json({ error: 'Insufficient credits' });
      return;
    }
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { credits: { decrement: payAmount } },
    });
    const nextBalance = loan.balance - payAmount;
    await prisma.loan.update({
      where: { id: loan.id },
      data: {
        balance: nextBalance,
        status: nextBalance <= 0 ? 'paid' : loan.status,
      },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to repay loan', err);
    res.status(500).json({ error: 'Failed to repay loan' });
  }
});

router.get('/economy/insurance', requireAuth, async (req, res) => {
  try {
    const policies = await prisma.insurancePolicy.findMany({
      where: { ownerId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ policies });
  } catch (err) {
    console.error('Failed to load insurance policies', err);
    res.status(500).json({ error: 'Failed to load insurance policies' });
  }
});

router.post('/economy/insurance/purchase', requireAuth, async (req, res) => {
  try {
    const { vesselId, coverage, deductible, premiumRate } = req.body || {};
    if (!vesselId || !coverage || premiumRate === undefined) {
      res.status(400).json({ error: 'Invalid insurance terms' });
      return;
    }
    const vessel = await prisma.vessel.findUnique({ where: { id: vesselId } });
    if (!vessel || vessel.ownerId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    const termDays =
      Number.isFinite(req.body?.termDays) && Number(req.body.termDays) > 0
        ? Number(req.body.termDays)
        : 30;
    const policy = await prisma.insurancePolicy.create({
      data: {
        vesselId,
        ownerId: req.user!.userId,
        type:
          req.body?.type === 'loss' || req.body?.type === 'salvage'
            ? req.body.type
            : 'damage',
        coverage: Number(coverage),
        deductible: Number(deductible) || 0,
        premiumRate: Number(premiumRate),
        status: 'active',
        activeFrom: new Date(),
        activeUntil: new Date(Date.now() + termDays * 24 * 60 * 60 * 1000),
        lastChargedAt: new Date(),
      },
    });
    res.json({ policy });
  } catch (err) {
    console.error('Failed to purchase insurance', err);
    res.status(500).json({ error: 'Failed to purchase insurance' });
  }
});

router.post('/economy/insurance/cancel', requireAuth, async (req, res) => {
  try {
    const policyId = req.body?.policyId;
    if (!policyId) {
      res.status(400).json({ error: 'Missing policy id' });
      return;
    }
    const policy = await prisma.insurancePolicy.findUnique({
      where: { id: policyId },
    });
    if (!policy || policy.ownerId !== req.user!.userId) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    await prisma.insurancePolicy.update({
      where: { id: policy.id },
      data: { status: 'canceled', activeUntil: new Date() },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to cancel insurance', err);
    res.status(500).json({ error: 'Failed to cancel insurance' });
  }
});

router.get('/economy/leases', requireAuth, async (req, res) => {
  try {
    const leases = await prisma.vesselLease.findMany({
      where: {
        OR: [{ ownerId: req.user!.userId }, { lesseeId: req.user!.userId }],
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ leases });
  } catch (err) {
    console.error('Failed to load leases', err);
    res.status(500).json({ error: 'Failed to load leases' });
  }
});

router.post('/economy/leases', requireAuth, async (req, res) => {
  try {
    const { vesselId, ratePerHour } = req.body || {};
    if (!vesselId || !ratePerHour) {
      res.status(400).json({ error: 'Invalid lease terms' });
      return;
    }
    const vessel = await prisma.vessel.findUnique({ where: { id: vesselId } });
    if (!vessel || vessel.ownerId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    const lease = await prisma.vesselLease.create({
      data: {
        vesselId,
        ownerId: req.user!.userId,
        type: req.body?.type === 'lease' ? 'lease' : 'charter',
        ratePerHour: Number(ratePerHour),
        revenueShare: Number(req.body?.revenueShare) || 0,
        status: 'open',
        endsAt: req.body?.endsAt ? new Date(req.body.endsAt) : null,
      },
    });
    res.json({ lease });
  } catch (err) {
    console.error('Failed to create lease', err);
    res.status(500).json({ error: 'Failed to create lease' });
  }
});

router.post('/economy/leases/accept', requireAuth, async (req, res) => {
  try {
    const leaseId = req.body?.leaseId;
    if (!leaseId) {
      res.status(400).json({ error: 'Missing lease id' });
      return;
    }
    const lease = await prisma.vesselLease.findUnique({
      where: { id: leaseId },
    });
    if (!lease || lease.status !== 'open') {
      res.status(404).json({ error: 'Lease not available' });
      return;
    }
    const updated = await prisma.vesselLease.update({
      where: { id: lease.id },
      data: {
        status: 'active',
        lesseeId: req.user!.userId,
        startedAt: new Date(),
      },
    });
    await prisma.vessel.update({
      where: { id: updated.vesselId },
      data:
        updated.type === 'lease'
          ? { status: 'leased', leaseeId: req.user!.userId, chartererId: null }
          : {
              status: 'chartered',
              chartererId: req.user!.userId,
              leaseeId: null,
            },
    });
    res.json({ lease: updated });
  } catch (err) {
    console.error('Failed to accept lease', err);
    res.status(500).json({ error: 'Failed to accept lease' });
  }
});

router.post('/economy/leases/end', requireAuth, async (req, res) => {
  try {
    const leaseId = req.body?.leaseId;
    if (!leaseId) {
      res.status(400).json({ error: 'Missing lease id' });
      return;
    }
    const lease = await prisma.vesselLease.findUnique({
      where: { id: leaseId },
    });
    if (!lease || lease.status !== 'active') {
      res.status(404).json({ error: 'Lease not active' });
      return;
    }
    const userId = req.user!.userId;
    const canEnd = lease.lesseeId === userId || lease.ownerId === userId;
    if (!canEnd) {
      res.status(403).json({ error: 'Not authorized to end lease' });
      return;
    }
    const vessel = await prisma.vessel.findUnique({
      where: { id: lease.vesselId },
    });
    const now = new Date();
    const position = vessel
      ? positionFromLatLon({
          lat: vessel.lat,
          lon: vessel.lon,
          z: vessel.z,
        })
      : null;
    const port = position ? resolvePortForPosition(position) : null;
    const stored = Boolean(port);
    await prisma.$transaction(async tx => {
      const txClient = tx as unknown as typeof prisma;
      await txClient.vesselLease.update({
        where: { id: lease.id },
        data: { status: 'completed', endsAt: now },
      });
      await txClient.vessel.update({
        where: { id: lease.vesselId },
        data: {
          status: stored ? 'stored' : 'active',
          storagePortId: stored ? port!.id : null,
          storedAt: stored ? now : null,
          chartererId: null,
          leaseeId: null,
          mode: 'ai',
          desiredMode: 'ai',
        },
      });
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to end lease', err);
    res.status(500).json({ error: 'Failed to end lease' });
  }
});

router.get('/economy/sales', requireAuth, async (req, res) => {
  try {
    const sales = await prisma.vesselSale.findMany({
      where: {
        OR: [{ sellerId: req.user!.userId }, { buyerId: req.user!.userId }],
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ sales });
  } catch (err) {
    console.error('Failed to load sales', err);
    res.status(500).json({ error: 'Failed to load sales' });
  }
});

router.post('/economy/sales', requireAuth, async (req, res) => {
  try {
    const { vesselId, price } = req.body || {};
    if (!vesselId || !price) {
      res.status(400).json({ error: 'Invalid sale' });
      return;
    }
    const vessel = await prisma.vessel.findUnique({ where: { id: vesselId } });
    if (!vessel || vessel.ownerId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    const sale = await prisma.vesselSale.create({
      data: {
        vesselId,
        sellerId: req.user!.userId,
        type: req.body?.type === 'auction' ? 'auction' : 'sale',
        price: Number(price),
        reservePrice: req.body?.reservePrice
          ? Number(req.body.reservePrice)
          : null,
        endsAt: req.body?.endsAt ? new Date(req.body.endsAt) : null,
      },
    });
    await prisma.vessel.update({
      where: { id: vesselId },
      data: { status: sale.type === 'auction' ? 'auction' : 'sale' },
    });
    res.json({ sale });
  } catch (err) {
    console.error('Failed to list vessel', err);
    res.status(500).json({ error: 'Failed to list vessel' });
  }
});

router.post('/economy/sales/buy', requireAuth, async (req, res) => {
  try {
    const saleId = req.body?.saleId;
    if (!saleId) {
      res.status(400).json({ error: 'Missing sale id' });
      return;
    }
    const sale = await prisma.vesselSale.findUnique({ where: { id: saleId } });
    if (!sale || sale.status !== 'open') {
      res.status(404).json({ error: 'Sale not available' });
      return;
    }
    if (sale.reservePrice && sale.price < sale.reservePrice) {
      res.status(400).json({ error: 'Reserve not met' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { credits: true },
    });
    if ((user?.credits ?? 0) < sale.price) {
      res.status(400).json({ error: 'Insufficient credits' });
      return;
    }
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { credits: { decrement: sale.price } },
    });
    await prisma.user.update({
      where: { id: sale.sellerId },
      data: { credits: { increment: sale.price } },
    });
    await prisma.vessel.update({
      where: { id: sale.vesselId },
      data: {
        ownerId: req.user!.userId,
        status: 'active',
        chartererId: null,
        leaseeId: null,
      },
    });
    await prisma.vesselSale.update({
      where: { id: sale.id },
      data: { status: 'sold', buyerId: req.user!.userId, endsAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to buy vessel', err);
    res.status(500).json({ error: 'Failed to buy vessel' });
  }
});

router.post('/economy/vessels/storage', requireAuth, async (req, res) => {
  try {
    const { vesselId, action } = req.body || {};
    if (!vesselId) {
      res.status(400).json({ error: 'Missing vessel id' });
      return;
    }
    const vessel = await prisma.vessel.findUnique({ where: { id: vesselId } });
    const isOperator =
      vessel?.ownerId === req.user!.userId ||
      vessel?.chartererId === req.user!.userId ||
      vessel?.leaseeId === req.user!.userId;
    if (!vessel || !isOperator) {
      res.status(404).json({ error: 'Vessel not found' });
      return;
    }
    if (action === 'activate') {
      await prisma.vessel.update({
        where: { id: vesselId },
        data: { status: 'active', storagePortId: null, storedAt: null },
      });
      res.json({ ok: true });
      return;
    }
    const port = resolvePortForPosition(toVesselPosition(vessel));
    if (!port) {
      res.status(400).json({ error: 'Vessel must be in port to store' });
      return;
    }
    await prisma.vessel.update({
      where: { id: vesselId },
      data: {
        status: 'stored',
        storagePortId: port.id,
        storedAt: new Date(),
      },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to store vessel', err);
    res.status(500).json({ error: 'Failed to store vessel' });
  }
});

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

router.get('/careers', requireAuth, async (_req, res) => {
  res.json({ careers: CAREERS });
});

router.get('/careers/status', requireAuth, async (req, res) => {
  try {
    await ensureUserCareers(req.user!.userId);
    const careers = await prisma.userCareer.findMany({
      where: { userId: req.user!.userId },
      include: { career: true },
      orderBy: { careerId: 'asc' },
    });
    res.json({ careers });
  } catch (err) {
    console.error('Failed to load career status', err);
    res.status(500).json({ error: 'Failed to load career status' });
  }
});

router.post('/careers/activate', requireAuth, async (req, res) => {
  try {
    const careerId = req.body?.careerId;
    if (!careerId) {
      res.status(400).json({ error: 'Missing career id' });
      return;
    }
    await ensureUserCareers(req.user!.userId);
    await prisma.userCareer.updateMany({
      where: { userId: req.user!.userId },
      data: { active: false },
    });
    const updated = await prisma.userCareer.update({
      where: {
        userId_careerId: { userId: req.user!.userId, careerId },
      },
      data: { active: true },
    });
    res.json({ career: updated });
  } catch (err) {
    console.error('Failed to activate career', err);
    res.status(500).json({ error: 'Failed to activate career' });
  }
});

router.get('/licenses', requireAuth, async (req, res) => {
  try {
    const licenses = await prisma.license.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ licenses });
  } catch (err) {
    console.error('Failed to load licenses', err);
    res.status(500).json({ error: 'Failed to load licenses' });
  }
});

router.post('/licenses/renew', requireAuth, async (req, res) => {
  try {
    const licenseKey = req.body?.licenseKey;
    if (!licenseKey) {
      res.status(400).json({ error: 'Missing license key' });
      return;
    }
    const durationDays =
      Number.isFinite(req.body?.durationDays) &&
      Number(req.body.durationDays) > 0
        ? Number(req.body.durationDays)
        : 90;
    await issueLicense({
      userId: req.user!.userId,
      licenseKey,
      durationDays,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to renew license', err);
    res.status(500).json({ error: 'Failed to renew license' });
  }
});

router.get('/exams', requireAuth, async (_req, res) => {
  res.json({ exams: getExamDefinitions() });
});

router.post('/exams/:id/attempt', requireAuth, async (req, res) => {
  try {
    const examId = req.params.id;
    const score = Number(req.body?.score);
    if (!Number.isFinite(score)) {
      res.status(400).json({ error: 'Missing exam score' });
      return;
    }
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      res.status(404).json({ error: 'Exam not found' });
      return;
    }
    const passed = score >= (exam.minScore ?? 70);
    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        userId: req.user!.userId,
        score,
        passed,
      },
    });
    if (passed && exam.licenseKey) {
      await issueLicense({
        userId: req.user!.userId,
        licenseKey: exam.licenseKey,
        durationDays: 180,
      });
    }
    res.json({ attempt, passed });
  } catch (err) {
    console.error('Failed to record exam attempt', err);
    res.status(500).json({ error: 'Failed to record exam attempt' });
  }
});

router.get('/reputation', requireAuth, async (req, res) => {
  try {
    const reputation = await prisma.reputation.findMany({
      where: { userId: req.user!.userId },
      orderBy: { scopeType: 'asc' },
    });
    res.json({ reputation });
  } catch (err) {
    console.error('Failed to load reputation', err);
    res.status(500).json({ error: 'Failed to load reputation' });
  }
});

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
  rulesetType?: string | null;
  rules?: unknown;
  createdBy?: string | null;
}) => ({
  id: space.id,
  name: space.name,
  visibility: space.visibility,
  inviteToken: space.inviteToken || undefined,
  kind: space.kind || 'free',
  rankRequired: space.rankRequired ?? 1,
  rulesetType: space.rulesetType || undefined,
  rules: normalizeRules(space.rules),
  createdBy: space.createdBy || undefined,
});

type SpaceWithMeta = Parameters<typeof serializeSpace>[0] & {
  createdAt: Date;
  updatedAt: Date;
  passwordHash?: string | null;
};

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
      const ids = known
        .map((k: { spaceId?: string | null }) => k.spaceId)
        .filter((id): id is string => typeof id === 'string');
      if (ids.length > 0) {
        const knownSpaces = await prisma.space.findMany({
          where: { id: { in: ids } },
        });
        knownSpaces
          .map(serializeSpace)
          .forEach((s: ReturnType<typeof serializeSpace>) => collected.push(s));
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
  const rulesetType = req.body?.rulesetType;
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
        rulesetType: rulesetType || 'CASUAL',
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
      spaces: spaces.map((space: SpaceWithMeta) => ({
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
    const spaceIds = spaces.map((space: { id: string }) => space.id);
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
      vesselCounts.map(
        (entry: { spaceId: string; _count: { _all: number } }) => [
          entry.spaceId,
          entry._count._all,
        ],
      ),
    );
    const activeCountMap = new Map(
      activeCounts.map(
        (entry: { spaceId: string; _count: { _all: number } }) => [
          entry.spaceId,
          entry._count._all,
        ],
      ),
    );
    res.json({
      spaces: spaces.map((space: SpaceWithMeta) => ({
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
    const requestedRulesetType = req.body?.rulesetType;
    const hasRulesField =
      req.body !== null &&
      typeof req.body === 'object' &&
      Object.prototype.hasOwnProperty.call(req.body, 'rules');

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
    if (hasRulesField && (await canManageSpace(req, spaceId))) {
      updates.rules = requestedRules ?? null;
    }
    if (
      requestedRulesetType &&
      [
        'CASUAL',
        'REALISM',
        'CUSTOM',
        'EXAM',
        'CASUAL_PUBLIC', // legacy
        'SIM_PUBLIC', // legacy
        'PRIVATE_SANDBOX', // legacy
        'TRAINING_EXAM', // legacy
      ].includes(requestedRulesetType)
    ) {
      updates.rulesetType = requestedRulesetType;
    }

    if (Object.keys(updates).length === 0) {
      res.json(serializeSpace(space));
      return;
    }

    const updated = await prisma.space.update({
      where: { id: spaceId },
      data: updates,
    });
    const auditEntry = buildRulesetAuditEntry({
      spaceId,
      spaceName: updated.name,
      previousRulesetType: space.rulesetType,
      nextRulesetType:
        typeof updates.rulesetType === 'string'
          ? (updates.rulesetType as string)
          : updated.rulesetType,
      previousRules: normalizeRules(space.rules),
      nextRules:
        updates.rules !== undefined
          ? normalizeRules(updates.rules)
          : normalizeRules(space.rules),
      changedBy: req.user?.userId ?? null,
    });
    if (auditEntry) {
      recordLog({ level: 'info', source: 'ruleset', ...auditEntry });
    }
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
    soundEnabled,
    units,
    speedUnit,
    distanceUnit,
    timeZoneMode,
    timeZone,
    notificationLevel,
    interfaceDensity,
  } = req.body;
  const existing = userSettingsStore[userId];

  const settings: UserSettings = {
    id: existing?.id ?? Date.now(),
    userId,
    soundEnabled:
      soundEnabled !== undefined
        ? soundEnabled
        : (existing?.soundEnabled ?? true),
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
    notificationLevel:
      notificationLevel === 'all' ||
      notificationLevel === 'mentions' ||
      notificationLevel === 'none'
        ? notificationLevel
        : existing?.notificationLevel || 'mentions',
    interfaceDensity:
      interfaceDensity === 'compact'
        ? 'compact'
        : existing?.interfaceDensity || 'comfortable',
    createdAt: existing?.createdAt ?? new Date(),
    updatedAt: new Date(),
  };
  userSettingsStore[userId] = settings;
  res.json(settings);
});

// POST /api/profile - update account identity or password
router.post('/profile', requireAuth, async function (req, res) {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const { username, email, password, currentPassword } = req.body || {};
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (typeof username === 'string' && username.trim().length > 0) {
      const normalized = username.trim();
      if (normalized.length < 3) {
        res
          .status(400)
          .json({ error: 'Username must be at least 3 characters' });
        return;
      }
      const existing = await prisma.user.findFirst({
        where: {
          name: { equals: normalized, mode: 'insensitive' },
        },
      });
      if (existing && existing.id !== userId) {
        res.status(409).json({ error: 'Username already in use' });
        return;
      }
      updates.name = normalized;
    }

    if (typeof email === 'string' && email.trim().length > 0) {
      const normalized = email.trim();
      if (!normalized.includes('@')) {
        res.status(400).json({ error: 'Provide a valid email address' });
        return;
      }
      const existing = await prisma.user.findFirst({
        where: {
          email: { equals: normalized, mode: 'insensitive' },
        },
      });
      if (existing && existing.id !== userId) {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }
      updates.email = normalized;
    }

    if (typeof password === 'string' && password.length > 0) {
      if (password.length < 8) {
        res
          .status(400)
          .json({ error: 'Password must be at least 8 characters' });
        return;
      }
      if (!currentPassword || typeof currentPassword !== 'string') {
        res.status(400).json({ error: 'Current password is required' });
        return;
      }
      if (!user.passwordHash) {
        res.status(400).json({ error: 'Password login not enabled' });
        return;
      }
      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) {
        res.status(403).json({ error: 'Current password is incorrect' });
        return;
      }
      updates.passwordHash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No profile updates submitted' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    res.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
      },
    });
  } catch (err) {
    console.error('Failed to update profile', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
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
