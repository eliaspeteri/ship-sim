import { randomUUID } from 'crypto';

import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { buildRulesetAuditEntry } from '../../lib/rulesetAudit';

import type { prisma as prismaClient } from '../../lib/prisma';
import type { Rules } from '../../types/rules.types';
import type { AuthenticatedUser } from '../middleware/authentication';
import type { Router, Request, Response, RequestHandler } from 'express';

type PrismaClient = typeof prismaClient;

type SpaceShape = {
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
  createdAt?: Date;
  updatedAt?: Date;
};

type RegisterCareersSpacesRoutesDeps = {
  router: Router;
  prisma: PrismaClient;
  requireAuth: RequestHandler;
  requireUser: (req: Request, res: Response) => AuthenticatedUser | null;
  DEFAULT_SPACE_ID: string;
  CAREERS: unknown[];
  getExamDefinitions: () => unknown[];
  ensureUserCareers: (userId: string) => Promise<void>;
  issueLicense: (params: {
    userId: string;
    licenseKey: string;
    durationDays: number;
  }) => Promise<void>;
  canManageSpace: (
    user: AuthenticatedUser | null,
    spaceId: string,
  ) => Promise<boolean>;
  seedDefaultMissions: (spaceId: string) => Promise<void>;
  recordLog: (entry: {
    level: 'info' | 'warn' | 'error';
    source: string;
    message: string;
    meta?: Record<string, unknown>;
  }) => void;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;

const readString = (
  record: Record<string, unknown> | undefined,
  key: string,
): string | undefined => {
  if (!record) return undefined;
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
};

const readNumber = (
  record: Record<string, unknown> | undefined,
  key: string,
): number | undefined => {
  if (!record) return undefined;
  const value = record[key];
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const readBoolean = (
  record: Record<string, unknown> | undefined,
  key: string,
): boolean | undefined => {
  if (!record) return undefined;
  const value = record[key];
  return typeof value === 'boolean' ? value : undefined;
};

const isJsonValue = (value: unknown): value is Prisma.InputJsonValue => {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(item => isJsonValue(item));
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every(item =>
      isJsonValue(item),
    );
  }
  return false;
};

const normalizeRules = (value: unknown): Rules | null => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Rules;
};

const serializeSpace = (space: SpaceShape) => ({
  id: space.id,
  name: space.name,
  visibility: space.visibility,
  inviteToken:
    space.inviteToken !== null && space.inviteToken.length > 0
      ? space.inviteToken
      : undefined,
  kind: space.kind ?? 'free',
  rankRequired: space.rankRequired ?? 1,
  rulesetType: space.rulesetType ?? undefined,
  rules: normalizeRules(space.rules),
  createdBy: space.createdBy ?? undefined,
});

const mergeSpaces = (
  base: ReturnType<typeof serializeSpace>[],
  extra: ReturnType<typeof serializeSpace>[],
) => {
  const map = new Map<string, ReturnType<typeof serializeSpace>>();
  [...base, ...extra].forEach(s => map.set(s.id, s));
  return Array.from(map.values());
};

const collectSpaces = async ({
  prisma,
  userId,
  includeKnown,
}: {
  prisma: PrismaClient;
  userId?: string;
  includeKnown: boolean;
}) => {
  const publicSpaces = await prisma.space.findMany({
    where: { visibility: 'public' },
    orderBy: { createdAt: 'asc' },
  });
  const collected: ReturnType<typeof serializeSpace>[] =
    publicSpaces.map(serializeSpace);

  if (includeKnown && userId !== undefined && userId.length > 0) {
    const known = await prisma.spaceAccess.findMany({
      where: { userId },
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

  return collected;
};

const validateSpacePassword = async ({
  space,
  password,
  res,
}: {
  space: SpaceShape;
  password: string | undefined;
  res: Response;
}) => {
  const passwordHash = space.passwordHash;
  if (
    space.visibility !== 'private' ||
    typeof passwordHash !== 'string' ||
    passwordHash.length === 0
  ) {
    return true;
  }
  if (password === undefined || password.length === 0) {
    res
      .status(403)
      .json({ error: 'Password required', requiresPassword: true });
    return false;
  }
  const passwordMatches = await bcrypt.compare(password, passwordHash);
  if (passwordMatches === false) {
    res.status(403).json({ error: 'Invalid password', requiresPassword: true });
    return false;
  }
  return true;
};

export const registerCareersSpacesRoutes = ({
  router,
  prisma,
  requireAuth,
  requireUser,
  DEFAULT_SPACE_ID,
  CAREERS,
  getExamDefinitions,
  ensureUserCareers,
  issueLicense,
  canManageSpace,
  seedDefaultMissions,
  recordLog,
}: RegisterCareersSpacesRoutesDeps) => {
  router.get('/careers', requireAuth, (_req, res) => {
    res.json({ careers: CAREERS });
  });

  router.get('/careers/status', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      await ensureUserCareers(user.userId);
      const careers = await prisma.userCareer.findMany({
        where: { userId: user.userId },
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
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const careerId = readString(body, 'careerId');
      if (careerId === undefined || careerId.length === 0) {
        res.status(400).json({ error: 'Missing career id' });
        return;
      }
      await ensureUserCareers(user.userId);
      await prisma.userCareer.updateMany({
        where: { userId: user.userId },
        data: { active: false },
      });
      const updated = await prisma.userCareer.update({
        where: {
          userId_careerId: { userId: user.userId, careerId },
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
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const licenses = await prisma.license.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ licenses });
    } catch (err) {
      console.error('Failed to load licenses', err);
      res.status(500).json({ error: 'Failed to load licenses' });
    }
  });

  router.post('/licenses/renew', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const body = asRecord(req.body as unknown);
      const licenseKey = readString(body, 'licenseKey');
      if (licenseKey === undefined || licenseKey.length === 0) {
        res.status(400).json({ error: 'Missing license key' });
        return;
      }
      const durationDaysValue = readNumber(body, 'durationDays');
      const durationDays =
        durationDaysValue !== undefined && durationDaysValue > 0
          ? durationDaysValue
          : 90;
      await issueLicense({
        userId: user.userId,
        licenseKey,
        durationDays,
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to renew license', err);
      res.status(500).json({ error: 'Failed to renew license' });
    }
  });

  router.get('/exams', requireAuth, (_req, res) => {
    res.json({ exams: getExamDefinitions() });
  });

  router.post('/exams/:id/attempt', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const examId = req.params.id;
      const body = asRecord(req.body as unknown);
      const score = readNumber(body, 'score');
      if (score === undefined) {
        res.status(400).json({ error: 'Missing exam score' });
        return;
      }
      const exam = await prisma.exam.findUnique({ where: { id: examId } });
      if (!exam) {
        res.status(404).json({ error: 'Exam not found' });
        return;
      }
      const passed = score >= exam.minScore;
      const attempt = await prisma.examAttempt.create({
        data: {
          examId: exam.id,
          userId: user.userId,
          score,
          passed,
        },
      });
      if (passed && exam.licenseKey !== null && exam.licenseKey.length > 0) {
        await issueLicense({
          userId: user.userId,
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
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const reputation = await prisma.reputation.findMany({
        where: { userId: user.userId },
        orderBy: { scopeType: 'asc' },
      });
      res.json({ reputation });
    } catch (err) {
      console.error('Failed to load reputation', err);
      res.status(500).json({ error: 'Failed to load reputation' });
    }
  });

  router.get('/spaces', async (req, res) => {
    const inviteToken =
      typeof req.query.inviteToken === 'string'
        ? req.query.inviteToken.trim()
        : undefined;
    const includeKnown =
      typeof req.query.includeKnown === 'string' &&
      ['1', 'true', 'yes'].includes(req.query.includeKnown.toLowerCase());

    try {
      const collected = await collectSpaces({
        prisma,
        userId: req.user?.userId,
        includeKnown,
      });

      if (inviteToken !== undefined && inviteToken.length > 0) {
        const space = await prisma.space.findUnique({
          where: { inviteToken },
        });
        if (!space) {
          res.status(404).json({ error: 'Space not found' });
          return;
        }
        if (
          space.visibility === 'private' &&
          space.passwordHash !== null &&
          space.passwordHash.length > 0
        ) {
          res
            .status(403)
            .json({ error: 'Password required', requiresPassword: true });
          return;
        }
        collected.push(serializeSpace(space));
      }

      res.json({ spaces: mergeSpaces([], collected) });
    } catch (err) {
      console.error('Failed to fetch spaces', err);
      res.status(500).json({ error: 'Failed to fetch spaces' });
    }
  });

  router.post('/spaces/access', async (req, res) => {
    const body = asRecord(req.body as unknown);
    const inviteTokenRaw = readString(body, 'inviteToken');
    const inviteToken =
      inviteTokenRaw !== undefined ? inviteTokenRaw.trim() : undefined;
    const password = readString(body, 'password');
    const includeKnown = readBoolean(body, 'includeKnown') === true;

    try {
      const collected = await collectSpaces({
        prisma,
        userId: req.user?.userId,
        includeKnown,
      });

      if (inviteToken !== undefined && inviteToken.length > 0) {
        const space = await prisma.space.findUnique({
          where: { inviteToken },
        });
        if (!space) {
          res.status(404).json({ error: 'Space not found' });
          return;
        }
        const hasAccess = await validateSpacePassword({ space, password, res });
        if (!hasAccess) {
          return;
        }
        collected.push(serializeSpace(space));
      }

      res.json({ spaces: mergeSpaces([], collected) });
    } catch (err) {
      console.error('Failed to fetch spaces', err);
      res.status(500).json({ error: 'Failed to fetch spaces' });
    }
  });

  router.post('/spaces', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    const body = asRecord(req.body as unknown);
    const name = (readString(body, 'name') ?? '').trim();
    if (name.length === 0) {
      res.status(400).json({ error: 'Space name is required' });
      return;
    }
    const visibility =
      readString(body, 'visibility') === 'private' ? 'private' : 'public';
    const requestedKind = readString(body, 'kind');
    const kind =
      user.roles.includes('admin') &&
      (requestedKind === 'tutorial' || requestedKind === 'scenario')
        ? requestedKind
        : 'free';
    const rankRequiredRaw = readNumber(body, 'rankRequired') ?? 1;
    const rankRequired = Number.isFinite(rankRequiredRaw)
      ? Math.max(1, Math.round(rankRequiredRaw))
      : 1;
    const rules =
      user.roles.includes('admin') &&
      body !== undefined &&
      body.rules !== undefined
        ? body.rules
        : null;
    const rulesInput =
      rules === null
        ? Prisma.JsonNull
        : isJsonValue(rules)
          ? rules
          : Prisma.JsonNull;
    const rulesetType = readString(body, 'rulesetType');
    const password = readString(body, 'password');
    const inviteTokenRaw = readString(body, 'inviteToken');
    const inviteToken =
      inviteTokenRaw !== undefined && inviteTokenRaw.trim().length > 0
        ? inviteTokenRaw.trim()
        : randomUUID();

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
      const passwordHash =
        password !== undefined && password.length > 0
          ? await bcrypt.hash(password, 10)
          : null;
      const space = await prisma.space.create({
        data: {
          name,
          visibility,
          inviteToken,
          passwordHash,
          kind,
          rankRequired,
          rulesetType: rulesetType ?? 'CASUAL',
          rules: rulesInput,
          createdBy: user.userId,
        },
      });
      await seedDefaultMissions(space.id).catch(err => {
        console.warn('Failed to seed default missions', err);
      });
      await prisma.spaceAccess.upsert({
        where: {
          userId_spaceId: { userId: user.userId, spaceId: space.id },
        },
        update: { role: 'host', inviteToken: space.inviteToken ?? null },
        create: {
          userId: user.userId,
          spaceId: space.id,
          inviteToken: space.inviteToken ?? null,
          role: 'host',
        },
      });
      res.status(201).json(serializeSpace(space));
    } catch (err) {
      console.error('Failed to create space', err);
      res.status(500).json({ error: 'Failed to create space' });
    }
  });

  router.post('/spaces/known', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    const body = asRecord(req.body as unknown);
    const spaceId = readString(body, 'spaceId');
    const inviteToken = readString(body, 'inviteToken');
    if (spaceId === undefined || spaceId.length === 0) {
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
        where: { userId_spaceId: { userId: user.userId, spaceId } },
        update: { inviteToken: inviteToken ?? space.inviteToken ?? null },
        create: {
          userId: user.userId,
          spaceId,
          inviteToken: inviteToken ?? space.inviteToken ?? null,
          role: 'member',
        },
      });
      res.json({ success: true });
    } catch (err) {
      console.error('Failed to save known space', err);
      res.status(500).json({ error: 'Failed to save known space' });
    }
  });

  router.get('/spaces/mine', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const spaces = await prisma.space.findMany({
        where: { createdBy: user.userId },
        orderBy: { createdAt: 'desc' },
      });
      res.json({
        spaces: spaces.map((space: SpaceShape) => ({
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

  router.get('/spaces/manage', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    const scope =
      typeof req.query.scope === 'string' ? req.query.scope : 'mine';
    const isAdmin = user.roles.includes('admin');
    const where = scope === 'all' && isAdmin ? {} : { createdBy: user.userId };
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
        spaces: spaces.map((space: SpaceShape) => ({
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

  router.patch('/spaces/:spaceId', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    const { spaceId } = req.params;
    try {
      const space = await prisma.space.findUnique({ where: { id: spaceId } });
      if (!space) {
        res.status(404).json({ error: 'Space not found' });
        return;
      }
      if (!(await canManageSpace(user, spaceId))) {
        res.status(403).json({ error: 'Not authorized to edit this space' });
        return;
      }
      const body = asRecord(req.body as unknown);

      const name =
        readString(body, 'name') !== undefined
          ? readString(body, 'name')?.trim()
          : undefined;
      const visibility =
        readString(body, 'visibility') === 'private'
          ? 'private'
          : readString(body, 'visibility');
      const password = readString(body, 'password');
      const clearPassword = readBoolean(body, 'clearPassword') === true;
      const regenerateInvite = readBoolean(body, 'regenerateInvite') === true;
      const requestedKind = readString(body, 'kind');
      const requestedRank = readNumber(body, 'rankRequired');
      const requestedRules = body?.rules;
      const requestedRulesetType = readString(body, 'rulesetType');
      const hasRulesField =
        body !== undefined &&
        Object.prototype.hasOwnProperty.call(body, 'rules');

      const nextVisibility =
        visibility === 'public' || visibility === 'private'
          ? visibility
          : space.visibility;
      const nextName =
        name !== undefined && name.length > 0 ? name : space.name;

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
      if (name !== undefined && name.length > 0) updates.name = name;
      if (nextVisibility !== space.visibility)
        updates.visibility = nextVisibility;
      if (regenerateInvite) updates.inviteToken = randomUUID();
      if (password !== undefined && password.trim().length > 0) {
        updates.passwordHash = await bcrypt.hash(password, 10);
      } else if (clearPassword) {
        updates.passwordHash = null;
      }
      if (
        user.roles.includes('admin') &&
        (requestedKind === 'free' ||
          requestedKind === 'tutorial' ||
          requestedKind === 'scenario')
      ) {
        updates.kind = requestedKind;
      }
      if (
        user.roles.includes('admin') &&
        requestedRank !== undefined &&
        Number.isFinite(requestedRank)
      ) {
        updates.rankRequired = Math.max(1, Math.round(requestedRank));
      }
      if (hasRulesField && (await canManageSpace(user, spaceId))) {
        updates.rules = requestedRules ?? null;
      }
      if (
        requestedRulesetType !== undefined &&
        requestedRulesetType.length > 0 &&
        [
          'CASUAL',
          'REALISM',
          'CUSTOM',
          'EXAM',
          'CASUAL_PUBLIC',
          'SIM_PUBLIC',
          'PRIVATE_SANDBOX',
          'TRAINING_EXAM',
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
            ? updates.rulesetType
            : updated.rulesetType,
        previousRules: normalizeRules(space.rules),
        nextRules:
          updates.rules !== undefined
            ? normalizeRules(updates.rules)
            : normalizeRules(space.rules),
        changedBy: user.userId,
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

  router.delete('/spaces/:spaceId', requireAuth, async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
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
      if (!(await canManageSpace(user, spaceId))) {
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
};
