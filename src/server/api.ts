import express from 'express';
import { authenticateRequest, requireAuth } from './middleware/authentication';
import { requirePermission, requireRole } from './middleware/authorization';
import { VesselState, ShipType } from '../types/vessel.types';
import { EnvironmentState } from '../types/environment.types';

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
