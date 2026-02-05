import {
  applyWeatherPattern,
  generateRandomWeather,
  getWeatherByCoordinates,
  getWeatherPattern,
  transitionWeather,
  weatherPresets,
} from '../../../src/server/weatherSystem';

jest.mock('../../../src/server', () => ({
  currentUtcTimeOfDay: jest.fn(() => 9),
  getEnvironmentForSpace: jest.fn(() => ({
    wind: { speed: 1, direction: 0, gusting: false, gustFactor: 1.2 },
    current: { speed: 0.1, direction: 0, variability: 0.1 },
    seaState: 1,
    timeOfDay: 6,
    tideHeight: 1,
    tideRange: 2,
    tidePhase: 0.3,
    tideTrend: 'rising',
  })),
}));

describe('weatherSystem', () => {
  it('applies a pattern and preserves tide fields', () => {
    const globalState = { environmentBySpace: new Map() } as any;
    const pattern = { ...weatherPresets.calm, timeOfDay: undefined };

    const next = applyWeatherPattern('space-1', pattern, globalState);

    expect(next.wind.speed).toBe(weatherPresets.calm.wind.speed);
    expect(next.seaState).toBe(weatherPresets.calm.seaState);
    expect(next.timeOfDay).toBe(6);
    expect(next.tideHeight).toBe(1);
    expect(globalState.environmentBySpace.get('space-1')).toEqual(next);
  });

  it('generates random weather with sensible bounds', () => {
    const originalRandom = Math.random;
    const values = [0.9, 0.2, 0.3, 0.4, 0.95, 0.7, 0.6, 0.8, 0.1, 0.2, 0.3];
    let index = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => {
      const value = values[index] ?? 0.5;
      index += 1;
      return value;
    });

    const weather = generateRandomWeather();

    expect(weather.wind.speed).toBeGreaterThanOrEqual(0);
    expect(weather.wind.speed).toBeLessThanOrEqual(25);
    expect(weather.seaState).toBeGreaterThanOrEqual(0);
    expect(weather.seaState).toBeLessThanOrEqual(9);
    expect(weather.visibility).toBeGreaterThanOrEqual(0.1);
    expect(weather.timeOfDay).toBeGreaterThanOrEqual(0);
    expect(weather.timeOfDay).toBeLessThanOrEqual(24);
    expect(['none', 'rain', 'snow', 'fog']).toContain(weather.precipitation);

    (Math.random as jest.Mock).mockRestore();
    Math.random = originalRandom;
  });

  it('returns presets when requested, otherwise random', () => {
    const preset = getWeatherPattern('stormy');
    expect(preset.name).toBe('Stormy');

    const random = getWeatherPattern('unknown');
    expect(random.name).toBe('Random Weather');
  });

  it('adjusts weather by latitude bands', () => {
    const polar = getWeatherByCoordinates(70, 0);
    expect(['snow', 'none']).toContain(polar.precipitation);

    const equator = getWeatherByCoordinates(10, 0);
    expect(['rain', 'none']).toContain(equator.precipitation);
    expect(equator.wind.speed).toBeLessThanOrEqual(
      weatherPresets.moderate.wind.speed,
    );
  });

  it('transitions between patterns with angle wrapping', () => {
    const current = {
      ...weatherPresets.calm,
      wind: { ...weatherPresets.calm.wind, direction: Math.PI * 1.9 },
      current: {
        ...weatherPresets.calm.current,
        direction: Math.PI * 1.9,
      },
    };
    const target = {
      ...weatherPresets.stormy,
      wind: { ...weatherPresets.stormy.wind, direction: 0.1 },
      current: { ...weatherPresets.stormy.current, direction: 0.1 },
    };

    const mid = transitionWeather(current, target, 0.5);
    expect(mid.name).toContain(target.name);
    expect(mid.seaState).toBeGreaterThanOrEqual(0);
    expect(mid.wind.direction).toBeGreaterThanOrEqual(0);
    expect(mid.wind.direction).toBeLessThanOrEqual(Math.PI * 2);

    const late = transitionWeather(current, target, 0.9);
    expect(late.precipitation).toBe(target.precipitation);
  });
});
