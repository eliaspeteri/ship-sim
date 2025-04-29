import React, { useEffect, useState } from 'react';
import useStore from '../store';
import { WasmBridge } from '../lib/wasmBridge';
import { loadWasm } from '../lib/wasmLoader';
import { EnvironmentState } from '../types/environment.types';

interface WeatherVisualizerProps {
  className?: string;
}

/**
 * Component for visualizing weather conditions
 */
export function WeatherVisualizer({ className = '' }: WeatherVisualizerProps) {
  // Use local state for wasmBridge
  const [wasmBridge, setWasmBridge] = useState<WasmBridge | null>(null);
  const environment = useStore(state => state.environment);

  // Load wasmBridge once on component mount
  useEffect(() => {
    let mounted = true;
    const initWasmBridge = async () => {
      try {
        const bridge = await loadWasm();
        if (mounted) {
          setWasmBridge(bridge);
        }
      } catch (error) {
        console.error(
          'Failed to load WASM bridge in WeatherVisualizer:',
          error,
        );
      }
    };

    initWasmBridge();

    return () => {
      mounted = false;
    };
  }, []);

  // Default values for initial render
  const defaultWeather: EnvironmentState = {
    wind: {
      speed: 5,
      direction: 0,
      gustFactor: 1.5,
      gusting: false,
    },
    current: {
      speed: 0.5,
      direction: Math.PI / 4,
      variability: 0.1,
    },
    seaState: 3,
    timeOfDay: 0,
  };

  // Use environment state or fallback to default
  const weather = environment || defaultWeather;

  // Calculate the Beaufort scale sea state based on wind speed
  const calculatedSeaState = wasmBridge
    ? wasmBridge.calculateSeaState(weather.wind.speed)
    : Math.min(Math.floor(weather.wind.speed / 3), 12);

  // Format values with appropriate units and directions
  const windSpeedKmh = (weather.wind.speed * 3.6).toFixed(1);
  const windDirectionDeg = ((weather.wind.direction * 180) / Math.PI).toFixed(
    0,
  );
  const windDirectionCardinal = degreesToCardinal(parseFloat(windDirectionDeg));

  const currentSpeedKnots = (weather.current.speed * 1.94384).toFixed(1);
  const currentDirectionDeg = (
    (weather.current.direction * 180) /
    Math.PI
  ).toFixed(0);
  const currentDirectionCardinal = degreesToCardinal(
    parseFloat(currentDirectionDeg),
  );

  // Determine if we show precipitation
  let precipitationType = '';
  let precipitationIntensity = 0;

  if (weather.wind.speed >= 20) {
    // Strong winds - show heavy rain
    precipitationType = 'rain';
    precipitationIntensity = Math.min((weather.wind.speed - 15) / 15, 1);
  } else if (weather.seaState >= 6) {
    // High sea state - show rain
    precipitationType = 'rain';
    precipitationIntensity = Math.min((weather.seaState - 5) / 4, 1);
  } else if (weather.seaState >= 4) {
    // Moderate sea state - show light rain
    precipitationType = 'drizzle';
    precipitationIntensity = Math.min((weather.seaState - 3) / 4, 0.8);
  }

  return (
    <div
      className={`weather-visualizer p-4 bg-gray-800 text-white rounded-lg shadow-lg ${className}`}
    >
      <h2 className="text-xl font-bold mb-3">Weather Conditions</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="weather-data">
          <h3 className="text-lg font-semibold mb-2">Wind</h3>
          <div className="mb-1">
            <span className="font-medium">Speed:</span> {windSpeedKmh} km/h
          </div>
          <div className="mb-1">
            <span className="font-medium">Direction:</span> {windDirectionDeg}°{' '}
            {windDirectionCardinal}
          </div>
          <div className="mb-1">
            <span className="font-medium">Gusting:</span>{' '}
            {weather.wind.gusting ? 'Yes' : 'No'}
          </div>
        </div>

        <div className="weather-data">
          <h3 className="text-lg font-semibold mb-2">Sea State</h3>
          <div className="mb-1">
            <span className="font-medium">Beaufort Scale:</span>{' '}
            {calculatedSeaState} ({getSeaStateDescription(calculatedSeaState)})
          </div>
          <div className="mb-1">
            <span className="font-medium">Based on Wind:</span> {windSpeedKmh}{' '}
            km/h → Beaufort {calculatedSeaState}
          </div>
          <div className="mb-1">
            <span className="font-medium">Wave Height:</span>{' '}
            {(
              environment.waveHeight || calculateWaveHeight(calculatedSeaState)
            ).toFixed(1)}{' '}
            m
          </div>
        </div>

        <div className="weather-data">
          <h3 className="text-lg font-semibold mb-2">Current</h3>
          <div className="mb-1">
            <span className="font-medium">Speed:</span> {currentSpeedKnots}{' '}
            knots
          </div>
          <div className="mb-1">
            <span className="font-medium">Direction:</span>{' '}
            {currentDirectionDeg}° {currentDirectionCardinal}
          </div>
        </div>

        {precipitationType && (
          <div className="weather-data">
            <h3 className="text-lg font-semibold mb-2">Precipitation</h3>
            <div className="mb-1">
              <span className="font-medium">Type:</span>{' '}
              {precipitationType.charAt(0).toUpperCase() +
                precipitationType.slice(1)}
            </div>
            <div className="mb-1">
              <span className="font-medium">Intensity:</span>{' '}
              {precipitationIntensity < 0.3
                ? 'Light'
                : precipitationIntensity < 0.7
                  ? 'Moderate'
                  : 'Heavy'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Convert degrees to cardinal direction
function degreesToCardinal(degrees: number): string {
  const cardinals = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return cardinals[index];
}

// Get description for sea state (Beaufort scale)
function getSeaStateDescription(seaState: number): string {
  const descriptions = [
    'Calm',
    'Light Air',
    'Light Breeze',
    'Gentle Breeze',
    'Moderate Breeze',
    'Fresh Breeze',
    'Strong Breeze',
    'Near Gale',
    'Gale',
    'Strong Gale',
    'Storm',
    'Violent Storm',
    'Hurricane',
  ];
  return descriptions[Math.min(seaState, descriptions.length - 1)];
}

// Calculate approximate wave height based on sea state
function calculateWaveHeight(seaState: number): number {
  const waveHeights = [
    0.0, 0.1, 0.2, 0.6, 1.0, 2.0, 3.0, 4.0, 5.5, 7.0, 9.0, 11.5, 14.0,
  ];
  return waveHeights[Math.min(Math.floor(seaState), waveHeights.length - 1)];
}
