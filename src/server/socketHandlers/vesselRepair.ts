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
    const currentUserId = socket.data.userId || effectiveUserId;
    if (!currentUserId) return;
    const vesselKey =
      data?.vesselId ||
      getVesselIdForUser(currentUserId, spaceId) ||
      currentUserId;
    const target = globalState.vessels.get(vesselKey);
    if (!target || (target.spaceId || defaultSpaceId) !== spaceId) {
      callback?.({ ok: false, message: 'Vessel not found' });
      return;
    }

    const isCrew = target.crewIds.has(currentUserId);
    const isAdmin = hasAdminRole(socket);
    if (!isCrew && !isAdmin) {
      callback?.({
        ok: false,
        message: 'Not authorized to repair this vessel',
      });
      return;
    }

    const speed = Math.hypot(target.velocity.surge, target.velocity.sway);
    if (speed > 0.2) {
      callback?.({ ok: false, message: 'Stop the vessel before repairs' });
      return;
    }

    const damageState = mergeDamageState(
      target.damageState ?? DEFAULT_DAMAGE_STATE,
    );
    const cost = computeRepairCost(damageState);
    if (cost <= 0) {
      callback?.({ ok: true, message: 'No repairs needed' });
      return;
    }

    const chargeUserId = resolveChargeUserId(target);
    if (!chargeUserId) {
      callback?.({ ok: false, message: 'Unable to bill repairs' });
      return;
    }

    try {
      let costToCharge = cost;
      if (target.ownerId) {
        const policy = await prisma.insurancePolicy.findFirst({
          where: {
            vesselId: target.id,
            ownerId: target.ownerId,
            status: 'active',
            type: 'damage',
          },
        });
        if (policy) {
          const payout = Math.max(
            0,
            Math.min(cost - (policy.deductible ?? 0), policy.coverage ?? 0),
          );
          if (payout > 0) {
            costToCharge = Math.max(0, cost - payout);
            const payoutProfile = await applyEconomyAdjustment({
              userId: target.ownerId,
              vesselId: target.id,
              deltaCredits: payout,
              reason: 'insurance_payout',
              meta: { policyId: policy.id, repairCost: cost },
            });
            io.to(`user:${target.ownerId}`).emit(
              'economy:update',
              payoutProfile,
            );
            void syncUserSocketsEconomy(target.ownerId, payoutProfile);
          }
        }
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
      callback?.({ ok: true, message: `Repairs complete (${cost} cr)` });
    } catch (err) {
      console.error('Failed to repair vessel', err);
      callback?.({ ok: false, message: 'Repair failed' });
    }
  });
}
