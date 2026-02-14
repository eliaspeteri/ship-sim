import { registerAdminWeatherHandler } from '../../../../src/server/socketHandlers/adminWeather';
import {
  applyWeatherPattern,
  getWeatherByCoordinates,
  getWeatherPattern,
} from '../../../../src/server/weatherSystem';

jest.mock('../../../../src/server/weatherSystem', () => ({
  applyWeatherPattern: jest.fn(() => ({ id: 'env-1' })),
  getWeatherByCoordinates: jest.fn(() => ({ id: 'pattern-coords' })),
  getWeatherPattern: jest.fn(() => ({ id: 'pattern-auto' })),
}));

describe('registerAdminWeatherHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unauthorized weather updates', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User' },
    };

    registerAdminWeatherHandler({
      io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      socket,
      hasAdminRole: jest.fn(() => false),
      getSpaceIdForSocket: jest.fn(() => 'space-1'),
      isSpaceHost: jest.fn(async () => false),
      weather: {
        setMode: jest.fn(),
        setTarget: jest.fn(),
        setNextAuto: jest.fn(),
        getNextAuto: jest.fn(() => 0),
      },
      getEnvironmentForSpace: jest.fn(),
      currentUtcTimeOfDay: jest.fn(() => 12),
      weatherAutoIntervalMs: 1000,
      persistEnvironmentToDb: jest.fn(),
      globalState: { environmentBySpace: new Map() },
    } as unknown as Parameters<typeof registerAdminWeatherHandler>[0]);

    await handlers['admin:weather']({ mode: 'auto' });

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      'Not authorized to change weather',
    );
  });

  it('switches to auto mode and broadcasts update', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User' },
    };
    const weather = {
      setMode: jest.fn(),
      setTarget: jest.fn(),
      setNextAuto: jest.fn(),
      getNextAuto: jest.fn(() => Date.now()),
    };
    const persistEnvironmentToDb = jest.fn();

    registerAdminWeatherHandler({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      hasAdminRole: jest.fn(() => true),
      getSpaceIdForSocket: jest.fn(() => 'space-1'),
      isSpaceHost: jest.fn(async () => false),
      weather,
      getEnvironmentForSpace: jest.fn(),
      currentUtcTimeOfDay: jest.fn(() => 5),
      weatherAutoIntervalMs: 1000,
      persistEnvironmentToDb,
      globalState: { environmentBySpace: new Map() },
    } as unknown as Parameters<typeof registerAdminWeatherHandler>[0]);

    await handlers['admin:weather']({ mode: 'auto' });

    expect(weather.setMode).toHaveBeenCalledWith('auto');
    expect(weather.setTarget).toHaveBeenCalledWith(null);
    expect(getWeatherPattern).toHaveBeenCalled();
    expect(applyWeatherPattern).toHaveBeenCalledWith(
      'space-1',
      expect.objectContaining({ id: 'pattern-auto', timeOfDay: 5 }),
      expect.any(Object),
    );
    expect(weather.setNextAuto).toHaveBeenCalledWith(expect.any(Number));
    expect(emitSpy).toHaveBeenCalledWith('environment:update', {
      id: 'env-1',
    });
    expect(persistEnvironmentToDb).toHaveBeenCalledWith({
      force: true,
      spaceId: 'space-1',
    });
  });

  it('applies manual pattern updates', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User' },
    };
    const weather = {
      setMode: jest.fn(),
      setTarget: jest.fn(),
      setNextAuto: jest.fn(),
      getNextAuto: jest.fn(() => Date.now()),
    };

    registerAdminWeatherHandler({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      hasAdminRole: jest.fn(() => true),
      getSpaceIdForSocket: jest.fn(() => 'space-1'),
      isSpaceHost: jest.fn(async () => false),
      weather,
      getEnvironmentForSpace: jest.fn(),
      currentUtcTimeOfDay: jest.fn(() => 5),
      weatherAutoIntervalMs: 1000,
      persistEnvironmentToDb: jest.fn(),
      globalState: { environmentBySpace: new Map() },
    } as unknown as Parameters<typeof registerAdminWeatherHandler>[0]);

    await handlers['admin:weather']({ mode: 'manual', pattern: 'storm' });

    expect(weather.setMode).toHaveBeenCalledWith('manual');
    expect(getWeatherPattern).toHaveBeenCalledWith('storm');
    expect(weather.setTarget).toHaveBeenCalledWith({ id: 'pattern-auto' });
    expect(emitSpy).toHaveBeenCalledWith('environment:update', {
      id: 'env-1',
    });
  });

  it('applies coordinate-based manual updates', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const emitSpy = jest.fn();
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      data: { userId: 'user-1', username: 'User' },
    };
    const weather = {
      setMode: jest.fn(),
      setTarget: jest.fn(),
      setNextAuto: jest.fn(),
      getNextAuto: jest.fn(() => Date.now()),
    };

    registerAdminWeatherHandler({
      io: { to: jest.fn(() => ({ emit: emitSpy })) },
      socket,
      hasAdminRole: jest.fn(() => true),
      getSpaceIdForSocket: jest.fn(() => 'space-1'),
      isSpaceHost: jest.fn(async () => false),
      weather,
      getEnvironmentForSpace: jest.fn(),
      currentUtcTimeOfDay: jest.fn(() => 5),
      weatherAutoIntervalMs: 1000,
      persistEnvironmentToDb: jest.fn(),
      globalState: { environmentBySpace: new Map() },
    } as unknown as Parameters<typeof registerAdminWeatherHandler>[0]);

    await handlers['admin:weather']({
      mode: 'manual',
      coordinates: { lat: 1, lng: 2 },
    });

    expect(getWeatherByCoordinates).toHaveBeenCalledWith(1, 2);
    expect(weather.setTarget).toHaveBeenCalledWith({ id: 'pattern-coords' });
    expect(emitSpy).toHaveBeenCalledWith('environment:update', {
      id: 'env-1',
    });
  });
});
