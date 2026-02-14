import { registerEconomyHandlers } from '../../../../src/server/socketHandlers/economy';
import { prisma } from '../../../../src/lib/prisma';
import {
  applyEconomyAdjustment,
  getEconomyProfile,
} from '../../../../src/server/economy';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    loan: {
      aggregate: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    insurancePolicy: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/server/economy', () => ({
  applyEconomyAdjustment: jest.fn(),
  getEconomyProfile: jest.fn(),
}));

const flushPromises = async (ticks = 3) => {
  for (let i = 0; i < ticks; i += 1) {
    await Promise.resolve();
  }
};

describe('registerEconomyHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects invalid loan amounts', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', rank: 1 },
    };

    registerEconomyHandlers({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map() },
      syncUserSocketsEconomy: jest.fn(),
    } as unknown as Parameters<typeof registerEconomyHandlers>[0]);

    handlers['economy:loan:request']({ amount: -5 });

    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Invalid loan amount');
  });

  it('issues loan and emits economy update', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', rank: 1 },
    };

    (prisma.loan.aggregate as jest.Mock).mockResolvedValue({
      _sum: { balance: 0 },
    });
    (prisma.loan.create as jest.Mock).mockResolvedValue({ id: 'loan-1' });
    (applyEconomyAdjustment as jest.Mock).mockResolvedValue({ credits: 100 });

    registerEconomyHandlers({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map() },
      syncUserSocketsEconomy: jest.fn(),
    } as unknown as Parameters<typeof registerEconomyHandlers>[0]);

    handlers['economy:loan:request']({ amount: 1000 });

    await flushPromises();
    expect(prisma.loan.create).toHaveBeenCalled();
    expect(applyEconomyAdjustment).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        deltaCredits: 1000,
        reason: 'loan_disbursement',
      }),
    );
    expect(emitSpy).toHaveBeenCalledWith('economy:update', { credits: 100 });
  });

  it('repays loan and updates balance', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', rank: 1 },
    };

    (prisma.loan.findUnique as jest.Mock).mockResolvedValue({
      id: 'loan-1',
      userId: 'user-1',
      status: 'active',
      balance: 200,
    });
    (getEconomyProfile as jest.Mock).mockResolvedValue({ credits: 150 });
    (applyEconomyAdjustment as jest.Mock).mockResolvedValue({ credits: 0 });

    registerEconomyHandlers({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map() },
      syncUserSocketsEconomy: jest.fn(),
    } as unknown as Parameters<typeof registerEconomyHandlers>[0]);

    handlers['economy:loan:repay']({ loanId: 'loan-1', amount: 200 });

    await flushPromises();
    expect(prisma.loan.update).toHaveBeenCalledWith({
      where: { id: 'loan-1' },
      data: { balance: 50, status: 'active' },
    });
    expect(emitSpy).toHaveBeenCalledWith('economy:update', { credits: 0 });
  });

  it('purchases and cancels insurance policies', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', rank: 1 },
    };

    (prisma.insurancePolicy.create as jest.Mock).mockResolvedValue({
      id: 'pol-1',
    });
    (applyEconomyAdjustment as jest.Mock).mockResolvedValue({ credits: 50 });
    (prisma.insurancePolicy.findUnique as jest.Mock).mockResolvedValue({
      id: 'pol-1',
      ownerId: 'user-1',
    });

    registerEconomyHandlers({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      effectiveUserId: 'user-1',
      globalState: {
        vessels: new Map([['v-1', { id: 'v-1', ownerId: 'user-1' }]]),
      },
      syncUserSocketsEconomy: jest.fn(),
    } as unknown as Parameters<typeof registerEconomyHandlers>[0]);

    handlers['economy:insurance:purchase']({
      vesselId: 'v-1',
      coverage: 100,
      deductible: 10,
      premiumRate: 5,
      termDays: 5,
    });
    await flushPromises();

    expect(prisma.insurancePolicy.create).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('economy:update', { credits: 50 });

    handlers['economy:insurance:cancel']({ policyId: 'pol-1' });
    await flushPromises();

    expect(prisma.insurancePolicy.update).toHaveBeenCalledWith({
      where: { id: 'pol-1' },
      data: { status: 'canceled', activeUntil: expect.any(Date) },
    });
  });

  it('rejects loan request when active debt exceeds max credit', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', rank: 1 },
    };

    (prisma.loan.aggregate as jest.Mock).mockResolvedValue({
      _sum: { balance: 6500 },
    });

    registerEconomyHandlers({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map() },
      syncUserSocketsEconomy: jest.fn(),
    } as unknown as Parameters<typeof registerEconomyHandlers>[0]);

    handlers['economy:loan:request']({ amount: 1000 });
    await flushPromises();

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Loan request exceeds available credit',
    );
  });

  it('validates repayment and insurance ownership checks', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', rank: 1 },
    };

    registerEconomyHandlers({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      effectiveUserId: 'user-1',
      globalState: { vessels: new Map() },
      syncUserSocketsEconomy: jest.fn(),
    } as unknown as Parameters<typeof registerEconomyHandlers>[0]);

    handlers['economy:loan:repay']({ amount: 10 });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Missing loan id');

    handlers['economy:loan:repay']({ loanId: 'l-1', amount: 0 });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Invalid repayment amount',
    );

    (prisma.loan.findUnique as jest.Mock).mockResolvedValueOnce(null);
    handlers['economy:loan:repay']({ loanId: 'l-1', amount: 10 });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Loan not found');

    handlers['economy:insurance:purchase']({ vesselId: 'v-1' });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Not authorized to insure this vessel',
    );

    handlers['economy:insurance:cancel']({});
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Missing policy id');

    (prisma.insurancePolicy.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'p-1',
      ownerId: 'other-user',
    });
    handlers['economy:insurance:cancel']({ policyId: 'p-1' });
    await flushPromises();
    expect(socket.emit).toHaveBeenCalledWith('error', 'Policy not found');
  });
});
