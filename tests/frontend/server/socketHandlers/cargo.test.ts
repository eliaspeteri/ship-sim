import { registerCargoHandlers } from '../../../../src/server/socketHandlers/cargo';
import { prisma } from '../../../../src/lib/prisma';
import {
  computeTurnaroundDelayMs,
  getPortCongestion,
} from '../../../../src/server/logistics';
import {
  getVesselCargoCapacityTons,
  resolvePortForPosition,
} from '../../../../src/server/economy';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    cargoLot: {
      create: jest.fn(),
      findUnique: jest.fn(),
      aggregate: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/server/logistics', () => ({
  computeTurnaroundDelayMs: jest.fn(() => 1000),
  getPortCongestion: jest.fn(async () => [{ portId: 'p-1', congestion: 0.5 }]),
}));

jest.mock('../../../../src/server/economy', () => ({
  getVesselCargoCapacityTons: jest.fn(() => 100),
  resolvePortForPosition: jest.fn(() => ({ id: 'p-1' })),
}));

const flushPromises = async (ticks = 3) => {
  for (let i = 0; i < ticks; i += 1) {
    await Promise.resolve();
  }
};

describe('registerCargoHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects invalid cargo values', async () => {
    const handlers: Record<string, any> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1' },
    };

    registerCargoHandlers({
      socket,
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map() },
      hasAdminRole: jest.fn(() => false),
    } as any);

    handlers['cargo:create']({ value: -10 });

    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Invalid cargo value');
    expect(prisma.cargoLot.create).not.toHaveBeenCalled();
  });

  it('creates loaded cargo when vessel provided', async () => {
    const handlers: Record<string, any> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1' },
    };
    const vessel = {
      id: 'v-1',
      ownerId: 'user-1',
      position: { lat: 1, lon: 2 },
    };

    registerCargoHandlers({
      socket,
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map([['v-1', vessel]]) },
      hasAdminRole: jest.fn(() => false),
    } as any);

    handlers['cargo:create']({
      value: 1000,
      rewardCredits: 1500,
      weightTons: 10,
      vesselId: 'v-1',
    });

    await flushPromises();

    expect(resolvePortForPosition).toHaveBeenCalledWith(vessel.position);
    expect(prisma.cargoLot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          vesselId: 'v-1',
          portId: 'p-1',
          originPortId: 'p-1',
          status: 'loaded',
        }),
      }),
    );
  });

  it('assigns cargo to a vessel when capacity allows', async () => {
    const handlers: Record<string, any> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1' },
    };
    const vessel = {
      id: 'v-1',
      position: { lat: 1, lon: 2 },
      ownerId: 'user-1',
    };

    (prisma.cargoLot.findUnique as jest.Mock).mockResolvedValue({
      id: 'c-1',
      ownerId: 'user-1',
      status: 'listed',
      weightTons: 10,
      portId: 'p-1',
      expiresAt: null,
    });
    (prisma.cargoLot.aggregate as jest.Mock).mockResolvedValue({
      _sum: { weightTons: 0 },
    });

    registerCargoHandlers({
      socket,
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map([['v-1', vessel]]) },
      hasAdminRole: jest.fn(() => false),
    } as any);

    handlers['cargo:assign']({ cargoId: 'c-1', vesselId: 'v-1' });

    await flushPromises();
    expect(getPortCongestion).toHaveBeenCalled();
    expect(getVesselCargoCapacityTons).toHaveBeenCalledWith(vessel);
    expect(computeTurnaroundDelayMs).toHaveBeenCalled();
    expect(prisma.cargoLot.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c-1' },
        data: expect.objectContaining({ status: 'loading', vesselId: 'v-1' }),
      }),
    );
  });

  it('releases cargo when owned by user', async () => {
    const handlers: Record<string, any> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1' },
    };

    (prisma.cargoLot.findUnique as jest.Mock).mockResolvedValue({
      id: 'c-1',
      ownerId: 'user-1',
    });

    registerCargoHandlers({
      socket,
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map() },
      hasAdminRole: jest.fn(() => false),
    } as any);

    handlers['cargo:release']({ cargoId: 'c-1' });

    await flushPromises();
    expect(prisma.cargoLot.update).toHaveBeenCalledWith({
      where: { id: 'c-1' },
      data: { vesselId: null, status: 'delivered', portId: null },
    });
  });
});
