import bcrypt from 'bcryptjs';

type MockedAsync = jest.Mock<Promise<unknown>, [unknown?]>;

const getLogsMock = jest.fn(() => []);
const clearLogsMock = jest.fn();

jest.mock('../../../src/server/middleware/authentication', () => ({
  authenticateRequest: (req: any, _res: any, next: any) => {
    req.user = req.user || { userId: 'user-1', roles: ['admin'] };
    next();
  },
  requireAuth: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../../src/server/middleware/authorization', () => ({
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../../src/lib/prisma', () => ({
  prisma: prismaMock,
}));

jest.mock('../../../src/server/metrics', () => ({
  recordMetric: jest.fn(),
  serverMetrics: {
    apiLatencyMs: { current: 1, avg: 1, max: 2, target: 120 },
    broadcastLoopMs: { current: 2, avg: 2, max: 3, target: 16 },
    aiLoopMs: { current: 3, avg: 3, max: 4, target: 12 },
    socketRttMs: { current: 30, avg: 25, max: 40, target: 120 },
    socketCount: 2,
    updatedAt: new Date().toISOString(),
    spaceMetrics: [],
  },
}));

jest.mock('../../../src/server/observability', () => ({
  recordLog: jest.fn(),
  getLogs: (...args: unknown[]) => getLogsMock(...args),
  clearLogs: (...args: unknown[]) => clearLogsMock(...args),
}));

jest.mock('../../../src/lib/rulesetAudit', () => ({
  buildRulesetAuditEntry: jest.fn(() => ({ id: 'audit-1' })),
}));

jest.mock('../../../src/server/economy', () => ({
  ECONOMY_PORTS: [
    {
      id: 'harbor-alpha',
      name: 'Harbor Alpha',
      position: { lat: 0, lon: 0 },
    },
  ],
  getEconomyProfile: jest.fn(async () => ({
    rank: 1,
    experience: 100,
    credits: 500,
    safetyScore: 0.9,
  })),
  getVesselCargoCapacityTons: jest.fn(() => 15),
  getVesselPassengerCapacity: jest.fn(() => 30),
  estimateCargoCapacityTons: jest.fn(() => 12),
  estimatePassengerCapacity: jest.fn(() => 20),
  resolvePortForPosition: jest.fn(() => ({
    id: 'harbor-alpha',
    name: 'Harbor Alpha',
    position: { lat: 0, lon: 0 },
  })),
}));

jest.mock('../../../src/server/logistics', () => ({
  computeTurnaroundDelayMs: jest.fn(() => 0),
  getPortCongestion: jest.fn(() => [
    { portId: 'harbor-alpha', congestion: 0.1 },
  ]),
}));

jest.mock('../../../src/server/missions', () => ({
  seedDefaultMissions: jest.fn(async () => undefined),
}));

jest.mock('../../../src/lib/scenarios', () => ({
  getScenarios: jest.fn(() => [
    {
      id: 'scn-1',
      name: 'Scenario',
      rankRequired: 1,
      rules: { assists: { stabilityAssist: true } },
      weatherPattern: 'squall-line',
      environmentOverrides: { seaState: 4 },
    },
  ]),
}));

jest.mock('../../../src/server/careers', () => ({
  CAREERS: [{ id: 'pilot', name: 'Pilot' }],
  getExamDefinitions: jest.fn(() => []),
  ensureUserCareers: jest.fn(async () => undefined),
  issueLicense: jest.fn(async () => ({ id: 'lic-1' })),
}));

jest.mock('../../../src/server/vesselCatalog', () => ({
  getVesselCatalog: jest.fn(() => {
    const entry = {
      id: 'starter-container',
      name: 'Starter',
      shipType: 'CONTAINER',
      properties: {
        mass: 1,
        length: 2,
        beam: 3,
        draft: 4,
        blockCoefficient: 0.8,
        maxSpeed: 20,
      },
      commerce: {
        purchasePrice: 1000,
        minRank: 1,
        leaseRatePerHour: 50,
        charterRatePerHour: 40,
        revenueShare: 0.15,
      },
    };
    return {
      entries: [entry],
      byId: new Map([[entry.id, entry]]),
    };
  }),
  resolveVesselTemplate: jest.fn(() => ({
    id: 'starter-container',
    name: 'Starter',
    shipType: 'CONTAINER',
    properties: {
      mass: 1,
      length: 2,
      beam: 3,
      draft: 4,
      blockCoefficient: 0.8,
      maxSpeed: 20,
    },
    hydrodynamics: {},
    physics: {},
  })),
}));

import router from '../../../src/server/api';
import { prismaMock } from '../lib/prismaMock';

const resetPrismaMocks = () => {
  Object.values(prismaMock).forEach(entry => {
    if (entry && typeof entry === 'object') {
      Object.values(entry as Record<string, unknown>).forEach(value => {
        if (typeof value === 'function' && 'mockReset' in value) {
          (value as jest.Mock).mockReset();
          (value as jest.Mock).mockImplementation(async () => null);
        }
      });
    }
  });
  if ('$transaction' in prismaMock) {
    (prismaMock.$transaction as jest.Mock).mockReset();
    (prismaMock.$transaction as jest.Mock).mockImplementation(
      async (arg: any) => (typeof arg === 'function' ? arg(prismaMock) : arg),
    );
  }
};

const getHandlers = (method: string, path: string) => {
  const layer = (router as any).stack.find(
    (entry: any) =>
      entry.route &&
      entry.route.path === path &&
      entry.route.methods?.[method.toLowerCase()],
  );
  if (!layer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }
  return layer.route.stack.map((entry: any) => entry.handle);
};

const runHandler = async (handler: any, req: any, res: any) => {
  await new Promise<void>((resolve, reject) => {
    const next = (err?: unknown) => {
      if (err) reject(err);
      else resolve();
    };
    try {
      const result = handler(req, res, next);
      if (result && typeof result.then === 'function') {
        result.then(() => {
          if (handler.length < 3) resolve();
        }, reject);
        return;
      }
      if (handler.length < 3) {
        resolve();
      }
    } catch (err) {
      reject(err);
    }
  });
};

const invokeRoute = async (
  method: string,
  path: string,
  input: {
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
    params?: Record<string, string>;
    user?: { userId: string; roles: string[] };
  } = {},
) => {
  const handlers = getHandlers(method, path);
  const req: Record<string, unknown> = {
    method: method.toUpperCase(),
    headers: {},
    ip: '127.0.0.1',
    body: input.body || {},
    query: input.query || {},
    params: input.params || {},
    user: input.user || { userId: 'user-1', roles: ['admin'] },
  };
  const res: Record<string, unknown> = {
    statusCode: 200,
    headersSent: false,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      this.headersSent = true;
      return this;
    },
    send(payload: unknown) {
      this.body = payload;
      this.headersSent = true;
      return this;
    },
    end(payload?: unknown) {
      this.body = payload;
      this.headersSent = true;
      return this;
    },
  };

  for (const handler of handlers) {
    if (res.headersSent) break;
    await runHandler(handler, req, res);
  }

  return { req, res };
};

const genericBody = {
  userId: 'user-1',
  username: 'captain',
  reason: 'testing',
  role: 'admin',
  spaceId: 'global',
  vesselId: 'vessel-1',
  missionId: 'mission-1',
  scenarioId: 'scn-1',
  name: 'Test',
  visibility: 'public',
  ruleset: 'CASUAL',
  lat: 60.17,
  lon: 24.94,
  throttle: 0.5,
  rudderAngle: 0.1,
  ballast: 0.5,
};

const genericQuery = {
  spaceId: 'global',
  scope: 'all',
  limit: '25',
};

const paramsFromPath = (path: string) => {
  const params: Record<string, string> = {};
  const matches = path.match(/:([A-Za-z0-9_]+)/g) || [];
  matches.forEach(entry => {
    params[entry.slice(1)] = `${entry.slice(1)}-1`;
  });
  return params;
};

const createVesselRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'vessel-1',
  spaceId: 'global',
  ownerId: 'user-1',
  status: 'active',
  storagePortId: null,
  storedAt: null,
  chartererId: null,
  leaseeId: null,
  mode: 'ai',
  desiredMode: 'player',
  lastCrewAt: new Date('2026-01-01T00:00:00.000Z'),
  lat: 0,
  lon: 0,
  z: 0,
  heading: 0,
  roll: 0,
  pitch: 0,
  surge: 0,
  sway: 0,
  heave: 0,
  throttle: 0,
  rudderAngle: 0,
  ballast: 0.5,
  bowThruster: 0,
  yawRate: 0,
  mass: 50000,
  length: 120,
  beam: 20,
  draft: 6,
  lastUpdate: new Date('2026-01-01T00:00:00.000Z'),
  isAi: true,
  ...overrides,
});

const createSpaceRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'space-1',
  name: 'Space One',
  visibility: 'public',
  inviteToken: 'invite-1',
  passwordHash: null,
  kind: 'free',
  rankRequired: 1,
  rulesetType: 'CASUAL',
  rules: null,
  createdBy: 'user-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('server/api router', () => {
  beforeEach(() => {
    resetPrismaMocks();
    getLogsMock.mockReset();
    clearLogsMock.mockReset();
    getLogsMock.mockReturnValue([{ level: 'info', message: 'ok' }]);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('handles moderation and role endpoints', async () => {
    (
      prismaMock.ban as Record<string, MockedAsync>
    ).findMany.mockResolvedValueOnce([{ id: 'ban-1' }] as never);
    (
      prismaMock.mute as Record<string, MockedAsync>
    ).findMany.mockResolvedValueOnce([{ id: 'mute-1' }] as never);
    (prismaMock.user as Record<string, MockedAsync>).update.mockResolvedValue({
      id: 'u2',
      role: 'player',
    } as never);
    (prismaMock.ban as Record<string, MockedAsync>).create.mockResolvedValue({
      id: 'ban-2',
    } as never);
    (prismaMock.mute as Record<string, MockedAsync>).create.mockResolvedValue({
      id: 'mute-2',
    } as never);

    const moderation = await invokeRoute('get', '/admin/moderation', {
      query: { spaceId: 'global' },
    });
    expect(moderation.res.statusCode).toBe(200);
    expect(moderation.res.body).toEqual({
      bans: [{ id: 'ban-1' }],
      mutes: [{ id: 'mute-1' }],
    });

    const invalidRole = await invokeRoute(
      'patch',
      '/admin/users/:userId/role',
      {
        params: { userId: 'u2' },
        body: { role: 'not-a-role' },
      },
    );
    expect(invalidRole.res.statusCode).toBe(400);

    const roleUpdate = await invokeRoute('patch', '/admin/users/:userId/role', {
      params: { userId: 'u2' },
      body: { role: 'player' },
    });
    expect(roleUpdate.res.statusCode).toBe(200);
    expect(roleUpdate.res.body).toEqual({ id: 'u2', role: 'player' });

    const invalidBan = await invokeRoute('post', '/admin/bans', {
      body: { reason: 'x' },
    });
    expect(invalidBan.res.statusCode).toBe(400);

    const createdBan = await invokeRoute('post', '/admin/bans', {
      body: { userId: 'u3', reason: 'x', spaceId: 'global' },
    });
    expect(createdBan.res.statusCode).toBe(201);

    const createdMute = await invokeRoute('post', '/admin/mutes', {
      body: { username: 'captain', reason: 'y' },
    });
    expect(createdMute.res.statusCode).toBe(201);

    const deletedBan = await invokeRoute('delete', '/admin/bans/:banId', {
      params: { banId: 'ban-2' },
    });
    expect(deletedBan.res.statusCode).toBe(200);

    const deletedMute = await invokeRoute('delete', '/admin/mutes/:muteId', {
      params: { muteId: 'mute-2' },
    });
    expect(deletedMute.res.statusCode).toBe(200);
  });

  it('handles vessel, environment, mission, and scenario routes', async () => {
    const vesselModel = prismaMock.vessel as Record<string, MockedAsync>;
    const environmentEventModel = prismaMock.environmentEvent as Record<
      string,
      MockedAsync
    >;
    const missionModel = prismaMock.mission as Record<string, MockedAsync>;
    const assignmentModel = prismaMock.missionAssignment as Record<
      string,
      MockedAsync
    >;
    const spaceModel = prismaMock.space as Record<string, MockedAsync>;
    const spaceAccessModel = prismaMock.spaceAccess as Record<
      string,
      MockedAsync
    >;

    vesselModel.findMany.mockResolvedValueOnce([
      createVesselRecord(),
      createVesselRecord({ id: 'vessel-2' }),
    ] as never);
    const vesselList = await invokeRoute('get', '/vessels');
    expect(vesselList.res.statusCode).toBe(200);
    expect(vesselList.res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'vessel-1' }),
        expect.objectContaining({ id: 'vessel-2' }),
      ]),
    );

    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ id: 'vessel-1' }) as never,
    );
    const vesselById = await invokeRoute('get', '/vessels/by-id/:vesselId', {
      params: { vesselId: 'vessel-1' },
    });
    expect(vesselById.res.statusCode).toBe(200);

    vesselModel.findUnique.mockResolvedValueOnce(null as never);
    const vesselById404 = await invokeRoute('get', '/vessels/by-id/:vesselId', {
      params: { vesselId: 'missing' },
    });
    expect(vesselById404.res.statusCode).toBe(404);

    const missingState = await invokeRoute('get', '/vessels/:userId', {
      params: { userId: 'local-user' },
    });
    expect(missingState.res.statusCode).toBe(404);

    const savedState = await invokeRoute('post', '/vessels/:userId', {
      params: { userId: 'local-user' },
      body: {
        position: { lat: 60.17, lon: 24.94, z: 1 },
        orientation: { heading: 1.2, roll: 0.1, pitch: -0.1 },
        velocity: { surge: 3, sway: 0.5, heave: -0.1 },
        properties: { mass: 20000, length: 80, beam: 14, draft: 4 },
      },
    });
    expect(savedState.res.statusCode).toBe(200);

    const fetchedState = await invokeRoute('get', '/vessels/:userId', {
      params: { userId: 'local-user' },
    });
    expect(fetchedState.res.statusCode).toBe(200);
    expect(fetchedState.res.body).toEqual(
      expect.objectContaining({
        properties: expect.objectContaining({ mass: 20000 }),
      }),
    );

    const deletedState = await invokeRoute('delete', '/vessels/:userId', {
      params: { userId: 'local-user' },
    });
    expect(deletedState.res.statusCode).toBe(200);

    const environmentGet = await invokeRoute('get', '/environment');
    expect(environmentGet.res.statusCode).toBe(200);
    const environmentPost = await invokeRoute('post', '/environment', {
      body: {
        wind: { speed: 8, direction: 1.5 },
        current: { speed: 1.2, direction: 0.4 },
        seaState: 5,
      },
    });
    expect(environmentPost.res.statusCode).toBe(200);

    environmentEventModel.findMany.mockResolvedValueOnce([
      { id: 'evt-1' },
    ] as never);
    const eventsGet = await invokeRoute('get', '/environment/events', {
      query: { spaceId: 'global' },
    });
    expect(eventsGet.res.statusCode).toBe(200);

    const eventsPostInvalid = await invokeRoute('post', '/environment/events', {
      body: { runAt: 'bad-date' },
    });
    expect(eventsPostInvalid.res.statusCode).toBe(400);

    environmentEventModel.create.mockResolvedValueOnce({
      id: 'evt-2',
      spaceId: 'global',
    } as never);
    const eventsPost = await invokeRoute('post', '/environment/events', {
      body: {
        spaceId: 'global',
        runAt: '2026-03-01T10:00:00.000Z',
        endAt: '2026-03-01T12:00:00.000Z',
        pattern: 'gust-front',
      },
    });
    expect(eventsPost.res.statusCode).toBe(201);

    environmentEventModel.findUnique.mockResolvedValueOnce(null as never);
    const eventsDelete404 = await invokeRoute(
      'delete',
      '/environment/events/:eventId',
      {
        params: { eventId: 'missing' },
      },
    );
    expect(eventsDelete404.res.statusCode).toBe(404);

    environmentEventModel.findUnique.mockResolvedValueOnce({
      id: 'evt-2',
      spaceId: 'global',
    } as never);
    environmentEventModel.delete.mockResolvedValueOnce({
      id: 'evt-2',
    } as never);
    const eventsDelete = await invokeRoute(
      'delete',
      '/environment/events/:eventId',
      {
        params: { eventId: 'evt-2' },
      },
    );
    expect(eventsDelete.res.statusCode).toBe(200);

    missionModel.findMany.mockResolvedValueOnce([
      { id: 'm-1', active: true, requiredRank: 1 },
    ] as never);
    const missionsGet = await invokeRoute('get', '/missions');
    expect(missionsGet.res.statusCode).toBe(200);

    missionModel.findUnique.mockResolvedValueOnce({
      id: 'm-1',
      active: true,
      requiredRank: 1,
    } as never);
    assignmentModel.findFirst.mockResolvedValueOnce(null as never);
    assignmentModel.create.mockResolvedValueOnce({
      id: 'ma-1',
      missionId: 'm-1',
      status: 'assigned',
    } as never);
    const assignMission = await invokeRoute(
      'post',
      '/missions/:missionId/assign',
      {
        params: { missionId: 'm-1' },
        body: { vesselId: 'vessel-1' },
      },
    );
    expect(assignMission.res.statusCode).toBe(201);

    assignmentModel.findMany.mockResolvedValueOnce([
      { id: 'ma-1', status: 'assigned' },
    ] as never);
    const assignments = await invokeRoute('get', '/missions/assignments');
    expect(assignments.res.statusCode).toBe(200);

    const missingScenario = await invokeRoute(
      'post',
      '/scenarios/:scenarioId/start',
      {
        params: { scenarioId: 'nope' },
      },
    );
    expect(missingScenario.res.statusCode).toBe(404);

    spaceModel.create.mockResolvedValueOnce(
      createSpaceRecord({ id: 'scn-space', visibility: 'private' }) as never,
    );
    spaceAccessModel.create.mockResolvedValueOnce({ id: 'sa-1' } as never);
    environmentEventModel.create.mockResolvedValueOnce({
      id: 'evt-3',
    } as never);
    const startScenario = await invokeRoute(
      'post',
      '/scenarios/:scenarioId/start',
      {
        params: { scenarioId: 'scn-1' },
      },
    );
    expect(startScenario.res.statusCode).toBe(201);
    expect(startScenario.res.body).toEqual(
      expect.objectContaining({
        space: expect.objectContaining({ id: 'scn-space' }),
      }),
    );
  });

  it('handles economy endpoints across purchase, logistics, finance, and storage', async () => {
    const vesselModel = prismaMock.vessel as Record<string, MockedAsync>;
    const userModel = prismaMock.user as Record<string, MockedAsync>;
    const cargoModel = prismaMock.cargoLot as Record<string, MockedAsync>;
    const passengerModel = prismaMock.passengerContract as Record<
      string,
      MockedAsync
    >;
    const loanModel = prismaMock.loan as Record<string, MockedAsync>;
    const insuranceModel = prismaMock.insurancePolicy as Record<
      string,
      MockedAsync
    >;
    const leaseModel = prismaMock.vesselLease as Record<string, MockedAsync>;
    const saleModel = prismaMock.vesselSale as Record<string, MockedAsync>;
    const txModel = prismaMock.economyTransaction as Record<
      string,
      MockedAsync
    >;
    const missionModel = prismaMock.mission as Record<string, MockedAsync>;

    txModel.findMany.mockResolvedValue([] as never);
    vesselModel.findMany.mockResolvedValue([createVesselRecord()] as never);
    cargoModel.count.mockResolvedValue(1 as never);
    passengerModel.count.mockResolvedValue(2 as never);
    loanModel.findMany.mockResolvedValue([] as never);
    insuranceModel.findMany.mockResolvedValue([] as never);
    leaseModel.findMany.mockResolvedValue([] as never);
    saleModel.findMany.mockResolvedValue([] as never);
    passengerModel.findMany.mockResolvedValue([] as never);
    missionModel.findMany.mockResolvedValue([] as never);

    const summary = await invokeRoute('get', '/economy/summary');
    expect(summary.res.statusCode).toBe(200);

    const dashboard = await invokeRoute('get', '/economy/dashboard');
    expect(dashboard.res.statusCode).toBe(200);

    const ports = await invokeRoute('get', '/economy/ports');
    expect(ports.res.statusCode).toBe(200);

    const catalog = await invokeRoute('get', '/economy/vessels/catalog');
    expect(catalog.res.statusCode).toBe(200);

    userModel.findUnique.mockResolvedValueOnce({
      credits: 5000,
      rank: 2,
    } as never);
    userModel.update.mockResolvedValueOnce({ id: 'user-1' } as never);
    vesselModel.create.mockResolvedValueOnce(createVesselRecord() as never);
    const purchased = await invokeRoute('post', '/economy/vessels/purchase', {
      body: { templateId: 'starter-container', spaceId: 'global' },
    });
    expect(purchased.res.statusCode).toBe(200);
    expect(purchased.res.body).toEqual(
      expect.objectContaining({ templateId: 'starter-container' }),
    );

    userModel.findUnique.mockResolvedValueOnce({ rank: 5 } as never);
    userModel.findUnique.mockResolvedValueOnce({
      id: 'system_shipyard',
    } as never);
    vesselModel.create.mockResolvedValueOnce(createVesselRecord() as never);
    leaseModel.create.mockResolvedValueOnce({ id: 'lease-1' } as never);
    const leased = await invokeRoute('post', '/economy/vessels/lease', {
      body: { templateId: 'starter-container', type: 'lease', termHours: 24 },
    });
    expect(leased.res.statusCode).toBe(200);

    cargoModel.findMany.mockResolvedValueOnce([
      { id: 'cargo-1', status: 'listed' },
    ] as never);
    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ id: 'cargo-vessel' }) as never,
    );
    cargoModel.aggregate.mockResolvedValueOnce({
      _sum: { weightTons: 1 },
    } as never);
    const cargoGet = await invokeRoute('get', '/economy/cargo', {
      query: { vesselId: 'cargo-vessel' },
    });
    expect(cargoGet.res.statusCode).toBe(200);

    cargoModel.findUnique.mockResolvedValueOnce({
      id: 'cargo-2',
      status: 'listed',
      ownerId: 'user-1',
      weightTons: 1,
      portId: 'harbor-alpha',
      expiresAt: new Date(Date.now() + 3600000),
    } as never);
    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ id: 'cargo-vessel-2' }) as never,
    );
    cargoModel.aggregate.mockResolvedValueOnce({
      _sum: { weightTons: 0 },
    } as never);
    cargoModel.update.mockResolvedValueOnce({ id: 'cargo-2' } as never);
    const cargoAssign = await invokeRoute('post', '/economy/cargo/assign', {
      body: { cargoId: 'cargo-2', vesselId: 'cargo-vessel-2' },
    });
    expect(cargoAssign.res.statusCode).toBe(200);

    cargoModel.findUnique.mockResolvedValueOnce({
      id: 'cargo-2',
      ownerId: 'user-1',
    } as never);
    cargoModel.update.mockResolvedValueOnce({ id: 'cargo-2' } as never);
    const cargoRelease = await invokeRoute('post', '/economy/cargo/release', {
      body: { cargoId: 'cargo-2' },
    });
    expect(cargoRelease.res.statusCode).toBe(200);

    passengerModel.findMany.mockResolvedValueOnce([
      { id: 'passenger-1' },
    ] as never);
    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ id: 'pax-vessel' }) as never,
    );
    passengerModel.aggregate.mockResolvedValueOnce({
      _sum: { paxCount: 4 },
    } as never);
    const passengers = await invokeRoute('get', '/economy/passengers', {
      query: { vesselId: 'pax-vessel' },
    });
    expect(passengers.res.statusCode).toBe(200);

    passengerModel.findUnique.mockResolvedValueOnce({
      id: 'contract-1',
      status: 'listed',
      expiresAt: new Date(Date.now() + 3600000),
      originPortId: 'harbor-alpha',
      paxCount: 3,
    } as never);
    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ id: 'pax-vessel-2' }) as never,
    );
    passengerModel.aggregate.mockResolvedValueOnce({
      _sum: { paxCount: 1 },
    } as never);
    passengerModel.update.mockResolvedValueOnce({
      id: 'contract-1',
      status: 'boarding',
    } as never);
    const acceptPassenger = await invokeRoute(
      'post',
      '/economy/passengers/accept',
      {
        body: { contractId: 'contract-1', vesselId: 'pax-vessel-2' },
      },
    );
    expect(acceptPassenger.res.statusCode).toBe(200);

    loanModel.aggregate.mockResolvedValueOnce({
      _sum: { balance: 0 },
    } as never);
    loanModel.create.mockResolvedValueOnce({
      id: 'loan-1',
      userId: 'user-1',
      balance: 500,
    } as never);
    userModel.update.mockResolvedValueOnce({ id: 'user-1' } as never);
    const loanRequest = await invokeRoute('post', '/economy/loans/request', {
      body: { amount: 500, termDays: 7 },
    });
    expect(loanRequest.res.statusCode).toBe(200);

    loanModel.findUnique.mockResolvedValueOnce({
      id: 'loan-1',
      userId: 'user-1',
      balance: 400,
      status: 'active',
    } as never);
    userModel.findUnique.mockResolvedValueOnce({ credits: 1000 } as never);
    userModel.update.mockResolvedValueOnce({ id: 'user-1' } as never);
    loanModel.update.mockResolvedValueOnce({ id: 'loan-1' } as never);
    const loanRepay = await invokeRoute('post', '/economy/loans/repay', {
      body: { loanId: 'loan-1', amount: 100 },
    });
    expect(loanRepay.res.statusCode).toBe(200);

    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ id: 'insured-vessel', ownerId: 'user-1' }) as never,
    );
    insuranceModel.create.mockResolvedValueOnce({ id: 'policy-1' } as never);
    const insuranceBuy = await invokeRoute(
      'post',
      '/economy/insurance/purchase',
      {
        body: {
          vesselId: 'insured-vessel',
          coverage: 50000,
          deductible: 2000,
          premiumRate: 0.02,
        },
      },
    );
    expect(insuranceBuy.res.statusCode).toBe(200);

    insuranceModel.findUnique.mockResolvedValueOnce({
      id: 'policy-1',
      ownerId: 'user-1',
    } as never);
    insuranceModel.update.mockResolvedValueOnce({ id: 'policy-1' } as never);
    const insuranceCancel = await invokeRoute(
      'post',
      '/economy/insurance/cancel',
      {
        body: { policyId: 'policy-1' },
      },
    );
    expect(insuranceCancel.res.statusCode).toBe(200);

    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ id: 'lease-vessel', ownerId: 'user-1' }) as never,
    );
    leaseModel.create.mockResolvedValueOnce({
      id: 'lease-open',
      vesselId: 'lease-vessel',
      type: 'lease',
    } as never);
    const createLease = await invokeRoute('post', '/economy/leases', {
      body: { vesselId: 'lease-vessel', ratePerHour: 25 },
    });
    expect(createLease.res.statusCode).toBe(200);

    leaseModel.findUnique.mockResolvedValueOnce({
      id: 'lease-open',
      status: 'open',
      vesselId: 'lease-vessel',
      type: 'lease',
    } as never);
    leaseModel.update.mockResolvedValueOnce({
      id: 'lease-open',
      status: 'active',
      vesselId: 'lease-vessel',
      type: 'lease',
    } as never);
    vesselModel.update.mockResolvedValueOnce({ id: 'lease-vessel' } as never);
    const acceptLease = await invokeRoute('post', '/economy/leases/accept', {
      body: { leaseId: 'lease-open' },
    });
    expect(acceptLease.res.statusCode).toBe(200);

    leaseModel.findUnique.mockResolvedValueOnce({
      id: 'lease-open',
      status: 'active',
      vesselId: 'lease-vessel',
      lesseeId: 'user-1',
      ownerId: 'shipyard',
    } as never);
    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ id: 'lease-vessel' }) as never,
    );
    leaseModel.update.mockResolvedValueOnce({ id: 'lease-open' } as never);
    vesselModel.update.mockResolvedValueOnce({ id: 'lease-vessel' } as never);
    const endLease = await invokeRoute('post', '/economy/leases/end', {
      body: { leaseId: 'lease-open' },
    });
    expect(endLease.res.statusCode).toBe(200);

    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ id: 'sale-vessel', ownerId: 'user-1' }) as never,
    );
    saleModel.create.mockResolvedValueOnce({
      id: 'sale-1',
      type: 'sale',
      status: 'open',
    } as never);
    vesselModel.update.mockResolvedValueOnce({ id: 'sale-vessel' } as never);
    const saleCreate = await invokeRoute('post', '/economy/sales', {
      body: { vesselId: 'sale-vessel', price: 9000 },
    });
    expect(saleCreate.res.statusCode).toBe(200);

    saleModel.findUnique.mockResolvedValueOnce({
      id: 'sale-1',
      status: 'open',
      reservePrice: null,
      price: 9000,
      sellerId: 'seller-1',
      vesselId: 'sale-vessel',
    } as never);
    userModel.findUnique.mockResolvedValueOnce({ credits: 10000 } as never);
    userModel.update.mockResolvedValue({ id: 'u' } as never);
    vesselModel.update.mockResolvedValueOnce({ id: 'sale-vessel' } as never);
    saleModel.update.mockResolvedValueOnce({ id: 'sale-1' } as never);
    const saleBuy = await invokeRoute('post', '/economy/sales/buy', {
      body: { saleId: 'sale-1' },
    });
    expect(saleBuy.res.statusCode).toBe(200);

    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ id: 'storage-vessel', ownerId: 'user-1' }) as never,
    );
    vesselModel.update.mockResolvedValueOnce({ id: 'storage-vessel' } as never);
    const activateStored = await invokeRoute(
      'post',
      '/economy/vessels/storage',
      {
        body: { vesselId: 'storage-vessel', action: 'activate' },
      },
    );
    expect(activateStored.res.statusCode).toBe(200);

    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({
        id: 'storage-vessel-2',
        ownerId: 'user-1',
      }) as never,
    );
    vesselModel.update.mockResolvedValueOnce({
      id: 'storage-vessel-2',
    } as never);
    const storeVessel = await invokeRoute('post', '/economy/vessels/storage', {
      body: { vesselId: 'storage-vessel-2' },
    });
    expect(storeVessel.res.statusCode).toBe(200);

    txModel.findMany.mockResolvedValueOnce([{ id: 'txn-1' }] as never);
    const transactions = await invokeRoute('get', '/economy/transactions');
    expect(transactions.res.statusCode).toBe(200);
  });

  it('handles spaces, profile, careers, licenses, exams, and reputation routes', async () => {
    const spaceModel = prismaMock.space as Record<string, MockedAsync>;
    const spaceAccessModel = prismaMock.spaceAccess as Record<
      string,
      MockedAsync
    >;
    const vesselModel = prismaMock.vessel as Record<string, MockedAsync>;
    const weatherStateModel = prismaMock.weatherState as Record<
      string,
      MockedAsync
    >;
    const userModel = prismaMock.user as Record<string, MockedAsync>;
    const careerModel = prismaMock.userCareer as Record<string, MockedAsync>;
    const licenseModel = prismaMock.license as Record<string, MockedAsync>;
    const examModel = prismaMock.exam as Record<string, MockedAsync>;
    const examAttemptModel = prismaMock.examAttempt as Record<
      string,
      MockedAsync
    >;
    const reputationModel = prismaMock.reputation as Record<
      string,
      MockedAsync
    >;

    const privateHash = await bcrypt.hash('secret', 4);
    spaceModel.findMany.mockResolvedValueOnce([
      createSpaceRecord({ id: 'public-1', visibility: 'public' }),
    ] as never);
    spaceAccessModel.findMany.mockResolvedValueOnce([
      { spaceId: 'known-1' },
    ] as never);
    spaceModel.findMany.mockResolvedValueOnce([
      createSpaceRecord({ id: 'known-1', visibility: 'private' }),
    ] as never);
    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({
        id: 'private-1',
        visibility: 'private',
        inviteToken: 'tok-1',
        passwordHash: privateHash,
      }) as never,
    );
    const spacesList = await invokeRoute('get', '/spaces', {
      query: {
        includeKnown: 'true',
        inviteToken: 'tok-1',
        password: 'secret',
      },
    });
    expect(spacesList.res.statusCode).toBe(200);

    const createdSpace = createSpaceRecord({
      id: 'created-1',
      name: 'Created Space',
      visibility: 'private',
      createdBy: 'user-1',
    });
    spaceModel.findFirst.mockResolvedValueOnce(null as never);
    spaceModel.create.mockResolvedValueOnce(createdSpace as never);
    spaceAccessModel.upsert.mockResolvedValue({ id: 'sa-created' } as never);
    const createSpace = await invokeRoute('post', '/spaces', {
      body: {
        name: 'Created Space',
        visibility: 'private',
        rulesetType: 'CUSTOM',
        password: 'abc12345',
      },
    });
    expect(createSpace.res.statusCode).toBe(201);

    spaceModel.findUnique.mockResolvedValueOnce(createdSpace as never);
    spaceAccessModel.upsert.mockResolvedValueOnce({ id: 'sa-known' } as never);
    const knownSpace = await invokeRoute('post', '/spaces/known', {
      body: { spaceId: 'created-1' },
    });
    expect(knownSpace.res.statusCode).toBe(200);

    spaceModel.findMany.mockResolvedValueOnce([
      createSpaceRecord({ id: 'mine-1', createdBy: 'user-1' }),
    ] as never);
    const mine = await invokeRoute('get', '/spaces/mine');
    expect(mine.res.statusCode).toBe(200);

    spaceModel.findMany.mockResolvedValueOnce([
      createSpaceRecord({ id: 'manage-1', createdBy: 'user-1' }),
      createSpaceRecord({ id: 'manage-2', createdBy: 'user-1' }),
    ] as never);
    vesselModel.groupBy.mockResolvedValueOnce([
      { spaceId: 'manage-1', _count: { _all: 2 } },
    ] as never);
    vesselModel.groupBy.mockResolvedValueOnce([
      { spaceId: 'manage-1', _count: { _all: 1 } },
    ] as never);
    const manage = await invokeRoute('get', '/spaces/manage', {
      query: { scope: 'mine' },
    });
    expect(manage.res.statusCode).toBe(200);

    const patchExisting = createSpaceRecord({
      id: 'patch-1',
      visibility: 'public',
      name: 'Patchable',
      rulesetType: 'CASUAL',
      rules: null,
      createdBy: 'user-1',
    });
    spaceModel.findUnique.mockResolvedValueOnce(patchExisting as never);
    spaceModel.findFirst.mockResolvedValueOnce(null as never);
    spaceModel.update.mockResolvedValueOnce(
      createSpaceRecord({
        ...patchExisting,
        name: 'Patchable Updated',
        rulesetType: 'CUSTOM',
      }) as never,
    );
    const patchSpace = await invokeRoute('patch', '/spaces/:spaceId', {
      params: { spaceId: 'patch-1' },
      body: {
        name: 'Patchable Updated',
        visibility: 'private',
        rulesetType: 'CUSTOM',
        rules: { assists: { stabilityAssist: false } },
        regenerateInvite: true,
      },
    });
    expect(patchSpace.res.statusCode).toBe(200);

    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({ id: 'delete-1', createdBy: 'user-1' }) as never,
    );
    vesselModel.count.mockResolvedValueOnce(0 as never);
    vesselModel.count.mockResolvedValueOnce(0 as never);
    spaceAccessModel.deleteMany.mockResolvedValueOnce({ count: 1 } as never);
    weatherStateModel.deleteMany.mockResolvedValueOnce({ count: 1 } as never);
    spaceModel.delete.mockResolvedValueOnce({ id: 'delete-1' } as never);
    const deleteSpace = await invokeRoute('delete', '/spaces/:spaceId', {
      params: { spaceId: 'delete-1' },
    });
    expect(deleteSpace.res.statusCode).toBe(200);

    careerModel.findMany.mockResolvedValueOnce([
      { id: 'career-1', userId: 'user-1' },
    ] as never);
    const careersStatus = await invokeRoute('get', '/careers/status');
    expect(careersStatus.res.statusCode).toBe(200);

    careerModel.updateMany.mockResolvedValueOnce({ count: 1 } as never);
    careerModel.update.mockResolvedValueOnce({
      userId: 'user-1',
      careerId: 'pilot',
      active: true,
    } as never);
    const activateCareer = await invokeRoute('post', '/careers/activate', {
      body: { careerId: 'pilot' },
    });
    expect(activateCareer.res.statusCode).toBe(200);

    licenseModel.findMany.mockResolvedValueOnce([{ id: 'license-1' }] as never);
    const licenses = await invokeRoute('get', '/licenses');
    expect(licenses.res.statusCode).toBe(200);

    const renewLicense = await invokeRoute('post', '/licenses/renew', {
      body: { licenseKey: 'harbor-master', durationDays: 120 },
    });
    expect(renewLicense.res.statusCode).toBe(200);

    examModel.findUnique.mockResolvedValueOnce({
      id: 'exam-1',
      minScore: 70,
      licenseKey: 'cert-a',
    } as never);
    examAttemptModel.create.mockResolvedValueOnce({
      id: 'attempt-1',
      passed: true,
    } as never);
    const examAttempt = await invokeRoute('post', '/exams/:id/attempt', {
      params: { id: 'exam-1' },
      body: { score: 95 },
    });
    expect(examAttempt.res.statusCode).toBe(200);

    reputationModel.findMany.mockResolvedValueOnce([
      { id: 'rep-1', userId: 'user-1' },
    ] as never);
    const reputation = await invokeRoute('get', '/reputation');
    expect(reputation.res.statusCode).toBe(200);

    const currentPasswordHash = await bcrypt.hash('current-password', 4);
    userModel.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      name: 'User One',
      email: 'u1@example.com',
      passwordHash: currentPasswordHash,
      role: 'player',
    } as never);
    userModel.findFirst.mockResolvedValueOnce(null as never);
    userModel.findFirst.mockResolvedValueOnce(null as never);
    userModel.update.mockResolvedValueOnce({
      id: 'user-1',
      name: 'User Prime',
      email: 'prime@example.com',
      role: 'player',
    } as never);
    const profileUpdate = await invokeRoute('post', '/profile', {
      body: {
        username: 'User Prime',
        email: 'prime@example.com',
        password: 'new-password-123',
        currentPassword: 'current-password',
      },
    });
    expect(profileUpdate.res.statusCode).toBe(200);
    expect(profileUpdate.res.body).toEqual(
      expect.objectContaining({
        success: true,
      }),
    );
  });

  it('handles logs, settings, profile and stats', async () => {
    (
      prismaMock.user as Record<string, MockedAsync>
    ).findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'User One',
      email: 'u1@example.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
      role: 'player',
    } as never);

    const logs = await invokeRoute('get', '/logs', { query: { limit: '50' } });
    expect(logs.res.statusCode).toBe(200);
    expect(getLogsMock).toHaveBeenCalled();

    const clear = await invokeRoute('delete', '/logs');
    expect(clear.res.statusCode).toBe(200);
    expect(clearLogsMock).toHaveBeenCalled();

    const initialSettingsGet = await invokeRoute('get', '/settings/:userId', {
      params: { userId: 'user-1' },
    });
    expect(initialSettingsGet.res.statusCode).toBe(404);

    const settingsPost = await invokeRoute('post', '/settings/:userId', {
      params: { userId: 'user-1' },
      body: {
        soundEnabled: true,
        units: 'metric',
        speedUnit: 'knots',
        distanceUnit: 'nm',
        timeZoneMode: 'auto',
        timeZone: 'UTC',
        notificationLevel: 'all',
        interfaceDensity: 'comfortable',
      },
    });
    expect(settingsPost.res.statusCode).toBe(200);
    expect(settingsPost.res.body).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        soundEnabled: true,
        units: 'metric',
      }),
    );

    const settingsGet = await invokeRoute('get', '/settings/:userId', {
      params: { userId: 'user-1' },
    });
    expect(settingsGet.res.statusCode).toBe(200);
    expect(settingsGet.res.body).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        soundEnabled: true,
        units: 'metric',
      }),
    );

    const profileNoop = await invokeRoute('post', '/profile', {
      body: {},
    });
    expect(profileNoop.res.statusCode).toBe(400);

    const stats = await invokeRoute('get', '/stats');
    expect(stats.res.statusCode).toBe(200);
    expect(stats.res.body).toEqual(
      expect.objectContaining({
        vesselCount: expect.any(Number),
      }),
    );
  });

  it('smoke-invokes all registered route handlers', async () => {
    const routes = (router as any).stack
      .filter((layer: any) => layer.route)
      .flatMap((layer: any) =>
        Object.keys(layer.route.methods).map((method: string) => ({
          method,
          path: layer.route.path as string,
        })),
      );

    let invoked = 0;
    for (const route of routes) {
      try {
        await invokeRoute(route.method, route.path, {
          body: genericBody,
          query: genericQuery,
          params: paramsFromPath(route.path),
        });
        invoked += 1;
      } catch {
        // Keep sweeping routes for coverage, even if an individual path rejects input.
      }
    }

    expect(invoked).toBeGreaterThan(40);
  });
});
