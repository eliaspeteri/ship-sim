import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateRequest, requireAuth } from './middleware/authentication';
import { requirePermission, requireRole } from './middleware/authorization';
import { VesselState, ShipType } from '../types/vessel.types';

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

interface EnvironmentState {
  id: number;
  windSpeed: number;
  windDirection: number;
  currentSpeed: number;
  currentDirection: number;
  seaState: number;
  createdAt: Date;
  updatedAt: Date;
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

// Create a router instance
const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all routes
router.use(authenticateRequest);

// GET /api/vessels
router.get(
  '/vessels',
  requireAuth,
  requirePermission('vessel', 'list'),
  async (req, res) => {
    try {
      const vesselStates = await prisma.vesselState.findMany();
      res.json(vesselStates);
    } catch (error: unknown) {
      console.error('Error fetching vessel states:', error);
      res.status(500).json({ error: 'Failed to fetch vessel states' });
    }
  },
);

// GET /api/vessels/:userId
router.get('/vessels/:userId', requireAuth, function (req, res) {
  const { userId } = req.params;

  prisma.vesselState
    .findUnique({
      where: { userId },
    })
    .then(dbVesselState => {
      if (!dbVesselState) {
        res.status(404).json({ error: 'Vessel state not found' });
        return;
      }
      // Convert DB vessel state to unified vessel state
      const vesselState = dbVesselStateToUnified(dbVesselState);
      res.json(vesselState);
    })
    .catch((error: unknown) => {
      console.error(`Error fetching vessel state for ${userId}:`, error);
      res.status(500).json({ error: 'Failed to fetch vessel state' });
    });
});

// POST /api/vessels/:userId
router.post(
  '/vessels/:userId',
  requireAuth,
  requirePermission('vessel', 'update'),
  function (req, res) {
    const { userId } = req.params;
    const { position, orientation, velocity, properties } = req.body;

    prisma.vesselState
      .upsert({
        where: { userId },
        update: {
          positionX: position?.x,
          positionY: position?.y,
          positionZ: position?.z,
          heading: orientation?.heading,
          roll: orientation?.roll,
          pitch: orientation?.pitch,
          velocityX: velocity?.surge,
          velocityY: velocity?.sway,
          velocityZ: velocity?.heave,
          mass: properties?.mass,
          length: properties?.length,
          beam: properties?.beam,
          draft: properties?.draft,
          updatedAt: new Date(),
        },
        create: {
          userId,
          positionX: position?.x || 0,
          positionY: position?.y || 0,
          positionZ: position?.z || 0,
          heading: orientation?.heading || 0,
          roll: orientation?.roll || 0,
          pitch: orientation?.pitch || 0,
          velocityX: velocity?.surge || 0,
          velocityY: velocity?.sway || 0,
          velocityZ: velocity?.heave || 0,
          mass: properties?.mass || 50000,
          length: properties?.length || 50,
          beam: properties?.beam || 10,
          draft: properties?.draft || 3,
        },
      })
      .then((vesselState: DBVesselState) => {
        res.json(vesselState);
      })
      .catch((error: unknown) => {
        console.error(`Error saving vessel state for ${userId}:`, error);
        res.status(500).json({ error: 'Failed to save vessel state' });
      });
  },
);

// DELETE /api/vessels/:userId
router.delete(
  '/vessels/:userId',
  requireAuth,
  requirePermission('vessel', 'delete'),
  function (req, res) {
    const { userId } = req.params;

    prisma.vesselState
      .delete({
        where: { userId },
      })
      .then(() => {
        res.json({ message: 'Vessel state deleted successfully' });
      })
      .catch((error: unknown) => {
        console.error(`Error deleting vessel state for ${userId}:`, error);
        res.status(500).json({ error: 'Failed to delete vessel state' });
      });
  },
);

// GET /api/environment
router.get('/environment', function (req, res) {
  prisma.environmentState
    .findUnique({
      where: { id: 1 },
    })
    .then((environmentState: EnvironmentState | null) => {
      if (!environmentState) {
        res.status(404).json({ error: 'Environment state not found' });
        return;
      }

      res.json({
        wind: {
          speed: environmentState.windSpeed,
          direction: environmentState.windDirection,
        },
        current: {
          speed: environmentState.currentSpeed,
          direction: environmentState.currentDirection,
        },
        seaState: environmentState.seaState,
      });
    })
    .catch((error: unknown) => {
      console.error('Error fetching environment state:', error);
      res.status(500).json({ error: 'Failed to fetch environment state' });
    });
});

// POST /api/environment
router.post(
  '/environment',
  requireAuth,
  requirePermission('environment', 'update'),
  function (req, res) {
    const { wind, current, seaState } = req.body;

    prisma.environmentState
      .upsert({
        where: { id: 1 },
        update: {
          windSpeed: wind?.speed,
          windDirection: wind?.direction,
          currentSpeed: current?.speed,
          currentDirection: current?.direction,
          seaState,
          updatedAt: new Date(),
        },
        create: {
          id: 1,
          windSpeed: wind?.speed || 5,
          windDirection: wind?.direction || 0,
          currentSpeed: current?.speed || 0.5,
          currentDirection: current?.direction || Math.PI / 4,
          seaState: seaState || 3,
        },
      })
      .then((environmentState: EnvironmentState) => {
        res.json({
          wind: {
            speed: environmentState.windSpeed,
            direction: environmentState.windDirection,
          },
          current: {
            speed: environmentState.currentSpeed,
            direction: environmentState.currentDirection,
          },
          seaState: environmentState.seaState,
        });
      })
      .catch((error: unknown) => {
        console.error('Error updating environment state:', error);
        res.status(500).json({ error: 'Failed to update environment state' });
      });
  },
);

// GET /api/settings/:userId
router.get('/settings/:userId', requireAuth, function (req, res) {
  const { userId } = req.params;

  prisma.userSettings
    .findUnique({
      where: { userId },
    })
    .then((settings: UserSettings | null) => {
      if (!settings) {
        res.status(404).json({ error: 'Settings not found' });
        return;
      }
      res.json(settings);
    })
    .catch((error: unknown) => {
      console.error(`Error fetching settings for ${userId}:`, error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    });
});

// POST /api/settings/:userId
router.post('/settings/:userId', requireAuth, function (req, res) {
  const { userId } = req.params;
  const { cameraMode, soundEnabled, showHUD, timeScale } = req.body;

  prisma.userSettings
    .upsert({
      where: { userId },
      update: {
        cameraMode,
        soundEnabled,
        showHUD,
        timeScale,
        updatedAt: new Date(),
      },
      create: {
        userId,
        cameraMode: cameraMode || 'thirdPerson',
        soundEnabled: soundEnabled !== undefined ? soundEnabled : true,
        showHUD: showHUD !== undefined ? showHUD : true,
        timeScale: timeScale || 1.0,
      },
    })
    .then((settings: UserSettings) => {
      res.json(settings);
    })
    .catch((error: unknown) => {
      console.error(`Error saving settings for ${userId}:`, error);
      res.status(500).json({ error: 'Failed to save settings' });
    });
});

// GET /api/stats
router.get(
  '/stats',
  requireAuth,
  requireRole(['admin', 'instructor']),
  function (req, res) {
    Promise.all([
      prisma.vesselState.count(),
      prisma.vesselState.findFirst({
        orderBy: { updatedAt: 'desc' },
      }),
    ])
      .then(([vesselCount, latestVessel]: [number, DBVesselState | null]) => {
        res.json({
          vesselCount,
          lastUpdate: latestVessel?.updatedAt || null,
        });
      })
      .catch((error: unknown) => {
        console.error('Error fetching system stats:', error);
        res.status(500).json({ error: 'Failed to fetch system stats' });
      });
  },
);

// Role management routes - admin only
// GET /api/roles
router.get(
  '/roles',
  requireAuth,
  requirePermission('role', 'list'),
  async (req, res) => {
    try {
      const roles = await prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  },
);

// POST /api/roles
router.post(
  '/roles',
  requireAuth,
  requirePermission('role', 'create'),
  async (req, res) => {
    const { name, description, permissions } = req.body;

    try {
      const role = await prisma.role.create({
        data: {
          name,
          description,
        },
      });

      // Add permissions if provided
      if (permissions && Array.isArray(permissions)) {
        for (const perm of permissions) {
          // Find or create the permission
          let permission = await prisma.permission.findFirst({
            where: {
              resource: perm.resource,
              action: perm.action,
            },
          });

          if (!permission) {
            permission = await prisma.permission.create({
              data: {
                name: `${perm.resource}:${perm.action}`,
                resource: perm.resource,
                action: perm.action,
                description:
                  perm.description ||
                  `Permission to ${perm.action} ${perm.resource}`,
              },
            });
          }

          // Link permission to role
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }

      // Return the created role with permissions
      const completeRole = await prisma.role.findUnique({
        where: { id: role.id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      res.status(201).json(completeRole);
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({ error: 'Failed to create role' });
    }
  },
);

// User role management - admin only
// POST /api/users/:userId/roles
router.post(
  '/users/:userId/roles',
  requireAuth,
  requirePermission('user', 'manage'),
  async (req, res, _next) => {
    const { userId } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      res.status(400).json({ error: 'Role ID is required' });
      return;
    }

    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if role exists
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        res.status(404).json({ error: 'Role not found' });
        return;
      }

      // Check if user already has this role
      const existingUserRole = await prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      });

      if (existingUserRole) {
        res.status(409).json({ error: 'User already has this role' });
        return;
      }

      // Assign role to user
      await prisma.userRole.create({
        data: {
          userId,
          roleId,
        },
      });

      res.status(201).json({ message: 'Role assigned successfully' });
    } catch (error) {
      console.error(`Error assigning role to user ${userId}:`, error);
      res.status(500).json({ error: 'Failed to assign role to user' });
    }
  },
);

export default router;
