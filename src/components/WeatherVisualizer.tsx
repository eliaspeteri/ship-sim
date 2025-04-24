import React, { useEffect, useState } from 'react';
import useStore from '../store';
import Precipitation from './Precipitation';

interface WeatherVisualizerProps {
  onWeatherChange: (weatherData: WeatherData) => void;
}

interface WeatherData {
  wind: WindData;
  current: CurrentData;
  seaState: number;
  precipitation?: 'none' | 'rain' | 'snow' | 'fog';
  precipitationIntensity?: number;
}

interface WindData {
  speed: number;
  direction: number;
}

interface CurrentData {
  speed: number;
  direction: number;
}

const WeatherVisualizer: React.FC<WeatherVisualizerProps> = ({
  onWeatherChange,
}) => {
  const [weather, setWeather] = useState<WeatherData>({
    wind: { speed: 5, direction: 0 },
    current: { speed: 0.5, direction: Math.PI / 4 },
    seaState: 3,
  });

  // Listen for weather updates from the store
  useEffect(() => {
    // Initial setup to get current environment state from the store
    const environment = useStore.getState().environment;
    if (environment) {
      setWeather(environment);
      if (onWeatherChange) {
        onWeatherChange(environment);
      }
    }

    // Subscribe to store updates
    const unsubscribe = useStore.subscribe(state => {
      const newEnvironment = state.environment;
      if (newEnvironment) {
        setWeather(newEnvironment);
        if (onWeatherChange) {
          onWeatherChange(newEnvironment);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onWeatherChange]);

  // Weather visualization logic would go here
  // For now, just show values and precipitation if sea state is high

  let precipitationType: 'rain' | 'fog' | null = null;
  let precipitationIntensity = 0.5;

  // Use the precipitation data from the server if available
  if (weather.precipitation && weather.precipitation !== 'none') {
    precipitationType =
      weather.precipitation === 'snow' ? 'rain' : weather.precipitation;
    precipitationIntensity = weather.precipitationIntensity || 0.5;
  } else if (weather.seaState >= 6) {
    precipitationType = 'rain';
    precipitationIntensity = Math.min((weather.seaState - 5) / 4, 1);
  } else if (weather.seaState >= 4) {
    precipitationType = 'fog';
    precipitationIntensity = Math.min((weather.seaState - 3) / 4, 0.8);
  }

  return (
    <div className="weather-visualizer">
      <div className="weather-data">
        <div className="wind-info">
          <h4>Wind</h4>
          <p>Speed: {weather.wind.speed.toFixed(1)} m/s</p>
          <p>
            Direction: {(weather.wind.direction * (180 / Math.PI)).toFixed(0)}°
          </p>
        </div>
        <div className="current-info">
          <h4>Current</h4>
          <p>Speed: {weather.current.speed.toFixed(1)} m/s</p>
          <p>
            Direction:{' '}
            {(weather.current.direction * (180 / Math.PI)).toFixed(0)}°
          </p>
        </div>
        <div className="sea-state">
          <h4>Sea State</h4>
          <p>
            {weather.seaState} ({getSeaStateDescription(weather.seaState)})
          </p>
        </div>
      </div>

      {precipitationType && (
        <Precipitation
          type={precipitationType}
          intensity={precipitationIntensity}
        />
      )}
    </div>
  );
};

function getSeaStateDescription(seaState: number): string {
  const descriptions = [
    'Calm (glassy)',
    'Calm (rippled)',
    'Smooth',
    'Slight',
    'Moderate',
    'Rough',
    'Very rough',
    'High',
    'Very high',
    'Phenomenal',
  ];

  return descriptions[Math.min(seaState, descriptions.length - 1)];
}

export default WeatherVisualizer;
