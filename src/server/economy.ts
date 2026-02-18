import {
  economyLedger,
  getRulesForSpace,
  io as serverIo,
  persistVesselToDb,
  syncUserSocketsEconomy,
} from '.';
import { distanceMeters, positionFromXY } from '../lib/position';
import { prisma } from '../lib/prisma';

import type { VesselRecord } from '.';
import type { VesselPose } from '../types/vessel.types';
import type { Prisma } from '@prisma/client';
import type { Server } from 'socket.io';

// --- Economy charging model (tunable knobs) ---
// Treat these as "design constants" you can tweak without changing behavior shape.
export const ECONOMY_CHARGE_INTERVAL_MS = 10_000; // how often to charge operating costs
export const ECONOMY_BASE_COST = 4; // base cost per interval (idle, engine off)
export const ECONOMY_THROTTLE_COST = 18; // additional cost per interval at full throttle
export const ECONOMY_IDLE_SPEED_KTS = 0.3; // below this = basically stopped
export const ECONOMY_UNDERWAY_SPEED_KTS = 1.0; // above this = underway (coasting counts)
export const ECONOMY_THROTTLE_EPS = 0.03; // below this = engine effectively off
export const ECONOMY_DRIFT_MULTIPLIER = 0.35; // cost factor when drifting (underway with ~0 throttle)
export const ECONOMY_IDLE_MULTIPLIER = 0.1; // cost factor when idle (optional; set 0 to disable)
export const ECONOMY_UNDERWAY_BASE = 2.0; // base cost per interval while underway (in addition to your base)
export const ECONOMY_OVERDRAFT_GUARD = true; // if true, clamp charges so credits don't go far negative
export const ECONOMY_DEFAULT_CREW_WAGE = 6; // credits per interval
export const ECONOMY_DEFAULT_CREW_SHARE = 0.06; // share of positive revenue
export const LOAN_ACCRUAL_INTERVAL_MS = 60 * 60 * 1000;
export const INSURANCE_PREMIUM_INTERVAL_MS = 60 * 60 * 1000;
export const LEASE_CHARGE_INTERVAL_MS = 60 * 60 * 1000;
export const VESSEL_CREATION_BASE_COST = 500;
export const VESSEL_CREATION_RANK_MULTIPLIER = 250;
export const VESSEL_CARGO_CAPACITY_RATIO = 0.03; // fraction of mass usable for cargo
const PORT_FEE = 120;

export type EconomyProfile = {
  rank: number;
  experience: number;
  credits: number;
  safetyScore: number;
};

export type EconomyAdjustment = {
  userId: string;
  deltaCredits?: number;
  deltaExperience?: number;
  deltaSafetyScore?: number;
  vesselId?: string | null;
  reason: string;
  meta?: Record<string, unknown> | null;
};

const DEFAULT_ECONOMY: EconomyProfile = {
  rank: 1,
  experience: 0,
  credits: 0,
  safetyScore: 1,
};

const loanAccrualLedger = new Map<string, number>();
const insuranceChargeLedger = new Map<string, number>();
const repossessionLedger = new Map<string, number>();

export const calculateVesselCreationCost = (rank: number) =>
  VESSEL_CREATION_BASE_COST +
  Math.max(0, rank - 1) * VESSEL_CREATION_RANK_MULTIPLIER;

export const estimateCargoCapacityTons = (massKg: number) =>
  (massKg * VESSEL_CARGO_CAPACITY_RATIO) / 1000;

export const estimatePassengerCapacity = (length: number) =>
  Math.max(4, Math.round(length * 0.6));

export const getVesselCargoCapacityTons = (vessel: VesselRecord) => {
  const massKg = vessel.properties.mass;
  return estimateCargoCapacityTons(massKg);
};

export const getVesselPassengerCapacity = (vessel: VesselRecord) => {
  const length = vessel.properties.length;
  return estimatePassengerCapacity(length);
};

const PORTS = [
  {
    id: 'harbor-alpha',
    name: 'Harbor Alpha',
    size: 'large',
    region: 'north',
    position: positionFromXY({ x: 0, y: 0 }),
  },
  {
    id: 'bay-delta',
    name: 'Bay Delta',
    size: 'medium',
    region: 'south',
    position: positionFromXY({ x: 2000, y: -1500 }),
  },
  {
    id: 'island-anchorage',
    name: 'Island Anchorage',
    size: 'small',
    region: 'islands',
    position: positionFromXY({ x: -2500, y: 1200 }),
  },
  {
    id: 'channel-gate',
    name: 'Channel Gate',
    size: 'medium',
    region: 'east',
    position: positionFromXY({ x: 800, y: 2400 }),
  },
];

export const ECONOMY_PORTS = PORTS.map(port => ({
  id: port.id,
  name: port.name,
  size: port.size,
  region: port.region,
  position: port.position,
}));

export const resolvePortForPosition = (position: VesselPose['position']) => {
  const closest = PORTS.find(
    port => distanceMeters(position, port.position) < 250,
  );
  return closest || null;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const calculateRank = (experience: number) =>
  Math.max(1, Math.floor(experience / 1000) + 1);

export async function getEconomyProfile(
  userId: string,
): Promise<EconomyProfile> {
  const record = (await prisma.user.findUnique({
    where: { id: userId },
    select: {
      rank: true,
      experience: true,
      credits: true,
      safetyScore: true,
    },
  })) as {
    rank: number;
    experience: number;
    credits: number;
    safetyScore: number;
  } | null;
  if (!record) return { ...DEFAULT_ECONOMY };
  return {
    rank: record.rank,
    experience: record.experience,
    credits: record.credits,
    safetyScore: record.safetyScore,
  };
}

export async function applyEconomyAdjustment(
  adjustment: EconomyAdjustment,
): Promise<EconomyProfile> {
  const current = await getEconomyProfile(adjustment.userId);
  const nextExperience = current.experience + (adjustment.deltaExperience ?? 0);
  const nextRank = calculateRank(nextExperience);
  const nextCredits = current.credits + (adjustment.deltaCredits ?? 0);
  const nextSafety = clamp(
    current.safetyScore + (adjustment.deltaSafetyScore ?? 0),
    0,
    2,
  );

  console.info(`Applying economy adjustment for user ${adjustment.userId}:`, {
    from: current,
    to: {
      rank: nextRank,
      experience: nextExperience,
      credits: nextCredits,
      safetyScore: nextSafety,
    },
    adjustment,
  });
  await prisma.user.update({
    where: { id: adjustment.userId },
    data: {
      rank: nextRank,
      experience: nextExperience,
      credits: nextCredits,
      safetyScore: nextSafety,
    },
  });

  if ((adjustment.deltaCredits ?? 0) !== 0) {
    await prisma.economyTransaction.create({
      data: {
        userId: adjustment.userId,
        vesselId: adjustment.vesselId ?? null,
        amount: adjustment.deltaCredits ?? 0,
        reason: adjustment.reason,
        meta: (adjustment.meta ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
  }

  return {
    rank: nextRank,
    experience: nextExperience,
    credits: nextCredits,
    safetyScore: nextSafety,
  };
}

// Utility
const msToIntervals = (dtMs: number) => dtMs / ECONOMY_CHARGE_INTERVAL_MS;

// If you already have a knots helper elsewhere, use it. This is safe.
const speedKnotsForVessel = (v: VesselRecord) => {
  const speedMs = Math.sqrt(v.velocity.surge ** 2 + v.velocity.sway ** 2);
  return speedMs * 1.94384; // m/s -> knots
};

// Classify operational state using speed + throttle (+ optional context like port/anchorage later)
type VesselOpState = 'idle' | 'drifting' | 'underway';

const classifyVesselOpState = (v: VesselRecord): VesselOpState => {
  const kts = speedKnotsForVessel(v);
  const throttle = Math.abs(v.controls.throttle);

  if (kts < ECONOMY_IDLE_SPEED_KTS && throttle < ECONOMY_THROTTLE_EPS)
    return 'idle';
  if (kts >= ECONOMY_UNDERWAY_SPEED_KTS && throttle < ECONOMY_THROTTLE_EPS)
    return 'drifting';
  return 'underway';
};

const resolveChargeUserId = (vessel: VesselRecord) =>
  vessel.chartererId ?? vessel.leaseeId ?? vessel.ownerId;

const isVesselStored = (vessel: VesselRecord) => vessel.status === 'stored';

const ensureCrewContracts = async (vessel: VesselRecord) => {
  if (vessel.ownerId === null || vessel.ownerId.length === 0) return;
  const crewIds = Array.from(vessel.crewIds.values());
  if (crewIds.length === 0) return;
  const existing = await prisma.crewContract.findMany({
    where: {
      vesselId: vessel.id,
      status: { in: ['draft', 'active'] },
      releasedAt: null,
    },
    select: { userId: true },
  });
  const existingByUser = new Set(
    existing.map((row: { userId: string }) => row.userId),
  );
  const createData = crewIds
    .filter(userId => !existingByUser.has(userId))
    .map(userId => ({
      vesselId: vessel.id,
      userId,
      wageRate: userId === vessel.ownerId ? 0 : ECONOMY_DEFAULT_CREW_WAGE,
      revenueShare: userId === vessel.ownerId ? 0 : ECONOMY_DEFAULT_CREW_SHARE,
      status: 'draft',
    }));
  if (createData.length > 0) {
    await prisma.crewContract.createMany({ data: createData });
  }
};

const lockCrewContractsForVoyage = async (
  vessel: VesselRecord,
  now: number,
) => {
  if (vessel.ownerId === null || vessel.ownerId.length === 0) return;
  const crewIds = Array.from(vessel.crewIds.values());
  if (crewIds.length === 0) return;
  await prisma.crewContract.updateMany({
    where: {
      vesselId: vessel.id,
      userId: { in: crewIds },
      status: 'draft',
      releasedAt: null,
    },
    data: { status: 'active', lockedAt: new Date(now) },
  });
};

const releaseCrewContracts = async (vessel: VesselRecord, now: number) => {
  await prisma.crewContract.updateMany({
    where: { vesselId: vessel.id, status: 'active', releasedAt: null },
    data: { status: 'completed', releasedAt: new Date(now) },
  });
};

const applyCrewWages = async (
  vessel: VesselRecord,
  intervals: number,
  io: Server,
) => {
  if (vessel.ownerId === null || vessel.ownerId.length === 0 || intervals <= 0)
    return;
  const chargeUserId = resolveChargeUserId(vessel);
  if (chargeUserId === null || chargeUserId.length === 0) return;
  const contracts = await prisma.crewContract.findMany({
    where: { vesselId: vessel.id, status: 'active', releasedAt: null },
  });
  const staleContractIds = contracts
    .filter(
      contract =>
        contract.userId !== chargeUserId &&
        !vessel.crewIds.has(contract.userId),
    )
    .map(contract => contract.id);
  if (staleContractIds.length > 0) {
    await prisma.crewContract.updateMany({
      where: { id: { in: staleContractIds } },
      data: { status: 'completed', releasedAt: new Date() },
    });
  }
  for (const contract of contracts) {
    if (
      contract.userId !== chargeUserId &&
      !vessel.crewIds.has(contract.userId)
    ) {
      continue;
    }
    const wage = contract.wageRate * intervals;
    if (wage <= 0) continue;
    if (contract.userId !== chargeUserId) {
      const crewProfile = await applyEconomyAdjustment({
        userId: contract.userId,
        vesselId: vessel.id,
        deltaCredits: wage,
        reason: 'crew_wage',
        meta: { vesselId: vessel.id },
      });
      io.to(`user:${contract.userId}`).emit('economy:update', crewProfile);
      void syncUserSocketsEconomy(contract.userId, crewProfile);
    }
    const ownerProfile = await applyEconomyAdjustment({
      userId: chargeUserId,
      vesselId: vessel.id,
      deltaCredits: -wage,
      reason: 'crew_wage',
      meta: { vesselId: vessel.id, crewId: contract.userId },
    });
    io.to(`user:${chargeUserId}`).emit('economy:update', ownerProfile);
    void syncUserSocketsEconomy(chargeUserId, ownerProfile);
  }
};

const applyLoanInterestForUser = async (userId: string, now: number) => {
  const last = loanAccrualLedger.get(userId) ?? 0;
  if (now - last < LOAN_ACCRUAL_INTERVAL_MS) return;
  loanAccrualLedger.set(userId, now);
  const loans = await prisma.loan.findMany({
    where: { userId, status: 'active' },
  });
  if (loans.length === 0) return;
  const yearMs = 365 * 24 * 60 * 60 * 1000;
  for (const loan of loans) {
    const lastAccrued =
      loan.lastAccruedAt?.getTime() ?? loan.issuedAt.getTime();
    const dt = Math.max(0, now - lastAccrued);
    if (dt <= 0) continue;
    const interest = (loan.balance * loan.interestRate * dt) / yearMs;
    const nextBalance = loan.balance + interest;
    const defaulted = loan.dueAt && now > loan.dueAt.getTime();
    await prisma.loan.update({
      where: { id: loan.id },
      data: {
        balance: nextBalance,
        lastAccruedAt: new Date(now),
        status: defaulted && nextBalance > 0 ? 'defaulted' : 'active',
      },
    });
  }
};

const enforceLoanRepossession = async (vessel: VesselRecord, now: number) => {
  if (vessel.ownerId === null || vessel.ownerId.length === 0) return;
  const last = repossessionLedger.get(vessel.ownerId) ?? 0;
  if (now - last < LOAN_ACCRUAL_INTERVAL_MS) return;
  const defaulted = await prisma.loan.findFirst({
    where: { userId: vessel.ownerId, status: 'defaulted' },
  });
  if (!defaulted) return;
  repossessionLedger.set(vessel.ownerId, now);
  if (vessel.status === 'repossession') return;
  await prisma.vesselSale.create({
    data: {
      vesselId: vessel.id,
      sellerId: vessel.ownerId,
      type: 'repossession',
      price: Math.max(defaulted.balance, 0),
      status: 'open',
    },
  });
  vessel.status = 'repossession';
  vessel.ownerId = null;
  vessel.chartererId = null;
  vessel.leaseeId = null;
  vessel.mode = 'ai';
  vessel.desiredMode = 'ai';
  vessel.crewIds.clear();
  vessel.crewNames.clear();
  vessel.helmUserId = null;
  vessel.helmUsername = null;
  vessel.engineUserId = null;
  vessel.engineUsername = null;
  vessel.radioUserId = null;
  vessel.radioUsername = null;
  vessel.lastUpdate = now;
  void persistVesselToDb(vessel, { force: true });
};

const applyInsurancePremiums = async (
  vessel: VesselRecord,
  now: number,
  io: Server,
) => {
  if (vessel.ownerId === null || vessel.ownerId.length === 0) return;
  const last = insuranceChargeLedger.get(vessel.id) ?? 0;
  if (now - last < INSURANCE_PREMIUM_INTERVAL_MS) return;
  insuranceChargeLedger.set(vessel.id, now);
  const policies = await prisma.insurancePolicy.findMany({
    where: {
      vesselId: vessel.id,
      status: 'active',
      OR: [{ activeUntil: null }, { activeUntil: { gt: new Date(now) } }],
    },
  });
  for (const policy of policies) {
    if (policy.premiumRate <= 0) continue;
    const profile = await applyEconomyAdjustment({
      userId: vessel.ownerId,
      vesselId: vessel.id,
      deltaCredits: -policy.premiumRate,
      reason: 'insurance_premium',
      meta: { policyId: policy.id, type: policy.type },
    });
    io.to(`user:${vessel.ownerId}`).emit('economy:update', profile);
    void syncUserSocketsEconomy(vessel.ownerId, profile);
    await prisma.insurancePolicy.update({
      where: { id: policy.id },
      data: { lastChargedAt: new Date(now) },
    });
  }
};

const applyLeaseCharges = async (
  vessel: VesselRecord,
  now: number,
  io: Server,
) => {
  const lease = await prisma.vesselLease.findFirst({
    where: { vesselId: vessel.id, status: 'active' },
  });
  if (
    lease?.lesseeId === null ||
    lease?.lesseeId === undefined ||
    lease.lesseeId.length === 0
  )
    return;
  const startedAtMs = lease.startedAt?.getTime() ?? now;
  const lastCharged = lease.lastChargedAt?.getTime() ?? startedAtMs;
  const dt = now - lastCharged;
  if (dt < LEASE_CHARGE_INTERVAL_MS) return;
  const intervals = Math.floor(dt / LEASE_CHARGE_INTERVAL_MS);
  if (intervals <= 0) return;
  const charge = lease.ratePerHour * intervals;
  if (charge <= 0) return;
  const payerProfile = await applyEconomyAdjustment({
    userId: lease.lesseeId,
    vesselId: vessel.id,
    deltaCredits: -charge,
    reason: 'lease_fee',
    meta: { leaseId: lease.id, intervals },
  });
  io.to(`user:${lease.lesseeId}`).emit('economy:update', payerProfile);
  void syncUserSocketsEconomy(lease.lesseeId, payerProfile);
  const payeeProfile = await applyEconomyAdjustment({
    userId: lease.ownerId,
    vesselId: vessel.id,
    deltaCredits: charge,
    reason: 'lease_income',
    meta: { leaseId: lease.id, intervals },
  });
  io.to(`user:${lease.ownerId}`).emit('economy:update', payeeProfile);
  void syncUserSocketsEconomy(lease.ownerId, payeeProfile);
  await prisma.vesselLease.update({
    where: { id: lease.id },
    data: {
      lastChargedAt: new Date(
        lastCharged + intervals * LEASE_CHARGE_INTERVAL_MS,
      ),
    },
  });
};

const expireLeaseIfNeeded = async (vessel: VesselRecord, now: number) => {
  const lease = await prisma.vesselLease.findFirst({
    where: { vesselId: vessel.id, status: 'active' },
  });
  if (!lease?.endsAt || lease.endsAt.getTime() > now) return false;
  const port = resolvePortForPosition(vessel.position);
  const stored = Boolean(port);
  vessel.status = stored ? 'stored' : 'active';
  vessel.storagePortId = stored ? port!.id : null;
  vessel.storedAt = stored ? now : null;
  vessel.chartererId = null;
  vessel.leaseeId = null;
  vessel.mode = 'ai';
  vessel.desiredMode = 'ai';
  vessel.controls.throttle = 0;
  vessel.controls.rudderAngle = 0;
  vessel.controls.bowThruster = 0;
  vessel.crewIds.clear();
  vessel.crewNames.clear();
  vessel.helmUserId = null;
  vessel.helmUsername = null;
  vessel.engineUserId = null;
  vessel.engineUsername = null;
  vessel.radioUserId = null;
  vessel.radioUsername = null;
  vessel.lastUpdate = now;
  await releaseCrewContracts(vessel, now);
  await prisma.vesselLease.update({
    where: { id: lease.id },
    data: { status: 'completed', endsAt: new Date(now) },
  });
  void persistVesselToDb(vessel, { force: true });
  return true;
};

const applyCargoLiability = async (
  vessel: VesselRecord,
  intervals: number,
  io: Server,
) => {
  if (intervals <= 0) return;
  const cargo = await prisma.cargoLot.findMany({
    where: { vesselId: vessel.id, status: 'loaded' },
  });
  for (const lot of cargo) {
    if (lot.liabilityRate <= 0) continue;
    if (lot.ownerId === null || lot.ownerId.length === 0) continue;
    const cost = lot.value * lot.liabilityRate * intervals;
    if (cost <= 0) continue;
    const profile = await applyEconomyAdjustment({
      userId: lot.ownerId,
      vesselId: vessel.id,
      deltaCredits: -cost,
      reason: 'cargo_liability',
      meta: { cargoId: lot.id },
    });
    io.to(`user:${lot.ownerId}`).emit('economy:update', profile);
    void syncUserSocketsEconomy(lot.ownerId, profile);
  }
};

export const applyEconomyAdjustmentWithRevenueShare = async (
  adjustment: EconomyAdjustment,
  io?: Server,
): Promise<EconomyProfile> => {
  const deltaCredits = adjustment.deltaCredits ?? 0;
  if (
    adjustment.vesselId === null ||
    adjustment.vesselId === undefined ||
    adjustment.vesselId.length === 0 ||
    deltaCredits <= 0
  ) {
    return applyEconomyAdjustment(adjustment);
  }
  const emitter = io ?? serverIo;
  const contracts = await prisma.crewContract.findMany({
    where: {
      vesselId: adjustment.vesselId,
      status: 'active',
      releasedAt: null,
      revenueShare: { gt: 0 },
    },
  });
  let totalShare = 0;
  for (const contract of contracts) {
    if (contract.userId === adjustment.userId) continue;
    const remaining = Math.max(0, deltaCredits - totalShare);
    const share = Math.min(remaining, deltaCredits * contract.revenueShare);
    if (share <= 0) continue;
    totalShare += share;
    const crewProfile = await applyEconomyAdjustment({
      userId: contract.userId,
      vesselId: adjustment.vesselId,
      deltaCredits: share,
      reason: 'crew_share',
      meta: { source: adjustment.reason, vesselId: adjustment.vesselId },
    });
    emitter.to(`user:${contract.userId}`).emit('economy:update', crewProfile);
    void syncUserSocketsEconomy(contract.userId, crewProfile);
  }
  const lease = await prisma.vesselLease.findFirst({
    where: {
      vesselId: adjustment.vesselId,
      status: 'active',
      revenueShare: { gt: 0 },
    },
  });
  if (lease && lease.ownerId !== adjustment.userId) {
    const remaining = Math.max(0, deltaCredits - totalShare);
    const leaseShare = Math.min(remaining, deltaCredits * lease.revenueShare);
    if (leaseShare > 0) {
      totalShare += leaseShare;
      const ownerProfile = await applyEconomyAdjustment({
        userId: lease.ownerId,
        vesselId: adjustment.vesselId,
        deltaCredits: leaseShare,
        reason: 'lease_share',
        meta: { source: adjustment.reason, leaseId: lease.id },
      });
      emitter.to(`user:${lease.ownerId}`).emit('economy:update', ownerProfile);
      void syncUserSocketsEconomy(lease.ownerId, ownerProfile);
    }
  }
  const ownerAdjustment: EconomyAdjustment = {
    ...adjustment,
    deltaCredits: deltaCredits - totalShare,
  };
  return applyEconomyAdjustment(ownerAdjustment);
};

export const updateEconomyForVessel = async (
  vessel: VesselRecord,
  now: number,
  io: Server,
) => {
  const chargeUserId = resolveChargeUserId(vessel);
  if (chargeUserId === null || chargeUserId.length === 0) return;

  // IMPORTANT: remove "player-only" billing; AI or offline still incurs costs if operating
  // (so we do NOT check vessel.mode here)

  const ledger = economyLedger.get(vessel.id) || {
    lastChargeAt: now,
    accrued: 0,
    lastPortId: undefined as string | undefined,
  };

  const dt = now - ledger.lastChargeAt;
  if (dt < ECONOMY_CHARGE_INTERVAL_MS) {
    economyLedger.set(vessel.id, ledger);
    return;
  }
  ledger.lastChargeAt = now;

  if (vessel.ownerId !== null && vessel.ownerId.length > 0) {
    await applyLoanInterestForUser(vessel.ownerId, now);
    await enforceLoanRepossession(vessel, now);
  }
  await applyInsurancePremiums(vessel, now, io);
  const leaseExpired = await expireLeaseIfNeeded(vessel, now);
  if (!leaseExpired) {
    await applyLeaseCharges(vessel, now, io);
  }

  // --- Determine op state ---
  const opState = classifyVesselOpState(vessel);
  const throttle = vessel.controls.throttle;
  const usageFactor = Math.abs(throttle);
  const intervals = msToIntervals(dt);
  const stored = isVesselStored(vessel);
  const port = resolvePortForPosition(vessel.position);

  if (!stored) {
    await ensureCrewContracts(vessel);
    if (opState !== 'idle') {
      await lockCrewContractsForVoyage(vessel, now);
    } else if (port) {
      await releaseCrewContracts(vessel, now);
    }
  }

  // --- Compute costs ---
  if (stored) {
    economyLedger.set(vessel.id, ledger);
    return;
  }

  // 1) Engine/propulsion cost (your existing model)
  const propulsionPerInterval =
    ECONOMY_BASE_COST + ECONOMY_THROTTLE_COST * usageFactor;

  // 2) Underway cost (prevents "free coasting")
  // This makes movement itself cost something, even at zero throttle.
  const underwayPerInterval = opState === 'idle' ? 0 : ECONOMY_UNDERWAY_BASE;

  // 3) Multipliers by state (drifting cheaper than powered underway)
  const stateMultiplier =
    opState === 'idle'
      ? ECONOMY_IDLE_MULTIPLIER
      : opState === 'drifting'
        ? ECONOMY_DRIFT_MULTIPLIER
        : 1.0;

  // Total charge for this tick
  const rawCost =
    (propulsionPerInterval + underwayPerInterval) * intervals * stateMultiplier;

  // --- Apply operating cost ---
  // Optional overdraft guard: avoid surprising massive negative balances if server runs long.
  // This clamps the charge to available credits, and can trigger auto-stop behavior.
  if (rawCost > 0) {
    // Fetch current credits once so we can clamp and optionally auto-stop.
    const currentProfile = await getEconomyProfile(chargeUserId);

    let costToCharge = rawCost;

    const available = currentProfile.credits;
    // Allow a tiny overdraft buffer if you want, or set 0 to never go negative.
    const overdraftBuffer = 0;
    costToCharge = Math.min(
      costToCharge,
      Math.max(0, available + overdraftBuffer),
    );

    if (costToCharge > 0) {
      const profile = await applyEconomyAdjustment({
        userId: chargeUserId,
        vesselId: vessel.id,
        deltaCredits: -costToCharge,
        reason: 'operating_cost',
        meta: {
          throttle,
          intervalMs: dt,
          opState,
          speedKnots: speedKnotsForVessel(vessel),
          multiplier: stateMultiplier,
          propulsionPerInterval,
          underwayPerInterval,
        },
      });
      io.to(`user:${chargeUserId}`).emit('economy:update', profile);
      void syncUserSocketsEconomy(chargeUserId, profile);

      // Safety valve: if they hit 0 credits, prevent runaway "offline burn"
      const rules = getRulesForSpace(vessel.spaceId ?? 'global');
      const shouldAutoStop =
        rules.economy.autoStopOnEmpty === true &&
        profile.credits <= 0 &&
        (vessel.mode === 'ai' || vessel.crewIds.size === 0) &&
        (Math.abs(vessel.controls.throttle) > 0 || opState !== 'idle');
      if (shouldAutoStop) {
        // Force the vessel into a safe state (you can make AI bring to halt too)
        vessel.controls.throttle = 0;
        vessel.controls.bowThruster = 0;
        // optional: also straighten rudder to reduce chaos
        vessel.controls.rudderAngle = 0;

        // optional: if you have a "desiredMode" concept, you can push to AI here
        // vessel.mode = 'ai';

        vessel.lastUpdate = now;
        void persistVesselToDb(vessel, { force: true });
      }
    }
  }

  // --- Port fee (unchanged), but should apply regardless of mode ---
  if (port && ledger.lastPortId !== port.id) {
    ledger.lastPortId = port.id;

    // Optional: only charge port fee if the vessel is "arriving" rather than drifting through.
    // For now, keep as-is.
    const profile = await applyEconomyAdjustment({
      userId: chargeUserId,
      vesselId: vessel.id,
      deltaCredits: -PORT_FEE,
      reason: 'port_fee',
      meta: { portId: port.id, portName: port.name },
    });
    io.to(`user:${chargeUserId}`).emit('economy:update', profile);
    void syncUserSocketsEconomy(chargeUserId, profile);
  }
  if (!port) {
    ledger.lastPortId = undefined;
  }

  await applyCrewWages(vessel, intervals, io);
  await applyCargoLiability(vessel, intervals, io);

  economyLedger.set(vessel.id, ledger);
};
