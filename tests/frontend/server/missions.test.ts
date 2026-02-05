import {
  assignMission,
  seedDefaultMissions,
  updateMissionAssignments,
} from '../../../src/server/missions';

jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    mission: {
      findFirst: jest.fn(async () => null),
      findUnique: jest.fn(async () => null),
      createMany: jest.fn(async () => ({})),
    },
    missionAssignment: {
      findFirst: jest.fn(async () => null),
      findMany: jest.fn(async () => []),
      create: jest.fn(async () => ({})),
      update: jest.fn(async () => ({})),
    },
    user: {
      findUnique: jest.fn(async () => ({ rank: 1 })),
    },
  },
}));

jest.mock('../../../src/server/economy', () => ({
  applyEconomyAdjustmentWithRevenueShare: jest.fn(async () => ({
    rank: 1,
    experience: 0,
    credits: 100,
    safetyScore: 1,
  })),
  ECONOMY_PORTS: [
    { id: 'port-1', position: { lat: 0, lon: 0 } },
    { id: 'port-2', position: { lat: 10, lon: 10 } },
  ],
}));

jest.mock('../../../src/server/careers', () => ({
  bumpReputation: jest.fn(async () => undefined),
  addCareerExperience: jest.fn(async () => undefined),
}));

describe('missions', () => {
  it('seeds default missions only when none exist', async () => {
    const { prisma } = await import('../../../src/lib/prisma');
    (prisma.mission.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'existing',
    });
    await seedDefaultMissions('space-1');
    expect(prisma.mission.createMany).not.toHaveBeenCalled();

    (prisma.mission.findFirst as jest.Mock).mockResolvedValueOnce(null);
    await seedDefaultMissions('space-1');
    expect(prisma.mission.createMany).toHaveBeenCalled();
  });

  it('assigns missions and respects rank requirements', async () => {
    const { prisma } = await import('../../../src/lib/prisma');
    (prisma.mission.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'm-1',
      active: false,
    });
    await expect(
      assignMission({ missionId: 'm-1', userId: 'u-1' }),
    ).resolves.toBeNull();

    (prisma.mission.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'm-2',
      active: true,
      requiredRank: 3,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ rank: 1 });
    await expect(
      assignMission({ missionId: 'm-2', userId: 'u-1' }),
    ).resolves.toBeNull();

    (prisma.mission.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'm-3',
      active: true,
      requiredRank: 1,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ rank: 2 });
    (prisma.missionAssignment.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'assign-1',
      userId: 'u-1',
      status: 'assigned',
      progress: { stage: 'pickup' },
    });
    const existing = await assignMission({ missionId: 'm-3', userId: 'u-1' });
    expect(existing?.id).toBe('assign-1');

    (prisma.mission.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'm-4',
      active: true,
      requiredRank: 1,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ rank: 2 });
    (prisma.missionAssignment.findFirst as jest.Mock).mockResolvedValueOnce(
      null,
    );
    (prisma.missionAssignment.create as jest.Mock).mockResolvedValueOnce({
      id: 'assign-2',
      userId: 'u-1',
      status: 'assigned',
      progress: { stage: 'pickup' },
    });
    const created = await assignMission({ missionId: 'm-4', userId: 'u-1' });
    expect(created?.id).toBe('assign-2');
  });

  it('updates mission assignments through pickup and delivery stages', async () => {
    const { prisma } = await import('../../../src/lib/prisma');
    (prisma.missionAssignment.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'assign-1',
        userId: 'u-1',
        vesselId: 'v-1',
        status: 'assigned',
        progress: { stage: 'pickup' },
        mission: {
          id: 'm-1',
          originLat: 0,
          originLon: 0,
          destinationLat: 1,
          destinationLon: 1,
          rewardCredits: 100,
          type: 'delivery',
          name: 'Harbor Shuttle',
        },
      },
    ]);
    const emitUpdate = jest.fn();
    const emitEconomyUpdate = jest.fn();
    const vessels = new Map([
      ['v-1', { position: { lat: 0, lon: 0 }, ownerId: 'u-1' }],
    ]);
    await updateMissionAssignments({
      spaceId: 'space-1',
      vessels,
      emitUpdate,
      emitEconomyUpdate,
    });
    expect(prisma.missionAssignment.update).toHaveBeenCalled();
    expect(emitUpdate).toHaveBeenCalled();

    (prisma.missionAssignment.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'assign-2',
        userId: 'u-1',
        vesselId: 'v-1',
        status: 'in_progress',
        progress: { stage: 'delivery' },
        mission: {
          id: 'm-2',
          originLat: 0,
          originLon: 0,
          destinationLat: 0,
          destinationLon: 0,
          rewardCredits: 50,
          type: 'towing',
          name: 'Tow Assist',
        },
      },
    ]);
    await updateMissionAssignments({
      spaceId: 'space-1',
      vessels,
      emitUpdate,
      emitEconomyUpdate,
    });
    expect(emitEconomyUpdate).toHaveBeenCalled();
  });
});
