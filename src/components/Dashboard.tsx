import React from 'react';
import useStore from '../store';
import {
  applyVesselControls,
  startSimulation,
  stopSimulation,
} from '../simulation';

interface DashboardProps {
  className?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  // Get state from Zustand store
  const vessel = useStore(state => state.vessel);
  const environment = useStore(state => state.environment);
  const isRunning = useStore(state => state.simulation.isRunning);
  const elapsedTime = useStore(state => state.simulation.elapsedTime);

  // Calculate vessel speed from velocity components
  const vesselSpeed = Math.sqrt(
    vessel.velocity.surge * vessel.velocity.surge +
      vessel.velocity.sway * vessel.velocity.sway,
  );

  // Handle throttle changes
  const handleThrottleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newThrottle = parseFloat(e.target.value);
    applyVesselControls(newThrottle, vessel.controls.rudderAngle);
  };

  // Handle rudder changes
  const handleRudderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRudder = parseFloat(e.target.value);
    applyVesselControls(vessel.controls.throttle, newRudder);
  };

  // Toggle simulation running state
  const toggleSimulation = () => {
    if (isRunning) {
      stopSimulation();
    } else {
      startSimulation();
    }
  };

  return (
    <div
      className={`${className} flex justify-center space-x-4 bg-black bg-opacity-50 p-4 text-white`}
    >
      {/* Vessel Information */}
      <div className="rounded-lg bg-gray-800 bg-opacity-70 p-3">
        <h3 className="border-b border-gray-600 font-bold">Vessel Status</h3>
        <p>Speed: {vesselSpeed.toFixed(2)} m/s</p>
        <p>
          Position: ({vessel.position.x.toFixed(1)},{' '}
          {vessel.position.y.toFixed(1)})
        </p>
        <p>
          Heading: {((vessel.orientation.heading * 180) / Math.PI).toFixed(1)}°
        </p>
        <p>Simulation time: {elapsedTime.toFixed(1)}s</p>
      </div>

      {/* Throttle Control */}
      <div className="rounded-lg bg-gray-800 bg-opacity-70 p-3">
        <h3 className="border-b border-gray-600 font-bold">Engine Telegraph</h3>
        <div className="my-2 flex items-center">
          <span className="w-20">Throttle:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={vessel.controls.throttle}
            onChange={handleThrottleChange}
            className="mx-2 h-8"
          />
          <span className="w-16">
            {(vessel.controls.throttle * 100).toFixed(0)}%
          </span>
        </div>

        {/* RPM Gauge - placeholder for now */}
        <div className="mt-2 h-16 w-full rounded-md bg-gray-700 flex items-center justify-center">
          <span className="text-xl font-mono">
            {Math.round(vessel.controls.throttle * 120)} RPM
          </span>
        </div>
      </div>

      {/* Rudder Control */}
      <div className="rounded-lg bg-gray-800 bg-opacity-70 p-3">
        <h3 className="border-b border-gray-600 font-bold">Steering</h3>
        <div className="my-2 flex items-center">
          <span className="w-20">Rudder:</span>
          <input
            type="range"
            min="-0.6"
            max="0.6"
            step="0.01"
            value={vessel.controls.rudderAngle}
            onChange={handleRudderChange}
            className="mx-2 h-8"
          />
          <span className="w-16">
            {((vessel.controls.rudderAngle * 180) / Math.PI).toFixed(0)}°
          </span>
        </div>

        {/* Rudder Angle Indicator - placeholder for now */}
        <div className="mt-2 h-16 w-full rounded-md bg-gray-700 flex items-center justify-center">
          <div
            className="h-8 w-2 bg-red-500"
            style={{
              transform: `rotate(${(vessel.controls.rudderAngle * 180) / Math.PI}deg)`,
              transformOrigin: 'center bottom',
            }}
          />
        </div>
      </div>

      {/* Environment Data */}
      <div className="rounded-lg bg-gray-800 bg-opacity-70 p-3">
        <h3 className="border-b border-gray-600 font-bold">Environment</h3>
        <p>
          Wind: {environment.wind.speed.toFixed(1)} m/s at{' '}
          {((environment.wind.direction * 180) / Math.PI).toFixed(0)}°
        </p>
        <p>
          Current: {environment.current.speed.toFixed(1)} m/s at{' '}
          {((environment.current.direction * 180) / Math.PI).toFixed(0)}°
        </p>
        <p>Sea state: {environment.seaState}/12 (Beaufort)</p>
        <p>Water depth: {environment.waterDepth.toFixed(0)}m</p>
      </div>

      {/* Simulation Controls */}
      <div className="rounded-lg bg-gray-800 bg-opacity-70 p-3 flex flex-col justify-center">
        <button
          onClick={toggleSimulation}
          className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 transition-colors"
        >
          {isRunning ? 'Pause Simulation' : 'Resume Simulation'}
        </button>

        <button
          className="mt-2 rounded bg-gray-600 px-4 py-2 font-bold text-white hover:bg-gray-700 transition-colors"
          onClick={() => window.location.reload()}
        >
          Reset Simulation
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
