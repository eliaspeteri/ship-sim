import type { VesselRecord } from '../../../../src/server/index';

export type TestSocketData = {
  userId?: string;
  roles?: string[];
  mode?: string;
  autoJoin?: boolean;
};

export const mockIo = {
  in: jest.fn(),
  to: jest.fn(),
  use: jest.fn(),
  on: jest.fn(),
  engine: { clientsCount: 0 },
  sockets: { adapter: { rooms: new Map() }, sockets: new Map() },
};

export const mockServer = {
  listen: jest.fn(),
};

jest.mock('express', () => {
  const app = { use: jest.fn(), get: jest.fn() };
  const express = jest.fn(() => app) as unknown as {
    (): typeof app;
    json: jest.Mock;
  };
  express.json = jest.fn(() => jest.fn());
  return express;
});

jest.mock('http', () => ({
  createServer: jest.fn(() => mockServer),
}));

jest.mock('socket.io', () => ({
  Server: jest.fn(() => mockIo),
}));

jest.mock('cors', () =>
  jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
);
jest.mock('cookie-parser', () =>
  jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
);

jest.mock('../../../../src/server/api', () => jest.fn());
jest.mock('../../../../src/server/weatherSystem', () => ({
  applyWeatherPattern: jest.fn(
    (_spaceId: string, pattern: { timeOfDay?: number; name?: string }) => ({
      wind: { speed: 5, direction: 0, gustFactor: 1.5, gusting: false },
      current: { speed: 0.5, direction: 0.2, variability: 0 },
      seaState: 2,
      waterDepth: 100,
      visibility: 10,
      timeOfDay: pattern.timeOfDay ?? 0,
      precipitation: 'none',
      precipitationIntensity: 0,
      tideHeight: 0,
      tideRange: 0,
      tidePhase: 0,
      tideTrend: 'rising',
      name: pattern.name || 'Auto weather',
    }),
  ),
  getWeatherPattern: jest.fn(() => ({ name: 'Mock Pattern', timeOfDay: 12 })),
  WeatherPattern: {},
}));
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(() => ({
    sub: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'player',
  })),
}));
jest.mock('../../../../src/server/bathymetry', () => ({
  getBathymetryDepth: jest.fn(() => 0),
  loadBathymetry: jest.fn(async () => undefined),
}));
jest.mock('../../../../src/server/seamarks', () => ({
  loadSeamarks: jest.fn(async () => undefined),
}));
jest.mock('../../../../src/server/missions', () => ({
  seedDefaultMissions: jest.fn(async () => undefined),
  updateMissionAssignments: jest.fn(async () => undefined),
}));
jest.mock('../../../../src/server/careers', () => ({
  seedCareerDefinitions: jest.fn(async () => undefined),
}));
jest.mock('../../../../src/server/logistics', () => ({
  ensureCargoAvailability: jest.fn(async () => undefined),
  ensurePassengerAvailability: jest.fn(async () => undefined),
  sweepExpiredCargo: jest.fn(async () => undefined),
  sweepExpiredPassengers: jest.fn(async () => undefined),
  updateCargoDeliveries: jest.fn(async () => undefined),
  updatePassengerDeliveries: jest.fn(async () => undefined),
}));
jest.mock('../../../../src/server/observability', () => ({
  recordLog: jest.fn(),
}));
jest.mock('../../../../src/server/metrics', () => ({
  recordMetric: jest.fn(),
  setConnectedClients: jest.fn(),
  updateSpaceMetrics: jest.fn(),
}));
jest.mock('../../../../src/server/economy', () => ({
  getEconomyProfile: jest.fn(async () => ({
    rank: 1,
    experience: 0,
    credits: 0,
    safetyScore: 1,
  })),
  applyEconomyAdjustment: jest.fn(async () => ({
    rank: 1,
    experience: 0,
    credits: 0,
    safetyScore: 1,
  })),
  updateEconomyForVessel: jest.fn(async () => undefined),
}));
jest.mock('../../../../src/lib/tides', () => ({
  computeTideState: jest.fn(() => ({
    height: 0,
    range: 0,
    phase: 0,
    trend: 'rising',
  })),
}));
jest.mock('../../../../src/server/failureModel', () => ({
  updateFailureState: jest.fn(() => ({
    state: {
      engineFailure: false,
      steeringFailure: false,
      floodingLevel: 0,
      engineFailureAt: null,
      steeringFailureAt: null,
    },
    triggered: {
      engineFailure: false,
      steeringFailure: false,
      flooding: false,
      engineRecovered: false,
      steeringRecovered: false,
    },
  })),
}));
jest.mock('../../../../src/server/damageModel', () => ({
  applyCollisionDamage: jest.fn(),
  applyFailureWear: jest.fn((state: unknown) => state),
  applyGroundingDamage: jest.fn((state: unknown) => state),
  mergeDamageState: jest.fn(state => state),
}));
jest.mock('../../../../src/lib/failureControls', () => ({
  applyFailureControlLimits: jest.fn(() => ({})),
}));
jest.mock('../../../../src/server/vesselCatalog', () => ({
  buildHydrodynamics: jest.fn(),
  warmVesselCatalog: jest.fn(async () => undefined),
  resolveVesselTemplate: jest.fn(() => ({
    id: 'template-1',
    properties: { mass: 1, length: 1, beam: 1, draft: 1 },
    hydrodynamics: {},
    physics: {},
    render: {},
  })),
}));
jest.mock('../../../../src/server/socketHandlers/vesselUpdate', () => ({
  registerVesselUpdateHandler: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/userMode', () => ({
  registerUserModeHandler: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/vesselControl', () => ({
  registerVesselControlHandler: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/vesselRepair', () => ({
  registerVesselRepairHandler: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/simulationState', () => ({
  registerSimulationStateHandler: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/simulationResync', () => ({
  registerSimulationResyncHandler: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/latencyPing', () => ({
  registerLatencyPingHandler: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/clientLog', () => ({
  registerClientLogHandler: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/vesselStorage', () => ({
  registerVesselStorageHandler: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/vesselSale', () => ({
  registerVesselSaleHandler: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/vesselJoin', () => ({
  registerVesselJoinHandler: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/vesselLease', () => ({
  registerVesselLeaseHandler: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/economy', () => ({
  registerEconomyHandlers: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/cargo', () => ({
  registerCargoHandlers: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/stations', () => ({
  registerStationHandlers: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/admin', () => ({
  registerAdminHandlers: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/chat', () => ({
  registerChatHandlers: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/adminWeather', () => ({
  registerAdminWeatherHandler: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/seamarks', () => ({
  registerSeamarksHandler: jest.fn(),
}));
jest.mock('../../../../src/server/socketHandlers/disconnect', () => ({
  registerDisconnectHandler: jest.fn(),
}));
jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    space: {
      upsert: jest.fn(async () => ({})),
      findMany: jest.fn(async () => []),
      findUnique: jest.fn(async () => null),
    },
    spaceAccess: {
      findUnique: jest.fn(async () => null),
    },
    vessel: {
      findMany: jest.fn(async () => []),
      upsert: jest.fn(async () => ({})),
    },
    weatherState: {
      findUnique: jest.fn(async () => null),
      upsert: jest.fn(async () => ({})),
    },
    environmentEvent: {
      findMany: jest.fn(async () => []),
      update: jest.fn(async () => ({})),
    },
    ban: {
      findFirst: jest.fn(async () => null),
    },
    mute: {
      findFirst: jest.fn(async () => null),
    },
    chatMessage: {
      findMany: jest.fn(async () => []),
    },
  },
}));

export const buildVessel = (id = 'v-1'): VesselRecord => ({
  id,
  spaceId: 'space-1',
  ownerId: 'owner-1',
  status: 'active',
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
  position: { lat: 10, lon: 20, z: 0 },
  orientation: { heading: 0, roll: 0, pitch: 0 },
  velocity: { surge: 1, sway: 0, heave: 0 },
  properties: { mass: 1, length: 1, beam: 1, draft: 1 },
  controls: { throttle: 0, rudderAngle: 0, ballast: 0.5, bowThruster: 0 },
  lastUpdate: 1,
});

export const loadServerIndexModule = async () => {
  jest.resetModules();
  return import('../../../../src/server/index');
};

export const createConnectionSocket = (overrides?: Record<string, unknown>) => {
  const socket = {
    id: 's-1',
    data: { userId: 'user-1', username: 'Test User', roles: ['player'] },
    handshake: { auth: { spaceId: 'space-1' } },
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({ emit: jest.fn() })),
    on: jest.fn(),
    disconnect: jest.fn(),
    rooms: new Set<string>(),
  };

  return {
    ...socket,
    ...overrides,
    data: {
      ...socket.data,
      ...((overrides?.data as Record<string, unknown>) ?? {}),
    },
    handshake: {
      ...socket.handshake,
      ...((overrides?.handshake as Record<string, unknown>) ?? {}),
    },
  };
};
