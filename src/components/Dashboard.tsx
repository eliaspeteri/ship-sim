import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { startSimulation, stopSimulation } from '../simulation';
import MachineryPanel from './MachineryPanel';
import EventLog from './EventLog';
import { AlarmIndicator } from './AlarmIndicator';
import { CompassRose } from './CompassRose';
import { ControlLever } from './ControlLever';
import { TelegraphLever } from './TelegraphLever';
import { CircularGauge } from './CircularGauge';

interface DashboardProps {
  className?: string;
}

// Main Dashboard component
const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const vessel = useStore(state => state.vessel);
  const environment = useStore(state => state.environment);
  const isRunning = useStore(state => state.simulation.isRunning);
  const elapsedTime = useStore(state => state.simulation.elapsedTime);
  const addEvent = useStore(state => state.addEvent);

  // Destructure vessel state for easier access
  const { position, orientation, velocity, controls, engineState, alarms } =
    vessel || {};

  // Control state
  const [throttle, setThrottle] = useState(controls?.throttle || 0);
  const [rudderAngle, setRudderAngle] = useState(controls?.rudderAngle || 0);
  const [showMachineryPanel, setShowMachineryPanel] = useState(false);

  // Apply controls whenever throttle or rudder changes
  useEffect(() => {
    if (controls) {
      useStore.getState().applyVesselControls({
        throttle,
        rudderAngle,
        ballast: controls?.ballast || 0.5,
      });
    }
  }, [throttle, rudderAngle, controls]);

  // Toggle simulation running state
  const toggleSimulation = () => {
    if (isRunning) {
      stopSimulation();
      addEvent({
        category: 'system',
        type: 'simulation_paused',
        message: 'Simulation paused',
        severity: 'info',
      });
    } else {
      startSimulation();
      addEvent({
        category: 'system',
        type: 'simulation_started',
        message: 'Simulation started',
        severity: 'info',
      });
    }
  };

  // Format simulation time as hh:mm:ss
  const formatTime = (seconds: number | null | undefined) => {
    // Handle invalid values
    if (seconds === undefined || seconds === null || isNaN(seconds)) {
      return '00:00:00';
    }

    // Ensure we're working with a non-negative number
    const timeInSeconds = Math.max(0, Math.floor(seconds));

    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const secs = timeInSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${className} text-white p-4`}>
      {/* Top bar with time and controls */}
      <div className="flex flex-wrap justify-between items-center mb-4 bg-gray-900 p-3 rounded-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSimulation}
            className={`px-4 py-2 rounded-md font-bold ${isRunning ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>

          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Simulation Time</span>
            <span className="font-mono font-bold">
              {formatTime(elapsedTime)}
            </span>
          </div>

          <button
            onClick={() => setShowMachineryPanel(prev => !prev)}
            className={`px-4 py-2 rounded-md ${showMachineryPanel ? 'bg-blue-700' : 'bg-gray-700'}`}
          >
            {showMachineryPanel ? 'Hide Machinery' : 'Show Machinery'}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {alarms &&
            Object.entries(alarms).map(
              ([key, active]) =>
                typeof active === 'boolean' &&
                active && (
                  <AlarmIndicator
                    key={key}
                    active={active}
                    label={
                      key === 'engineOverheat'
                        ? 'ENGINE TEMP'
                        : key === 'lowOilPressure'
                          ? 'OIL PRESSURE'
                          : key === 'propulsionFailure'
                            ? 'PROPULSION'
                            : key
                    }
                    severity={
                      key === 'engineOverheat' || key === 'lowOilPressure'
                        ? 'critical'
                        : 'warning'
                    }
                  />
                ),
            )}
        </div>
      </div>

      {/* Main dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column - Navigation */}
        <div className="lg:col-span-3 bg-gray-900 bg-opacity-70 p-4 rounded-lg">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">
            Navigation
          </h2>

          {/* Compass */}
          <div className="flex justify-center mb-4">
            <CompassRose heading={orientation?.heading || 0} />
          </div>

          {/* Position/Speed */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-xs text-gray-400">Position X</div>
              <div className="font-mono">
                {position?.x?.toFixed(1) || '0.0'} m
              </div>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-xs text-gray-400">Position Y</div>
              <div className="font-mono">
                {position?.y?.toFixed(1) || '0.0'} m
              </div>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-xs text-gray-400">Speed</div>
              <div className="font-mono">
                {((velocity?.surge || 0) * 1.94384).toFixed(1)} kts
              </div>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-xs text-gray-400">Course</div>
              <div className="font-mono">
                {Math.round(
                  (((orientation?.heading || 0) * 180) / Math.PI) % 360,
                )}
                °
              </div>
            </div>
          </div>

          {/* Environmental info */}
          <div className="bg-gray-800 p-3 rounded mb-4">
            <h3 className="font-bold mb-2 text-sm">Environment</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Wind:</span>{' '}
                {environment?.wind?.speed?.toFixed(1) || '0.0'} m/s
              </div>
              <div>
                <span className="text-gray-400">Direction:</span>{' '}
                {Math.round(
                  (((environment?.wind?.direction || 0) * 180) / Math.PI) % 360,
                )}
                °
              </div>
              <div>
                <span className="text-gray-400">Sea State:</span>{' '}
                {environment?.seaState || 0}
              </div>
              <div>
                <span className="text-gray-400">Current:</span>{' '}
                {environment?.current?.speed?.toFixed(1) || '0.0'} m/s
              </div>
            </div>
          </div>

          {/* Event log */}
          <EventLog />
        </div>

        {/* Middle column - Gauges */}
        <div className="lg:col-span-5 bg-gray-900 bg-opacity-70 p-4 rounded-lg flex flex-col">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">
            Performance
          </h2>

          {/* Single Grid for ALL Gauges and Group Headings */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 justify-items-center w-full mb-4">
            {/* Group 1: Navigation Heading */}
            <div className="col-span-2 md:col-span-3 w-full text-sm font-semibold text-gray-400 mb-2 border-b border-gray-700 pb-1">
              Navigation
            </div>
            {/* Navigation Gauges */}
            <CircularGauge
              label="Speed"
              value={(velocity?.surge || 0) * 1.94384} // convert to knots
              min={0}
              max={20}
              unit="kts"
              warningThreshold={15}
              size={140}
            />
            <CircularGauge
              label="Rudder Angle"
              value={Math.round(rudderAngle * 90)}
              min={-90}
              max={90}
              unit="°"
              size={140}
            />
            {/* Placeholder for 3-column layout */}
            <div className="hidden md:block"></div>

            {/* Group 2: Engine Heading */}
            <div className="col-span-2 md:col-span-3 w-full text-sm font-semibold text-gray-400 mb-2 border-b border-gray-700 pb-1 mt-4">
              Engine
            </div>
            {/* Engine Gauges */}
            <CircularGauge
              label="Engine RPM"
              value={engineState?.rpm || 0}
              min={0}
              max={1500}
              unit="rpm"
              warningThreshold={1200}
              criticalThreshold={1400}
              // size={120} // Default size
            />
            <CircularGauge
              label="Engine Temp"
              value={engineState?.temperature || 25}
              min={0}
              max={120}
              unit="°C"
              warningThreshold={85}
              criticalThreshold={95}
              // size={120}
            />
            <CircularGauge
              label="Oil Pressure"
              value={engineState?.oilPressure || 0}
              min={0}
              max={8}
              unit="bar"
              warningThreshold={3}
              criticalThreshold={2}
              // size={120}
            />

            {/* Group 3: Resources Heading */}
            <div className="col-span-2 md:col-span-3 w-full text-sm font-semibold text-gray-400 mb-2 border-b border-gray-700 pb-1 mt-4">
              Resources
            </div>
            {/* Resources Gauges */}
            <CircularGauge
              label="Fuel"
              value={(engineState?.fuelLevel || 0) * 100}
              min={0}
              max={100}
              unit="%"
              warningThreshold={20}
              criticalThreshold={10}
              size={140}
            />
            <CircularGauge
              label="Load"
              value={(engineState?.load || 0) * 100}
              min={0}
              max={100}
              unit="%"
              warningThreshold={85}
              criticalThreshold={95}
              size={140}
            />
            {/* Placeholder for 3-column layout */}
            <div className="hidden md:block"></div>
          </div>

          {/* Fuel consumption and efficiency */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-auto">
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-xs text-gray-400">Fuel Consumption</div>
              <div className="font-mono">
                {(engineState?.fuelConsumption || 0).toFixed(1)} kg/h
              </div>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-xs text-gray-400">Engine Load</div>
              <div className="font-mono">
                {((engineState?.load || 0) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-xs text-gray-400">Engine Hours</div>
              <div className="font-mono">
                {(engineState?.hours || 0).toFixed(1)} h
              </div>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-xs text-gray-400">Engine Status</div>
              <div className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full ${engineState?.running ? 'bg-green-500' : 'bg-red-500'} mr-1`}
                ></div>
                <span>{engineState?.running ? 'Running' : 'Stopped'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Controls */}
        <div className="lg:col-span-4 bg-gray-900 bg-opacity-70 p-4 rounded-lg">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">
            Controls
          </h2>

          <div className="flex flex-wrap justify-around items-start mb-4">
            {/* Throttle Telegraph */}
            <TelegraphLever
              label="Throttle"
              value={throttle}
              min={-1}
              max={1}
              onChange={setThrottle}
              scale={[
                { label: 'F.Astern', value: -1, major: true },
                { label: 'H.Astern', value: -0.5 },
                { label: 'S.Astern', value: -0.25 },
                { label: 'Stop', value: 0, major: true },
                { label: 'S.Ahead', value: 0.25 },
                { label: 'H.Ahead', value: 0.5 },
                { label: 'F.Ahead', value: 1, major: true },
              ]}
            />

            {/* Rudder Control Lever */}
            <ControlLever
              label="Rudder"
              value={rudderAngle}
              min={-0.6}
              max={0.6}
              onChange={setRudderAngle}
              scale={[
                { label: '35° Port', value: -0.6 },
                { label: '0°', value: 0 },
                { label: '35° Stbd', value: 0.6 },
              ]}
            />
          </div>

          {/* Rudder indicator */}
          <div className="flex justify-center mb-4">
            <div className="relative w-40 h-20">
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <div className="w-1 h-full bg-white"></div>
              </div>
              <div
                className="absolute w-20 h-4 bg-blue-500"
                style={{
                  top: '50%',
                  left: '50%',
                  marginTop: '-2px',
                  marginLeft: '-10px',
                  transformOrigin: 'center left',
                  transform: `rotate(${rudderAngle * 90}deg)`,
                  transition: 'transform 0.3s ease',
                }}
              ></div>
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-gray-400">
                <span>35° Port</span>
                <span>35° Starboard</span>
              </div>
            </div>
          </div>

          {/* Engine status */}
          <div className="bg-gray-800 p-3 rounded">
            <h3 className="font-bold mb-2">Engine Controls</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1">
                  <span className="text-gray-400 text-sm">Status:</span>
                  <span
                    className={`ml-2 ${engineState?.running ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {engineState?.running ? 'Running' : 'Stopped'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">RPM:</span>
                  <span className="ml-2 font-mono">
                    {Math.round(engineState?.rpm || 0)}
                  </span>
                </div>
              </div>

              <div>
                <button
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded mr-2 disabled:opacity-50"
                  disabled={!engineState?.running}
                  onClick={() => {
                    setThrottle(0);
                    setTimeout(() => {
                      useStore.getState().updateVessel({
                        engineState: {
                          ...engineState,
                          running: false,
                        },
                      });
                    }, 500);
                  }}
                >
                  Stop
                </button>

                <button
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
                  disabled={engineState?.running}
                  onClick={() => {
                    // This is simplified - real engine start would involve machinery panel
                    if ((engineState?.fuelLevel || 0) > 0.05) {
                      useStore.getState().updateVessel({
                        engineState: {
                          ...engineState,
                          running: true,
                        },
                      });
                      addEvent({
                        category: 'engine',
                        type: 'engine_start',
                        message: 'Engine started',
                        severity: 'info',
                      });
                    } else {
                      addEvent({
                        category: 'engine',
                        type: 'engine_start_failed',
                        message: 'Engine start failed: Low fuel',
                        severity: 'warning',
                      });
                    }
                  }}
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Machinery panel (conditionally shown) */}
      {showMachineryPanel && (
        <div className="mt-4">
          <MachineryPanel />
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a202c;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
