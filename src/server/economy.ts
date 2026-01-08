import { prisma } from '../lib/prisma';

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
