import bcrypt from 'bcryptjs';
import { EventEmitter } from 'events';
const { prismaMock } = require('../lib/prismaMock');

type MockedAsync = jest.Mock<Promise<unknown>, [unknown?]>;
type MockUser = { userId: string; roles: string[] };
type MiddlewareReq = {
  user?: MockUser;
  params?: Record<string, string>;
};
type MiddlewareRes = {
  status: (code: number) => { json: (payload: unknown) => void };
};
type MiddlewareNext = () => void;

const getLogsMock = jest.fn<{ level: string; message: string }[], [unknown?]>(
  () => [],
);
const clearLogsMock = jest.fn();

jest.mock('../../../src/server/middleware/authentication', () => ({
  authenticateRequest: (
    req: MiddlewareReq,
    _res: MiddlewareRes,
    next: MiddlewareNext,
  ) => {
    req.user = req.user || { userId: 'user-1', roles: ['admin'] };
    next();
  },
  requireAuth: (
    _req: MiddlewareReq,
    _res: MiddlewareRes,
    next: MiddlewareNext,
  ) => next(),
  requireUser: (req: MiddlewareReq, res: MiddlewareRes) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return null;
    }
    return req.user;
  },
}));

jest.mock('../../../src/server/middleware/authorization', () => ({
  requirePermission:
    () => (_req: MiddlewareReq, _res: MiddlewareRes, next: MiddlewareNext) =>
      next(),
  requireRole:
    () => (_req: MiddlewareReq, _res: MiddlewareRes, next: MiddlewareNext) =>
      next(),
  requireSelfOrRole:
    (paramKey: string, roles: string[] = ['admin']) =>
    (req: MiddlewareReq, res: MiddlewareRes, next: MiddlewareNext) => {
      const subjectId = req?.params?.[paramKey];
      const userId = req?.user?.userId;
      const userRoles = Array.isArray(req?.user?.roles) ? req.user.roles : [];
      if (userId && subjectId && userId === subjectId) {
        next();
        return;
      }
      if (userRoles.some((role: string) => roles.includes(role))) {
        next();
        return;
      }
      res.status(403).json({ error: 'Forbidden' });
      return;
    },
}));

jest.mock('../../../src/lib/prisma', () => ({
  prisma: require('../lib/prismaMock').prismaMock,
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
  getLogs: (...args: Parameters<typeof getLogsMock>) => getLogsMock(...args),
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
  warmVesselCatalog: jest.fn(async () => undefined),
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
      async (arg: unknown) =>
        typeof arg === 'function' ? arg(prismaMock) : arg,
    );
  }
};

type TestResponse = {
  statusCode: number;
  headersSent: boolean;
  finished: boolean;
  body: unknown;
  headers: Record<string, unknown>;
  on: EventEmitter['on'];
  once: EventEmitter['once'];
  emit: EventEmitter['emit'];
  status: (code: number) => TestResponse;
  json: (payload: unknown) => TestResponse;
  send: (payload: unknown) => TestResponse;
  end: (payload?: unknown) => TestResponse;
  setHeader: (name: string, value: unknown) => void;
  getHeader: (name: string) => unknown;
  set: (name: string, value: unknown) => TestResponse;
};

const createResponse = (): TestResponse => {
  const emitter = new EventEmitter();
  const res = {
    statusCode: 200,
    headersSent: false,
    finished: false,
    body: undefined as unknown,
    headers: {} as Record<string, unknown>,
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    emit: emitter.emit.bind(emitter),
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      res.headersSent = true;
      if (!res.finished) {
        res.finished = true;
        res.emit('finish');
      }
      return res;
    },
    send(payload: unknown) {
      res.body = payload;
      res.headersSent = true;
      if (!res.finished) {
        res.finished = true;
        res.emit('finish');
      }
      return res;
    },
    end(payload?: unknown) {
      res.body = payload;
      res.headersSent = true;
      if (!res.finished) {
        res.finished = true;
        res.emit('finish');
      }
      return res;
    },
    setHeader(name: string, value: unknown) {
      res.headers[name.toLowerCase()] = value;
    },
    getHeader(name: string) {
      return res.headers[name.toLowerCase()];
    },
    set(name: string, value: unknown) {
      res.setHeader(name, value);
      return res;
    },
  } as TestResponse;
  return res;
};

const replaceParamsInPath = (path: string, params: Record<string, string>) =>
  path.replace(/:([A-Za-z0-9_]+)/g, (_match, key) => {
    if (!(key in params)) {
      throw new Error(`Missing param '${key}' for path '${path}'`);
    }
    return params[key];
  });

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
  const params = input.params || paramsFromPath(path);
  const resolvedPath = replaceParamsInPath(path, params);
  const queryString =
    input.query && Object.keys(input.query).length > 0
      ? `?${new URLSearchParams(
          Object.entries(input.query).map(([key, value]) => [
            key,
            String(value),
          ]),
        ).toString()}`
      : '';
  const req: Record<string, unknown> = {
    method: method.toUpperCase(),
    url: `${resolvedPath}${queryString}`,
    originalUrl: `${resolvedPath}${queryString}`,
    headers: {},
    ip: '127.0.0.1',
    body: input.body || {},
    query: input.query || {},
    params,
    user: input.user || { userId: 'user-1', roles: ['admin'] },
  };
  const res = createResponse();

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const done = (err?: unknown) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve();
    };
    res.once('finish', () => done());
    const routeHandler = router as unknown as {
      handle: (
        req: unknown,
        res: unknown,
        next: (err?: unknown) => void,
      ) => void;
    };
    routeHandler.handle(req, res, (err: unknown) => done(err));
  });

  return { req, res };
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
    const weatherModel = prismaMock.weatherState as Record<string, MockedAsync>;
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

    vesselModel.findFirst.mockResolvedValueOnce(null as never);
    vesselModel.create.mockResolvedValueOnce(
      createVesselRecord({
        ownerId: 'local-user',
        lat: 60.17,
        lon: 24.94,
        z: 1,
        heading: 1.2,
        roll: 0.1,
        pitch: -0.1,
        surge: 3,
        sway: 0.5,
        heave: -0.1,
        mass: 20000,
        length: 80,
        beam: 14,
        draft: 4,
      }) as never,
    );
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

    vesselModel.findFirst.mockResolvedValueOnce(
      createVesselRecord({
        ownerId: 'local-user',
        mass: 20000,
      }) as never,
    );
    const fetchedState = await invokeRoute('get', '/vessels/:userId', {
      params: { userId: 'local-user' },
    });
    expect(fetchedState.res.statusCode).toBe(200);
    expect(fetchedState.res.body).toEqual(
      expect.objectContaining({
        properties: expect.objectContaining({ mass: 20000 }),
      }),
    );

    vesselModel.findFirst.mockResolvedValueOnce({ id: 'vessel-1' } as never);
    vesselModel.delete.mockResolvedValueOnce({ id: 'vessel-1' } as never);
    const deletedState = await invokeRoute('delete', '/vessels/:userId', {
      params: { userId: 'local-user' },
    });
    expect(deletedState.res.statusCode).toBe(200);

    weatherModel.findUnique.mockResolvedValueOnce(null as never);
    const environmentGet = await invokeRoute('get', '/environment');
    expect(environmentGet.res.statusCode).toBe(200);
    weatherModel.findUnique.mockResolvedValueOnce(null as never);
    weatherModel.upsert.mockResolvedValueOnce({ id: 'global' } as never);
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
    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({
        id: 'private-1',
        visibility: 'private',
        inviteToken: 'tok-1',
        passwordHash: privateHash,
      }) as never,
    );
    const spacesPasswordRequired = await invokeRoute('get', '/spaces', {
      query: {
        inviteToken: 'tok-1',
        password: 'secret',
      },
    });
    expect(spacesPasswordRequired.res.statusCode).toBe(403);
    expect(spacesPasswordRequired.res.body).toMatchObject({
      error: 'Password required',
      requiresPassword: true,
    });

    spaceModel.findMany.mockResolvedValueOnce([
      createSpaceRecord({ id: 'public-1', visibility: 'public' }),
    ] as never);
    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({
        id: 'private-1',
        visibility: 'private',
        inviteToken: 'tok-1',
        passwordHash: privateHash,
      }) as never,
    );
    const spacesInvalidPassword = await invokeRoute('post', '/spaces/access', {
      body: {
        inviteToken: 'tok-1',
        password: 'wrong-password',
      },
    });
    expect(spacesInvalidPassword.res.statusCode).toBe(403);
    expect(spacesInvalidPassword.res.body).toMatchObject({
      error: 'Invalid password',
      requiresPassword: true,
    });

    spaceModel.findMany.mockResolvedValueOnce([
      createSpaceRecord({ id: 'public-1', visibility: 'public' }),
    ] as never);
    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({
        id: 'private-1',
        visibility: 'private',
        inviteToken: 'tok-1',
        passwordHash: privateHash,
      }) as never,
    );
    const spacesList = await invokeRoute('post', '/spaces/access', {
      body: {
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

  it('handles economy endpoint validation and error paths', async () => {
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

    const purchaseMissingTemplate = await invokeRoute(
      'post',
      '/economy/vessels/purchase',
      { body: {} },
    );
    expect(purchaseMissingTemplate.res.statusCode).toBe(400);

    const leaseMissingTemplate = await invokeRoute(
      'post',
      '/economy/vessels/lease',
      { body: {} },
    );
    expect(leaseMissingTemplate.res.statusCode).toBe(400);

    const cargoAssignMissing = await invokeRoute(
      'post',
      '/economy/cargo/assign',
      { body: {} },
    );
    expect(cargoAssignMissing.res.statusCode).toBe(400);

    cargoModel.findUnique.mockResolvedValueOnce(null as never);
    const cargoReleaseMissing = await invokeRoute(
      'post',
      '/economy/cargo/release',
      { body: { cargoId: 'cargo-404' } },
    );
    expect(cargoReleaseMissing.res.statusCode).toBe(404);

    const passengerMissing = await invokeRoute(
      'post',
      '/economy/passengers/accept',
      { body: {} },
    );
    expect(passengerMissing.res.statusCode).toBe(400);

    const loanInvalidAmount = await invokeRoute(
      'post',
      '/economy/loans/request',
      { body: { amount: 0 } },
    );
    expect(loanInvalidAmount.res.statusCode).toBe(400);

    const loanRepayMissing = await invokeRoute('post', '/economy/loans/repay', {
      body: {},
    });
    expect(loanRepayMissing.res.statusCode).toBe(400);

    const insuranceMissing = await invokeRoute(
      'post',
      '/economy/insurance/purchase',
      { body: {} },
    );
    expect(insuranceMissing.res.statusCode).toBe(400);

    const insuranceCancelMissing = await invokeRoute(
      'post',
      '/economy/insurance/cancel',
      { body: {} },
    );
    expect(insuranceCancelMissing.res.statusCode).toBe(400);

    const createLeaseMissing = await invokeRoute('post', '/economy/leases', {
      body: {},
    });
    expect(createLeaseMissing.res.statusCode).toBe(400);

    const acceptLeaseMissing = await invokeRoute(
      'post',
      '/economy/leases/accept',
      { body: {} },
    );
    expect(acceptLeaseMissing.res.statusCode).toBe(400);

    const endLeaseMissing = await invokeRoute('post', '/economy/leases/end', {
      body: {},
    });
    expect(endLeaseMissing.res.statusCode).toBe(400);

    const saleMissing = await invokeRoute('post', '/economy/sales', {
      body: {},
    });
    expect(saleMissing.res.statusCode).toBe(400);

    const saleBuyMissing = await invokeRoute('post', '/economy/sales/buy', {
      body: {},
    });
    expect(saleBuyMissing.res.statusCode).toBe(400);

    const storageMissing = await invokeRoute(
      'post',
      '/economy/vessels/storage',
      { body: {} },
    );
    expect(storageMissing.res.statusCode).toBe(400);

    const summaryModel = prismaMock.economyTransaction as Record<
      string,
      MockedAsync
    >;
    summaryModel.findMany.mockRejectedValueOnce(new Error('db down') as never);
    const summaryFailure = await invokeRoute('get', '/economy/summary');
    expect(summaryFailure.res.statusCode).toBe(500);

    loanModel.findUnique.mockResolvedValueOnce(null as never);
    const loanNotFound = await invokeRoute('post', '/economy/loans/repay', {
      body: { loanId: 'loan-404', amount: 5 },
    });
    expect(loanNotFound.res.statusCode).toBe(404);

    insuranceModel.findUnique.mockResolvedValueOnce(null as never);
    const insuranceNotFound = await invokeRoute(
      'post',
      '/economy/insurance/cancel',
      {
        body: { policyId: 'policy-404' },
      },
    );
    expect(insuranceNotFound.res.statusCode).toBe(404);

    leaseModel.findUnique.mockResolvedValueOnce(null as never);
    const leaseNotFound = await invokeRoute('post', '/economy/leases/accept', {
      body: { leaseId: 'lease-404' },
    });
    expect(leaseNotFound.res.statusCode).toBe(404);

    saleModel.findUnique.mockResolvedValueOnce(null as never);
    const saleNotFound = await invokeRoute('post', '/economy/sales/buy', {
      body: { saleId: 'sale-404' },
    });
    expect(saleNotFound.res.statusCode).toBe(404);

    passengerModel.findUnique.mockResolvedValueOnce(null as never);
    const passengerNotFound = await invokeRoute(
      'post',
      '/economy/passengers/accept',
      {
        body: { contractId: 'contract-404', vesselId: 'v-1' },
      },
    );
    expect(passengerNotFound.res.statusCode).toBe(404);
  });

  it('handles spaces, careers, licenses, and exams validation branches', async () => {
    const spaceModel = prismaMock.space as Record<string, MockedAsync>;
    const careerModel = prismaMock.userCareer as Record<string, MockedAsync>;
    const examModel = prismaMock.exam as Record<string, MockedAsync>;

    const createSpaceMissingName = await invokeRoute('post', '/spaces', {
      body: { name: '  ' },
    });
    expect(createSpaceMissingName.res.statusCode).toBe(400);

    const knownMissingSpaceId = await invokeRoute('post', '/spaces/known', {
      body: {},
    });
    expect(knownMissingSpaceId.res.statusCode).toBe(400);

    const activateMissingCareer = await invokeRoute(
      'post',
      '/careers/activate',
      {
        body: {},
      },
    );
    expect(activateMissingCareer.res.statusCode).toBe(400);

    const renewMissingKey = await invokeRoute('post', '/licenses/renew', {
      body: {},
    });
    expect(renewMissingKey.res.statusCode).toBe(400);

    const examMissingScore = await invokeRoute('post', '/exams/:id/attempt', {
      params: { id: 'exam-1' },
      body: {},
    });
    expect(examMissingScore.res.statusCode).toBe(400);

    examModel.findUnique.mockResolvedValueOnce(null as never);
    const examNotFound = await invokeRoute('post', '/exams/:id/attempt', {
      params: { id: 'exam-404' },
      body: { score: 80 },
    });
    expect(examNotFound.res.statusCode).toBe(404);

    spaceModel.findMany.mockResolvedValueOnce([] as never);
    spaceModel.findUnique.mockResolvedValueOnce(null as never);
    const accessNotFound = await invokeRoute('post', '/spaces/access', {
      body: { inviteToken: 'missing-token' },
    });
    expect(accessNotFound.res.statusCode).toBe(404);

    careerModel.findMany.mockRejectedValueOnce(new Error('boom') as never);
    const careersFailure = await invokeRoute('get', '/careers/status');
    expect(careersFailure.res.statusCode).toBe(500);
  });

  it('covers additional economy route edge branches', async () => {
    const vesselModel = prismaMock.vessel as Record<string, MockedAsync>;
    const userModel = prismaMock.user as Record<string, MockedAsync>;
    const cargoModel = prismaMock.cargoLot as Record<string, MockedAsync>;
    const passengerModel = prismaMock.passengerContract as Record<
      string,
      MockedAsync
    >;
    const loanModel = prismaMock.loan as Record<string, MockedAsync>;
    const leaseModel = prismaMock.vesselLease as Record<string, MockedAsync>;
    const saleModel = prismaMock.vesselSale as Record<string, MockedAsync>;
    const txModel = prismaMock.economyTransaction as Record<
      string,
      MockedAsync
    >;
    const vesselCatalogModule = jest.requireMock(
      '../../../src/server/vesselCatalog',
    ) as {
      getVesselCatalog: jest.Mock;
      warmVesselCatalog: jest.Mock;
    };
    const economyModule = jest.requireMock('../../../src/server/economy') as {
      resolvePortForPosition: jest.Mock;
    };

    vesselCatalogModule.getVesselCatalog.mockReturnValueOnce({
      entries: [],
      byId: new Map(),
    });
    const purchaseUnknown = await invokeRoute(
      'post',
      '/economy/vessels/purchase',
      {
        body: { templateId: 'unknown-template' },
      },
    );
    expect(purchaseUnknown.res.statusCode).toBe(404);

    vesselCatalogModule.getVesselCatalog.mockReturnValueOnce({
      entries: [
        {
          id: 'free-vessel',
          properties: { mass: 1, length: 1, beam: 1, draft: 1 },
          commerce: { purchasePrice: 0, minRank: 1 },
        },
      ],
      byId: new Map([
        [
          'free-vessel',
          {
            id: 'free-vessel',
            properties: { mass: 1, length: 1, beam: 1, draft: 1 },
            commerce: { purchasePrice: 0, minRank: 1 },
          },
        ],
      ]),
    });
    const purchaseUnavailable = await invokeRoute(
      'post',
      '/economy/vessels/purchase',
      {
        body: { templateId: 'free-vessel' },
      },
    );
    expect(purchaseUnavailable.res.statusCode).toBe(400);

    vesselCatalogModule.getVesselCatalog.mockReturnValueOnce({
      entries: [
        {
          id: 'starter-container',
          properties: { mass: 1, length: 2, beam: 3, draft: 4 },
          commerce: { purchasePrice: 1000, minRank: 5 },
        },
      ],
      byId: new Map([
        [
          'starter-container',
          {
            id: 'starter-container',
            properties: { mass: 1, length: 2, beam: 3, draft: 4 },
            commerce: { purchasePrice: 1000, minRank: 5 },
          },
        ],
      ]),
    });
    userModel.findUnique.mockResolvedValueOnce({
      credits: 9999,
      rank: 1,
    } as never);
    const purchaseLowRank = await invokeRoute(
      'post',
      '/economy/vessels/purchase',
      {
        body: { templateId: 'starter-container' },
      },
    );
    expect(purchaseLowRank.res.statusCode).toBe(403);

    userModel.findUnique.mockResolvedValueOnce({
      credits: 10,
      rank: 5,
    } as never);
    const purchaseLowCredits = await invokeRoute(
      'post',
      '/economy/vessels/purchase',
      {
        body: { templateId: 'starter-container' },
      },
    );
    expect(purchaseLowCredits.res.statusCode).toBe(400);

    vesselCatalogModule.getVesselCatalog.mockReturnValueOnce({
      entries: [],
      byId: new Map(),
    });
    const leaseUnknown = await invokeRoute('post', '/economy/vessels/lease', {
      body: { templateId: 'unknown-template' },
    });
    expect(leaseUnknown.res.statusCode).toBe(404);

    vesselCatalogModule.getVesselCatalog.mockReturnValueOnce({
      entries: [
        {
          id: 'starter-container',
          properties: { mass: 1, length: 2, beam: 3, draft: 4 },
          commerce: {
            purchasePrice: 1000,
            minRank: 5,
            leaseRatePerHour: 50,
            charterRatePerHour: 40,
            revenueShare: 0.15,
          },
        },
      ],
      byId: new Map([
        [
          'starter-container',
          {
            id: 'starter-container',
            properties: { mass: 1, length: 2, beam: 3, draft: 4 },
            commerce: {
              purchasePrice: 1000,
              minRank: 5,
              leaseRatePerHour: 50,
              charterRatePerHour: 40,
              revenueShare: 0.15,
            },
          },
        ],
      ]),
    });
    userModel.findUnique.mockResolvedValueOnce({ rank: 1 } as never);
    const leaseLowRank = await invokeRoute('post', '/economy/vessels/lease', {
      body: { templateId: 'starter-container', type: 'lease' },
    });
    expect(leaseLowRank.res.statusCode).toBe(403);

    cargoModel.findUnique.mockResolvedValueOnce({
      id: 'cargo-1',
      ownerId: 'other-user',
      status: 'listed',
    } as never);
    const cargoNotOwner = await invokeRoute('post', '/economy/cargo/assign', {
      body: { cargoId: 'cargo-1', vesselId: 'v-1' },
    });
    expect(cargoNotOwner.res.statusCode).toBe(404);

    passengerModel.findUnique.mockResolvedValueOnce({
      id: 'pc-1',
      status: 'listed',
      expiresAt: new Date(Date.now() - 1000),
      originPortId: 'harbor-alpha',
      paxCount: 2,
    } as never);
    const passengerExpired = await invokeRoute(
      'post',
      '/economy/passengers/accept',
      {
        body: { contractId: 'pc-1', vesselId: 'v-1' },
      },
    );
    expect(passengerExpired.res.statusCode).toBe(400);

    loanModel.aggregate.mockResolvedValueOnce({
      _sum: { balance: 8000 },
    } as never);
    const loanLimit = await invokeRoute('post', '/economy/loans/request', {
      body: { amount: 2000 },
    });
    expect(loanLimit.res.statusCode).toBe(400);

    loanModel.findUnique.mockResolvedValueOnce({
      id: 'loan-1',
      userId: 'user-1',
      balance: 100,
      status: 'active',
    } as never);
    userModel.findUnique.mockResolvedValueOnce({ credits: 0 } as never);
    const repayNoCredits = await invokeRoute('post', '/economy/loans/repay', {
      body: { loanId: 'loan-1', amount: 50 },
    });
    expect(repayNoCredits.res.statusCode).toBe(400);

    leaseModel.findUnique.mockResolvedValueOnce({
      id: 'lease-1',
      status: 'active',
      lesseeId: 'other-user',
      ownerId: 'other-owner',
      vesselId: 'v-lease',
    } as never);
    const endLeaseForbidden = await invokeRoute('post', '/economy/leases/end', {
      body: { leaseId: 'lease-1' },
    });
    expect(endLeaseForbidden.res.statusCode).toBe(403);

    saleModel.findUnique.mockResolvedValueOnce({
      id: 'sale-1',
      status: 'open',
      reservePrice: 2000,
      price: 1000,
      sellerId: 'seller-1',
      vesselId: 'v-s1',
    } as never);
    const reserveNotMet = await invokeRoute('post', '/economy/sales/buy', {
      body: { saleId: 'sale-1' },
    });
    expect(reserveNotMet.res.statusCode).toBe(400);

    saleModel.findUnique.mockResolvedValueOnce({
      id: 'sale-2',
      status: 'open',
      reservePrice: null,
      price: 5000,
      sellerId: 'seller-1',
      vesselId: 'v-s2',
    } as never);
    userModel.findUnique.mockResolvedValueOnce({ credits: 10 } as never);
    const saleInsufficientCredits = await invokeRoute(
      'post',
      '/economy/sales/buy',
      {
        body: { saleId: 'sale-2' },
      },
    );
    expect(saleInsufficientCredits.res.statusCode).toBe(400);

    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ id: 'store-1', ownerId: 'user-1' }) as never,
    );
    economyModule.resolvePortForPosition.mockReturnValueOnce(null);
    const storeOutsidePort = await invokeRoute(
      'post',
      '/economy/vessels/storage',
      {
        body: { vesselId: 'store-1' },
      },
    );
    expect(storeOutsidePort.res.statusCode).toBe(400);

    txModel.findMany.mockRejectedValueOnce(
      new Error('transactions failed') as never,
    );
    const transactionsFailure = await invokeRoute(
      'get',
      '/economy/transactions',
    );
    expect(transactionsFailure.res.statusCode).toBe(500);
  });

  it('covers additional spaces route management and conflict branches', async () => {
    const spaceModel = prismaMock.space as Record<string, MockedAsync>;
    const vesselModel = prismaMock.vessel as Record<string, MockedAsync>;
    const weatherStateModel = prismaMock.weatherState as Record<
      string,
      MockedAsync
    >;
    const spaceAccessModel = prismaMock.spaceAccess as Record<
      string,
      MockedAsync
    >;

    spaceModel.findMany.mockResolvedValueOnce([] as never);
    const spacesList = await invokeRoute('get', '/spaces');
    expect(spacesList.res.statusCode).toBe(200);

    spaceModel.findFirst.mockResolvedValueOnce(createSpaceRecord() as never);
    const duplicatePublic = await invokeRoute('post', '/spaces', {
      body: { name: 'Space One', visibility: 'public' },
    });
    expect(duplicatePublic.res.statusCode).toBe(409);

    spaceModel.findMany.mockResolvedValueOnce([] as never);
    spaceModel.findMany.mockResolvedValueOnce([
      createSpaceRecord({ id: 'known-space-1' }),
    ] as never);
    spaceAccessModel.findMany.mockResolvedValueOnce([
      { spaceId: 'known-space-1' },
    ] as never);
    const includeKnown = await invokeRoute('get', '/spaces', {
      query: { includeKnown: 'true' },
    });
    expect(includeKnown.res.statusCode).toBe(200);

    spaceModel.findMany.mockResolvedValueOnce([] as never);
    const manageEmpty = await invokeRoute('get', '/spaces/manage', {
      query: { scope: 'mine' },
    });
    expect(manageEmpty.res.statusCode).toBe(200);
    expect(manageEmpty.res.body).toEqual({ spaces: [] });

    spaceModel.findUnique.mockResolvedValueOnce(null as never);
    const patchMissing = await invokeRoute('patch', '/spaces/:spaceId', {
      params: { spaceId: 'space-missing' },
      body: { name: 'x' },
    });
    expect(patchMissing.res.statusCode).toBe(404);

    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({ id: 'space-forbidden' }) as never,
    );
    const patchForbidden = await invokeRoute('patch', '/spaces/:spaceId', {
      params: { spaceId: 'space-forbidden' },
      body: { name: 'x' },
      user: { userId: 'non-admin', roles: ['player'] },
    });
    expect(patchForbidden.res.statusCode).toBe(403);

    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({ id: 'space-noop', createdBy: 'user-1' }) as never,
    );
    const patchNoop = await invokeRoute('patch', '/spaces/:spaceId', {
      params: { spaceId: 'space-noop' },
      body: {},
    });
    expect(patchNoop.res.statusCode).toBe(200);

    const deleteDefault = await invokeRoute('delete', '/spaces/:spaceId', {
      params: { spaceId: 'global' },
    });
    expect(deleteDefault.res.statusCode).toBe(400);

    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({ id: 'space-active' }) as never,
    );
    vesselModel.count.mockResolvedValueOnce(2 as never);
    const deleteWithActive = await invokeRoute('delete', '/spaces/:spaceId', {
      params: { spaceId: 'space-active' },
    });
    expect(deleteWithActive.res.statusCode).toBe(409);

    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({ id: 'space-has-vessels' }) as never,
    );
    vesselModel.count.mockResolvedValueOnce(0 as never);
    vesselModel.count.mockResolvedValueOnce(3 as never);
    const deleteWithVessels = await invokeRoute('delete', '/spaces/:spaceId', {
      params: { spaceId: 'space-has-vessels' },
    });
    expect(deleteWithVessels.res.statusCode).toBe(409);

    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({ id: 'space-delete-ok' }) as never,
    );
    vesselModel.count.mockResolvedValueOnce(0 as never);
    vesselModel.count.mockResolvedValueOnce(0 as never);
    spaceAccessModel.deleteMany.mockResolvedValueOnce({ count: 1 } as never);
    weatherStateModel.deleteMany.mockResolvedValueOnce({ count: 1 } as never);
    spaceModel.delete.mockResolvedValueOnce({ id: 'space-delete-ok' } as never);
    const deleteOk = await invokeRoute('delete', '/spaces/:spaceId', {
      params: { spaceId: 'space-delete-ok' },
    });
    expect(deleteOk.res.statusCode).toBe(200);
  });

  it('covers remaining economy and spaces catch/guard branches', async () => {
    const vesselModel = prismaMock.vessel as Record<string, MockedAsync>;
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
    const spaceModel = prismaMock.space as Record<string, MockedAsync>;
    const careerModel = prismaMock.userCareer as Record<string, MockedAsync>;
    const licenseModel = prismaMock.license as Record<string, MockedAsync>;
    const reputationModel = prismaMock.reputation as Record<
      string,
      MockedAsync
    >;
    const examModel = prismaMock.exam as Record<string, MockedAsync>;
    const examAttemptModel = prismaMock.examAttempt as Record<
      string,
      MockedAsync
    >;

    vesselModel.findUnique.mockResolvedValueOnce(null as never);
    const cargoListNoVessel = await invokeRoute('get', '/economy/cargo', {
      query: { vesselId: 'missing' },
    });
    expect(cargoListNoVessel.res.statusCode).toBe(200);

    cargoModel.findUnique.mockResolvedValueOnce({
      id: 'cargo-nonavail',
      ownerId: 'user-1',
      status: 'loading',
      expiresAt: null,
      weightTons: 1,
      portId: 'harbor-alpha',
    } as never);
    const cargoNotAvailable = await invokeRoute(
      'post',
      '/economy/cargo/assign',
      {
        body: { cargoId: 'cargo-nonavail', vesselId: 'v-1' },
      },
    );
    expect(cargoNotAvailable.res.statusCode).toBe(400);

    cargoModel.findUnique.mockResolvedValueOnce({
      id: 'cargo-vessel-missing',
      ownerId: 'user-1',
      status: 'listed',
      expiresAt: null,
      weightTons: 1,
      portId: 'harbor-alpha',
    } as never);
    vesselModel.findUnique.mockResolvedValueOnce(null as never);
    const cargoVesselMissing = await invokeRoute(
      'post',
      '/economy/cargo/assign',
      {
        body: { cargoId: 'cargo-vessel-missing', vesselId: 'missing' },
      },
    );
    expect(cargoVesselMissing.res.statusCode).toBe(404);

    cargoModel.findUnique.mockResolvedValueOnce({
      id: 'cargo-port-mismatch',
      ownerId: 'user-1',
      status: 'listed',
      expiresAt: null,
      weightTons: 1,
      portId: 'other-port',
    } as never);
    vesselModel.findUnique.mockResolvedValueOnce(createVesselRecord() as never);
    const cargoPortMismatch = await invokeRoute(
      'post',
      '/economy/cargo/assign',
      {
        body: { cargoId: 'cargo-port-mismatch', vesselId: 'v-1' },
      },
    );
    expect(cargoPortMismatch.res.statusCode).toBe(400);

    cargoModel.findUnique.mockResolvedValueOnce({
      id: 'cargo-release-1',
      ownerId: 'user-1',
    } as never);
    cargoModel.update.mockRejectedValueOnce(
      new Error('release failed') as never,
    );
    const cargoReleaseError = await invokeRoute(
      'post',
      '/economy/cargo/release',
      {
        body: { cargoId: 'cargo-release-1' },
      },
    );
    expect(cargoReleaseError.res.statusCode).toBe(500);

    passengerModel.findMany.mockRejectedValueOnce(
      new Error('pax list fail') as never,
    );
    const paxListFailure = await invokeRoute('get', '/economy/passengers');
    expect(paxListFailure.res.statusCode).toBe(500);

    passengerModel.findUnique.mockResolvedValueOnce({
      id: 'pc-vessel-missing',
      status: 'listed',
      expiresAt: null,
      originPortId: 'harbor-alpha',
      paxCount: 2,
    } as never);
    vesselModel.findUnique.mockResolvedValueOnce(null as never);
    const paxMissingVessel = await invokeRoute(
      'post',
      '/economy/passengers/accept',
      {
        body: { contractId: 'pc-vessel-missing', vesselId: 'missing' },
      },
    );
    expect(paxMissingVessel.res.statusCode).toBe(404);

    passengerModel.findUnique.mockResolvedValueOnce({
      id: 'pc-port-mismatch',
      status: 'listed',
      expiresAt: null,
      originPortId: 'somewhere-else',
      paxCount: 2,
    } as never);
    vesselModel.findUnique.mockResolvedValueOnce(createVesselRecord() as never);
    const paxPortMismatch = await invokeRoute(
      'post',
      '/economy/passengers/accept',
      {
        body: { contractId: 'pc-port-mismatch', vesselId: 'vessel-1' },
      },
    );
    expect(paxPortMismatch.res.statusCode).toBe(400);

    passengerModel.findUnique.mockResolvedValueOnce({
      id: 'pc-overcap',
      status: 'listed',
      expiresAt: null,
      originPortId: 'harbor-alpha',
      paxCount: 100,
    } as never);
    vesselModel.findUnique.mockResolvedValueOnce(createVesselRecord() as never);
    passengerModel.aggregate.mockResolvedValueOnce({
      _sum: { paxCount: 0 },
    } as never);
    const paxOverCapacity = await invokeRoute(
      'post',
      '/economy/passengers/accept',
      {
        body: { contractId: 'pc-overcap', vesselId: 'vessel-1' },
      },
    );
    expect(paxOverCapacity.res.statusCode).toBe(400);

    loanModel.findMany.mockRejectedValueOnce(
      new Error('loan list fail') as never,
    );
    const loansFailure = await invokeRoute('get', '/economy/loans');
    expect(loansFailure.res.statusCode).toBe(500);

    insuranceModel.findMany.mockRejectedValueOnce(
      new Error('ins list fail') as never,
    );
    const insuranceFailure = await invokeRoute('get', '/economy/insurance');
    expect(insuranceFailure.res.statusCode).toBe(500);

    leaseModel.findMany.mockRejectedValueOnce(
      new Error('lease list fail') as never,
    );
    const leasesFailure = await invokeRoute('get', '/economy/leases');
    expect(leasesFailure.res.statusCode).toBe(500);

    saleModel.findMany.mockRejectedValueOnce(
      new Error('sale list fail') as never,
    );
    const salesFailure = await invokeRoute('get', '/economy/sales');
    expect(salesFailure.res.statusCode).toBe(500);

    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ ownerId: 'other-user' }) as never,
    );
    const insuranceUnauthorized = await invokeRoute(
      'post',
      '/economy/insurance/purchase',
      {
        body: {
          vesselId: 'v-no-auth',
          coverage: 1000,
          premiumRate: 10,
        },
      },
    );
    expect(insuranceUnauthorized.res.statusCode).toBe(403);

    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ ownerId: 'other-user' }) as never,
    );
    const createLeaseUnauthorized = await invokeRoute(
      'post',
      '/economy/leases',
      {
        body: { vesselId: 'v-no-auth', ratePerHour: 10 },
      },
    );
    expect(createLeaseUnauthorized.res.statusCode).toBe(403);

    leaseModel.findUnique.mockResolvedValueOnce({
      id: 'lease-inactive',
      status: 'closed',
      vesselId: 'v-1',
    } as never);
    const leaseInactive = await invokeRoute('post', '/economy/leases/end', {
      body: { leaseId: 'lease-inactive' },
    });
    expect(leaseInactive.res.statusCode).toBe(404);

    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ id: 'sale-auth', ownerId: 'other-user' }) as never,
    );
    const createSaleUnauthorized = await invokeRoute('post', '/economy/sales', {
      body: { vesselId: 'sale-auth', price: 5000 },
    });
    expect(createSaleUnauthorized.res.statusCode).toBe(403);

    vesselModel.findUnique.mockResolvedValueOnce(
      createVesselRecord({ id: 'store-auth', ownerId: 'other-user' }) as never,
    );
    const storageUnauthorized = await invokeRoute(
      'post',
      '/economy/vessels/storage',
      {
        body: { vesselId: 'store-auth' },
      },
    );
    expect(storageUnauthorized.res.statusCode).toBe(404);

    vesselModel.findMany.mockRejectedValueOnce(
      new Error('dashboard fail') as never,
    );
    const dashboardFailure = await invokeRoute('get', '/economy/dashboard');
    expect(dashboardFailure.res.statusCode).toBe(500);

    cargoModel.count.mockRejectedValueOnce(new Error('ports fail') as never);
    const portsFailure = await invokeRoute('get', '/economy/ports');
    expect(portsFailure.res.statusCode).toBe(500);

    const vesselCatalogModule = await import(
      '../../../src/server/vesselCatalog'
    );
    (vesselCatalogModule.warmVesselCatalog as jest.Mock).mockRejectedValueOnce(
      new Error('catalog fail'),
    );
    const catalogFailure = await invokeRoute('get', '/economy/vessels/catalog');
    expect(catalogFailure.res.statusCode).toBe(500);

    (
      prismaMock.user as Record<string, MockedAsync>
    ).findUnique.mockResolvedValueOnce({
      rank: 2,
      credits: 100_000,
    } as never);
    (prismaMock.$transaction as jest.Mock).mockRejectedValueOnce(
      new Error('purchase tx fail'),
    );
    const purchaseFailure = await invokeRoute(
      'post',
      '/economy/vessels/purchase',
      {
        body: { templateId: 'starter-container' },
      },
    );
    expect(purchaseFailure.res.statusCode).toBe(500);

    (prismaMock.user as Record<string, MockedAsync>).findUnique
      .mockResolvedValueOnce({ rank: 2 } as never)
      .mockResolvedValueOnce(null as never);
    (
      prismaMock.user as Record<string, MockedAsync>
    ).create.mockResolvedValueOnce({
      id: 'system_shipyard',
    } as never);
    leaseModel.create.mockResolvedValueOnce({ id: 'lease-created' } as never);
    const leaseShipyardCreate = await invokeRoute(
      'post',
      '/economy/vessels/lease',
      {
        body: { templateId: 'starter-container', type: 'lease' },
      },
    );
    expect(leaseShipyardCreate.res.statusCode).toBe(200);
    expect(
      (prismaMock.user as Record<string, MockedAsync>).create,
    ).toHaveBeenCalled();

    (prismaMock.$transaction as jest.Mock).mockRejectedValueOnce(
      new Error('lease tx fail'),
    );
    (prismaMock.user as Record<string, MockedAsync>).findUnique
      .mockResolvedValueOnce({ rank: 2 } as never)
      .mockResolvedValueOnce({ id: 'system_shipyard' } as never);
    const leaseFailure = await invokeRoute('post', '/economy/vessels/lease', {
      body: { templateId: 'starter-container', type: 'charter' },
    });
    expect(leaseFailure.res.statusCode).toBe(500);

    cargoModel.findMany.mockRejectedValueOnce(
      new Error('cargo list fail') as never,
    );
    const cargoFailure = await invokeRoute('get', '/economy/cargo');
    expect(cargoFailure.res.statusCode).toBe(500);

    const cargoMissingId = await invokeRoute('post', '/economy/cargo/release', {
      body: {},
    });
    expect(cargoMissingId.res.statusCode).toBe(400);

    passengerModel.findUnique.mockResolvedValueOnce({
      id: 'pc-update-fail',
      status: 'listed',
      expiresAt: null,
      originPortId: 'harbor-alpha',
      paxCount: 2,
    } as never);
    vesselModel.findUnique.mockResolvedValueOnce(createVesselRecord() as never);
    passengerModel.aggregate.mockResolvedValueOnce({
      _sum: { paxCount: 0 },
    } as never);
    passengerModel.update.mockRejectedValueOnce(
      new Error('pax update fail') as never,
    );
    const passengerAcceptFailure = await invokeRoute(
      'post',
      '/economy/passengers/accept',
      {
        body: { contractId: 'pc-update-fail', vesselId: 'vessel-1' },
      },
    );
    expect(passengerAcceptFailure.res.statusCode).toBe(500);

    const fleetSuccess = await invokeRoute('get', '/economy/fleet');
    expect(fleetSuccess.res.statusCode).toBe(200);

    loanModel.aggregate.mockRejectedValueOnce(
      new Error('loan issue fail') as never,
    );
    const issueLoanFailure = await invokeRoute(
      'post',
      '/economy/loans/request',
      {
        body: { amount: 200 },
      },
    );
    expect(issueLoanFailure.res.statusCode).toBe(500);

    loanModel.findUnique.mockResolvedValueOnce({
      id: 'loan-err',
      userId: 'user-1',
      balance: 100,
      status: 'active',
    } as never);
    (
      prismaMock.user as Record<string, MockedAsync>
    ).findUnique.mockRejectedValueOnce(new Error('repay fail'));
    const repayFailure = await invokeRoute('post', '/economy/loans/repay', {
      body: { loanId: 'loan-err', amount: 10 },
    });
    expect(repayFailure.res.statusCode).toBe(500);

    const insuranceSuccess = await invokeRoute('get', '/economy/insurance');
    expect(insuranceSuccess.res.statusCode).toBe(200);

    vesselModel.findUnique.mockResolvedValueOnce(createVesselRecord() as never);
    insuranceModel.create.mockRejectedValueOnce(
      new Error('insurance create fail') as never,
    );
    const insuranceCreateFailure = await invokeRoute(
      'post',
      '/economy/insurance/purchase',
      {
        body: {
          vesselId: 'vessel-1',
          coverage: 1000,
          premiumRate: 1.2,
        },
      },
    );
    expect(insuranceCreateFailure.res.statusCode).toBe(500);

    insuranceModel.findUnique.mockResolvedValueOnce({
      id: 'policy-err',
      ownerId: 'user-1',
    } as never);
    insuranceModel.update.mockRejectedValueOnce(
      new Error('insurance cancel fail') as never,
    );
    const insuranceCancelFailure = await invokeRoute(
      'post',
      '/economy/insurance/cancel',
      {
        body: { policyId: 'policy-err' },
      },
    );
    expect(insuranceCancelFailure.res.statusCode).toBe(500);

    const leaseSuccess = await invokeRoute('get', '/economy/leases');
    expect(leaseSuccess.res.statusCode).toBe(200);

    const leaseAcceptMissing = await invokeRoute(
      'post',
      '/economy/leases/accept',
      {
        body: {},
      },
    );
    expect(leaseAcceptMissing.res.statusCode).toBe(400);

    leaseModel.findUnique.mockResolvedValueOnce({
      id: 'lease-catch',
      status: 'open',
      vesselId: 'vessel-1',
      type: 'lease',
    } as never);
    leaseModel.update.mockRejectedValueOnce(new Error('accept fail') as never);
    const leaseAcceptFailure = await invokeRoute(
      'post',
      '/economy/leases/accept',
      {
        body: { leaseId: 'lease-catch' },
      },
    );
    expect(leaseAcceptFailure.res.statusCode).toBe(500);

    leaseModel.findUnique.mockResolvedValueOnce({
      id: 'lease-end-catch',
      status: 'active',
      vesselId: 'vessel-1',
      ownerId: 'user-1',
      lesseeId: 'user-2',
    } as never);
    vesselModel.findUnique.mockResolvedValueOnce(createVesselRecord() as never);
    (prismaMock.$transaction as jest.Mock).mockRejectedValueOnce(
      new Error('end lease fail'),
    );
    const leaseEndFailure = await invokeRoute('post', '/economy/leases/end', {
      body: { leaseId: 'lease-end-catch' },
    });
    expect(leaseEndFailure.res.statusCode).toBe(500);

    const salesSuccess = await invokeRoute('get', '/economy/sales');
    expect(salesSuccess.res.statusCode).toBe(200);

    vesselModel.findUnique.mockResolvedValueOnce(createVesselRecord() as never);
    saleModel.create.mockRejectedValueOnce(
      new Error('sale create fail') as never,
    );
    const saleCreateFailure = await invokeRoute('post', '/economy/sales', {
      body: { vesselId: 'vessel-1', price: 7000 },
    });
    expect(saleCreateFailure.res.statusCode).toBe(500);

    saleModel.findUnique.mockResolvedValueOnce({
      id: 'sale-open',
      status: 'open',
      price: 100,
      sellerId: 'seller-1',
      vesselId: 'vessel-1',
      reservePrice: null,
    } as never);
    (
      prismaMock.user as Record<string, MockedAsync>
    ).findUnique.mockResolvedValueOnce({
      credits: 1000,
    } as never);
    (prismaMock.user as Record<string, MockedAsync>).update
      .mockResolvedValueOnce({} as never)
      .mockRejectedValueOnce(new Error('buy fail') as never);
    const saleBuyFailure = await invokeRoute('post', '/economy/sales/buy', {
      body: { saleId: 'sale-open' },
    });
    expect(saleBuyFailure.res.statusCode).toBe(500);

    vesselModel.findUnique.mockResolvedValueOnce(createVesselRecord() as never);
    vesselModel.update.mockRejectedValueOnce(new Error('store fail') as never);
    const storageFailure = await invokeRoute(
      'post',
      '/economy/vessels/storage',
      {
        body: { vesselId: 'vessel-1' },
      },
    );
    expect(storageFailure.res.statusCode).toBe(500);

    careerModel.update.mockRejectedValueOnce(
      new Error('activate fail') as never,
    );
    const activateFailure = await invokeRoute('post', '/careers/activate', {
      body: { careerId: 'pilot' },
    });
    expect(activateFailure.res.statusCode).toBe(500);

    licenseModel.findMany.mockRejectedValueOnce(
      new Error('license fail') as never,
    );
    const licenseFailure = await invokeRoute('get', '/licenses');
    expect(licenseFailure.res.statusCode).toBe(500);

    examModel.findUnique.mockResolvedValueOnce({
      id: 'exam-1',
      minScore: 70,
      licenseKey: null,
    } as never);
    examAttemptModel.create.mockRejectedValueOnce(
      new Error('exam fail') as never,
    );
    const examAttemptFailure = await invokeRoute('post', '/exams/:id/attempt', {
      params: { id: 'exam-1' },
      body: { score: 75 },
    });
    expect(examAttemptFailure.res.statusCode).toBe(500);

    reputationModel.findMany.mockRejectedValueOnce(
      new Error('rep fail') as never,
    );
    const reputationFailure = await invokeRoute('get', '/reputation');
    expect(reputationFailure.res.statusCode).toBe(500);

    spaceModel.findMany.mockRejectedValueOnce(
      new Error('spaces fail') as never,
    );
    const spacesFailure = await invokeRoute('get', '/spaces');
    expect(spacesFailure.res.statusCode).toBe(500);

    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({ id: 'patch-conflict', name: 'Old Name' }) as never,
    );
    spaceModel.findFirst.mockResolvedValueOnce(
      createSpaceRecord({ id: 'other', name: 'Conflict Name' }) as never,
    );
    const patchConflict = await invokeRoute('patch', '/spaces/:spaceId', {
      params: { spaceId: 'patch-conflict' },
      body: { name: 'Conflict Name', visibility: 'public' },
    });
    expect(patchConflict.res.statusCode).toBe(409);

    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({ id: 'patch-password', createdBy: 'user-1' }) as never,
    );
    spaceModel.update.mockResolvedValueOnce(
      createSpaceRecord({
        id: 'patch-password',
        inviteToken: 'new-token',
      }) as never,
    );
    const patchPassword = await invokeRoute('patch', '/spaces/:spaceId', {
      params: { spaceId: 'patch-password' },
      body: {
        password: 'new-secret',
        regenerateInvite: true,
        clearPassword: true,
      },
    });
    expect(patchPassword.res.statusCode).toBe(200);
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

  it('restricts settings access to self unless admin', async () => {
    const normalUser = { userId: 'settings-user-self', roles: ['player'] };
    const otherUserId = 'settings-user-other';

    const selfPost = await invokeRoute('post', '/settings/:userId', {
      params: { userId: normalUser.userId },
      user: normalUser,
      body: { soundEnabled: false },
    });
    expect(selfPost.res.statusCode).toBe(200);

    const selfGet = await invokeRoute('get', '/settings/:userId', {
      params: { userId: normalUser.userId },
      user: normalUser,
    });
    expect(selfGet.res.statusCode).toBe(200);

    const otherGet = await invokeRoute('get', '/settings/:userId', {
      params: { userId: otherUserId },
      user: normalUser,
    });
    expect(otherGet.res.statusCode).toBe(403);

    const otherPost = await invokeRoute('post', '/settings/:userId', {
      params: { userId: otherUserId },
      user: normalUser,
      body: { soundEnabled: true },
    });
    expect(otherPost.res.statusCode).toBe(403);

    const adminUser = { userId: 'settings-admin', roles: ['admin'] };
    const adminPost = await invokeRoute('post', '/settings/:userId', {
      params: { userId: otherUserId },
      user: adminUser,
      body: { soundEnabled: true },
    });
    expect(adminPost.res.statusCode).toBe(200);

    const adminGet = await invokeRoute('get', '/settings/:userId', {
      params: { userId: otherUserId },
      user: adminUser,
    });
    expect(adminGet.res.statusCode).toBe(200);
  });

  it('enforces owner-or-admin policy for vessel mutation routes', async () => {
    const vesselModel = prismaMock.vessel as Record<string, MockedAsync>;
    const ownerUser = { userId: 'vessel-owner', roles: ['player'] };
    const otherUserId = 'vessel-other';
    const adminUser = { userId: 'vessel-admin', roles: ['admin'] };

    vesselModel.findFirst.mockResolvedValueOnce(null as never);
    vesselModel.create.mockResolvedValueOnce(
      createVesselRecord({ ownerId: ownerUser.userId }) as never,
    );
    const ownerUpdate = await invokeRoute('post', '/vessels/:userId', {
      params: { userId: ownerUser.userId },
      user: ownerUser,
      body: {
        position: { lat: 60.17, lon: 24.94, z: 1 },
        orientation: { heading: 1.2, roll: 0.1, pitch: -0.1 },
        velocity: { surge: 3, sway: 0.5, heave: -0.1 },
        properties: { mass: 20000, length: 80, beam: 14, draft: 4 },
      },
    });
    expect(ownerUpdate.res.statusCode).toBe(200);

    const crossUserUpdate = await invokeRoute('post', '/vessels/:userId', {
      params: { userId: otherUserId },
      user: ownerUser,
      body: {
        position: { lat: 60.17, lon: 24.94, z: 1 },
      },
    });
    expect(crossUserUpdate.res.statusCode).toBe(403);

    vesselModel.findFirst.mockResolvedValueOnce(null as never);
    vesselModel.create.mockResolvedValueOnce(
      createVesselRecord({ ownerId: otherUserId }) as never,
    );
    const adminUpdate = await invokeRoute('post', '/vessels/:userId', {
      params: { userId: otherUserId },
      user: adminUser,
      body: {
        position: { lat: 60.17, lon: 24.94, z: 1 },
      },
    });
    expect(adminUpdate.res.statusCode).toBe(200);

    const crossUserDelete = await invokeRoute('delete', '/vessels/:userId', {
      params: { userId: otherUserId },
      user: ownerUser,
    });
    expect(crossUserDelete.res.statusCode).toBe(403);

    vesselModel.findFirst.mockResolvedValueOnce({ id: 'vessel-1' } as never);
    vesselModel.delete.mockResolvedValueOnce({ id: 'vessel-1' } as never);
    const adminDelete = await invokeRoute('delete', '/vessels/:userId', {
      params: { userId: otherUserId },
      user: adminUser,
    });
    expect(adminDelete.res.statusCode).toBe(200);
  });

  it('covers additional careers/spaces route branches and catches', async () => {
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
    const careerModel = prismaMock.userCareer as Record<string, MockedAsync>;
    const licenseModel = prismaMock.license as Record<string, MockedAsync>;

    const careers = await invokeRoute('get', '/careers');
    expect(careers.res.statusCode).toBe(200);

    const exams = await invokeRoute('get', '/exams');
    expect(exams.res.statusCode).toBe(200);

    licenseModel.findMany.mockResolvedValueOnce([{ id: 'lic-1' }] as never);
    const licenses = await invokeRoute('get', '/licenses');
    expect(licenses.res.statusCode).toBe(200);

    const renewLicenseFailure = await invokeRoute('post', '/licenses/renew', {
      body: { licenseKey: 'deck-watch' },
    });
    expect(renewLicenseFailure.res.statusCode).toBe(200);

    licenseModel.findMany.mockRejectedValueOnce(
      new Error('license catch') as never,
    );
    const licensesFailure = await invokeRoute('get', '/licenses');
    expect(licensesFailure.res.statusCode).toBe(500);

    spaceModel.findMany.mockResolvedValueOnce([] as never);
    const spacesInviteMissing = await invokeRoute('get', '/spaces', {
      query: { inviteToken: 'nope-token' },
    });
    expect(spacesInviteMissing.res.statusCode).toBe(404);

    spaceModel.findMany.mockResolvedValueOnce([] as never);
    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({ id: 'inv-public', visibility: 'public' }) as never,
    );
    const spacesInviteFound = await invokeRoute('get', '/spaces', {
      query: { inviteToken: 'public-token' },
    });
    expect(spacesInviteFound.res.statusCode).toBe(200);
    expect(
      (spacesInviteFound.res.body as { spaces?: unknown[] }).spaces,
    ).toHaveLength(1);

    spaceModel.findMany.mockRejectedValueOnce(
      new Error('spaces access fail') as never,
    );
    const spacesAccessFailure = await invokeRoute('post', '/spaces/access', {
      body: { includeKnown: true },
    });
    expect(spacesAccessFailure.res.statusCode).toBe(500);

    spaceModel.findFirst.mockResolvedValueOnce(null as never);
    spaceModel.create.mockResolvedValueOnce(
      createSpaceRecord({ id: 'space-seed-catch' }) as never,
    );
    spaceAccessModel.upsert.mockResolvedValueOnce({
      id: 'sa-seed-catch',
    } as never);
    const missionModule = jest.requireMock('../../../src/server/missions') as {
      seedDefaultMissions: jest.Mock;
    };
    missionModule.seedDefaultMissions.mockRejectedValueOnce(
      new Error('seed fail'),
    );
    const createSpaceSeedCatch = await invokeRoute('post', '/spaces', {
      body: { name: 'Seed Catch Space', visibility: 'public' },
    });
    expect(createSpaceSeedCatch.res.statusCode).toBe(201);

    spaceModel.findFirst.mockResolvedValueOnce(null as never);
    spaceModel.create.mockRejectedValueOnce(new Error('create fail') as never);
    const createSpaceCatch = await invokeRoute('post', '/spaces', {
      body: { name: 'Create Catch Space', visibility: 'public' },
    });
    expect(createSpaceCatch.res.statusCode).toBe(500);

    spaceModel.findUnique.mockResolvedValueOnce(null as never);
    const knownSpaceNotFound = await invokeRoute('post', '/spaces/known', {
      body: { spaceId: 'unknown-space' },
    });
    expect(knownSpaceNotFound.res.statusCode).toBe(404);

    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({ id: 'known-catch' }) as never,
    );
    spaceAccessModel.upsert.mockRejectedValueOnce(
      new Error('known fail') as never,
    );
    const knownSpaceCatch = await invokeRoute('post', '/spaces/known', {
      body: { spaceId: 'known-catch' },
    });
    expect(knownSpaceCatch.res.statusCode).toBe(500);

    spaceModel.findMany.mockRejectedValueOnce(new Error('mine fail') as never);
    const mineCatch = await invokeRoute('get', '/spaces/mine');
    expect(mineCatch.res.statusCode).toBe(500);

    spaceModel.findMany.mockRejectedValueOnce(
      new Error('manage fail') as never,
    );
    const manageCatch = await invokeRoute('get', '/spaces/manage');
    expect(manageCatch.res.statusCode).toBe(500);

    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({ id: 'patch-admin', createdBy: 'user-1' }) as never,
    );
    spaceModel.findFirst.mockResolvedValueOnce(null as never);
    spaceModel.update.mockResolvedValueOnce(
      createSpaceRecord({
        id: 'patch-admin',
        kind: 'tutorial',
        rankRequired: 3,
        passwordHash: null,
      }) as never,
    );
    const patchAdmin = await invokeRoute('patch', '/spaces/:spaceId', {
      params: { spaceId: 'patch-admin' },
      body: {
        clearPassword: true,
        kind: 'tutorial',
        rankRequired: 3,
      },
    });
    expect(patchAdmin.res.statusCode).toBe(200);

    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({ id: 'patch-catch', createdBy: 'user-1' }) as never,
    );
    spaceModel.update.mockRejectedValueOnce(new Error('patch fail') as never);
    const patchCatch = await invokeRoute('patch', '/spaces/:spaceId', {
      params: { spaceId: 'patch-catch' },
      body: { name: 'boom' },
    });
    expect(patchCatch.res.statusCode).toBe(500);

    spaceModel.findUnique.mockResolvedValueOnce(null as never);
    const deleteMissing = await invokeRoute('delete', '/spaces/:spaceId', {
      params: { spaceId: 'missing-delete' },
    });
    expect(deleteMissing.res.statusCode).toBe(404);

    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({ id: 'delete-forbidden' }) as never,
    );
    const deleteForbidden = await invokeRoute('delete', '/spaces/:spaceId', {
      params: { spaceId: 'delete-forbidden' },
      user: { userId: 'u-player', roles: ['player'] },
    });
    expect(deleteForbidden.res.statusCode).toBe(403);

    spaceModel.findUnique.mockResolvedValueOnce(
      createSpaceRecord({ id: 'delete-catch' }) as never,
    );
    vesselModel.count
      .mockResolvedValueOnce(0 as never)
      .mockResolvedValueOnce(0 as never);
    spaceAccessModel.deleteMany.mockResolvedValueOnce({ count: 1 } as never);
    weatherStateModel.deleteMany.mockResolvedValueOnce({ count: 1 } as never);
    spaceModel.delete.mockRejectedValueOnce(new Error('delete fail') as never);
    const deleteCatch = await invokeRoute('delete', '/spaces/:spaceId', {
      params: { spaceId: 'delete-catch' },
    });
    expect(deleteCatch.res.statusCode).toBe(500);

    careerModel.findMany.mockResolvedValueOnce([] as never);
    const careersStatus = await invokeRoute('get', '/careers/status');
    expect(careersStatus.res.statusCode).toBe(200);
  });
});
