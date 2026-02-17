import { prisma } from '../../../../src/lib/prisma';
import { registerVesselLeaseHandler } from '../../../../src/server/socketHandlers/vesselLease';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    vesselLease: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vessel: {
      update: jest.fn(),
    },
  },
}));

const flushPromises = async (ticks = 3) => {
  for (let i = 0; i < ticks; i += 1) {
    await Promise.resolve();
  }
};

describe('registerVesselLeaseHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects lease creation with missing vessel id', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1' },
    };

    registerVesselLeaseHandler({
      socket,
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map() },
      hasAdminRole: jest.fn(() => false),
      persistVesselToDb: jest.fn(),
    } as unknown as Parameters<typeof registerVesselLeaseHandler>[0]);

    handlers['vessel:lease:create']({});

    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Missing vessel id');
  });

  it('rejects lease creation when not owner', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1' },
    };
    const vessel = { id: 'v-1', ownerId: 'other' };

    registerVesselLeaseHandler({
      socket,
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map([['v-1', vessel]]) },
      hasAdminRole: jest.fn(() => false),
      persistVesselToDb: jest.fn(),
    } as unknown as Parameters<typeof registerVesselLeaseHandler>[0]);

    handlers['vessel:lease:create']({ vesselId: 'v-1', ratePerHour: 10 });

    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Not authorized to lease this vessel',
    );
  });

  it('accepts lease and updates vessel in memory', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-2' },
    };
    const vessel = {
      id: 'v-1',
      ownerId: 'user-1',
      leaseeId: null,
      chartererId: null,
      status: 'active',
      desiredMode: 'ai',
      lastUpdate: 0,
    };

    (prisma.vesselLease.findUnique as jest.Mock).mockResolvedValue({
      id: 'lease-1',
      vesselId: 'v-1',
      status: 'open',
      type: 'lease',
    });
    (prisma.vesselLease.update as jest.Mock).mockResolvedValue({
      id: 'lease-1',
      vesselId: 'v-1',
      status: 'active',
      type: 'lease',
    });

    const persistVesselToDb = jest.fn();

    registerVesselLeaseHandler({
      socket,
      effectiveUserId: 'user-2',
      globalState: { vessels: new Map([['v-1', vessel]]) },
      hasAdminRole: jest.fn(() => false),
      persistVesselToDb,
    } as unknown as Parameters<typeof registerVesselLeaseHandler>[0]);

    handlers['vessel:lease:accept']({ leaseId: 'lease-1' });

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(vessel.status).toBe('leased');
    expect(vessel.leaseeId).toBe('user-2');
    expect(persistVesselToDb).toHaveBeenCalled();
  });

  it('validates lease create inputs and acceptance fallback path', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-2' },
    };

    registerVesselLeaseHandler({
      socket,
      effectiveUserId: 'user-2',
      globalState: {
        vessels: new Map([['v-1', { id: 'v-1', ownerId: 'user-2' }]]),
      },
      hasAdminRole: jest.fn(() => false),
      persistVesselToDb: jest.fn(),
    } as unknown as Parameters<typeof registerVesselLeaseHandler>[0]);

    handlers['vessel:lease:create']({ vesselId: 'v-1', ratePerHour: 0 });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Invalid lease rate');

    handlers['vessel:lease:accept']({});
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Missing lease id');

    (prisma.vesselLease.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'lease-charter',
      vesselId: 'v-missing',
      status: 'open',
      type: 'charter',
    });
    (prisma.vesselLease.update as jest.Mock).mockResolvedValueOnce({
      id: 'lease-charter',
      vesselId: 'v-missing',
      status: 'active',
      type: 'charter',
    });

    handlers['vessel:lease:accept']({ leaseId: 'lease-charter' });
    await flushPromises();
    expect(prisma.vessel.update).toHaveBeenCalledWith({
      where: { id: 'v-missing' },
      data: {
        status: 'chartered',
        chartererId: 'user-2',
        leaseeId: null,
      },
    });
  });
});
