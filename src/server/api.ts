import express from 'express';
import { PrismaClient } from '@prisma/client';

// Create a router instance
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/vessels
router.get('/vessels', async (req, res) => {
  try {
    const vesselStates = await prisma.vesselState.findMany();
    res.json(vesselStates);
  } catch (error: unknown) {
    console.error('Error fetching vessel states:', error);
    res.status(500).json({ error: 'Failed to fetch vessel states' });
  }
});

// GET /api/vessels/:userId
router.get('/vessels/:userId', function (req, res) {
  const { userId } = req.params;

  prisma.vesselState
    .findUnique({
      where: { userId },
    })
    .then((vesselState: any) => {
      if (!vesselState) {
        return res.status(404).json({ error: 'Vessel state not found' });
      }
      res.json(vesselState);
    })
    .catch((error: unknown) => {
      console.error(`Error fetching vessel state for ${userId}:`, error);
      res.status(500).json({ error: 'Failed to fetch vessel state' });
    });
});

// POST /api/vessels/:userId
router.post('/vessels/:userId', function (req, res) {
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
    .then((vesselState: any) => {
      res.json(vesselState);
    })
    .catch((error: unknown) => {
      console.error(`Error saving vessel state for ${userId}:`, error);
      res.status(500).json({ error: 'Failed to save vessel state' });
    });
});

// DELETE /api/vessels/:userId
router.delete('/vessels/:userId', function (req, res) {
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
});

// GET /api/environment
router.get('/environment', function (req, res) {
  prisma.environmentState
    .findUnique({
      where: { id: 1 },
    })
    .then((environmentState: any) => {
      if (!environmentState) {
        return res.status(404).json({ error: 'Environment state not found' });
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
router.post('/environment', function (req, res) {
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
    .then((environmentState: any) => {
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
});

// GET /api/settings/:userId
router.get('/settings/:userId', function (req, res) {
  const { userId } = req.params;

  prisma.userSettings
    .findUnique({
      where: { userId },
    })
    .then((settings: any) => {
      if (!settings) {
        return res.status(404).json({ error: 'Settings not found' });
      }
      res.json(settings);
    })
    .catch((error: unknown) => {
      console.error(`Error fetching settings for ${userId}:`, error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    });
});

// POST /api/settings/:userId
router.post('/settings/:userId', function (req, res) {
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
    .then((settings: any) => {
      res.json(settings);
    })
    .catch((error: unknown) => {
      console.error(`Error saving settings for ${userId}:`, error);
      res.status(500).json({ error: 'Failed to save settings' });
    });
});

// GET /api/stats
router.get('/stats', function (req, res) {
  Promise.all([
    prisma.vesselState.count(),
    prisma.vesselState.findFirst({
      orderBy: { updatedAt: 'desc' },
    }),
  ])
    .then(([vesselCount, latestVessel]: [number, any]) => {
      res.json({
        vesselCount,
        lastUpdate: latestVessel?.updatedAt || null,
      });
    })
    .catch((error: unknown) => {
      console.error('Error fetching system stats:', error);
      res.status(500).json({ error: 'Failed to fetch system stats' });
    });
});

export default router;
