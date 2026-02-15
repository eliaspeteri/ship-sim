import type { Router, RequestHandler, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ShipType, type VesselState } from '../../types/vessel.types';
import type { EnvironmentState } from '../../types/environment.types';
import type { AuthenticatedUser } from '../middleware/authentication';
import type { prisma as prismaClient } from '../../lib/prisma';
import { ensurePosition } from '../../lib/position';
import { withErrorResponse } from './routeUtils';

type PrismaClient = typeof prismaClient;
type WeatherStateRow = Awaited<
  ReturnType<PrismaClient['weatherState']['findUnique']>
>;
type VesselRow = Awaited<ReturnType<PrismaClient['vessel']['findFirst']>>;

type RequireUser = (req: Request, res: Response) => AuthenticatedUser | null;

type RegisterVesselEnvironmentRoutesDeps = {
  router: Router;
  prisma: PrismaClient;
  requireAuth: RequestHandler;
  requireSelfOrRole: (paramKey: string, roles?: string[]) => RequestHandler;
  requirePermission: (resource: string, action: string) => RequestHandler;
  requireUser: RequireUser;
  DEFAULT_SPACE_ID: string;
  canManageSpace: (
    user: AuthenticatedUser | null,
    spaceId: string,
  ) => Promise<boolean>;
};

const defaultEnvironmentState = (): EnvironmentState => ({
  wind: { speed: 5, direction: 0, gusting: false, gustFactor: 1 },
  current: { speed: 0.5, direction: Math.PI / 4, variability: 0 },
  seaState: 3,
  timeOfDay: 12,
  tideHeight: 0,
  tideRange: 0,
  tidePhase: 0,
  tideTrend: 'rising',
  precipitation: 'none',
  precipitationIntensity: 0,
});

const toEnvironmentState = (
  row: WeatherStateRow,
  fallbackSpaceId: string,
): EnvironmentState => {
  if (!row) {
    return {
      ...defaultEnvironmentState(),
      name: fallbackSpaceId,
    };
  }
  return {
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
    timeOfDay: row.timeOfDay,
    precipitation:
      (row.precipitation as EnvironmentState['precipitation']) || 'none',
    precipitationIntensity: row.precipitationIntensity ?? 0,
    tideHeight: 0,
    tideRange: 0,
    tidePhase: 0,
    tideTrend: 'rising',
    name: row.name || row.spaceId,
  };
};

const toWeatherStateData = (env: EnvironmentState, spaceId: string) => ({
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
  timeOfDay: env.timeOfDay,
  precipitation: env.precipitation || 'none',
  precipitationIntensity: env.precipitationIntensity ?? 0,
});

const toVesselDetail = (vessel: NonNullable<VesselRow>) => ({
  id: vessel.id,
  spaceId: vessel.spaceId,
  ownerId: vessel.ownerId,
  mode: vessel.mode,
  desiredMode: vessel.desiredMode,
  lastCrewAt: vessel.lastCrewAt.getTime(),
  position: { lat: vessel.lat, lon: vessel.lon, z: vessel.z },
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
    ballast: vessel.ballast,
    bowThruster: vessel.bowThruster,
  },
  properties: {
    mass: vessel.mass,
    length: vessel.length,
    beam: vessel.beam,
    draft: vessel.draft,
  },
  yawRate: vessel.yawRate,
  lastUpdate: vessel.lastUpdate.getTime(),
  isAi: vessel.isAi,
});

const toUnifiedVesselState = (vessel: NonNullable<VesselRow>): VesselState => ({
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
  angularVelocity: {
    yaw: vessel.yawRate,
    roll: 0,
    pitch: 0,
  },
  controls: {
    throttle: vessel.throttle,
    rudderAngle: vessel.rudderAngle,
    ballast: vessel.ballast,
    bowThruster: vessel.bowThruster,
  },
  properties: {
    name: vessel.id,
    type: ShipType.CONTAINER,
    mass: vessel.mass,
    length: vessel.length,
    beam: vessel.beam,
    draft: vessel.draft,
    blockCoefficient: 0.8,
    maxSpeed: 25,
  },
  engineState: {
    rpm: 0,
    fuelLevel: 1.0,
    fuelConsumption: 0,
    temperature: 25,
    oilPressure: 5,
    load: 0,
    running: false,
    hours: 0,
  },
  electricalSystem: {
    mainBusVoltage: 440,
    generatorOutput: 0,
    batteryLevel: 1,
    powerConsumption: 50,
    generatorRunning: true,
  },
  stability: {
    metacentricHeight: 2,
    centerOfGravity: { x: 0, y: 0, z: 6 },
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
});

const buildUserVesselWhere = (userId: string) => ({
  OR: [{ ownerId: userId }, { leaseeId: userId }, { chartererId: userId }],
});

export const registerVesselEnvironmentRoutes = ({
  router,
  prisma,
  requireAuth,
  requireSelfOrRole,
  requirePermission,
  requireUser,
  DEFAULT_SPACE_ID,
  canManageSpace,
}: RegisterVesselEnvironmentRoutesDeps) => {
  router.get(
    '/vessels',
    withErrorResponse('Failed to load vessels', async (_req, res) => {
      const vessels = await prisma.vessel.findMany({
        orderBy: { lastUpdate: 'desc' },
      });
      res.json(
        vessels.map(vessel => ({
          id: vessel.id,
          spaceId: vessel.spaceId,
          ownerId: vessel.ownerId,
          mode: vessel.mode,
          isAi: vessel.isAi,
          lastUpdate: vessel.lastUpdate.getTime(),
          position: {
            lat: vessel.lat,
            lon: vessel.lon,
          },
        })),
      );
    }),
  );

  router.get(
    '/vessels/by-id/:vesselId',
    withErrorResponse('Failed to fetch vessel', async (req, res) => {
      const { vesselId } = req.params;
      const vessel = await prisma.vessel.findUnique({
        where: { id: vesselId },
      });
      if (!vessel) {
        res.status(404).json({ error: 'Vessel not found' });
        return;
      }
      res.json({ vessel: toVesselDetail(vessel) });
    }),
  );

  router.get(
    '/vessels/:userId',
    requireAuth,
    withErrorResponse('Failed to fetch vessel state', async (req, res) => {
      const { userId } = req.params;
      const vessel = await prisma.vessel.findFirst({
        where: buildUserVesselWhere(userId),
        orderBy: { lastUpdate: 'desc' },
      });
      if (!vessel) {
        res.status(404).json({ error: 'Vessel state not found' });
        return;
      }
      res.json(toUnifiedVesselState(vessel));
    }),
  );

  router.post(
    '/vessels/:userId',
    requireAuth,
    requireSelfOrRole('userId'),
    requirePermission('vessel', 'update'),
    withErrorResponse('Failed to update vessel state', async (req, res) => {
      const { userId } = req.params;
      const { position, orientation, velocity, properties } = req.body || {};
      const vessel = await prisma.vessel.findFirst({
        where: buildUserVesselWhere(userId),
        orderBy: { lastUpdate: 'desc' },
      });
      const nextPosition = ensurePosition(position);
      const now = new Date();
      const updated = vessel
        ? await prisma.vessel.update({
            where: { id: vessel.id },
            data: {
              lat: nextPosition.lat,
              lon: nextPosition.lon,
              z: nextPosition.z,
              heading: orientation?.heading ?? vessel.heading,
              roll: orientation?.roll ?? vessel.roll,
              pitch: orientation?.pitch ?? vessel.pitch,
              surge: velocity?.surge ?? vessel.surge,
              sway: velocity?.sway ?? vessel.sway,
              heave: velocity?.heave ?? vessel.heave,
              mass: properties?.mass ?? vessel.mass,
              length: properties?.length ?? vessel.length,
              beam: properties?.beam ?? vessel.beam,
              draft: properties?.draft ?? vessel.draft,
              lastUpdate: now,
            },
          })
        : await prisma.vessel.create({
            data: {
              id: randomUUID(),
              spaceId: DEFAULT_SPACE_ID,
              ownerId: userId,
              status: 'active',
              storagePortId: null,
              storedAt: null,
              chartererId: null,
              leaseeId: null,
              templateId: null,
              mode: 'ai',
              desiredMode: 'player',
              lastCrewAt: now,
              lat: nextPosition.lat,
              lon: nextPosition.lon,
              z: nextPosition.z,
              heading: orientation?.heading ?? 0,
              roll: orientation?.roll ?? 0,
              pitch: orientation?.pitch ?? 0,
              surge: velocity?.surge ?? 0,
              sway: velocity?.sway ?? 0,
              heave: velocity?.heave ?? 0,
              throttle: 0,
              rudderAngle: 0,
              ballast: 0.5,
              bowThruster: 0,
              yawRate: 0,
              mass: properties?.mass ?? 50000,
              length: properties?.length ?? 50,
              beam: properties?.beam ?? 10,
              draft: properties?.draft ?? 3,
              hullIntegrity: 1,
              engineHealth: 1,
              steeringHealth: 1,
              electricalHealth: 1,
              floodingDamage: 0,
              lastUpdate: now,
              isAi: true,
            },
          });
      res.json(toUnifiedVesselState(updated));
    }),
  );

  router.delete(
    '/vessels/:userId',
    requireAuth,
    requireSelfOrRole('userId'),
    requirePermission('vessel', 'delete'),
    withErrorResponse('Failed to delete vessel state', async (req, res) => {
      const { userId } = req.params;
      const vessel = await prisma.vessel.findFirst({
        where: buildUserVesselWhere(userId),
        orderBy: { lastUpdate: 'desc' },
        select: { id: true },
      });
      if (!vessel) {
        res.status(404).json({ error: 'Vessel state not found' });
        return;
      }
      await prisma.vessel.delete({ where: { id: vessel.id } });
      res.json({ message: 'Vessel state deleted successfully' });
    }),
  );

  router.get(
    '/environment',
    withErrorResponse('Failed to fetch environment', async (req, res) => {
      const spaceId =
        typeof req.query.spaceId === 'string'
          ? req.query.spaceId
          : DEFAULT_SPACE_ID;
      const row = await prisma.weatherState.findUnique({
        where: { id: spaceId },
      });
      res.json(toEnvironmentState(row, spaceId));
    }),
  );

  router.post(
    '/environment',
    requireAuth,
    requirePermission('environment', 'update'),
    withErrorResponse('Failed to update environment', async (req, res) => {
      const user = requireUser(req, res);
      if (!user) return;
      const spaceId =
        typeof req.body?.spaceId === 'string'
          ? req.body.spaceId
          : DEFAULT_SPACE_ID;
      if (!(await canManageSpace(user, spaceId))) {
        res.status(403).json({ error: 'Not authorized to update environment' });
        return;
      }

      const current = toEnvironmentState(
        await prisma.weatherState.findUnique({ where: { id: spaceId } }),
        spaceId,
      );
      const { wind, current: currentUpdate, seaState } = req.body || {};
      const next: EnvironmentState = {
        ...current,
        wind: {
          speed: wind?.speed ?? current.wind.speed,
          direction: wind?.direction ?? current.wind.direction,
          gusting: wind?.gusting ?? current.wind.gusting,
          gustFactor: wind?.gustFactor ?? current.wind.gustFactor,
        },
        current: {
          speed: currentUpdate?.speed ?? current.current.speed,
          direction: currentUpdate?.direction ?? current.current.direction,
          variability:
            currentUpdate?.variability ?? current.current.variability,
        },
        seaState: seaState ?? current.seaState,
      };

      await prisma.weatherState.upsert({
        where: { id: spaceId },
        update: toWeatherStateData(next, spaceId),
        create: {
          id: spaceId,
          ...toWeatherStateData(next, spaceId),
        },
      });

      res.json(next);
    }),
  );

  router.get(
    '/environment/events',
    requireAuth,
    withErrorResponse(
      'Failed to fetch environment events',
      async (req, res) => {
        const user = requireUser(req, res);
        if (!user) return;
        const spaceId =
          typeof req.query.spaceId === 'string'
            ? req.query.spaceId
            : DEFAULT_SPACE_ID;
        if (!(await canManageSpace(user, spaceId))) {
          res
            .status(403)
            .json({ error: 'Not authorized to view environment events' });
          return;
        }
        const events = await prisma.environmentEvent.findMany({
          where: { spaceId },
          orderBy: { runAt: 'asc' },
        });
        res.json({ events });
      },
    ),
  );

  router.post(
    '/environment/events',
    requireAuth,
    withErrorResponse(
      'Failed to create environment event',
      async (req, res) => {
        const user = requireUser(req, res);
        if (!user) return;
        const spaceId =
          typeof req.body?.spaceId === 'string'
            ? req.body.spaceId
            : DEFAULT_SPACE_ID;
        if (!(await canManageSpace(user, spaceId))) {
          res
            .status(403)
            .json({ error: 'Not authorized to schedule environment events' });
          return;
        }
        const runAt = new Date(req.body?.runAt);
        const endAt = req.body?.endAt ? new Date(req.body.endAt) : null;
        if (Number.isNaN(runAt.getTime())) {
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
        const event = await prisma.environmentEvent.create({
          data: {
            spaceId,
            name: req.body?.name || null,
            pattern: req.body?.pattern || null,
            payload: req.body?.payload || null,
            runAt,
            endAt,
            enabled: req.body?.enabled !== false,
            createdBy: user.userId,
          },
        });
        res.status(201).json(event);
      },
    ),
  );

  router.delete(
    '/environment/events/:eventId',
    requireAuth,
    withErrorResponse(
      'Failed to delete environment event',
      async (req, res) => {
        const user = requireUser(req, res);
        if (!user) return;
        const eventId = req.params.eventId;
        const event = await prisma.environmentEvent.findUnique({
          where: { id: eventId },
          select: { spaceId: true },
        });
        if (!event) {
          res.status(404).json({ error: 'Event not found' });
          return;
        }
        if (!(await canManageSpace(user, event.spaceId))) {
          res
            .status(403)
            .json({ error: 'Not authorized to delete this event' });
          return;
        }
        await prisma.environmentEvent.delete({ where: { id: eventId } });
        res.json({ success: true });
      },
    ),
  );
};
