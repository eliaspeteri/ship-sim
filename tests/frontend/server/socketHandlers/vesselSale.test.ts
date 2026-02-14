import { registerVesselSaleHandler } from '../../../../src/server/socketHandlers/vesselSale';
import { prisma } from '../../../../src/lib/prisma';
import {
  applyEconomyAdjustment,
  getEconomyProfile,
  resolvePortForPosition,
} from '../../../../src/server/economy';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    vesselSale: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vessel: {
      update: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/server/economy', () => ({
  applyEconomyAdjustment: jest.fn(),
  getEconomyProfile: jest.fn(),
  resolvePortForPosition: jest.fn(() => ({ id: 'p-1' })),
}));

const flushPromises = async (ticks = 3) => {
  for (let i = 0; i < ticks; i += 1) {
    await Promise.resolve();
  }
};

describe('registerVesselSaleHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects invalid sale price', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1' },
    };

    registerVesselSaleHandler({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      effectiveUserId: 'user-1',
      globalState: {
        vessels: new Map([
          [
            'v-1',
            { id: 'v-1', ownerId: 'user-1', position: { lat: 1, lon: 2 } },
          ],
        ]),
      },
      hasAdminRole: jest.fn(() => false),
      persistVesselToDb: jest.fn(),
      defaultSpaceId: 'space-1',
      userSpaceKey: jest.fn(() => 'user:space-1'),
      syncUserSocketsEconomy: jest.fn(),
    } as unknown as Parameters<typeof registerVesselSaleHandler>[0]);

    handlers['vessel:sale:create']({ vesselId: 'v-1', price: -1 });

    await flushPromises(6);
    expect(socket.emit).toHaveBeenCalledWith('error', 'Invalid sale price');
  });

  it('creates sale and updates vessel status', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
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
      crewIds: new Set(['user-1']),
      crewNames: new Map(),
      lastUpdate: 0,
    } as {
      id: string;
      ownerId: string;
      position: { lat: number; lon: number };
      crewIds: Set<string>;
      crewNames: Map<string, string>;
      lastUpdate: number;
      status?: string;
    };

    registerVesselSaleHandler({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      effectiveUserId: 'user-1',
      globalState: {
        vessels: new Map([['v-1', vessel]]),
        userLastVessel: new Map(),
      },
      hasAdminRole: jest.fn(() => false),
      persistVesselToDb: jest.fn(),
      defaultSpaceId: 'space-1',
      userSpaceKey: jest.fn(() => 'user:space-1'),
      syncUserSocketsEconomy: jest.fn(),
    } as unknown as Parameters<typeof registerVesselSaleHandler>[0]);

    handlers['vessel:sale:create']({ vesselId: 'v-1', price: 1000 });

    await flushPromises();
    expect(resolvePortForPosition).toHaveBeenCalledWith(vessel.position);
    expect(prisma.vesselSale.create).toHaveBeenCalled();
    expect(vessel.status).toBe('sale');
  });

  it('completes sale purchase and credits seller', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'buyer' },
    };
    const vessel = {
      id: 'v-1',
      spaceId: 'space-1',
      ownerId: 'seller',
      status: 'sale',
      crewIds: new Set(),
      crewNames: new Map(),
      lastUpdate: 0,
    } as {
      id: string;
      spaceId: string;
      ownerId: string;
      status: string;
      crewIds: Set<string>;
      crewNames: Map<string, string>;
      lastUpdate: number;
    };

    (prisma.vesselSale.findUnique as jest.Mock).mockResolvedValue({
      id: 'sale-1',
      vesselId: 'v-1',
      sellerId: 'seller',
      status: 'open',
      price: 200,
      reservePrice: null,
    });
    (getEconomyProfile as jest.Mock).mockResolvedValue({ credits: 500 });
    (applyEconomyAdjustment as jest.Mock)
      .mockResolvedValueOnce({ credits: 300 })
      .mockResolvedValueOnce({ credits: 700 });

    registerVesselSaleHandler({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      effectiveUserId: 'buyer',
      globalState: {
        vessels: new Map([['v-1', vessel]]),
        userLastVessel: new Map(),
      },
      hasAdminRole: jest.fn(() => false),
      persistVesselToDb: jest.fn(),
      defaultSpaceId: 'space-1',
      userSpaceKey: jest.fn(() => 'user:space-1'),
      syncUserSocketsEconomy: jest.fn(),
    } as unknown as Parameters<typeof registerVesselSaleHandler>[0]);

    handlers['vessel:sale:buy']({ saleId: 'sale-1' });

    await flushPromises(6);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(prisma.vesselSale.update).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('economy:update', { credits: 300 });
    expect(emitSpy).toHaveBeenCalledWith('economy:update', { credits: 700 });
  });
});
