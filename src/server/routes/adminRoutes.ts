import bcrypt from 'bcryptjs';

import { withErrorResponse } from './routeUtils';

import type { prisma as prismaClient } from '../../lib/prisma';
import type { AuthenticatedUser } from '../middleware/authentication';
import type { Role } from '../roles';
import type {
  UserSettings,
  UserSettingsStore,
} from '../services/userSettingsStore';
import type { Router, RequestHandler, Request, Response } from 'express';

type PrismaClient = typeof prismaClient;

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
  userSettingsStore: UserSettingsStore;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};

const readString = (
  record: Record<string, unknown>,
  key: string,
): string | undefined => {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
};

const readBoolean = (
  record: Record<string, unknown>,
  key: string,
): boolean | undefined => {
  const value = record[key];
  return typeof value === 'boolean' ? value : undefined;
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
      const settings = userSettingsStore.get(userId);
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
      const body = asRecord(req.body as unknown);
      const soundEnabled = readBoolean(body, 'soundEnabled');
      const units = readString(body, 'units');
      const speedUnit = readString(body, 'speedUnit');
      const distanceUnit = readString(body, 'distanceUnit');
      const timeZoneMode = readString(body, 'timeZoneMode');
      const timeZone = readString(body, 'timeZone');
      const notificationLevel = readString(body, 'notificationLevel');
      const interfaceDensity = readString(body, 'interfaceDensity');
      const existing = userSettingsStore.get(userId);

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
            : (existing?.units ?? 'metric'),
        speedUnit:
          speedUnit === 'kmh' || speedUnit === 'mph' || speedUnit === 'knots'
            ? speedUnit
            : (existing?.speedUnit ?? 'knots'),
        distanceUnit:
          distanceUnit === 'km' ||
          distanceUnit === 'mi' ||
          distanceUnit === 'nm'
            ? distanceUnit
            : (existing?.distanceUnit ?? 'nm'),
        timeZoneMode: timeZoneMode === 'manual' ? 'manual' : 'auto',
        timeZone:
          typeof timeZone === 'string' && timeZone.trim().length > 0
            ? timeZone.trim()
            : (existing?.timeZone ?? 'UTC'),
        notificationLevel:
          notificationLevel === 'all' ||
          notificationLevel === 'mentions' ||
          notificationLevel === 'none'
            ? notificationLevel
            : (existing?.notificationLevel ?? 'mentions'),
        interfaceDensity:
          interfaceDensity === 'compact'
            ? 'compact'
            : (existing?.interfaceDensity ?? 'comfortable'),
        createdAt: existing?.createdAt ?? new Date(),
        updatedAt: new Date(),
      };
      userSettingsStore.set(userId, settings);
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
      const body = asRecord(req.body as unknown);
      const username = readString(body, 'username');
      const email = readString(body, 'email');
      const password = readString(body, 'password');
      const currentPassword = readString(body, 'currentPassword');
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!currentUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const updates: Record<string, unknown> = {};
      if (username !== undefined && username.trim().length > 0) {
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

      if (email !== undefined && email.trim().length > 0) {
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

      if (password !== undefined && password.length > 0) {
        if (password.length < 8) {
          res
            .status(400)
            .json({ error: 'Password must be at least 8 characters' });
          return;
        }
        if (currentPassword === undefined || currentPassword.length === 0) {
          res.status(400).json({ error: 'Current password is required' });
          return;
        }
        if (
          currentUser.passwordHash === null ||
          currentUser.passwordHash.length === 0
        ) {
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
      const body = asRecord(req.body as unknown);
      const nextRoleRaw = readString(body, 'role');
      const allowed: Role[] = ['guest', 'spectator', 'player', 'admin'];
      if (nextRoleRaw === undefined || !allowed.includes(nextRoleRaw as Role)) {
        res.status(400).json({ error: 'Invalid role' });
        return;
      }
      const nextRole = nextRoleRaw as Role;
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
      const body = asRecord(req.body as unknown);
      const targetUserId = readString(body, 'userId');
      const username = readString(body, 'username');
      const spaceId = readString(body, 'spaceId');
      const reason = readString(body, 'reason');
      const expiresAt = readString(body, 'expiresAt');
      if (
        (targetUserId === undefined || targetUserId.length === 0) &&
        (username === undefined || username.length === 0)
      ) {
        res.status(400).json({ error: 'userId or username is required' });
        return;
      }
      const user = requireUser(req, res);
      if (!user) return;
      const ban = await prisma.ban.create({
        data: {
          userId:
            targetUserId !== undefined && targetUserId.length > 0
              ? targetUserId
              : null,
          username:
            username !== undefined && username.length > 0 ? username : null,
          spaceId:
            spaceId !== undefined && spaceId.length > 0
              ? spaceId
              : DEFAULT_SPACE_ID,
          reason: reason !== undefined && reason.length > 0 ? reason : null,
          createdBy: user.userId,
          expiresAt:
            expiresAt !== undefined && expiresAt.length > 0
              ? new Date(expiresAt)
              : null,
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
      const body = asRecord(req.body as unknown);
      const targetUserId = readString(body, 'userId');
      const username = readString(body, 'username');
      const spaceId = readString(body, 'spaceId');
      const reason = readString(body, 'reason');
      const expiresAt = readString(body, 'expiresAt');
      if (
        (targetUserId === undefined || targetUserId.length === 0) &&
        (username === undefined || username.length === 0)
      ) {
        res.status(400).json({ error: 'userId or username is required' });
        return;
      }
      const user = requireUser(req, res);
      if (!user) return;
      const mute = await prisma.mute.create({
        data: {
          userId:
            targetUserId !== undefined && targetUserId.length > 0
              ? targetUserId
              : null,
          username:
            username !== undefined && username.length > 0 ? username : null,
          spaceId:
            spaceId !== undefined && spaceId.length > 0
              ? spaceId
              : DEFAULT_SPACE_ID,
          reason: reason !== undefined && reason.length > 0 ? reason : null,
          createdBy: user.userId,
          expiresAt:
            expiresAt !== undefined && expiresAt.length > 0
              ? new Date(expiresAt)
              : null,
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
