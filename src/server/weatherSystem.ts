/**
 * Weather System Module
 * Handles server-side weather generation and changes
 */

import { currentUtcTimeOfDay, getEnvironmentForSpace } from '.';

import type { EnvironmentState } from '../types/environment.types';
import type { GlobalState } from './socketHandlers/context';

// Weather pattern definitions
export interface WeatherPattern {
  name: string;
  wind: {
    speed: number;
    direction: number;
    gusting: boolean;
    gustFactor: number;
  };
  current: { speed: number; direction: number; variability: number };
  seaState: number;
  waterDepth: number;
  visibility: number;
  timeOfDay?: number;
  precipitation: 'none' | 'rain' | 'snow' | 'fog';
  precipitationIntensity: number;
}

export const applyWeatherPattern = (
  spaceId: string,
  pattern: WeatherPattern,
  globalState: GlobalState,
): EnvironmentState => {
  const env = getEnvironmentForSpace(spaceId);
  const next: EnvironmentState = {
    wind: {
      speed: pattern.wind.speed,
      direction: pattern.wind.direction,
      gusting: pattern.wind.gusting,
      gustFactor: pattern.wind.gustFactor,
    },
    current: {
      speed: pattern.current.speed,
      direction: pattern.current.direction,
      variability: pattern.current.variability,
    },
    seaState: Math.round(pattern.seaState),
    waterDepth: pattern.waterDepth,
    visibility: pattern.visibility,
    timeOfDay: pattern.timeOfDay ?? env.timeOfDay,
    precipitation: pattern.precipitation,
    precipitationIntensity: pattern.precipitationIntensity,
    tideHeight: env.tideHeight,
    tideRange: env.tideRange,
    tidePhase: env.tidePhase,
    tideTrend: env.tideTrend,
    name: pattern.name.length > 0 ? pattern.name : 'Weather',
  };
  globalState.environmentBySpace.set(spaceId, next);
  return next;
};
// Preset weather patterns
export const weatherPresets: Record<string, WeatherPattern> = {
  calm: {
    name: 'Calm',
    wind: { speed: 2, direction: 0, gusting: false, gustFactor: 1.2 },
    current: { speed: 0.2, direction: Math.PI / 4, variability: 0.1 },
    seaState: 1,
    waterDepth: 100,
    visibility: 10,
    timeOfDay: 12,
    precipitation: 'none',
    precipitationIntensity: 0,
  },
  moderate: {
    name: 'Moderate',
    wind: { speed: 8, direction: Math.PI / 6, gusting: true, gustFactor: 1.5 },
    current: { speed: 0.8, direction: Math.PI / 3, variability: 0.2 },
    seaState: 3,
    waterDepth: 100,
    visibility: 8,
    timeOfDay: 14,
    precipitation: 'none',
    precipitationIntensity: 0,
  },
  stormy: {
    name: 'Stormy',
    wind: { speed: 15, direction: Math.PI / 2, gusting: true, gustFactor: 2.0 },
    current: { speed: 1.5, direction: Math.PI / 2, variability: 0.4 },
    seaState: 6,
    waterDepth: 100,
    visibility: 3,
    timeOfDay: 16,
    precipitation: 'rain',
    precipitationIntensity: 0.6,
  },
  hurricane: {
    name: 'Hurricane',
    wind: {
      speed: 25,
      direction: Math.PI * 0.7,
      gusting: true,
      gustFactor: 2.5,
    },
    current: { speed: 2.5, direction: Math.PI * 0.7, variability: 0.6 },
    seaState: 8,
    waterDepth: 100,
    visibility: 1,
    timeOfDay: 15,
    precipitation: 'rain',
    precipitationIntensity: 0.9,
  },
  night: {
    name: 'Night',
    wind: { speed: 5, direction: 0, gusting: false, gustFactor: 1.3 },
    current: { speed: 0.5, direction: Math.PI / 6, variability: 0.1 },
    seaState: 2,
    waterDepth: 100,
    visibility: 6,
    timeOfDay: 23,
    precipitation: 'none',
    precipitationIntensity: 0,
  },
  foggy: {
    name: 'Foggy',
    wind: { speed: 3, direction: 0, gusting: false, gustFactor: 1.2 },
    current: { speed: 0.3, direction: 0, variability: 0.1 },
    seaState: 1,
    waterDepth: 100,
    visibility: 0.5,
    timeOfDay: 10,
    precipitation: 'fog',
    precipitationIntensity: 0.8,
  },
  winter: {
    name: 'Winter',
    wind: {
      speed: 10,
      direction: Math.PI * 1.5,
      gusting: true,
      gustFactor: 1.8,
    },
    current: { speed: 1.0, direction: Math.PI * 1.5, variability: 0.3 },
    seaState: 4,
    waterDepth: 100,
    visibility: 2,
    timeOfDay: 14,
    precipitation: 'snow',
    precipitationIntensity: 0.7,
  },
};

// Generate a random weather pattern
export function generateRandomWeather(): WeatherPattern {
  // Random coefficients between 0 and 1
  const windCoeff = Math.random();
  const seaCoeff = Math.random();
  const visCoeff = Math.random();
  const timeCoeff = Math.random();
  const precipType = Math.random();

  // Generate random wind data (0-25 m/s)
  const windSpeed = windCoeff * 25;
  const windDirection = Math.random() * Math.PI * 2;
  const gusting = windSpeed > 5 && Math.random() > 0.5;

  // Generate sea state based on wind (Beaufort scale relationship)
  const seaState = Math.min(9, Math.floor(seaCoeff * 10));

  // Random precipitation
  let precipitation: 'none' | 'rain' | 'snow' | 'fog' = 'none';
  if (precipType > 0.6) {
    if (precipType > 0.9) precipitation = 'fog';
    else if (precipType > 0.75) precipitation = 'snow';
    else precipitation = 'rain';
  }

  // Build the weather pattern
  const randomWeather: WeatherPattern = {
    name: 'Random Weather',
    wind: {
      speed: windSpeed,
      direction: windDirection,
      gusting,
      gustFactor: 1.2 + Math.random() * 0.8,
    },
    current: {
      speed: Math.random() * 2.5,
      direction: Math.random() * Math.PI * 2,
      variability: Math.random() * 0.5,
    },
    seaState,
    waterDepth: 100,
    visibility: Math.max(0.1, visCoeff * 10),
    timeOfDay: timeCoeff * 24,
    precipitation,
    precipitationIntensity: precipitation === 'none' ? 0 : Math.random(),
  };

  return randomWeather;
}

// Get weather based on Earth coordinates (placeholder for future implementation)
export function getWeatherByCoordinates(
  latitude: number,
  _longitude: number,
): WeatherPattern {
  // In a future implementation, this would fetch real-world weather data
  // For now, we just return a random weather pattern influenced by latitude

  // Adjust probabilities based on latitude (equator vs polar regions)
  const isEquatorial = Math.abs(latitude) < 30;
  const isPolar = Math.abs(latitude) > 60;

  if (isPolar) {
    // Colder regions - more likely to have snow and high winds
    const pattern = { ...generateRandomWeather() };
    pattern.precipitation = Math.random() > 0.5 ? 'snow' : 'none';
    const baseTime = pattern.timeOfDay ?? currentUtcTimeOfDay();
    pattern.timeOfDay = (baseTime + 3) % 24; // Adjust for polar day/night cycles
    return pattern;
  } else if (isEquatorial) {
    // Equatorial regions - warmer, more stable weather
    const pattern = { ...weatherPresets.moderate };
    pattern.wind.speed *= 0.8;
    pattern.precipitation = Math.random() > 0.7 ? 'rain' : 'none';
    return pattern;
  } else {
    // Temperate regions - variable weather
    return generateRandomWeather();
  }
}

// Select a specific weather preset or random
export function getWeatherPattern(pattern?: string): WeatherPattern {
  if (pattern !== undefined && pattern.length > 0) {
    return weatherPresets[pattern] ?? generateRandomWeather();
  }
  return generateRandomWeather();
}

// Gradually transition from one weather pattern to another over time
export function transitionWeather(
  current: WeatherPattern,
  target: WeatherPattern,
  progress: number,
): WeatherPattern {
  // Ensure progress is between 0 and 1
  progress = Math.max(0, Math.min(1, progress));

  // Linear interpolation function
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Interpolate angle (for wind/current direction)
  const lerpAngle = (a: number, b: number, t: number) => {
    const diff = Math.abs(b - a);
    if (diff > Math.PI) {
      // Take the shorter path around the circle
      if (a > b) {
        return lerp(a, b + Math.PI * 2, t) % (Math.PI * 2);
      } else {
        return lerp(a + Math.PI * 2, b, t) % (Math.PI * 2);
      }
    }
    return lerp(a, b, t);
  };
  const currentTimeOfDay = current.timeOfDay ?? currentUtcTimeOfDay();
  const targetTimeOfDay = target.timeOfDay ?? currentTimeOfDay;

  return {
    name: `Transitioning to ${target.name}`,
    wind: {
      speed: lerp(current.wind.speed, target.wind.speed, progress),
      direction: lerpAngle(
        current.wind.direction,
        target.wind.direction,
        progress,
      ),
      gusting: progress > 0.5 ? target.wind.gusting : current.wind.gusting,
      gustFactor: lerp(
        current.wind.gustFactor,
        target.wind.gustFactor,
        progress,
      ),
    },
    current: {
      speed: lerp(current.current.speed, target.current.speed, progress),
      direction: lerpAngle(
        current.current.direction,
        target.current.direction,
        progress,
      ),
      variability: lerp(
        current.current.variability,
        target.current.variability,
        progress,
      ),
    },
    seaState: Math.round(lerp(current.seaState, target.seaState, progress)),
    waterDepth: lerp(current.waterDepth, target.waterDepth, progress),
    visibility: lerp(current.visibility, target.visibility, progress),
    timeOfDay: lerp(currentTimeOfDay, targetTimeOfDay, progress) % 24,
    precipitation:
      progress > 0.7 ? target.precipitation : current.precipitation,
    precipitationIntensity: lerp(
      current.precipitationIntensity,
      target.precipitationIntensity,
      progress,
    ),
  };
}
