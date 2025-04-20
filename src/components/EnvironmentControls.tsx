import React, { useState } from 'react';
import useStore from '../store';
import { WeatherVisualizer } from './WeatherVisualizer';

interface EnvironmentControlsProps {
  className?: string;
}

const EnvironmentControls: React.FC<EnvironmentControlsProps> = ({
  className = '',
}) => {
  // Get environment state from store
  const environment = useStore(state => state.environment);
  const updateEnvironment = useStore(state => state.updateEnvironment);
  const setDayNightCycle = useStore(state => state.setDayNightCycle);

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
  const [visibility, setVisibility] = useState(environment.visibility);
  const [timeOfDay, setTimeOfDay] = useState(environment.timeOfDay);
  const [precipitation, setPrecipitation] = useState<
    'none' | 'rain' | 'snow' | 'fog'
  >(environment.precipitation);
  const [precipitationIntensity, setPrecipitationIntensity] = useState(
    environment.precipitationIntensity,
  );
  const [autoDayNight, setAutoDayNight] = useState(false);

  // Handle applying changes to the environment
  const handleApplyChanges = () => {
    updateEnvironment({
      wind: {
        speed: windSpeed,
        direction: windDirection,
        gusting: windGusting,
        gustFactor: environment.wind.gustFactor,
      },
      current: {
        speed: currentSpeed,
        direction: currentDirection,
        variability: environment.current.variability,
      },
      seaState: seaState,
      visibility: visibility,
      timeOfDay: timeOfDay,
      precipitation: precipitation,
      precipitationIntensity: precipitationIntensity,
      // Keep existing values for other properties
      waterDepth: environment.waterDepth,
      waveHeight: calculateWaveHeight(seaState),
      waveDirection: windDirection, // Assume waves generally follow wind direction
      waveLength: environment.waveLength,
    });

    // Update day/night cycle if checkbox is checked
    setDayNightCycle(autoDayNight);
  };

  // Calculate approximate wave height from sea state
  const calculateWaveHeight = (state: number): number => {
    // Douglas Sea Scale approximate wave heights
    const heights = [0, 0.1, 0.2, 0.6, 1.5, 2.5, 4, 6, 9, 14, 14, 14, 14];
    return heights[Math.min(state, heights.length - 1)];
  };

  // Convert radians to degrees for display
  const radToDeg = (rad: number) => Math.round((rad * 180) / Math.PI);

  // Convert degrees to radians for input
  const degToRad = (deg: number) => (deg * Math.PI) / 180;

  // Preview of current settings
  const previewEnvironment = {
    wind: {
      speed: windSpeed,
      direction: windDirection,
      gusting: windGusting,
      gustFactor: environment.wind.gustFactor,
    },
    current: {
      speed: currentSpeed,
      direction: currentDirection,
      variability: environment.current.variability,
    },
    seaState: seaState,
    visibility: visibility,
    timeOfDay: timeOfDay,
    precipitation: precipitation,
    precipitationIntensity: precipitationIntensity,
  };

  return (
    <div
      className={`${className} rounded-lg bg-gray-800 bg-opacity-70 p-4 text-white`}
    >
      <h2 className="mb-3 text-xl font-bold">Environment Controls</h2>

      {/* Environment visualizer */}
      <WeatherVisualizer weatherState={previewEnvironment} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Wind Controls */}
        <div className="space-y-2 bg-gray-900 bg-opacity-50 p-3 rounded-lg">
          <h3 className="font-semibold border-b border-gray-700 pb-1">Wind</h3>

          <div className="flex items-center">
            <label className="w-24">Speed (m/s):</label>
            <input
              type="range"
              min="0"
              max="30"
              step="0.5"
              value={windSpeed}
              onChange={e => setWindSpeed(parseFloat(e.target.value))}
              className="mx-2 w-32"
            />
            <span className="w-12">{windSpeed.toFixed(1)}</span>
          </div>

          <div className="flex items-center">
            <label className="w-24">Direction (°):</label>
            <input
              type="range"
              min="0"
              max="359"
              step="1"
              value={radToDeg(windDirection)}
              onChange={e =>
                setWindDirection(degToRad(parseInt(e.target.value)))
              }
              className="mx-2 w-32"
            />
            <span className="w-12">{radToDeg(windDirection)}°</span>
          </div>

          <div className="flex items-center">
            <label className="w-24">Gusting:</label>
            <input
              type="checkbox"
              checked={windGusting}
              onChange={e => setWindGusting(e.target.checked)}
              className="mx-2"
            />
            <span className="w-32">
              {windGusting ? 'Variable winds' : 'Steady wind'}
            </span>
          </div>
        </div>

        {/* Current Controls */}
        <div className="space-y-2 bg-gray-900 bg-opacity-50 p-3 rounded-lg">
          <h3 className="font-semibold border-b border-gray-700 pb-1">
            Current
          </h3>

          <div className="flex items-center">
            <label className="w-24">Speed (m/s):</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={currentSpeed}
              onChange={e => setCurrentSpeed(parseFloat(e.target.value))}
              className="mx-2 w-32"
            />
            <span className="w-12">{currentSpeed.toFixed(1)}</span>
          </div>

          <div className="flex items-center">
            <label className="w-24">Direction (°):</label>
            <input
              type="range"
              min="0"
              max="359"
              step="1"
              value={radToDeg(currentDirection)}
              onChange={e =>
                setCurrentDirection(degToRad(parseInt(e.target.value)))
              }
              className="mx-2 w-32"
            />
            <span className="w-12">{radToDeg(currentDirection)}°</span>
          </div>
        </div>
      </div>

      {/* Sea State Control */}
      <div className="mt-4 bg-gray-900 bg-opacity-50 p-3 rounded-lg">
        <h3 className="font-semibold border-b border-gray-700 pb-1">
          Sea Conditions
        </h3>

        <div className="flex items-center mt-2">
          <label className="w-24">Sea State:</label>
          <input
            type="range"
            min="0"
            max="9"
            step="1"
            value={seaState}
            onChange={e => setSeaState(parseInt(e.target.value))}
            className="mx-2 w-32"
          />
          <span className="w-48">
            {seaState} - {getSeaStateDescription(seaState)}
          </span>
        </div>

        <div className="flex items-center mt-2">
          <label className="w-24">Wave Height:</label>
          <span className="w-32">
            {calculateWaveHeight(seaState).toFixed(1)} m
          </span>
        </div>
      </div>

      {/* Visibility and Time Controls */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 bg-opacity-50 p-3 rounded-lg">
          <h3 className="font-semibold border-b border-gray-700 pb-1">
            Visibility & Time
          </h3>

          <div className="flex items-center mt-2">
            <label className="w-24">Visibility:</label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={visibility}
              onChange={e => setVisibility(parseFloat(e.target.value))}
              className="mx-2 w-32"
            />
            <span className="w-20">{visibility.toFixed(1)} nm</span>
          </div>

          <div className="flex items-center mt-2">
            <label className="w-24">Time:</label>
            <input
              type="range"
              min="0"
              max="24"
              step="0.5"
              value={timeOfDay}
              onChange={e => setTimeOfDay(parseFloat(e.target.value))}
              className="mx-2 w-32"
            />
            <span className="w-20">
              {Math.floor(timeOfDay)}:
              {Math.floor((timeOfDay % 1) * 60)
                .toString()
                .padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center mt-2">
            <label className="w-24">Auto Cycle:</label>
            <input
              type="checkbox"
              checked={autoDayNight}
              onChange={e => setAutoDayNight(e.target.checked)}
              className="mx-2"
            />
            <span className="w-32">Day/Night Cycle</span>
          </div>
        </div>

        <div className="bg-gray-900 bg-opacity-50 p-3 rounded-lg">
          <h3 className="font-semibold border-b border-gray-700 pb-1">
            Precipitation
          </h3>

          <div className="flex items-center mt-2">
            <label className="w-24">Type:</label>
            <select
              value={precipitation}
              onChange={e => setPrecipitation(e.target.value as any)}
              className="mx-2 w-32 bg-gray-700 rounded p-1"
            >
              <option value="none">None</option>
              <option value="rain">Rain</option>
              <option value="snow">Snow</option>
              <option value="fog">Fog</option>
            </select>
          </div>

          {precipitation !== 'none' && (
            <div className="flex items-center mt-2">
              <label className="w-24">Intensity:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={precipitationIntensity}
                onChange={e =>
                  setPrecipitationIntensity(parseFloat(e.target.value))
                }
                className="mx-2 w-32"
              />
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

      {/* Presets */}
      <div className="mt-4 bg-gray-900 bg-opacity-50 p-3 rounded-lg">
        <h3 className="font-semibold border-b border-gray-700 pb-1">
          Weather Presets
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          <button
            className="bg-blue-600 hover:bg-blue-700 py-1 px-2 rounded"
            onClick={() => {
              setWindSpeed(2);
              setSeaState(1);
              setPrecipitation('none');
              setPrecipitationIntensity(0);
              setVisibility(10);
              setTimeOfDay(12);
            }}
          >
            Calm
          </button>

          <button
            className="bg-teal-600 hover:bg-teal-700 py-1 px-2 rounded"
            onClick={() => {
              setWindSpeed(8);
              setSeaState(3);
              setPrecipitation('none');
              setPrecipitationIntensity(0);
              setVisibility(8);
              setTimeOfDay(14);
            }}
          >
            Moderate
          </button>

          <button
            className="bg-yellow-600 hover:bg-yellow-700 py-1 px-2 rounded"
            onClick={() => {
              setWindSpeed(15);
              setSeaState(5);
              setPrecipitation('rain');
              setPrecipitationIntensity(0.5);
              setVisibility(3);
              setTimeOfDay(16);
            }}
          >
            Stormy
          </button>

          <button
            className="bg-red-600 hover:bg-red-700 py-1 px-2 rounded"
            onClick={() => {
              setWindSpeed(25);
              setSeaState(8);
              setPrecipitation('rain');
              setPrecipitationIntensity(0.9);
              setVisibility(1);
              setTimeOfDay(17);
            }}
          >
            Hurricane
          </button>

          <button
            className="bg-blue-800 hover:bg-blue-900 py-1 px-2 rounded"
            onClick={() => {
              setWindSpeed(5);
              setSeaState(2);
              setPrecipitation('none');
              setPrecipitationIntensity(0);
              setVisibility(10);
              setTimeOfDay(21);
            }}
          >
            Night
          </button>

          <button
            className="bg-gray-500 hover:bg-gray-600 py-1 px-2 rounded"
            onClick={() => {
              setWindSpeed(3);
              setSeaState(1);
              setPrecipitation('fog');
              setPrecipitationIntensity(0.8);
              setVisibility(0.5);
              setTimeOfDay(10);
            }}
          >
            Foggy
          </button>

          <button
            className="bg-blue-200 hover:bg-blue-300 text-gray-900 py-1 px-2 rounded"
            onClick={() => {
              setWindSpeed(10);
              setSeaState(4);
              setPrecipitation('snow');
              setPrecipitationIntensity(0.7);
              setVisibility(2);
              setTimeOfDay(14);
            }}
          >
            Winter
          </button>
        </div>
      </div>

      {/* Apply Changes Button */}
      <div className="mt-4 text-right">
        <button
          onClick={handleApplyChanges}
          className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 transition-colors"
        >
          Apply Changes
        </button>
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

export default EnvironmentControls;
