import { distanceMeters, positionFromXY } from '../lib/position';
import { prisma } from '../lib/prisma';

import type { VesselPose } from '../types/vessel.types';

export const ECONOMY_THROTTLE_EPS = 0.03; // below this = engine effectively off

type EconomyProfile = {
  rank: number;
  experience: number;
  credits: number;
  safetyScore: number;
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

export const resolvePortForPosition = (position: VesselPose['position']) => {
  const closest = PORTS.find(
    port => distanceMeters(position, port.position) < 250,
  );
  return closest || null;
};

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
