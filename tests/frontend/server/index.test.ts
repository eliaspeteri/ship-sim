import {
  TestSocketData,
  buildVessel,
  createConnectionSocket,
  loadServerIndexModule,
  mockIo,
  mockServer,
} from './fixtures/serverIndexHarness';

const loadModule = loadServerIndexModule;
type SocketHandler = (...args: unknown[]) => void;
type TestSocketAuth = {
  data: TestSocketData & {
    vesselId?: string;
    mode?: string;
    autoJoin?: boolean;
  };
  join: jest.Mock;
  leave?: jest.Mock;
  emit?: jest.Mock;
  disconnect?: jest.Mock;
};

describe('server/index', () => {
  const intervalCallbacks: Array<() => void> = [];
  const setIntervalSpy = jest
    .spyOn(global, 'setInterval')
    .mockImplementation((cb: TimerHandler) => {
      if (typeof cb === 'function') {
        intervalCallbacks.push(cb as () => void);
      }
      return 0 as unknown as NodeJS.Timeout;
    });
  const exitSpy = jest
    .spyOn(process, 'exit')
    .mockImplementation((() => undefined) as never);
  let connectionHandler: ((socket: TestSocketAuth) => void) | null = null;
  let authMiddleware:
    | ((socket: TestSocketAuth, next: (err?: Error) => void) => void)
    | null = null;

  beforeEach(() => {
    intervalCallbacks.length = 0;
    mockIo.on.mockImplementation((event: string, cb: SocketHandler) => {
      if (event === 'connection') {
        connectionHandler = cb as (socket: TestSocketAuth) => void;
      }
    });
    mockIo.use.mockImplementation((cb: SocketHandler) => {
      authMiddleware = cb as (
        socket: TestSocketAuth,
        next: (err?: Error) => void,
      ) => void;
    });
    mockIo.to.mockImplementation(() => ({ emit: jest.fn() }));
    mockIo.in.mockImplementation(() => ({
      fetchSockets: jest.fn(async () => []),
    }));
    mockIo.sockets.adapter.rooms = new Map();
    mockIo.sockets.sockets = new Map();
  });

  afterAll(() => {
    setIntervalSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('currentUtcTimeOfDay returns fractional hours', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(Date.UTC(2020, 0, 1, 6, 30, 0, 0)));
    const mod = await loadModule();
    expect(mod.currentUtcTimeOfDay()).toBeCloseTo(6.5, 6);
    jest.useRealTimers();
  });

  it('getEnvironmentForSpace caches default environments', async () => {
    const mod = await loadModule();
    const first = mod.getEnvironmentForSpace('space-x');
    const second = mod.getEnvironmentForSpace('space-x');
    expect(first).toBe(second);
    expect(first.name).toBe('space-x');
  });

  it('getRulesForSpace returns default rules when no metadata', async () => {
    const mod = await loadModule();
    const rules = mod.getRulesForSpace('unknown-space');
    expect(rules).toBeTruthy();
    expect(rules).toHaveProperty('realism');
  });

  it('parses cookies safely', async () => {
    const mod = await loadModule();
    expect(mod.__test__.parseCookies()).toEqual({});
    expect(
      mod.__test__.parseCookies('a=1; b=hello%20world; token=xyz'),
    ).toEqual({ a: '1', b: 'hello world', token: 'xyz' });
    expect(
      mod.__test__.parseCookies(
        'good=1; bad=%E0%A4%A; noeq; =missing-key; enc=%7Bok%7D',
      ),
    ).toEqual({
      good: '1',
      bad: '%E0%A4%A',
      enc: '{ok}',
    });
  });

  it('fails fast in production when CORS origins are not configured', async () => {
    const mod = await loadModule();
    expect(() =>
      mod.__test__.parseAllowedOrigins({ production: true, rawOrigins: '' }),
    ).toThrow('Missing FRONTEND_ORIGINS/FRONTEND_URL in production');
  });

  it('applies environment overrides and updates tide state', async () => {
    const mod = await loadModule();
    const { computeTideState } = await import('../../../src/lib/tides');
    const env = mod.__test__.getDefaultEnvironment('Test Ocean');
    mod.__test__.globalState.environmentBySpace.set('space-2', env);

    const updated = mod.__test__.applyEnvironmentOverrides('space-2', {
      wind: { speed: 12, direction: 1.2 },
      current: { speed: 2, direction: 0.4 },
      visibility: 6,
      precipitation: 'rain',
      precipitationIntensity: 0.2,
      seaState: 5,
      waterDepth: 80,
    });
    expect(updated.wind.speed).toBe(12);
    expect(updated.current.speed).toBe(2);
    expect(
      mod.__test__.globalState.environmentBySpace.get('space-2')?.visibility,
    ).toBe(6);

    (computeTideState as jest.Mock).mockReturnValueOnce({
      height: env.tideHeight ?? 0,
      range: env.tideRange ?? 0,
      phase: env.tidePhase ?? 0,
      trend: env.tideTrend ?? 'rising',
    });
    expect(mod.__test__.updateTideForSpace('space-2', Date.now())).toBe(false);

    (computeTideState as jest.Mock).mockReturnValueOnce({
      height: 1,
      range: 2,
      phase: 0.5,
      trend: 'falling',
    });
    expect(mod.__test__.updateTideForSpace('space-2', Date.now())).toBe(true);
  });

  it('throttles cooldown checks', async () => {
    const mod = await loadModule();
    expect(mod.__test__.canTriggerCooldown('k', 1000, 500)).toBe(true);
    expect(mod.__test__.canTriggerCooldown('k', 1200, 500)).toBe(false);
    expect(mod.__test__.canTriggerCooldown('k', 1601, 500)).toBe(true);
  });

  it('resolves chat channels by request and vessel', async () => {
    const mod = await loadModule();
    expect(
      mod.__test__.resolveChatChannel('space:space-1:global', 'v-1', 'space-1'),
    ).toBe('space:space-1:global');
    expect(
      mod.__test__.resolveChatChannel('space:other:global', 'v-1', 'space-1'),
    ).toBe('space:space-1:global');
    expect(
      mod.__test__.resolveChatChannel('vessel:any', 'v-1', 'space-1'),
    ).toBe('space:space-1:vessel:v-1');
    expect(
      mod.__test__.resolveChatChannel('global', undefined, 'space-1'),
    ).toBe('space:space-1:global');
  });

  it('assigns and updates station ownership', async () => {
    const mod = await loadModule();
    const vessel = buildVessel('v-stations');
    mod.__test__.assignStationsForCrew(vessel, 'u1', 'User One');
    expect(vessel.helmUserId).toBe('u1');
    expect(vessel.engineUserId).toBe('u1');
    expect(vessel.radioUserId).toBe('u1');

    const claimFail = mod.__test__.updateStationAssignment(
      vessel,
      'helm',
      'claim',
      'u2',
      'User Two',
    );
    expect(claimFail.ok).toBe(false);

    const claimAdmin = mod.__test__.updateStationAssignment(
      vessel,
      'helm',
      'claim',
      'u2',
      'User Two',
      true,
    );
    expect(claimAdmin.ok).toBe(true);
    expect(vessel.helmUserId).toBe('u2');

    const releaseFail = mod.__test__.updateStationAssignment(
      vessel,
      'helm',
      'release',
      'u3',
      'User Three',
    );
    expect(releaseFail.ok).toBe(false);

    const releaseOk = mod.__test__.updateStationAssignment(
      vessel,
      'helm',
      'release',
      'u2',
      'User Two',
    );
    expect(releaseOk.ok).toBe(true);
    expect(vessel.helmUserId).toBeNull();
  });

  it('updates socket vessel rooms', async () => {
    const mod = await loadModule();
    const socket: TestSocketAuth = {
      data: { vesselId: 'old_vessel' },
      leave: jest.fn(),
      join: jest.fn(),
    };
    mod.__test__.updateSocketVesselRoom(
      socket as unknown as Parameters<
        typeof mod.__test__.updateSocketVesselRoom
      >[0],
      'space-1',
      'new_vessel',
    );
    expect(socket.leave).toHaveBeenCalledWith(
      'space:space-1:vessel:old_vessel',
    );
    expect(socket.join).toHaveBeenCalledWith('space:space-1:vessel:new');
    expect(socket.data.vesselId).toBe('new');

    mod.__test__.updateSocketVesselRoom(
      socket as unknown as Parameters<
        typeof mod.__test__.updateSocketVesselRoom
      >[0],
      'space-1',
      null,
    );
    expect(socket.data.vesselId).toBeUndefined();
  });

  it('selects vessels for users across scenarios', async () => {
    const mod = await loadModule();
    const { globalState } = mod.__test__;
    globalState.vessels.clear();
    globalState.userLastVessel.clear();

    const last = buildVessel('v-last');
    globalState.vessels.set(last.id, last);
    globalState.userLastVessel.set('space-1:user-1', last.id);
    const assigned = mod.__test__.ensureVesselForUser(
      'user-1',
      'User One',
      'space-1',
    );
    expect(assigned).toBe(last);
    expect(last.crewIds.has('user-1')).toBe(true);

    last.status = 'stored';
    const none = mod.__test__.ensureVesselForUser(
      'user-1',
      'User One',
      'space-1',
    );
    expect(none).toBeUndefined();

    globalState.userLastVessel.clear();
    const existing = buildVessel('v-existing');
    existing.crewIds.add('user-2');
    existing.crewNames.set('user-2', 'User Two');
    globalState.vessels.set(existing.id, existing);
    const existingAssign = mod.__test__.ensureVesselForUser(
      'user-2',
      'User Two',
      'space-1',
    );
    expect(existingAssign).toBe(existing);

    globalState.vessels.clear();
    const joinable = buildVessel('v-join');
    joinable.crewIds.add('crew-1');
    joinable.crewNames.set('crew-1', 'Crew');
    globalState.vessels.set(joinable.id, joinable);
    const joined = mod.__test__.ensureVesselForUser(
      'user-3',
      'User Three',
      'space-1',
    );
    expect(joined).toBe(joinable);
    expect(joinable.crewIds.has('user-3')).toBe(true);

    globalState.vessels.clear();
    const owned = buildVessel('v-owned');
    owned.ownerId = 'user-4';
    globalState.vessels.set(owned.id, owned);
    const ownedAssign = mod.__test__.ensureVesselForUser(
      'user-4',
      'User Four',
      'space-1',
    );
    expect(ownedAssign).toBe(owned);
    expect(owned.crewIds.has('user-4')).toBe(true);

    globalState.vessels.clear();
    const aiVessel = buildVessel('v-ai');
    aiVessel.mode = 'ai';
    aiVessel.crewIds.clear();
    globalState.vessels.set(aiVessel.id, aiVessel);
    const taken = mod.__test__.ensureVesselForUser(
      'user-5',
      'User Five',
      'space-1',
    );
    expect(taken?.id).toBe(aiVessel.id);
    expect(aiVessel.mode).toBe('player');
  });

  it('loads and refreshes space metadata', async () => {
    const mod = await loadModule();
    const { prisma } = await import('../../../src/lib/prisma');
    (prisma.space.findUnique as jest.Mock).mockResolvedValue({
      id: 'space-1',
      name: 'Space One',
      visibility: 'public',
      kind: 'free',
      rankRequired: 2,
      rulesetType: 'REALISTIC',
      rules: { realism: { damage: true } },
      createdBy: 'user-1',
    });
    const meta = await mod.__test__.getSpaceMeta('space-1');
    expect(meta.name).toBe('Space One');
    await mod.__test__.refreshSpaceMeta('space-1');
    expect(prisma.space.findUnique).toHaveBeenCalled();
  });

  it('resolves space roles and access', async () => {
    const mod = await loadModule();
    const { prisma } = await import('../../../src/lib/prisma');
    (prisma.space.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'space-1',
      name: 'Space One',
      visibility: 'public',
      createdBy: 'user-1',
    });
    const hostRole = await mod.__test__.getSpaceRole('user-1', 'space-1');
    expect(hostRole).toBe('host');
    (prisma.space.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'space-2',
      name: 'Space Two',
      visibility: 'public',
      createdBy: null,
    });
    (prisma.spaceAccess.findUnique as jest.Mock).mockResolvedValue({
      role: 'host',
    });
    const hostRole2 = await mod.__test__.getSpaceRole('user-2', 'space-2');
    expect(hostRole2).toBe('host');
    const memberRole = await mod.__test__.getSpaceRole(undefined, 'space-2');
    expect(memberRole).toBe('member');
  });

  it('loads vessels and environment from db', async () => {
    const mod = await loadModule();
    const { prisma } = await import('../../../src/lib/prisma');
    (prisma.vessel.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'v-1',
        spaceId: 'space-1',
        ownerId: 'owner-1',
        status: 'active',
        storedAt: null,
        chartererId: null,
        leaseeId: null,
        mode: 'player',
        desiredMode: 'player',
        lastCrewAt: new Date(),
        lat: 0,
        lon: 0,
        z: 0,
        heading: 0,
        roll: 0,
        pitch: 0,
        surge: 0,
        sway: 0,
        heave: 0,
        yawRate: 0,
        throttle: 0,
        rudderAngle: 0,
        ballast: 0.5,
        bowThruster: 0,
        mass: 1,
        length: 1,
        beam: 1,
        draft: 1,
        lastUpdate: new Date(),
        templateId: 'template-1',
      },
    ]);
    (prisma.weatherState.findUnique as jest.Mock).mockResolvedValueOnce(null);
    await mod.__test__.loadVesselsFromDb();
    await mod.__test__.loadEnvironmentFromDb('space-1');
    expect(mod.__test__.globalState.vessels.get('v-1')).toBeTruthy();
    expect(
      mod.__test__.globalState.environmentBySpace.get('space-1'),
    ).toBeTruthy();
  });

  it('ensures default space exists', async () => {
    const mod = await loadModule();
    const { prisma } = await import('../../../src/lib/prisma');
    await mod.__test__.ensureDefaultSpaceExists();
    expect(prisma.space.upsert).toHaveBeenCalled();
  });

  it('builds vessel records from db rows', async () => {
    const mod = await loadModule();
    const vessel = mod.__test__.buildVesselRecordFromRow({
      id: 'v-1',
      spaceId: 'space-1',
      ownerId: 'owner-1',
      status: 'active',
      storagePortId: null,
      storedAt: null,
      chartererId: null,
      leaseeId: null,
      mode: 'player',
      desiredMode: 'player',
      lastCrewAt: new Date(),
      lat: 0,
      lon: 0,
      z: 0,
      heading: 0,
      roll: 0,
      pitch: 0,
      surge: 0,
      sway: 0,
      heave: 0,
      yawRate: 0,
      throttle: 0,
      rudderAngle: 0,
      ballast: 0.5,
      bowThruster: 0,
      mass: 1,
      length: 1,
      beam: 1,
      draft: 1,
      lastUpdate: new Date(),
      templateId: 'template-1',
    });
    expect(vessel.id).toBe('v-1');
    expect(vessel.position).toBeTruthy();
  });

  it('starts server boot sequence', async () => {
    const mod = await loadModule();
    const { prisma } = await import('../../../src/lib/prisma');
    (prisma.space.findMany as jest.Mock).mockResolvedValue([{ id: 'space-1' }]);
    await mod.__test__.startServer();
    expect(mockServer.listen).toHaveBeenCalled();
  });

  it('handles server boot failures gracefully', async () => {
    const mod = await loadModule();
    const { loadBathymetry } = await import('../../../src/server/bathymetry');
    (loadBathymetry as jest.Mock).mockRejectedValueOnce(
      new Error('boot failure'),
    );
    await mod.__test__.startServer();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('processes scheduled environment events', async () => {
    const mod = await loadModule();
    const { prisma } = await import('../../../src/lib/prisma');
    (prisma.environmentEvent.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 'evt-1',
          spaceId: 'space-1',
          enabled: true,
          runAt: new Date(Date.now() - 1000),
          executedAt: null,
          payload: { wind: { speed: 10 } },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'evt-1',
          spaceId: 'space-1',
          enabled: true,
          endAt: new Date(Date.now() - 1000),
          endedAt: null,
          executedAt: new Date(),
          endPayload: null,
        },
      ]);
    await mod.__test__.processEnvironmentEvents();
    expect(prisma.environmentEvent.update).toHaveBeenCalled();
  });

  it('processes environment events with restore payloads and explicit end payloads', async () => {
    const mod = await loadModule();
    const { prisma } = await import('../../../src/lib/prisma');
    const now = Date.now();
    (prisma.environmentEvent.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 'evt-restore',
          spaceId: 'space-1',
          enabled: true,
          runAt: new Date(now - 1000),
          executedAt: null,
          endAt: new Date(now + 1000),
          endPayload: null,
          pattern: 'stormy',
          payload: { wind: { speed: 12 } },
          name: 'Scheduled Storm',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'evt-end',
          spaceId: 'space-1',
          enabled: true,
          endAt: new Date(now - 1000),
          endedAt: null,
          executedAt: new Date(now - 2000),
          endPayload: { wind: { speed: 3 } },
        },
      ]);

    await mod.__test__.processEnvironmentEvents();

    expect(prisma.environmentEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'evt-restore' },
        data: expect.objectContaining({ endPayload: expect.any(Object) }),
      }),
    );
    expect(prisma.environmentEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'evt-end' },
        data: expect.objectContaining({ endedAt: expect.any(Date) }),
      }),
    );
  });

  it('handles auth middleware for sockets', async () => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    const mod = await loadModule();
    const socket = {
      handshake: { headers: { cookie: '' }, auth: { token: 'abc' } },
      data: {} as TestSocketData,
      join: jest.fn(),
    };
    const next = jest.fn();
    expect(authMiddleware).toBeTruthy();
    await authMiddleware!(socket, next);
    expect(socket.data.userId).toBe('user-1');
    expect(next).toHaveBeenCalled();
    void mod;
  });

  it('auth middleware falls back to guest on invalid token', async () => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    const mod = await loadModule();
    const jwt = await import('jsonwebtoken');
    (jwt.verify as jest.Mock).mockImplementationOnce(() => {
      throw new Error('bad token');
    });
    const socket = {
      handshake: { headers: { cookie: '' }, auth: { token: 'bad' } },
      data: {} as TestSocketData,
      join: jest.fn(),
    };
    const next = jest.fn();
    await authMiddleware!(socket, next);
    expect(socket.data.roles).toContain('guest');
    expect((socket.data as TestSocketAuth['data']).mode).toBe('spectator');
    expect((socket.data as TestSocketAuth['data']).autoJoin).toBe(false);
    expect(next).toHaveBeenCalled();
    void mod;
  });

  it('auth middleware blocks banned users', async () => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    const mod = await loadModule();
    const { prisma } = await import('../../../src/lib/prisma');
    (prisma.ban.findFirst as jest.Mock).mockResolvedValueOnce({
      reason: 'Nope',
    });
    const socket = {
      handshake: { headers: { cookie: '' }, auth: { token: 'abc' } },
      data: {} as TestSocketData,
      join: jest.fn(),
    };
    const next = jest.fn();
    await authMiddleware!(socket, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    void mod;
  });

  it('logs slow API responses in the request timing middleware', async () => {
    const mod = await loadModule();
    const express = await import('express');
    const { recordLog } = await import('../../../src/server/observability');
    const app = (express.default as unknown as jest.Mock)();
    const req = { method: 'GET', path: '/vessels' };
    const candidates = app.use.mock.calls
      .map((call: [unknown]) => call[0])
      .filter((fn: unknown) => typeof fn === 'function');
    let middleware:
      | ((
          req: { method: string; path: string },
          res: unknown,
          next: () => void,
        ) => void)
      | null = null;
    for (const candidate of candidates) {
      let finishCb: (() => void) | null = null;
      const resProbe = {
        statusCode: 200,
        on: jest.fn((event: string, cb: () => void) => {
          if (event === 'finish') finishCb = cb;
        }),
      };
      const nextProbe = jest.fn();
      candidate(req, resProbe, nextProbe);
      if (finishCb) {
        middleware = candidate;
        break;
      }
    }
    expect(middleware).toBeTruthy();

    let finishCb: (() => void) | null = null;
    const res = {
      statusCode: 200,
      on: jest.fn((event: string, cb: () => void) => {
        if (event === 'finish') finishCb = cb;
      }),
    };
    const next = jest.fn();
    const originalHrtime = process.hrtime.bigint;
    (process.hrtime as unknown as { bigint: jest.Mock }).bigint = jest
      .fn()
      .mockReturnValueOnce(BigInt(0))
      .mockReturnValueOnce(BigInt(300_000_000));

    middleware!(req, res, next);
    const finish = finishCb as (() => void) | null;
    finish?.();

    expect(next).toHaveBeenCalled();
    expect(recordLog).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'api' }),
    );
    (process.hrtime as unknown as { bigint: typeof originalHrtime }).bigint =
      originalHrtime;
    void mod;
  });

  it('runs broadcast tick and updates metrics', async () => {
    const mod = await loadModule();
    const { updateEconomyForVessel } = await import(
      '../../../src/server/economy'
    );
    const { updateSpaceMetrics } = await import('../../../src/server/metrics');
    const { updateMissionAssignments } = await import(
      '../../../src/server/missions'
    );
    const { updateFailureState } = await import(
      '../../../src/server/failureModel'
    );
    const { recordLog } = await import('../../../src/server/observability');
    const now = Date.now();
    mod.__test__.setLastBroadcastAt(now - 1000);
    mod.__test__.setNextAutoWeatherAt(now - 1);
    mod.__test__.setWeatherMode('auto');
    mod.__test__.spaceMetaCache.set('space-1', {
      id: 'space-1',
      name: 'Space One',
      visibility: 'public',
      kind: 'free',
      rankRequired: 1,
      rulesetType: null,
      rules: { realism: { failures: true, damage: true } },
      createdBy: null,
    });
    const env = mod.__test__.globalState.environmentBySpace.get('space-1');
    if (env) {
      env.timeOfDay = 0;
    }

    (updateFailureState as jest.Mock).mockReturnValueOnce({
      state: {
        engineFailure: true,
        steeringFailure: true,
        floodingLevel: 0.4,
        engineFailureAt: null,
        steeringFailureAt: null,
      },
      triggered: {
        engineFailure: true,
        steeringFailure: true,
        flooding: true,
        engineRecovered: true,
        steeringRecovered: true,
      },
    });
    (updateMissionAssignments as jest.Mock).mockImplementation(
      async ({ emitUpdate, emitEconomyUpdate }) => {
        emitUpdate('user-1', { id: 'mission-1' });
        emitEconomyUpdate('user-1', {
          rank: 1,
          experience: 0,
          credits: 5,
          safetyScore: 1,
        });
      },
    );

    const vesselA = buildVessel('v-1');
    vesselA.mode = 'player';
    vesselA.desiredMode = 'player';
    vesselA.crewIds.clear();
    vesselA.lastCrewAt = now - 1000 * 60;
    const vesselB = buildVessel('v-2');
    vesselB.mode = 'player';
    vesselB.desiredMode = 'ai';
    vesselB.crewIds.clear();
    vesselB.lastCrewAt = now - 1000;
    const vesselC = buildVessel('v-3');
    vesselC.mode = 'ai';
    mod.__test__.globalState.vessels.set(vesselA.id, vesselA);
    mod.__test__.globalState.vessels.set(vesselB.id, vesselB);
    mod.__test__.globalState.vessels.set(vesselC.id, vesselC);

    await mod.__test__.broadcastTick();
    expect(updateEconomyForVessel).toHaveBeenCalled();
    expect(updateSpaceMetrics).toHaveBeenCalled();
    expect(recordLog).toHaveBeenCalled();
  });

  it('applies colregs penalties and collision handling', async () => {
    const mod = await loadModule();
    const { applyEconomyAdjustment } = await import(
      '../../../src/server/economy'
    );
    const { applyCollisionDamage } = await import(
      '../../../src/server/damageModel'
    );
    mod.__test__.spaceMetaCache.set('space-1', {
      id: 'space-1',
      name: 'Space One',
      visibility: 'public',
      kind: 'free',
      rankRequired: 1,
      rulesetType: null,
      rules: {
        colregs: true,
        maxSpeed: 2,
        collisionPenalty: 10,
        nearMissPenalty: 5,
        realism: { damage: true },
      },
      createdBy: null,
    });
    const vesselA = buildVessel('v-1');
    const vesselB = buildVessel('v-2');
    const vesselC = buildVessel('v-3');
    vesselA.mode = 'player';
    vesselB.mode = 'player';
    vesselC.mode = 'player';
    vesselA.velocity.surge = 3;
    vesselB.position = { ...vesselA.position };
    vesselC.position = {
      lat: vesselA.position.lat + 0.0008,
      lon: vesselA.position.lon + 0.0008,
      z: 0,
    };
    mod.__test__.globalState.vessels.set(vesselA.id, vesselA);
    mod.__test__.globalState.vessels.set(vesselB.id, vesselB);
    mod.__test__.globalState.vessels.set(vesselC.id, vesselC);

    await mod.__test__.applyColregsRules('space-1', Date.now());
    expect(applyEconomyAdjustment).toHaveBeenCalled();
    expect(applyCollisionDamage).toHaveBeenCalled();
  });

  it('runs connection handler wiring', async () => {
    const mod = await loadModule();
    expect(connectionHandler).toBeTruthy();
    const socket = createConnectionSocket();
    await connectionHandler!(socket);
    expect(socket.join).toHaveBeenCalled();
    void mod;
  });

  it('disconnects prior sockets and warns on insufficient rank', async () => {
    const mod = await loadModule();
    expect(connectionHandler).toBeTruthy();
    mod.__test__.spaceMetaCache.set('space-1', {
      id: 'space-1',
      name: 'Space One',
      visibility: 'public',
      kind: 'free',
      rankRequired: 10,
      rulesetType: null,
      rules: null,
      createdBy: null,
    });
    const oldSocket = { emit: jest.fn(), disconnect: jest.fn() };
    mockIo.sockets.sockets.set('s-old', oldSocket);

    const socketA = createConnectionSocket({
      id: 's-old',
      data: {
        userId: 'user-1',
        username: 'User One',
        roles: ['player'],
        spaceId: 'space-1',
      },
    });
    await connectionHandler!(socketA);

    const socketB = createConnectionSocket({
      id: 's-new',
      data: {
        userId: 'user-1',
        username: 'User One',
        roles: ['player'],
        spaceId: 'space-1',
      },
    });
    await connectionHandler!(socketB);
    expect(oldSocket.emit).toHaveBeenCalledWith(
      'error',
      expect.stringContaining('signed in elsewhere'),
    );
    expect(oldSocket.disconnect).toHaveBeenCalled();
    expect(socketB.emit).toHaveBeenCalledWith(
      'error',
      expect.stringContaining('Rank'),
    );
    void mod;
  });

  it('loads chat history and reports failed channels', async () => {
    const mod = await loadModule();
    expect(connectionHandler).toBeTruthy();
    const { prisma } = await import('../../../src/lib/prisma');
    (prisma.chatMessage.findMany as jest.Mock)
      .mockRejectedValueOnce(new Error('channel failed'))
      .mockResolvedValueOnce([
        {
          id: 'm-1',
          userId: 'user-2',
          username: 'User Two',
          message: 'Hello',
          createdAt: new Date(1000),
        },
      ]);
    const vessel = buildVessel('v-chat');
    mod.__test__.globalState.vessels.set(vessel.id, vessel);
    mod.__test__.globalState.userLastVessel.set('space-1:user-1', vessel.id);
    const socket = createConnectionSocket({
      id: 's-chat',
      data: {
        userId: 'user-1',
        username: 'User One',
        roles: ['player'],
        spaceId: 'space-1',
      },
    });
    await connectionHandler!(socket);
    await new Promise(resolve => setTimeout(resolve, 0));
    const simulationCalls = socket.emit.mock.calls.filter(
      (call: unknown[]) => call[0] === 'simulation:update',
    );
    const hasMessage = simulationCalls.some((call: unknown[]) => {
      const payload = call[1] as { chatHistory?: Array<{ id: string }> };
      return (payload?.chatHistory || []).some(msg => msg.id === 'm-1');
    });
    expect(hasMessage).toBe(true);
    void mod;
  });

  it('registers vessel join handler with a working createNewVesselForUser', async () => {
    const mod = await loadModule();
    const { registerVesselJoinHandler } = await import(
      '../../../src/server/socketHandlers/vesselJoin'
    );
    (registerVesselJoinHandler as jest.Mock).mockImplementationOnce(context => {
      const vessel = context.createNewVesselForUser(
        'user-9',
        'User Nine',
        { lat: 1, lon: 2 },
        'space-1',
      );
      context.globalState.vessels.set(vessel.id, vessel);
    });
    const socket = createConnectionSocket({
      id: 's-join',
      data: { userId: 'user-1', username: 'User One', roles: ['player'] },
    });
    await connectionHandler!(socket);
    const created = Array.from(mod.__test__.globalState.vessels.values()).find(
      v => v.ownerId === 'user-9',
    );
    expect(created).toBeTruthy();
    void mod;
  });

  it('handles user auth events', async () => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    const mod = await loadModule();
    expect(connectionHandler).toBeTruthy();
    const handlers: Record<string, SocketHandler> = {};
    const socket = createConnectionSocket({
      id: 's-auth',
      data: { userId: 'prev-user', username: 'Prev', roles: ['player'] },
      on: jest.fn((event: string, cb: SocketHandler) => {
        handlers[event] = cb;
      }),
    });
    await connectionHandler!(socket);

    await handlers['user:auth']({});
    expect((socket.data as TestSocketAuth['data']).mode).toBe('spectator');
    expect((socket.data as TestSocketAuth['data']).autoJoin).toBe(false);
    expect(socket.leave).toHaveBeenCalledWith('user:prev-user');
    expect(socket.emit).toHaveBeenCalledWith(
      'simulation:update',
      expect.objectContaining({ partial: true }),
    );

    const jwt = await import('jsonwebtoken');
    (jwt.verify as jest.Mock).mockImplementationOnce(() => ({
      sub: 'banned-user',
      name: 'Banned',
      role: 'player',
    }));
    const { prisma } = await import('../../../src/lib/prisma');
    (prisma.ban.findFirst as jest.Mock).mockResolvedValueOnce({
      reason: 'No access',
    });
    await handlers['user:auth']({ token: 'abc' });
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.stringContaining('Banned'),
    );
    expect(socket.disconnect).toHaveBeenCalled();

    (jwt.verify as jest.Mock).mockImplementationOnce(() => ({
      sub: 'new-user',
      name: 'New User',
      role: 'player',
    }));
    (prisma.ban.findFirst as jest.Mock).mockResolvedValueOnce(null);
    await handlers['user:auth']({ token: 'good' });
    expect(socket.join).toHaveBeenCalledWith('user:new-user');
    expect(socket.data.userId).toBe('new-user');
    void mod;
  });

  it('falls back to guest when user auth verification fails', async () => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    const mod = await loadModule();
    expect(connectionHandler).toBeTruthy();
    const handlers: Record<string, SocketHandler> = {};
    const socket = createConnectionSocket({
      id: 's-auth-fail',
      data: { userId: 'prev-user', username: 'Prev', roles: ['player'] },
      on: jest.fn((event: string, cb: SocketHandler) => {
        handlers[event] = cb;
      }),
    });
    await connectionHandler!(socket);
    const jwt = await import('jsonwebtoken');
    (jwt.verify as jest.Mock).mockImplementationOnce(() => {
      throw new Error('bad token');
    });
    await handlers['user:auth']({ token: 'bad' });
    expect(socket.data.roles).toContain('guest');
    expect((socket.data as TestSocketAuth['data']).mode).toBe('spectator');
    void mod;
  });

  it('invokes broadcast interval callback', async () => {
    const mod = await loadModule();
    const { updateSpaceMetrics } = await import('../../../src/server/metrics');
    mod.__test__.startRuntimeLoops();
    expect(intervalCallbacks.length).toBeGreaterThan(1);
    const broadcastCb = intervalCallbacks[intervalCallbacks.length - 1];
    await broadcastCb();
    expect(updateSpaceMetrics).toHaveBeenCalled();
    mod.__test__.stopRuntimeLoops();
    void mod;
  });

  it('syncUserSocketsEconomy updates socket data', async () => {
    const socketA = { data: {} as Partial<TestSocketData> };
    const socketB = { data: {} as Partial<TestSocketData> };
    const fetchSockets = jest.fn(async () => [socketA, socketB]);
    mockIo.in.mockReturnValue({ fetchSockets });

    const mod = await loadModule();
    await mod.syncUserSocketsEconomy('user-1', {
      rank: 2,
      experience: 10,
      credits: 50,
      safetyScore: 0.9,
    });

    expect(fetchSockets).toHaveBeenCalled();
    expect(socketA.data).toMatchObject({
      rank: 2,
      experience: 10,
      credits: 50,
      safetyScore: 0.9,
    });
    expect(socketB.data).toMatchObject({
      rank: 2,
      experience: 10,
      credits: 50,
      safetyScore: 0.9,
    });
  });

  it('persistVesselToDb throttles writes unless forced', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2020, 0, 1, 0, 0, 0, 0));
    const mod = await loadModule();
    const { prisma } = await import('../../../src/lib/prisma');
    const vessel = buildVessel();

    await mod.persistVesselToDb(vessel);
    expect(prisma.vessel.upsert).toHaveBeenCalledTimes(1);

    await mod.persistVesselToDb(vessel);
    expect(prisma.vessel.upsert).toHaveBeenCalledTimes(1);

    await mod.persistVesselToDb(vessel, { force: true });
    expect(prisma.vessel.upsert).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});
