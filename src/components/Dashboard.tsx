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
    applyVesselControls(
      newThrottle,
      vessel.controls.rudderAngle,
      vessel.controls.ballast,
    );
  };

  // Handle rudder changes
  const handleRudderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRudder = parseFloat(e.target.value);
    applyVesselControls(
      vessel.controls.throttle,
      newRudder,
      vessel.controls.ballast,
    );
  };

  // Handle ballast changes
  const handleBallastChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBallast = parseFloat(e.target.value);
    applyVesselControls(
      vessel.controls.throttle,
      vessel.controls.rudderAngle,
      newBallast,
    );
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
      className={`${className} flex flex-wrap justify-center space-x-4 bg-black bg-opacity-50 p-4 text-white`}
    >
      {/* Vessel Information */}
      <div className="rounded-lg bg-gray-800 bg-opacity-70 p-3 m-2">
        <h3 className="border-b border-gray-600 font-bold">Vessel Status</h3>
        <p>
          Speed: {vesselSpeed.toFixed(2)} m/s (
          {(vesselSpeed * 1.94384).toFixed(2)} knots)
        </p>
        <p>
          Position: ({vessel.position.x.toFixed(1)},{' '}
          {vessel.position.y.toFixed(1)})
        </p>
        <p>
          Heading: {((vessel.orientation.heading * 180) / Math.PI).toFixed(1)}°
        </p>
        <p>Simulation time: {elapsedTime.toFixed(1)}s</p>
      </div>

      {/* Engine Information - New Panel */}
      <div className="rounded-lg bg-gray-800 bg-opacity-70 p-3 m-2">
        <h3 className="border-b border-gray-600 font-bold">Engine Data</h3>
        <p>RPM: {vessel.engineState?.rpm.toFixed(0) || 'N/A'}</p>
        <p>
          Fuel Level:{' '}
          {(vessel.engineState?.fuelLevel * 100).toFixed(1) || 'N/A'}%
        </p>
        <p>
          Fuel Consumption:{' '}
          {vessel.engineState?.fuelConsumption.toFixed(2) || 'N/A'} kg/h
        </p>

        {/* Fuel level visual indicator */}
        <div className="mt-2 w-full">
          <div className="text-xs mb-1">Fuel Tank</div>
          <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-600"
              style={{
                width: `${(vessel.engineState?.fuelLevel || 0) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Stability Information - New Panel */}
      <div className="rounded-lg bg-gray-800 bg-opacity-70 p-3 m-2">
        <h3 className="border-b border-gray-600 font-bold">Stability</h3>
        <p>GM: {vessel.stability?.metacentricHeight.toFixed(2) || 'N/A'} m</p>
        <p>
          Ballast Level: {((vessel.controls.ballast || 0) * 100).toFixed(0)}%
        </p>

        {/* Ballast control */}
        <div className="my-2 flex items-center">
          <span className="w-20">Ballast:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={vessel.controls.ballast || 0.5}
            onChange={handleBallastChange}
            className="mx-2 h-8 flex-grow"
          />
        </div>

        {/* Visual stability indicator */}
        <div className="mt-2 relative h-12 w-full bg-gray-700 rounded flex items-center justify-center">
          <div className="absolute w-1 h-full bg-white opacity-30"></div>
          <div
            className="absolute h-4 w-24 bg-blue-500 rounded-sm"
            style={{
              transform: `rotate(${vessel.stability?.centerOfGravity?.y ? vessel.stability.centerOfGravity.y * 10 : 0}deg)`,
              transformOrigin: 'center center',
            }}
          ></div>
          <div className="text-xs opacity-70">Vessel Stability</div>
        </div>
      </div>

      {/* Throttle Control */}
      <div className="rounded-lg bg-gray-800 bg-opacity-70 p-3 m-2">
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

        {/* RPM Gauge - updated to show actual engine RPM */}
        <div className="mt-2 h-16 w-full rounded-md bg-gray-700 flex items-center justify-center">
          <span className="text-xl font-mono">
            {Math.round(
              vessel.engineState?.rpm || vessel.controls.throttle * 120,
            )}{' '}
            RPM
          </span>
        </div>
      </div>

      {/* Rudder Control */}
      <div className="rounded-lg bg-gray-800 bg-opacity-70 p-3 m-2">
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

        {/* Rudder Angle Indicator */}
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
      <div className="rounded-lg bg-gray-800 bg-opacity-70 p-3 m-2">
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

        {/* Sea state control */}
        <div className="my-2 flex items-center">
          <span className="w-20">Sea State:</span>
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={environment.seaState}
            onChange={e => {
              useStore.getState().updateEnvironment({
                seaState: parseInt(e.target.value),
              });
            }}
            className="mx-2 h-8 flex-grow"
          />
          <span>{environment.seaState}</span>
        </div>

        {/* Wind speed control */}
        <div className="my-2 flex items-center">
          <span className="w-20">Wind:</span>
          <input
            type="range"
            min="0"
            max="30"
            step="0.5"
            value={environment.wind.speed}
            onChange={e => {
              useStore.getState().updateEnvironment({
                wind: {
                  ...environment.wind,
                  speed: parseFloat(e.target.value),
                },
              });
            }}
            className="mx-2 h-8 flex-grow"
          />
          <span>{environment.wind.speed.toFixed(1)} m/s</span>
        </div>
      </div>

      {/* Simulation Controls */}
      <div className="rounded-lg bg-gray-800 bg-opacity-70 p-3 m-2 flex flex-col justify-center">
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
