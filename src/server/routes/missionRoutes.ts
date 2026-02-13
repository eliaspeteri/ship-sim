import { Prisma } from '@prisma/client';
import type { Router, Request, RequestHandler, Response } from 'express';
import { getScenarios } from '../../lib/scenarios';
import type {
  MissionAssignmentData,
  MissionDefinition,
} from '../../types/mission.types';
import type { AuthenticatedUser } from '../middleware/authentication';
import type { prisma as prismaClient } from '../../lib/prisma';

type PrismaClient = typeof prismaClient;

type RegisterMissionRoutesDeps = {
  router: Router;
  prisma: PrismaClient;
  requireAuth: RequestHandler;
  requirePermission: (resource: string, action: string) => RequestHandler;
  requireUser: (req: Request, res: Response) => AuthenticatedUser | null;
  DEFAULT_SPACE_ID: string;
  serializeSpace: (space: {
    id: string;
    name: string;
    visibility: string;
    inviteToken: string | null;
    kind?: string | null;
    rankRequired?: number | null;
    rulesetType?: string | null;
    rules?: unknown;
    createdBy?: string | null;
  }) => unknown;
};

export const registerMissionRoutes = ({
  router,
  prisma,
  requireAuth,
  requirePermission,
  requireUser,
  DEFAULT_SPACE_ID,
  serializeSpace,
}: RegisterMissionRoutesDeps) => {
  router.get(
    '/missions',
    requireAuth,
    requirePermission('mission', 'list'),
    async (req, res) => {
      const user = requireUser(req, res);
      if (!user) return;
      const spaceId =
        typeof req.query.spaceId === 'string'
          ? req.query.spaceId
          : DEFAULT_SPACE_ID;
      const rank = user.rank ?? 1;
      try {
        const missions = (await prisma.mission.findMany({
          where: {
            spaceId,
            active: true,
            ...(user.roles.includes('admin')
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
      const user = requireUser(req, res);
      if (!user) return;
      try {
        const mission = (await prisma.mission.findUnique({
          where: { id: missionId },
        })) as MissionDefinition | null;
        if (!mission || !mission.active) {
          res.status(404).json({ error: 'Mission not found' });
          return;
        }
        const rank = user.rank ?? 1;
        if (!user.roles.includes('admin') && rank < mission.requiredRank) {
          res.status(403).json({ error: 'Rank too low for this mission' });
          return;
        }
        const existing = (await prisma.missionAssignment.findFirst({
          where: {
            userId: user.userId,
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
            userId: user.userId,
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
      const user = requireUser(req, res);
      if (!user) return;
      const status =
        typeof req.query.status === 'string' ? req.query.status : undefined;
      const statusList = status ? status.split(',') : undefined;
      try {
        const assignments = await prisma.missionAssignment.findMany({
          where: {
            userId: user.userId,
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
    const user = requireUser(req, res);
    if (!user) return;
    const scenario = getScenarios().find(item => item.id === scenarioId);
    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }
    const rank = user.rank ?? 1;
    if (!user.roles.includes('admin') && rank < scenario.rankRequired) {
      res.status(403).json({ error: 'Rank too low for this scenario' });
      return;
    }
    try {
      const name = `${scenario.name} (${user.userId.slice(0, 6) || 'pilot'})`;
      const space = await prisma.space.create({
        data: {
          name,
          visibility: 'private',
          kind: 'scenario',
          rankRequired: scenario.rankRequired,
          rules: scenario.rules,
          createdBy: user.userId,
        },
      });
      await prisma.spaceAccess.create({
        data: {
          userId: user.userId,
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
            createdBy: user.userId,
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
};
