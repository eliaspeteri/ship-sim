import { distanceMeters } from '../../../src/lib/position';
import { prisma } from '../../../src/lib/prisma';
import { applyEconomyAdjustmentWithRevenueShare } from '../../../src/server/economy';
import {
  computeTurnaroundDelayMs,
  ensureCargoAvailability,
  ensurePassengerAvailability,
  getPortCongestion,
  sweepExpiredCargo,
  updateCargoDeliveries,
  updatePassengerDeliveries,
} from '../../../src/server/logistics';

jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    cargoLot: {
      groupBy: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    passengerContract: {
      groupBy: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../../src/lib/position', () => ({
  distanceMeters: jest.fn(() => 0),
}));

jest.mock('../../../src/server/economy', () => ({
  ECONOMY_PORTS: [
    {
      id: 'p-1',
      size: 'small',
      region: 'north',
      position: { lat: 0, lon: 0 },
    },
    {
      id: 'p-2',
      size: 'medium',
      region: 'south',
      position: { lat: 1, lon: 1 },
    },
  ],
  applyEconomyAdjustmentWithRevenueShare: jest.fn(),
}));

describe('logistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('computes turnaround delay from congestion', () => {
    const base = computeTurnaroundDelayMs(0);
    const max = computeTurnaroundDelayMs(1);
    expect(max).toBeGreaterThan(base);
  });

  it('computes port congestion from cargo and passenger counts', async () => {
    (prisma.cargoLot.groupBy as jest.Mock).mockResolvedValue([
      { portId: 'p-1', _count: { _all: 4 } },
    ]);
    (prisma.passengerContract.groupBy as jest.Mock).mockResolvedValue([
      { originPortId: 'p-1', _count: { _all: 2 } },
    ]);

    const congestion = await getPortCongestion();
    const p1 = congestion.find(c => c.portId === 'p-1');

    expect(p1).toBeTruthy();
    expect(p1?.congestion).toBeGreaterThan(0);
  });

  it('ensures cargo and passenger availability', async () => {
    (prisma.cargoLot.count as jest.Mock).mockResolvedValue(0);
    (prisma.passengerContract.count as jest.Mock).mockResolvedValue(0);

    await ensureCargoAvailability(Date.now() + 999999);
    await ensurePassengerAvailability(Date.now() + 999999);

    expect(prisma.cargoLot.createMany).toHaveBeenCalled();
    expect(prisma.passengerContract.createMany).toHaveBeenCalled();
  });

  it('sweeps expired cargo and recreates listings', async () => {
    (prisma.cargoLot.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'c-1',
        originPortId: 'p-1',
        cargoType: 'bulk',
        description: 'bulk cargo',
        value: 100,
        rewardCredits: 110,
        weightTons: 10,
        liabilityRate: 0.01,
      },
    ]);

    await sweepExpiredCargo(Date.now() + 999999);

    expect(prisma.cargoLot.updateMany).toHaveBeenCalled();
    expect(prisma.cargoLot.create).toHaveBeenCalled();
  });

  it('updates cargo deliveries when near destination', async () => {
    (prisma.cargoLot.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'c-2',
        vesselId: 'v-1',
        destinationPortId: 'p-2',
        rewardCredits: 150,
        value: 100,
        carrierId: 'user-1',
      },
    ]);

    await updateCargoDeliveries({
      vessels: new Map([['v-1', { position: { lat: 1, lon: 1 } }]]),
    });

    expect(distanceMeters).toHaveBeenCalled();
    expect(prisma.cargoLot.update).toHaveBeenCalled();
    expect(applyEconomyAdjustmentWithRevenueShare).toHaveBeenCalled();
  });

  it('updates passenger deliveries when near destination', async () => {
    (prisma.passengerContract.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'p-1',
        vesselId: 'v-1',
        destinationPortId: 'p-2',
        rewardCredits: 80,
        operatorId: 'user-1',
      },
    ]);

    await updatePassengerDeliveries({
      vessels: new Map([['v-1', { position: { lat: 1, lon: 1 } }]]),
    });

    expect(distanceMeters).toHaveBeenCalled();
    expect(prisma.passengerContract.update).toHaveBeenCalled();
    expect(applyEconomyAdjustmentWithRevenueShare).toHaveBeenCalled();
  });
});
