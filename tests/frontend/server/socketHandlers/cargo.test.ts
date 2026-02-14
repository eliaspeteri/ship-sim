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

  it('validates cargo create inputs and permissions', async () => {
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
      globalState: {
        vessels: new Map([
          [
            'v-1',
            { id: 'v-1', ownerId: 'other', position: { lat: 0, lon: 0 } },
          ],
        ]),
      },
      hasAdminRole: jest.fn(() => false),
    } as any);

    handlers['cargo:create']({ value: 1, weightTons: -1 });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Invalid cargo weight');

    handlers['cargo:create']({ value: 1, rewardCredits: 0 });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Invalid cargo reward');

    handlers['cargo:create']({ value: 1, vesselId: 'v-missing' });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Vessel not found');

    handlers['cargo:create']({ value: 1, vesselId: 'v-1' });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Not authorized to load cargo',
    );

    handlers['cargo:create']({ value: 1 });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Missing port for cargo listing',
    );
  });

  it('validates cargo assignment failure branches', async () => {
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

    registerCargoHandlers({
      socket,
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map([['v-1', vessel]]) },
      hasAdminRole: jest.fn(() => false),
    } as any);

    handlers['cargo:assign']({});
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Missing cargo or vessel id',
    );

    (prisma.cargoLot.findUnique as jest.Mock).mockResolvedValueOnce(null);
    handlers['cargo:assign']({ cargoId: 'c-1', vesselId: 'v-1' });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Cargo not found');

    (prisma.cargoLot.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'c-2',
      ownerId: 'user-1',
      status: 'loaded',
      weightTons: 10,
      expiresAt: null,
      portId: 'p-1',
    });
    handlers['cargo:assign']({ cargoId: 'c-2', vesselId: 'v-1' });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Cargo not available');

    (prisma.cargoLot.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'c-3',
      ownerId: 'user-1',
      status: 'listed',
      weightTons: 10,
      expiresAt: new Date(Date.now() - 1000),
      portId: 'p-1',
    });
    handlers['cargo:assign']({ cargoId: 'c-3', vesselId: 'v-1' });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Cargo offer expired');

    (prisma.cargoLot.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'c-4',
      ownerId: 'user-1',
      status: 'listed',
      weightTons: 101,
      expiresAt: null,
      portId: 'p-1',
    });
    (prisma.cargoLot.aggregate as jest.Mock).mockResolvedValueOnce({
      _sum: { weightTons: 0 },
    });
    (getVesselCargoCapacityTons as jest.Mock).mockReturnValueOnce(100);
    handlers['cargo:assign']({ cargoId: 'c-4', vesselId: 'v-1' });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Cargo exceeds vessel capacity',
    );
  });
});
