import { applyEconomyAdjustment } from '../economy';
import { prisma } from '../../lib/prisma';
import {
  applyRepair,
  computeRepairCost,
  DEFAULT_DAMAGE_STATE,
  mergeDamageState,
} from '../../lib/damage';
import { syncUserSocketsEconomy } from '../index';
import type { SocketHandlerContext } from './context';

const applyInsuranceRepairPayout = async (params: {
  vesselId: string;
  ownerId: string;
  repairCost: number;
  io: SocketHandlerContext['io'];
}) => {
  const policy = await prisma.insurancePolicy.findFirst({
    where: {
      vesselId: params.vesselId,
      ownerId: params.ownerId,
      status: 'active',
      type: 'damage',
    },
  });
  if (!policy) {
    return 0;
  }
  const payout = Math.max(
    0,
    Math.min(params.repairCost - policy.deductible, policy.coverage),
  );
  if (payout <= 0) {
    return 0;
  }
  const payoutProfile = await applyEconomyAdjustment({
    userId: params.ownerId,
    vesselId: params.vesselId,
    deltaCredits: payout,
    reason: 'insurance_payout',
    meta: { policyId: policy.id, repairCost: params.repairCost },
  });
  params.io.to(`user:${params.ownerId}`).emit('economy:update', payoutProfile);
  void syncUserSocketsEconomy(params.ownerId, payoutProfile);
  return payout;
};

export function registerVesselRepairHandler({
  io,
  socket,
  spaceId,
  effectiveUserId,
  globalState,
  getVesselIdForUser,
  hasAdminRole,
  resolveChargeUserId,
  persistVesselToDb,
  toSimpleVesselState,
  defaultSpaceId,
}: SocketHandlerContext) {
  socket.on('vessel:repair', async (data, callback) => {
    const currentUserId = effectiveUserId;
    const requestedVesselId =
      typeof data.vesselId === 'string' && data.vesselId.length > 0
        ? data.vesselId
        : undefined;
    const vesselKey =
      requestedVesselId ??
      getVesselIdForUser(currentUserId, spaceId) ??
      currentUserId;
    const target = globalState.vessels.get(vesselKey);
    if (!target || (target.spaceId ?? defaultSpaceId) !== spaceId) {
      callback({ ok: false, message: 'Vessel not found' });
      return;
    }

    const isCrew = target.crewIds.has(currentUserId);
    const isAdmin = hasAdminRole(socket);
    if (!isCrew && !isAdmin) {
      callback({
        ok: false,
        message: 'Not authorized to repair this vessel',
      });
      return;
    }

    const speed = Math.hypot(target.velocity.surge, target.velocity.sway);
    if (speed > 0.2) {
      callback({ ok: false, message: 'Stop the vessel before repairs' });
      return;
    }

    const damageState = mergeDamageState(
      target.damageState ?? DEFAULT_DAMAGE_STATE,
    );
    const cost = computeRepairCost(damageState);
    if (cost <= 0) {
      callback({ ok: true, message: 'No repairs needed' });
      return;
    }

    const chargeUserId = resolveChargeUserId(target);

    try {
      let costToCharge = cost;
      if (target.ownerId !== null && target.ownerId.length > 0) {
        const payout = await applyInsuranceRepairPayout({
          vesselId: target.id,
          ownerId: target.ownerId,
          repairCost: cost,
          io,
        });
        costToCharge = Math.max(0, cost - payout);
      }
      const profile = await applyEconomyAdjustment({
        userId: chargeUserId,
        vesselId: target.id,
        deltaCredits: -costToCharge,
        deltaSafetyScore: 0,
        reason: 'repair',
        meta: { cost: costToCharge },
      });
      target.damageState = applyRepair();
      if (target.failureState) {
        target.failureState.floodingLevel = 0;
        target.failureState.engineFailure = false;
        target.failureState.steeringFailure = false;
      }
      target.lastUpdate = Date.now();
      void persistVesselToDb(target, { force: true });
      io.to(`user:${chargeUserId}`).emit('economy:update', profile);
      void syncUserSocketsEconomy(chargeUserId, profile);
      io.to(`space:${spaceId}`).emit('simulation:update', {
        vessels: { [target.id]: toSimpleVesselState(target) },
        partial: true,
        timestamp: Date.now(),
      });
      callback({ ok: true, message: `Repairs complete (${cost} cr)` });
    } catch (err) {
      console.error('Failed to repair vessel', err);
      callback({ ok: false, message: 'Repair failed' });
    }
  });
}
