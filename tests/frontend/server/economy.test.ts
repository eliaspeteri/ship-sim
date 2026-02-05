type VesselRecord = {
  id: string;
  spaceId?: string;
  ownerId: string | null;
  chartererId?: string | null;
  leaseeId?: string | null;
  status?: string;
  storagePortId?: string | null;
  storedAt?: number | null;
  crewIds: Set<string>;
  crewNames: Map<string, string>;
  helmUserId?: string | null;
  helmUsername?: string | null;
  engineUserId?: string | null;
  engineUsername?: string | null;
  radioUserId?: string | null;
  radioUsername?: string | null;
  mode: 'player' | 'ai';
  desiredMode: 'player' | 'ai';
  lastCrewAt: number;
  position: { lat: number; lon: number; z?: number };
  orientation: { heading: number; roll: number; pitch: number };
  velocity: { surge: number; sway: number; heave: number };
  properties: { mass: number; length: number; beam: number; draft: number };
  controls: {
    throttle: number;
    rudderAngle: number;
    ballast: number;
    bowThruster: number;
  };
  lastUpdate: number;
};

const economyLedger = new Map<string, any>();
const serverIo = { to: jest.fn(() => ({ emit: jest.fn() })) };
const getRulesForSpace = jest.fn(() => ({
  economy: { autoStopOnEmpty: true },
}));
const persistVesselToDb = jest.fn();
const syncUserSocketsEconomy = jest.fn();

jest.mock('../../../src/server/index', () => ({
  economyLedger,
  getRulesForSpace,
  io: serverIo,
  persistVesselToDb,
  syncUserSocketsEconomy,
}));

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  economyTransaction: {
    create: jest.fn(),
  },
  crewContract: {
    findMany: jest.fn(),
    createMany: jest.fn(),
    updateMany: jest.fn(),
  },
  loan: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  vesselSale: {
    create: jest.fn(),
  },
  insurancePolicy: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  vesselLease: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  cargoLot: {
    findMany: jest.fn(),
  },
};

jest.mock('../../../src/lib/prisma', () => ({
  prisma: prismaMock,
}));

const buildVessel = (overrides: Partial<VesselRecord> = {}): VesselRecord => ({
  id: 'v-1',
  spaceId: 'space-1',
  ownerId: 'owner-1',
  chartererId: null,
  leaseeId: null,
  status: 'active',
  storagePortId: null,
  storedAt: null,
  crewIds: new Set(),
  crewNames: new Map(),
  helmUserId: null,
  helmUsername: null,
  engineUserId: null,
  engineUsername: null,
  radioUserId: null,
  radioUsername: null,
  mode: 'player',
  desiredMode: 'player',
  lastCrewAt: 1,
  position: { lat: 0, lon: 0, z: 0 },
  orientation: { heading: 0, roll: 0, pitch: 0 },
  velocity: { surge: 0, sway: 0, heave: 0 },
  properties: { mass: 1_000_000, length: 120, beam: 10, draft: 6 },
  controls: { throttle: 0, rudderAngle: 0, ballast: 0.5, bowThruster: 0 },
  lastUpdate: 1,
  ...overrides,
});

const loadEconomy = async () => {
  jest.resetModules();
  return import('../../../src/server/economy');
};

beforeEach(() => {
  economyLedger.clear();
  serverIo.to.mockClear();
  getRulesForSpace.mockClear();
  persistVesselToDb.mockClear();
  syncUserSocketsEconomy.mockClear();
  Object.values(prismaMock).forEach(group => {
    Object.values(group as Record<string, unknown>).forEach(fn => {
      if (typeof fn === 'function' && 'mockReset' in fn) {
        (fn as jest.Mock).mockReset();
      }
    });
  });
  prismaMock.loan.findMany.mockResolvedValue([]);
  prismaMock.loan.findFirst.mockResolvedValue(null);
  prismaMock.crewContract.findMany.mockResolvedValue([]);
  prismaMock.insurancePolicy.findMany.mockResolvedValue([]);
  prismaMock.vesselLease.findFirst.mockResolvedValue(null);
  prismaMock.cargoLot.findMany.mockResolvedValue([]);
});

describe('economy helpers', () => {
  it('calculates creation and capacity helpers', async () => {
    const mod = await loadEconomy();
    expect(mod.calculateVesselCreationCost(1)).toBe(
      mod.VESSEL_CREATION_BASE_COST,
    );
    expect(mod.calculateVesselCreationCost(3)).toBe(
      mod.VESSEL_CREATION_BASE_COST + 2 * mod.VESSEL_CREATION_RANK_MULTIPLIER,
    );
    expect(mod.estimateCargoCapacityTons(2_000_000)).toBeCloseTo(60, 4);
    expect(mod.estimatePassengerCapacity(10)).toBe(6);
    expect(mod.estimatePassengerCapacity(1)).toBe(4);
    expect(mod.getVesselCargoCapacityTons(buildVessel())).toBeCloseTo(30, 4);
    expect(mod.getVesselPassengerCapacity(buildVessel())).toBe(72);
  });

  it('resolves ports near position', async () => {
    const mod = await loadEconomy();
    const port = mod.resolvePortForPosition({ lat: 0, lon: 0, z: 0 });
    expect(port?.id).toBe('harbor-alpha');
    const none = mod.resolvePortForPosition({ lat: 50, lon: 50, z: 0 });
    expect(none).toBeNull();
  });

  it('calculates rank from experience', async () => {
    const mod = await loadEconomy();
    expect(mod.calculateRank(0)).toBe(1);
    expect(mod.calculateRank(1000)).toBe(2);
    expect(mod.calculateRank(1999)).toBe(2);
    expect(mod.calculateRank(2000)).toBe(3);
  });
});

describe('economy profile updates', () => {
  it('returns defaults when no profile exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const mod = await loadEconomy();
    const profile = await mod.getEconomyProfile('user-1');
    expect(profile).toEqual({
      rank: 1,
      experience: 0,
      credits: 0,
      safetyScore: 1,
    });
  });

  it('applies adjustments and records transactions', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      rank: 2,
      experience: 1000,
      credits: 50,
      safetyScore: 0.9,
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.economyTransaction.create.mockResolvedValue({});

    const mod = await loadEconomy();
    const profile = await mod.applyEconomyAdjustment({
      userId: 'user-1',
      deltaCredits: 25,
      deltaExperience: 500,
      deltaSafetyScore: -1.2,
      reason: 'test',
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        rank: 2,
        experience: 1500,
        credits: 75,
        safetyScore: 0,
      },
    });
    expect(prismaMock.economyTransaction.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        vesselId: null,
        amount: 25,
        reason: 'test',
        meta: undefined,
      },
    });
    expect(profile).toEqual({
      rank: 2,
      experience: 1500,
      credits: 75,
      safetyScore: 0,
    });
  });

  it('splits revenue across crew and lease before owner', async () => {
    prismaMock.crewContract.findMany.mockResolvedValue([
      { userId: 'crew-1', revenueShare: 0.1 },
      { userId: 'owner-1', revenueShare: 0.2 },
    ]);
    prismaMock.vesselLease.findFirst.mockResolvedValue({
      id: 'lease-1',
      ownerId: 'lessor-1',
      revenueShare: 0.2,
      status: 'active',
    });
    prismaMock.user.findUnique.mockResolvedValue({
      rank: 1,
      experience: 0,
      credits: 0,
      safetyScore: 1,
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.economyTransaction.create.mockResolvedValue({});

    const mod = await loadEconomy();

    const io = { to: jest.fn(() => ({ emit: jest.fn() })) } as any;
    await mod.applyEconomyAdjustmentWithRevenueShare(
      {
        userId: 'owner-1',
        vesselId: 'v-1',
        deltaCredits: 100,
        reason: 'mission_reward',
      },
      io,
    );

    const amounts = prismaMock.economyTransaction.create.mock.calls.map(
      call => call[0].data.amount,
    );
    const reasons = prismaMock.economyTransaction.create.mock.calls.map(
      call => call[0].data.reason,
    );
    expect(amounts).toEqual(expect.arrayContaining([10, 20, 70]));
    expect(reasons).toEqual(
      expect.arrayContaining(['crew_share', 'lease_share', 'mission_reward']),
    );
  });

  it('falls back to plain adjustment when no vessel or negative delta', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      rank: 1,
      experience: 0,
      credits: 10,
      safetyScore: 1,
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.economyTransaction.create.mockResolvedValue({});

    const mod = await loadEconomy();
    await mod.applyEconomyAdjustmentWithRevenueShare({
      userId: 'user-1',
      deltaCredits: -5,
      reason: 'penalty',
    });
    await mod.applyEconomyAdjustmentWithRevenueShare({
      userId: 'user-1',
      vesselId: null,
      deltaCredits: 5,
      reason: 'bonus',
    });

    const reasons = prismaMock.economyTransaction.create.mock.calls.map(
      call => call[0].data.reason,
    );
    expect(reasons).toEqual(expect.arrayContaining(['penalty', 'bonus']));
  });
});

describe('updateEconomyForVessel', () => {
  it('skips when no charge user exists', async () => {
    const mod = await loadEconomy();
    const vessel = buildVessel({ ownerId: null });
    await mod.updateEconomyForVessel(vessel, Date.now(), serverIo as any);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('charges operating cost and port fee', async () => {
    const mod = await loadEconomy();
    const now = Date.now();
    const vessel = buildVessel({
      velocity: { surge: 2, sway: 0, heave: 0 },
      controls: { throttle: 0.5, rudderAngle: 0, ballast: 0.5, bowThruster: 0 },
    });

    prismaMock.user.findUnique.mockResolvedValue({
      rank: 1,
      experience: 0,
      credits: 1000,
      safetyScore: 1,
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.economyTransaction.create.mockResolvedValue({});
    prismaMock.crewContract.findMany.mockResolvedValue([]);
    prismaMock.vesselLease.findFirst.mockResolvedValue(null);
    prismaMock.insurancePolicy.findMany.mockResolvedValue([]);
    prismaMock.cargoLot.findMany.mockResolvedValue([]);
    prismaMock.loan.findMany.mockResolvedValue([]);
    prismaMock.loan.findFirst.mockResolvedValue(null);

    economyLedger.set(vessel.id, {
      lastChargeAt: now - mod.ECONOMY_CHARGE_INTERVAL_MS - 1,
      accrued: 0,
      lastPortId: undefined,
    });
    await mod.updateEconomyForVessel(vessel, now, serverIo as any);

    expect(prismaMock.economyTransaction.create).toHaveBeenCalled();
    const reasons = prismaMock.economyTransaction.create.mock.calls.map(
      call => call[0].data.reason,
    );
    expect(reasons).toContain('operating_cost');
    expect(reasons).toContain('port_fee');
    expect(economyLedger.get(vessel.id)?.lastPortId).toBe('harbor-alpha');
  });

  it('skips when interval not reached', async () => {
    const mod = await loadEconomy();
    const now = Date.now();
    const vessel = buildVessel();
    economyLedger.set(vessel.id, {
      lastChargeAt: now,
      accrued: 0,
      lastPortId: undefined,
    });
    await mod.updateEconomyForVessel(vessel, now + 1, serverIo as any);
    expect(prismaMock.economyTransaction.create).not.toHaveBeenCalled();
  });

  it('returns early for stored vessels but keeps ledger', async () => {
    const mod = await loadEconomy();
    const now = Date.now();
    const vessel = buildVessel({ status: 'stored' });
    economyLedger.set(vessel.id, {
      lastChargeAt: now - mod.ECONOMY_CHARGE_INTERVAL_MS - 1,
      accrued: 0,
      lastPortId: undefined,
    });
    await mod.updateEconomyForVessel(vessel, now, serverIo as any);
    expect(prismaMock.economyTransaction.create).not.toHaveBeenCalled();
    expect(economyLedger.get(vessel.id)).toBeTruthy();
  });

  it('releases crew contracts when idle in port', async () => {
    const mod = await loadEconomy();
    const now = Date.now();
    const vessel = buildVessel({
      velocity: { surge: 0, sway: 0, heave: 0 },
      controls: { throttle: 0, rudderAngle: 0, ballast: 0.5, bowThruster: 0 },
      crewIds: new Set(['crew-1']),
    });
    prismaMock.user.findUnique.mockResolvedValue({
      rank: 1,
      experience: 0,
      credits: 100,
      safetyScore: 1,
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.economyTransaction.create.mockResolvedValue({});
    prismaMock.crewContract.findMany.mockResolvedValue([]);
    prismaMock.vesselLease.findFirst.mockResolvedValue(null);
    prismaMock.insurancePolicy.findMany.mockResolvedValue([]);
    prismaMock.cargoLot.findMany.mockResolvedValue([]);
    prismaMock.loan.findMany.mockResolvedValue([]);
    prismaMock.loan.findFirst.mockResolvedValue(null);

    economyLedger.set(vessel.id, {
      lastChargeAt: now - mod.ECONOMY_CHARGE_INTERVAL_MS - 1,
      accrued: 0,
      lastPortId: undefined,
    });
    await mod.updateEconomyForVessel(vessel, now, serverIo as any);
    expect(prismaMock.crewContract.updateMany).toHaveBeenCalled();
  });

  it('auto-stops when credits depleted', async () => {
    const mod = await loadEconomy();
    const now = Date.now();
    const vessel = buildVessel({
      mode: 'ai',
      controls: { throttle: 1, rudderAngle: 0.3, ballast: 0.5, bowThruster: 0 },
      velocity: { surge: 2, sway: 0, heave: 0 },
    });
    prismaMock.user.findUnique.mockResolvedValue({
      rank: 1,
      experience: 0,
      credits: 1,
      safetyScore: 1,
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.economyTransaction.create.mockResolvedValue({});
    prismaMock.crewContract.findMany.mockResolvedValue([]);
    prismaMock.vesselLease.findFirst.mockResolvedValue(null);
    prismaMock.insurancePolicy.findMany.mockResolvedValue([]);
    prismaMock.cargoLot.findMany.mockResolvedValue([]);
    prismaMock.loan.findMany.mockResolvedValue([]);
    prismaMock.loan.findFirst.mockResolvedValue(null);

    economyLedger.set(vessel.id, {
      lastChargeAt: now - mod.ECONOMY_CHARGE_INTERVAL_MS - 1,
      accrued: 0,
      lastPortId: undefined,
    });
    await mod.updateEconomyForVessel(vessel, now, serverIo as any);
    expect(vessel.controls.throttle).toBe(0);
    expect(vessel.controls.rudderAngle).toBe(0);
    expect(persistVesselToDb).toHaveBeenCalled();
  });

  it('charges insurance, lease fees, and cargo liability', async () => {
    const mod = await loadEconomy();
    const now = Date.now();
    const vessel = buildVessel({
      position: { lat: 10, lon: 10, z: 0 },
      velocity: { surge: 2, sway: 0, heave: 0 },
    });
    prismaMock.user.findUnique.mockResolvedValue({
      rank: 1,
      experience: 0,
      credits: 500,
      safetyScore: 1,
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.economyTransaction.create.mockResolvedValue({});
    prismaMock.crewContract.findMany.mockResolvedValue([]);
    prismaMock.insurancePolicy.findMany.mockResolvedValue([
      { id: 'pol-1', premiumRate: 5, type: 'basic' },
    ]);
    prismaMock.vesselLease.findFirst.mockResolvedValue({
      id: 'lease-1',
      vesselId: vessel.id,
      ownerId: 'owner-1',
      lesseeId: 'lessee-1',
      status: 'active',
      ratePerHour: 10,
      startedAt: new Date(now - mod.LEASE_CHARGE_INTERVAL_MS * 2),
      lastChargedAt: new Date(now - mod.LEASE_CHARGE_INTERVAL_MS * 2),
    });
    prismaMock.cargoLot.findMany.mockResolvedValue([
      {
        id: 'cargo-1',
        ownerId: 'owner-1',
        value: 100,
        liabilityRate: 0.1,
      },
    ]);
    prismaMock.loan.findMany.mockResolvedValue([]);
    prismaMock.loan.findFirst.mockResolvedValue(null);

    economyLedger.set(vessel.id, {
      lastChargeAt: now - mod.ECONOMY_CHARGE_INTERVAL_MS - 1,
      accrued: 0,
      lastPortId: undefined,
    });
    await mod.updateEconomyForVessel(vessel, now, serverIo as any);

    const reasons = prismaMock.economyTransaction.create.mock.calls.map(
      call => call[0].data.reason,
    );
    expect(reasons).toEqual(
      expect.arrayContaining([
        'insurance_premium',
        'lease_fee',
        'lease_income',
        'cargo_liability',
      ]),
    );
    expect(prismaMock.vesselLease.update).toHaveBeenCalled();
    expect(prismaMock.insurancePolicy.update).toHaveBeenCalled();
  });

  it('expires leases and repossesses on defaulted loans', async () => {
    const mod = await loadEconomy();
    const now = Date.now();
    const vessel = buildVessel({
      ownerId: 'owner-1',
      position: { lat: 0, lon: 0, z: 0 },
    });
    prismaMock.user.findUnique.mockResolvedValue({
      rank: 1,
      experience: 0,
      credits: 500,
      safetyScore: 1,
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.economyTransaction.create.mockResolvedValue({});
    prismaMock.crewContract.findMany.mockResolvedValue([]);
    prismaMock.insurancePolicy.findMany.mockResolvedValue([]);
    prismaMock.cargoLot.findMany.mockResolvedValue([]);
    prismaMock.loan.findMany.mockResolvedValue([
      {
        id: 'loan-1',
        balance: 100,
        interestRate: 0.1,
        status: 'active',
        issuedAt: new Date(now - 1000),
        lastAccruedAt: new Date(now - 2000),
        dueAt: new Date(now - 500),
      },
    ]);
    prismaMock.loan.findFirst.mockResolvedValue({
      id: 'loan-1',
      balance: 100,
      status: 'defaulted',
    });
    prismaMock.vesselLease.findFirst.mockResolvedValue({
      id: 'lease-1',
      vesselId: vessel.id,
      status: 'active',
      endsAt: new Date(now - 1000),
    });
    prismaMock.vesselLease.update.mockResolvedValue({});
    prismaMock.vesselSale.create.mockResolvedValue({});

    economyLedger.set(vessel.id, {
      lastChargeAt: now - mod.ECONOMY_CHARGE_INTERVAL_MS - 1,
      accrued: 0,
      lastPortId: undefined,
    });
    await mod.updateEconomyForVessel(vessel, now, serverIo as any);

    expect(prismaMock.loan.update).toHaveBeenCalled();
    expect(prismaMock.vesselSale.create).toHaveBeenCalled();
    expect(vessel.ownerId).toBeNull();
    expect(prismaMock.vesselLease.update).toHaveBeenCalled();
  });
});
