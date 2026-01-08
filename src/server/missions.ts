import { prisma } from '../lib/prisma';
import { positionFromXY, distanceMeters } from '../lib/position';
import type {
  MissionAssignmentData,
  MissionDefinition,
} from '../types/mission.types';
import { applyEconomyAdjustment } from './economy';

type MissionSeed = Omit<
  MissionDefinition,
  'id' | 'spaceId' | 'active' | 'createdBy'
> & {
  originXY: { x: number; y: number };
  destinationXY: { x: number; y: number };
};

const DEFAULT_MISSIONS: MissionSeed[] = [
  {
    name: 'Harbor Shuttle',
    description: 'Depart the inner harbor and dock at the outer quay.',
    type: 'delivery',
    originXY: { x: 0, y: 0 },
    destinationXY: { x: 1800, y: 1200 },
    rewardCredits: 450,
    requiredRank: 1,
  },
  {
    name: 'Channel Transit',
    description: 'Practice COLREGs by transiting the channel safely.',
    type: 'harbor-entry',
    originXY: { x: -800, y: -1200 },
    destinationXY: { x: 2500, y: -400 },
    rewardCredits: 720,
    requiredRank: 2,
  },
  {
    name: 'Tow Assist',
    description: 'Escort a disabled ship to the anchorage.',
    type: 'towing',
    originXY: { x: 900, y: 2000 },
    destinationXY: { x: -1400, y: 1600 },
    rewardCredits: 1100,
    requiredRank: 3,
  },
];

const MISSION_PICKUP_RADIUS_M = 220;
const MISSION_DELIVERY_RADIUS_M = 260;

const getSeedPayload = (seed: MissionSeed) => {
  const origin = positionFromXY(seed.originXY);
  const destination = positionFromXY(seed.destinationXY);
  return {
    originLat: origin.lat,
    originLon: origin.lon,
    destinationLat: destination.lat,
    destinationLon: destination.lon,
  };
};

export async function seedDefaultMissions(spaceId: string) {
  const existing = (await prisma.mission.findFirst({
    where: { spaceId },
    select: { id: true },
  })) as { id: string } | null;
  if (existing) return;

  await prisma.mission.createMany({
    data: DEFAULT_MISSIONS.map(seed => {
      const payload = getSeedPayload(seed);
      return {
        spaceId,
        name: seed.name,
        description: seed.description,
        type: seed.type,
        originLat: payload.originLat,
        originLon: payload.originLon,
        destinationLat: payload.destinationLat,
        destinationLon: payload.destinationLon,
        rewardCredits: seed.rewardCredits,
        requiredRank: seed.requiredRank,
        active: true,
      };
    }),
  });
}

export async function assignMission(params: {
  missionId: string;
  userId: string;
  vesselId?: string | null;
}): Promise<MissionAssignmentData | null> {
  const mission = (await prisma.mission.findUnique({
    where: { id: params.missionId },
  })) as MissionDefinition | null;
  if (!mission || !mission.active) return null;

  const user = (await prisma.user.findUnique({
    where: { id: params.userId },
    select: { rank: true },
  })) as { rank?: number } | null;
  if ((user?.rank ?? 1) < mission.requiredRank) {
    return null;
  }

  const existing = (await prisma.missionAssignment.findFirst({
    where: {
      userId: params.userId,
      status: { in: ['assigned', 'in_progress'] },
    },
  })) as MissionAssignmentData | null;
  if (existing) {
    return { ...existing, mission };
  }

  const assignment = (await prisma.missionAssignment.create({
    data: {
      missionId: params.missionId,
      userId: params.userId,
      vesselId: params.vesselId || null,
      status: 'assigned',
      progress: { stage: 'pickup' },
    },
  })) as MissionAssignmentData;

  return { ...assignment, mission };
}

export async function updateMissionAssignments(params: {
  spaceId: string;
  vessels: Map<
    string,
    {
      position: { lat: number; lon: number };
      ownerId?: string | null;
    }
  >;
  emitUpdate?: (userId: string, data: MissionAssignmentData) => void;
  emitEconomyUpdate?: (
    userId: string,
    profile: {
      rank: number;
      experience: number;
      credits: number;
      safetyScore: number;
    },
  ) => void;
}) {
  const assignments = (await prisma.missionAssignment.findMany({
    where: {
      status: { in: ['assigned', 'in_progress'] },
      mission: { spaceId: params.spaceId },
    },
    include: { mission: true },
  })) as MissionAssignmentData[];

  if (!assignments.length) return;

  for (const assignment of assignments) {
    const mission = assignment.mission as MissionDefinition | undefined;
    if (!mission) continue;
    const vesselId = assignment.vesselId || undefined;
    const vessel = vesselId ? params.vessels.get(vesselId) : undefined;
    if (!vessel) continue;

    const progress = (assignment.progress || {
      stage: 'pickup',
    }) as { stage: 'pickup' | 'delivery'; pickedUpAt?: number };

    const originPos = {
      lat: mission.originLat,
      lon: mission.originLon,
    };
    const destPos = {
      lat: mission.destinationLat,
      lon: mission.destinationLon,
    };

    if (progress.stage === 'pickup') {
      const distance = distanceMeters(vessel.position, originPos);
      if (distance <= MISSION_PICKUP_RADIUS_M) {
        progress.stage = 'delivery';
        progress.pickedUpAt = Date.now();
        const updated = (await prisma.missionAssignment.update({
          where: { id: assignment.id },
          data: { status: 'in_progress', progress },
        })) as MissionAssignmentData;
        params.emitUpdate?.(assignment.userId, {
          ...updated,
          mission,
        });
      }
      continue;
    }

    if (progress.stage === 'delivery') {
      const distance = distanceMeters(vessel.position, destPos);
      if (distance <= MISSION_DELIVERY_RADIUS_M) {
        const updated = (await prisma.missionAssignment.update({
          where: { id: assignment.id },
          data: { status: 'completed', completedAt: new Date(), progress },
        })) as MissionAssignmentData;
        const profile = await applyEconomyAdjustment({
          userId: assignment.userId,
          vesselId: assignment.vesselId,
          deltaCredits: mission.rewardCredits,
          deltaExperience: mission.rewardCredits,
          reason: 'mission_reward',
          meta: { missionId: mission.id, name: mission.name },
        });
        params.emitUpdate?.(assignment.userId, { ...updated, mission });
        params.emitEconomyUpdate?.(assignment.userId, profile);
        params.emitUpdate?.(assignment.userId, {
          ...updated,
          mission,
          progress: {
            ...progress,
            awardedCredits: mission.rewardCredits,
            newRank: profile.rank,
          } as Record<string, unknown>,
        });
      }
    }
  }
}
