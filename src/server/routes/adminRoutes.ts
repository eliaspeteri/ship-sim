import type { Router, RequestHandler, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import type { prisma as prismaClient } from '../../lib/prisma';
import type { Role } from '../roles';
import type { AuthenticatedUser } from '../middleware/authentication';
import { withErrorResponse } from './routeUtils';

type PrismaClient = typeof prismaClient;

type UserSettings = {
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
};

type RequireRole = (roles: string[]) => RequestHandler;
type RequireSelfOrRole = (paramKey: string, roles?: string[]) => RequestHandler;
type RequireUser = (req: Request, res: Response) => AuthenticatedUser | null;

type AdminRouteDeps = {
  router: Router;
  prisma: PrismaClient;
  requireAuth: RequestHandler;
  requireRole: RequireRole;
  requireSelfOrRole: RequireSelfOrRole;
  requireUser: RequireUser;
  DEFAULT_SPACE_ID: string;
  serverMetrics: unknown;
  getLogs: (options: { since: number; limit: number }) => unknown[];
  clearLogs: () => void;
  userSettingsStore: Record<string, UserSettings>;
};

export const registerAdminRoutes = ({
  router,
  prisma,
  requireAuth,
  requireRole,
  requireSelfOrRole,
  requireUser,
  DEFAULT_SPACE_ID,
  serverMetrics,
  getLogs,
  clearLogs,
  userSettingsStore,
}: AdminRouteDeps) => {
  router.get('/metrics', requireAuth, (_req, res) => {
    res.json(serverMetrics);
  });

  router.get('/logs', requireAuth, requireRole(['admin']), (req, res) => {
    const since = Number(req.query.since ?? 0);
    const limit = Number(req.query.limit ?? 200);
    res.json({ logs: getLogs({ since, limit }) });
  });

  router.delete('/logs', requireAuth, requireRole(['admin']), (_req, res) => {
    clearLogs();
    res.json({ success: true });
  });

  router.get(
    '/settings/:userId',
    requireAuth,
    requireSelfOrRole('userId'),
    (req, res) => {
      const { userId } = req.params;
      const settings = userSettingsStore[userId];
      if (!settings) {
        res.status(404).json({ error: 'Settings not found' });
        return;
      }
      res.json(settings);
    },
  );

  router.post(
    '/settings/:userId',
    requireAuth,
    requireSelfOrRole('userId'),
    (req, res) => {
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
          distanceUnit === 'km' ||
          distanceUnit === 'mi' ||
          distanceUnit === 'nm'
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
    },
  );

  router.post(
    '/profile',
    requireAuth,
    withErrorResponse('Failed to update profile', async (req, res) => {
      const user = requireUser(req, res);
      if (!user) return;
      const userId = user.userId;
      const { username, email, password, currentPassword } = req.body || {};
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!currentUser) {
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
          where: { name: { equals: normalized, mode: 'insensitive' } },
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
          where: { email: { equals: normalized, mode: 'insensitive' } },
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
        if (!currentUser.passwordHash) {
          res.status(400).json({ error: 'Password login not enabled' });
          return;
        }
        const ok = await bcrypt.compare(
          currentPassword,
          currentUser.passwordHash,
        );
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
    }),
  );

  router.get(
    '/stats',
    requireAuth,
    requireRole(['admin', 'instructor']),
    withErrorResponse('Failed to load stats', async (_req, res) => {
      const [vesselCountRaw, latest] = await Promise.all([
        prisma.vessel.count(),
        prisma.vessel.findFirst({
          orderBy: { lastUpdate: 'desc' },
          select: { lastUpdate: true },
        }),
      ]);
      const vesselCount =
        typeof vesselCountRaw === 'number' && Number.isFinite(vesselCountRaw)
          ? vesselCountRaw
          : 0;
      res.json({
        vesselCount,
        lastUpdate: latest?.lastUpdate ?? null,
      });
    }),
  );

  router.get(
    '/admin/moderation',
    requireAuth,
    requireRole(['admin']),
    withErrorResponse('Failed to load moderation list', async (req, res) => {
      const spaceId =
        typeof req.query.spaceId === 'string'
          ? req.query.spaceId
          : DEFAULT_SPACE_ID;
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
    }),
  );

  router.patch(
    '/admin/users/:userId/role',
    requireAuth,
    requireRole(['admin']),
    withErrorResponse('Failed to update user role', async (req, res) => {
      const { userId } = req.params;
      const nextRole = req.body?.role as Role | undefined;
      const allowed: Role[] = ['guest', 'spectator', 'player', 'admin'];
      if (!nextRole || !allowed.includes(nextRole)) {
        res.status(400).json({ error: 'Invalid role' });
        return;
      }
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: nextRole },
      });
      res.json({ id: updated.id, role: updated.role });
    }),
  );

  router.post(
    '/admin/bans',
    requireAuth,
    requireRole(['admin']),
    withErrorResponse('Failed to create ban', async (req, res) => {
      const { userId, username, spaceId, reason, expiresAt } = req.body || {};
      if (!userId && !username) {
        res.status(400).json({ error: 'userId or username is required' });
        return;
      }
      const user = requireUser(req, res);
      if (!user) return;
      const ban = await prisma.ban.create({
        data: {
          userId: userId || null,
          username: username || null,
          spaceId: spaceId || DEFAULT_SPACE_ID,
          reason: reason || null,
          createdBy: user.userId,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
      res.status(201).json(ban);
    }),
  );

  router.delete(
    '/admin/bans/:banId',
    requireAuth,
    requireRole(['admin']),
    withErrorResponse('Failed to delete ban', async (req, res) => {
      await prisma.ban.delete({ where: { id: req.params.banId } });
      res.json({ success: true });
    }),
  );

  router.post(
    '/admin/mutes',
    requireAuth,
    requireRole(['admin']),
    withErrorResponse('Failed to create mute', async (req, res) => {
      const { userId, username, spaceId, reason, expiresAt } = req.body || {};
      if (!userId && !username) {
        res.status(400).json({ error: 'userId or username is required' });
        return;
      }
      const user = requireUser(req, res);
      if (!user) return;
      const mute = await prisma.mute.create({
        data: {
          userId: userId || null,
          username: username || null,
          spaceId: spaceId || DEFAULT_SPACE_ID,
          reason: reason || null,
          createdBy: user.userId,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
      res.status(201).json(mute);
    }),
  );

  router.delete(
    '/admin/mutes/:muteId',
    requireAuth,
    requireRole(['admin']),
    withErrorResponse('Failed to delete mute', async (req, res) => {
      await prisma.mute.delete({ where: { id: req.params.muteId } });
      res.json({ success: true });
    }),
  );
};
