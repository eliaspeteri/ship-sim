import express from 'express';
import {
  authenticateRequest,
  requireAuth,
  requireUser,
  type AuthenticatedUser,
} from './middleware/authentication';
import {
  requirePermission,
  requireRole,
  requireSelfOrRole,
} from './middleware/authorization';
import { prisma } from '../lib/prisma';
import { recordMetric, serverMetrics } from './metrics';
import { clearLogs, getLogs, recordLog } from './observability';
import { seedDefaultMissions } from './missions';
import type { Rules } from '../types/rules.types';
import {
  CAREERS,
  getExamDefinitions,
  ensureUserCareers,
  issueLicense,
} from './careers';
import { registerAdminRoutes } from './routes/adminRoutes';
import { registerCareersSpacesRoutes } from './routes/careersSpacesRoutes';
import { registerMissionRoutes } from './routes/missionRoutes';
import { registerEconomyRoutes } from './routes/economyRoutes';
import { registerVesselEnvironmentRoutes } from './routes/vesselEnvironmentRoutes';
import { createInMemoryUserSettingsStore } from './services/userSettingsStore';

const router = express.Router();
const DEFAULT_SPACE_ID = process.env.DEFAULT_SPACE_ID ?? 'global';

router.use(authenticateRequest);
router.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    recordMetric('api', Date.now() - start);
  });
  next();
});

const canManageSpace = async (
  user: AuthenticatedUser | null,
  spaceId: string,
) => {
  if (!user) return false;
  if (user.roles.includes('admin')) return true;
  const userId = user.userId;
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { createdBy: true },
  });
  if (
    space?.createdBy !== null &&
    space?.createdBy !== undefined &&
    space.createdBy === userId
  ) {
    return true;
  }
  const access = await prisma.spaceAccess.findUnique({
    where: { userId_spaceId: { userId, spaceId } },
    select: { role: true },
  });
  return access?.role === 'host';
};

const serializeSpace = (space: {
  id: string;
  name: string;
  visibility: string;
  inviteToken: string | null;
  kind?: string | null;
  rankRequired?: number | null;
  rulesetType?: string | null;
  rules?: unknown;
  createdBy?: string | null;
}) => ({
  id: space.id,
  name: space.name,
  visibility: space.visibility,
  inviteToken: space.inviteToken ?? undefined,
  kind: space.kind ?? 'free',
  rankRequired: space.rankRequired ?? 1,
  rulesetType: space.rulesetType ?? undefined,
  rules:
    space.rules !== null &&
    space.rules !== undefined &&
    typeof space.rules === 'object' &&
    !Array.isArray(space.rules)
      ? (space.rules as Rules)
      : null,
  createdBy: space.createdBy ?? undefined,
});

const userSettingsStore = createInMemoryUserSettingsStore();

registerVesselEnvironmentRoutes({
  router,
  prisma,
  requireAuth,
  requireSelfOrRole,
  requirePermission,
  requireUser,
  DEFAULT_SPACE_ID,
  canManageSpace,
});

registerMissionRoutes({
  router,
  prisma,
  requireAuth,
  requirePermission,
  requireUser,
  DEFAULT_SPACE_ID,
  serializeSpace,
});

registerEconomyRoutes({
  router,
  prisma,
  requireAuth,
  requirePermission,
  requireUser,
});

registerCareersSpacesRoutes({
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
});

registerAdminRoutes({
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
});

export default router;
