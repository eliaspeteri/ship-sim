import React, { useState } from 'react';
import useStore from '../store';

interface EnvironmentControlsProps {
  className?: string;
}

const EnvironmentControls: React.FC<EnvironmentControlsProps> = ({
  className = '',
}) => {
  // Get environment state from store
  const environment = useStore(state => state.environment);
  const updateEnvironment = useStore(state => state.updateEnvironment);

  // Local state for the form
  const [windSpeed, setWindSpeed] = useState(environment.wind.speed);
  const [windDirection, setWindDirection] = useState(
    environment.wind.direction,
  );
  const [currentSpeed, setCurrentSpeed] = useState(environment.current.speed);
  const [currentDirection, setCurrentDirection] = useState(
    environment.current.direction,
  );
  const [seaState, setSeaState] = useState(environment.seaState);

  // Handle applying changes to the environment
  const handleApplyChanges = () => {
    updateEnvironment({
      wind: {
        speed: windSpeed,
        direction: windDirection,
      },
      current: {
        speed: currentSpeed,
        direction: currentDirection,
      },
      seaState: seaState,
    });
  };

  // Convert radians to degrees for display
  const radToDeg = (rad: number) => Math.round((rad * 180) / Math.PI);

  // Convert degrees to radians for input
  const degToRad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <div
      className={`${className} rounded-lg bg-gray-800 bg-opacity-70 p-4 text-white`}
    >
      <h2 className="mb-3 text-xl font-bold">Environment Controls</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Wind Controls */}
        <div className="space-y-2">
          <h3 className="font-semibold">Wind</h3>

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
        </div>

        {/* Current Controls */}
        <div className="space-y-2">
          <h3 className="font-semibold">Current</h3>

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
      <div className="mt-4">
        <h3 className="font-semibold">Sea Conditions</h3>

        <div className="flex items-center">
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
    </div>
  );
};

// Helper function to get sea state description based on Beaufort scale
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
