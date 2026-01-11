import { Server } from 'socket.io';
import {
  economyLedger,
  persistVesselToDb,
  syncUserSocketsEconomy,
  VesselRecord,
} from '.';
import { distanceMeters, positionFromXY } from '../lib/position';
import { prisma } from '../lib/prisma';
import { VesselPose } from '../types/vessel.types';

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
export const ECONOMY_AUTO_STOP_ON_EMPTY = true; // if true, when broke, force throttle to 0 (safety valve)
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

const PORTS = [
  {
    id: 'harbor-alpha',
    name: 'Harbor Alpha',
    position: positionFromXY({ x: 0, y: 0 }),
  },
  {
    id: 'bay-delta',
    name: 'Bay Delta',
    position: positionFromXY({ x: 2000, y: -1500 }),
  },
  {
    id: 'island-anchorage',
    name: 'Island Anchorage',
    position: positionFromXY({ x: -2500, y: 1200 }),
  },
  {
    id: 'channel-gate',
    name: 'Channel Gate',
    position: positionFromXY({ x: 800, y: 2400 }),
  },
];

const resolvePortForPosition = (position: VesselPose['position']) => {
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
    rank: record.rank ?? DEFAULT_ECONOMY.rank,
    experience: record.experience ?? DEFAULT_ECONOMY.experience,
    credits: record.credits ?? DEFAULT_ECONOMY.credits,
    safetyScore: record.safetyScore ?? DEFAULT_ECONOMY.safetyScore,
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
        vesselId: adjustment.vesselId || null,
        amount: adjustment.deltaCredits ?? 0,
        reason: adjustment.reason,
        meta: adjustment.meta || undefined,
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
  const speedMs = Math.sqrt(
    (v.velocity.surge ?? 0) ** 2 + (v.velocity.sway ?? 0) ** 2,
  );
  return speedMs * 1.94384; // m/s -> knots
};

// Classify operational state using speed + throttle (+ optional context like port/anchorage later)
type VesselOpState = 'idle' | 'drifting' | 'underway';

const classifyVesselOpState = (v: VesselRecord): VesselOpState => {
  const kts = speedKnotsForVessel(v);
  const throttle = Math.abs(v.controls.throttle ?? 0);

  if (kts < ECONOMY_IDLE_SPEED_KTS && throttle < ECONOMY_THROTTLE_EPS)
    return 'idle';
  if (kts >= ECONOMY_UNDERWAY_SPEED_KTS && throttle < ECONOMY_THROTTLE_EPS)
    return 'drifting';
  return 'underway';
};

export const updateEconomyForVessel = async (
  vessel: VesselRecord,
  now: number,
  io: Server,
) => {
  // Only owners get charged (your intended rule)
  if (!vessel.ownerId) return;

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

  // --- Determine op state ---
  const opState = classifyVesselOpState(vessel);
  const throttle = vessel.controls.throttle ?? 0;
  const usageFactor = Math.abs(throttle);
  const intervals = msToIntervals(dt);

  // --- Compute costs ---
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
    const currentProfile = await getEconomyProfile(vessel.ownerId).catch(
      () => null,
    );

    let costToCharge = rawCost;

    if (ECONOMY_OVERDRAFT_GUARD && currentProfile) {
      const available = currentProfile.credits ?? 0;
      // Allow a tiny overdraft buffer if you want, or set 0 to never go negative.
      const overdraftBuffer = 0;
      costToCharge = Math.min(
        costToCharge,
        Math.max(0, available + overdraftBuffer),
      );
    }

    if (costToCharge > 0) {
      const profile = await applyEconomyAdjustment({
        userId: vessel.ownerId,
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
      io.to(`user:${vessel.ownerId}`).emit('economy:update', profile);
      void syncUserSocketsEconomy(vessel.ownerId, profile);

      // Safety valve: if they hit 0 credits, prevent runaway "offline burn"
      if (
        ECONOMY_AUTO_STOP_ON_EMPTY &&
        (profile.credits ?? 0) <= 0 &&
        (Math.abs(vessel.controls.throttle ?? 0) > 0 || opState !== 'idle')
      ) {
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
  const port = resolvePortForPosition(vessel.position);
  if (port && ledger.lastPortId !== port.id) {
    ledger.lastPortId = port.id;

    // Optional: only charge port fee if the vessel is "arriving" rather than drifting through.
    // For now, keep as-is.
    const profile = await applyEconomyAdjustment({
      userId: vessel.ownerId,
      vesselId: vessel.id,
      deltaCredits: -PORT_FEE,
      reason: 'port_fee',
      meta: { portId: port.id, portName: port.name },
    });
    io.to(`user:${vessel.ownerId}`).emit('economy:update', profile);
    void syncUserSocketsEconomy(vessel.ownerId, profile);
  }
  if (!port) {
    ledger.lastPortId = undefined;
  }

  economyLedger.set(vessel.id, ledger);
};
