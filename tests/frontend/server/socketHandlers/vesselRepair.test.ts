import { registerVesselRepairHandler } from '../../../../src/server/socketHandlers/vesselRepair';
import { prisma } from '../../../../src/lib/prisma';
import { applyEconomyAdjustment } from '../../../../src/server/economy';
import {
  applyRepair,
  computeRepairCost,
  mergeDamageState,
} from '../../../../src/lib/damage';
import { syncUserSocketsEconomy } from '../../../../src/server/index';

jest.mock('../../../../src/server/index', () => ({
  syncUserSocketsEconomy: jest.fn(),
}));

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    insurancePolicy: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/server/economy', () => ({
  applyEconomyAdjustment: jest.fn(),
}));

jest.mock('../../../../src/lib/damage', () => ({
  applyRepair: jest.fn(() => ({ repaired: true })),
  computeRepairCost: jest.fn(() => 100),
  mergeDamageState: jest.fn(() => ({ hull: 1 })),
}));

describe('registerVesselRepairHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects repairs when vessel not found', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      data: { userId: 'user-1' },
    };

    registerVesselRepairHandler({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map() },
      getVesselIdForUser: jest.fn(),
      hasAdminRole: jest.fn(() => false),
      resolveChargeUserId: jest.fn(),
      persistVesselToDb: jest.fn(),
      toSimpleVesselState: jest.fn(),
      defaultSpaceId: 'space-1',
    } as unknown as Parameters<typeof registerVesselRepairHandler>[0]);

    const callback = jest.fn();
    await handlers['vessel:repair']({}, callback);

    expect(callback).toHaveBeenCalledWith({
      ok: false,
      message: 'Vessel not found',
    });
  });

  it('repairs vessel and emits updates', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      data: { userId: 'user-1' },
    };
    const vessel = {
      id: 'v-1',
      spaceId: 'space-1',
      crewIds: new Set(['user-1']),
      velocity: { surge: 0, sway: 0 },
      damageState: {},
      ownerId: 'user-1',
      failureState: {
        floodingLevel: 1,
        engineFailure: true,
        steeringFailure: true,
      },
      lastUpdate: 0,
    } as {
      id: string;
      spaceId: string;
      crewIds: Set<string>;
      velocity: { surge: number; sway: number };
      damageState: Record<string, unknown>;
      ownerId: string;
      failureState: {
        floodingLevel: number;
        engineFailure: boolean;
        steeringFailure: boolean;
      };
      lastUpdate: number;
    };

    (prisma.insurancePolicy.findFirst as jest.Mock).mockResolvedValue({
      id: 'policy-1',
      deductible: 10,
      coverage: 100,
    });
    (applyEconomyAdjustment as jest.Mock)
      .mockResolvedValueOnce({ credits: 50 })
      .mockResolvedValueOnce({ credits: 0 });

    registerVesselRepairHandler({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      spaceId: 'space-1',
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map([['v-1', vessel]]) },
      getVesselIdForUser: jest.fn(() => 'v-1'),
      hasAdminRole: jest.fn(() => false),
      resolveChargeUserId: jest.fn(() => 'user-1'),
      persistVesselToDb: jest.fn(),
      toSimpleVesselState: jest.fn(() => ({ id: 'v-1' })),
      defaultSpaceId: 'space-1',
    } as unknown as Parameters<typeof registerVesselRepairHandler>[0]);

    const callback = jest.fn();
    await handlers['vessel:repair']({}, callback);

    expect(mergeDamageState).toHaveBeenCalled();
    expect(computeRepairCost).toHaveBeenCalled();
    expect(applyEconomyAdjustment).toHaveBeenCalled();
    expect(applyRepair).toHaveBeenCalled();
    expect(syncUserSocketsEconomy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('simulation:update', {
      vessels: { 'v-1': { id: 'v-1' } },
      partial: true,
      timestamp: expect.any(Number),
    });
    expect(callback).toHaveBeenCalledWith({
      ok: true,
      message: 'Repairs complete (100 cr)',
    });
  });
});
