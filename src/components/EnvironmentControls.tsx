import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { WeatherVisualizer } from './WeatherVisualizer';
import socketManager from '../networking/socket';

interface EnvironmentControlsProps {
  className?: string;
}

const EnvironmentControls: React.FC<EnvironmentControlsProps> = ({
  className = '',
}) => {
  // Get environment state from store
  const environment = useStore(state => state.environment);

  // Check if current user is an admin
  const isAdmin = socketManager.isAdminUser();
  const isConnected = socketManager.isConnected();

  // Local state for the form
  const [windSpeed, setWindSpeed] = useState(environment.wind.speed);
  const [windDirection, setWindDirection] = useState(
    environment.wind.direction,
  );
  const [windGusting, setWindGusting] = useState(environment.wind.gusting);
  const [currentSpeed, setCurrentSpeed] = useState(environment.current.speed);
  const [currentDirection, setCurrentDirection] = useState(
    environment.current.direction,
  );
  const [seaState, setSeaState] = useState(environment.seaState);
  const [visibility, setVisibility] = useState(environment.visibility || 10);
  const [timeOfDay, setTimeOfDay] = useState(environment.timeOfDay || 12);
  const [precipitation, setPrecipitation] = useState<
    'none' | 'rain' | 'snow' | 'fog'
  >(environment.precipitation || 'none');
  const [precipitationIntensity, setPrecipitationIntensity] = useState(
    environment.precipitationIntensity || 0,
  );
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [randomWeather, setRandomWeather] = useState(true);

  // Update local state when environment changes (from server)
  useEffect(() => {
    setWindSpeed(environment.wind.speed);
    setWindDirection(environment.wind.direction);
    setWindGusting(environment.wind.gusting || false);
    setCurrentSpeed(environment.current.speed);
    setCurrentDirection(environment.current.direction);
    setSeaState(environment.seaState);
    setVisibility(environment.visibility || 10);
    setTimeOfDay(environment.timeOfDay || 12);
    setPrecipitation(environment.precipitation || 'none');
    setPrecipitationIntensity(environment.precipitationIntensity || 0);
  }, [environment]);

  // Handle applying changes to the environment (admin only)
  const handleApplyChanges = () => {
    if (!isAdmin) {
      return;
    }

    // Send weather control command to server
    socketManager.sendWeatherControl(selectedPreset);

    // Clear selected preset
    setSelectedPreset('');
  };

  // Enable or disable random weather changes
  const toggleRandomWeather = () => {
    setRandomWeather(!randomWeather);

    if (!randomWeather) {
      socketManager.enableRandomWeather();
    }
  };

  // Convert radians to degrees for display
  const radToDeg = (rad: number) => Math.round((rad * 180) / Math.PI);

  return (
    <div
      className={`${className} rounded-lg bg-gray-800 bg-opacity-70 p-4 text-white`}
    >
      <h2 className="mb-3 text-xl font-bold">Environment Status</h2>

      {/* Environment visualizer */}
      <WeatherVisualizer />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Wind Information */}
        <div className="space-y-2 bg-gray-900 bg-opacity-50 p-3 rounded-lg">
          <h3 className="font-semibold border-b border-gray-700 pb-1">Wind</h3>

          <div className="flex items-center">
            <label className="w-24">Speed:</label>
            <span className="w-32">{windSpeed.toFixed(1)} m/s</span>
          </div>

          <div className="flex items-center">
            <label className="w-24">Direction:</label>
            <span className="w-32">{radToDeg(windDirection)}°</span>
          </div>

          <div className="flex items-center">
            <label className="w-24">Gusting:</label>
            <span className="w-32">
              {windGusting ? 'Variable winds' : 'Steady wind'}
            </span>
          </div>
        </div>

        {/* Current Information */}
        <div className="space-y-2 bg-gray-900 bg-opacity-50 p-3 rounded-lg">
          <h3 className="font-semibold border-b border-gray-700 pb-1">
            Current
          </h3>

          <div className="flex items-center">
            <label className="w-24">Speed:</label>
            <span className="w-32">{currentSpeed.toFixed(1)} m/s</span>
          </div>

          <div className="flex items-center">
            <label className="w-24">Direction:</label>
            <span className="w-32">{radToDeg(currentDirection)}°</span>
          </div>
        </div>
      </div>

      {/* Sea State Information */}
      <div className="mt-4 bg-gray-900 bg-opacity-50 p-3 rounded-lg">
        <h3 className="font-semibold border-b border-gray-700 pb-1">
          Sea Conditions
        </h3>

        <div className="flex items-center mt-2">
          <label className="w-24">Sea State:</label>
          <span className="w-48">
            {seaState} - {getSeaStateDescription(seaState)}
          </span>
        </div>

        <div className="flex items-center mt-2">
          <label className="w-24">Wave Height:</label>
          <span className="w-32">
            {(environment.waveHeight || calculateWaveHeight(seaState)).toFixed(
              1,
            )}{' '}
            m
          </span>
        </div>
      </div>

      {/* Visibility and Time Information */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 bg-opacity-50 p-3 rounded-lg">
          <h3 className="font-semibold border-b border-gray-700 pb-1">
            Visibility & Time
          </h3>

          <div className="flex items-center mt-2">
            <label className="w-24">Visibility:</label>
            <span className="w-20">{visibility?.toFixed(1)} nm</span>
          </div>

          <div className="flex items-center mt-2">
            <label className="w-24">Time:</label>
            <span className="w-20">
              {Math.floor(timeOfDay || 12)}:
              {Math.floor(((timeOfDay || 12) % 1) * 60)
                .toString()
                .padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="bg-gray-900 bg-opacity-50 p-3 rounded-lg">
          <h3 className="font-semibold border-b border-gray-700 pb-1">
            Precipitation
          </h3>

          <div className="flex items-center mt-2">
            <label className="w-24">Type:</label>
            <span className="w-32">
              {precipitation.charAt(0).toUpperCase() + precipitation.slice(1)}
            </span>
          </div>

          {precipitation !== 'none' && (
            <div className="flex items-center mt-2">
              <label className="w-24">Intensity:</label>
              <span className="w-20">
                {precipitationIntensity < 0.3
                  ? 'Light'
                  : precipitationIntensity < 0.7
                    ? 'Moderate'
                    : 'Heavy'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Admin Controls - only visible to admin users */}
      {isAdmin && isConnected && (
        <div className="mt-4 bg-gray-700 bg-opacity-50 p-3 rounded-lg border border-blue-500">
          <h3 className="font-semibold border-b border-gray-500 pb-1 text-blue-300">
            Admin Weather Controls
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            <button
              className={`py-1 px-2 rounded ${selectedPreset === 'calm' ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'}`}
              onClick={() => setSelectedPreset('calm')}
            >
              Calm
            </button>

            <button
              className={`py-1 px-2 rounded ${selectedPreset === 'moderate' ? 'bg-teal-800' : 'bg-teal-600 hover:bg-teal-700'}`}
              onClick={() => setSelectedPreset('moderate')}
            >
              Moderate
            </button>

            <button
              className={`py-1 px-2 rounded ${selectedPreset === 'stormy' ? 'bg-yellow-800' : 'bg-yellow-600 hover:bg-yellow-700'}`}
              onClick={() => setSelectedPreset('stormy')}
            >
              Stormy
            </button>

            <button
              className={`py-1 px-2 rounded ${selectedPreset === 'hurricane' ? 'bg-red-800' : 'bg-red-600 hover:bg-red-700'}`}
              onClick={() => setSelectedPreset('hurricane')}
            >
              Hurricane
            </button>

            <button
              className={`py-1 px-2 rounded ${selectedPreset === 'night' ? 'bg-blue-900' : 'bg-blue-800 hover:bg-blue-900'}`}
              onClick={() => setSelectedPreset('night')}
            >
              Night
            </button>

            <button
              className={`py-1 px-2 rounded ${selectedPreset === 'foggy' ? 'bg-gray-600' : 'bg-gray-500 hover:bg-gray-600'}`}
              onClick={() => setSelectedPreset('foggy')}
            >
              Foggy
            </button>

            <button
              className={`py-1 px-2 rounded ${selectedPreset === 'winter' ? 'bg-blue-300 text-gray-800' : 'bg-blue-200 hover:bg-blue-300 text-gray-900'}`}
              onClick={() => setSelectedPreset('winter')}
            >
              Winter
            </button>
          </div>

          <div className="flex items-center mt-4">
            <label className="w-40">Random Weather:</label>
            <input
              type="checkbox"
              checked={randomWeather}
              onChange={toggleRandomWeather}
              className="mx-2"
            />
            <span className="w-40">
              {randomWeather ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="mt-4 text-right">
            <button
              onClick={handleApplyChanges}
              disabled={!selectedPreset && randomWeather}
              className={`rounded px-4 py-2 font-bold text-white transition-colors ${
                !selectedPreset && randomWeather
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {randomWeather
                ? 'Enable Random Weather'
                : 'Apply Selected Weather'}
            </button>
          </div>
        </div>
      )}

      {/* Server connection status */}
      <div className="mt-4 text-center text-xs text-gray-400">
        {isConnected ? (
          <span className="flex items-center justify-center">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Connected to weather server
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            Disconnected from weather server
          </span>
        )}
        {isAdmin && <span className="ml-2">(Admin Mode)</span>}
      </div>

      <style>{`
        @keyframes wave {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 100px 0;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to get sea state description based on Douglas Sea Scale
function getSeaStateDescription(state: number): string {
  const descriptions = [
    'Calm (Glassy)',
    'Calm (Rippled)',
    'Smooth',
    'Slight',
    'Moderate',
    'Rough',
    'Very Rough',
    'High',
    'Very High',
    'Phenomenal',
  ];

  return descriptions[Math.min(state, descriptions.length - 1)];
}

// Calculate approximate wave height from sea state
function calculateWaveHeight(state: number): number {
  // Douglas Sea Scale approximate wave heights
  const heights = [0, 0.1, 0.2, 0.6, 1.5, 2.5, 4, 6, 9, 14, 14, 14, 14];
  return heights[Math.min(state, heights.length - 1)];
}

export default EnvironmentControls;
