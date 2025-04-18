import React, { useState, useEffect } from 'react';
import useStore from '../store';
import {
  applyVesselControls,
  startSimulation,
  stopSimulation,
} from '../simulation';
import MachineryPanel from './MachineryPanel';

interface DashboardProps {
  className?: string;
}

// Compass Rose component for showing heading
const CompassRose: React.FC<{ heading: number; size?: number }> = ({
  heading,
  size = 150,
}) => {
  // Convert heading from radians to degrees for display
  const headingDeg = ((heading * 180) / Math.PI) % 360;

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative rounded-full border-2 border-blue-400 bg-gray-900"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Cardinal points */}
        {['N', 'E', 'S', 'W'].map((dir, i) => (
          <div
            key={dir}
            className="absolute text-white font-bold"
            style={{
              left: `${50 + 45 * Math.sin((i * Math.PI) / 2)}%`,
              top: `${50 - 45 * Math.cos((i * Math.PI) / 2)}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {dir}
          </div>
        ))}

        {/* Degree markings */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = i * 10;
          const isCardinal = angle % 90 === 0;
          const length = isCardinal ? 10 : angle % 30 === 0 ? 8 : 5;

          return (
            <div
              key={angle}
              className="absolute bg-white"
              style={{
                height: `${length}px`,
                width: '2px',
                bottom: '50%',
                left: '50%',
                transformOrigin: 'bottom center',
                transform: `rotate(${angle}deg)`,
              }}
            />
          );
        })}

        {/* Ship indicator */}
        <div
          className="absolute w-0 h-0"
          style={{
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: '25px solid #f56565',
            bottom: '50%',
            left: '50%',
            transform: `translateX(-50%) rotate(${headingDeg}deg)`,
            transformOrigin: 'bottom center',
            transition: 'transform 0.2s ease-out',
          }}
        />

        {/* Heading display */}
        <div className="absolute inset-x-0 bottom-8 flex justify-center">
          <div className="bg-black bg-opacity-70 px-2 py-1 rounded">
            <span className="font-mono text-white font-bold">
              {Math.round(headingDeg).toString().padStart(3, '0')}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Control lever component for throttle/rudder
const ControlLever: React.FC<{
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  vertical?: boolean;
  label: string;
  scale?: Array<{ label: string; value: number }>;
}> = ({ value, min, max, onChange, vertical = false, label, scale }) => {
  // Calculate normalized position 0-1
  const normalized = (value - min) / (max - min);
  const position = vertical ? 1 - normalized : normalized;

  // Handle drag
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startValue, setStartValue] = useState(value);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartValue(value);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    // Calculate delta
    const delta = vertical
      ? (startPos.y - e.clientY) / 100
      : (e.clientX - startPos.x) / 100;

    // Calculate new value based on range
    const range = max - min;
    const newValue = Math.max(min, Math.min(max, startValue + delta * range));

    onChange(newValue);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startPos, startValue]);

  // Track width/height
  const trackDimension = vertical ? 'h-40' : 'w-40';

  return (
    <div className="flex flex-col items-center p-2">
      <div className="text-white mb-1">{label}</div>
      <div
        className={`relative ${vertical ? 'h-40 w-10' : 'w-40 h-10'} bg-gray-800 rounded-full border border-gray-600`}
      >
        {/* Scale markings */}
        {scale &&
          scale.map(mark => {
            const markPos = (mark.value - min) / (max - min);
            const posStyle = vertical
              ? { bottom: `${markPos * 100}%`, left: '100%' }
              : { left: `${markPos * 100}%`, top: '100%' };

            return (
              <div key={mark.value} className="absolute" style={posStyle}>
                <div
                  className="h-2 w-1 bg-white"
                  style={{
                    transform: vertical
                      ? 'translateY(50%)'
                      : 'translateX(-50%)',
                    marginLeft: vertical ? '5px' : '0',
                    marginTop: vertical ? '0' : '5px',
                  }}
                />
                <div
                  className="text-white text-xs"
                  style={{
                    transform: vertical
                      ? 'translateY(50%)'
                      : 'translateX(-50%)',
                    marginLeft: vertical ? '8px' : '0',
                    marginTop: vertical ? '0' : '8px',
                  }}
                >
                  {mark.label}
                </div>
              </div>
            );
          })}

        {/* Track active section */}
        <div
          className={`absolute ${vertical ? 'w-full' : 'h-full'} bg-blue-500 rounded-full`}
          style={
            vertical
              ? { bottom: 0, height: `${normalized * 100}%` }
              : { left: 0, width: `${normalized * 100}%` }
          }
        />

        {/* Lever handle */}
        <div
          className={`absolute cursor-grab ${isDragging ? 'cursor-grabbing' : ''} w-8 h-8 rounded-full bg-gray-300 border-2 border-gray-500`}
          style={
            vertical
              ? { bottom: `calc(${position * 100}% - 16px)`, left: '1px' }
              : { left: `calc(${position * 100}% - 16px)`, top: '1px' }
          }
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Value display */}
      <div className="mt-1">
        <span className="text-white font-mono">
          {typeof value === 'number' && value.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

// Circular gauge component
const CircularGauge: React.FC<{
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  size?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
}> = ({
  value,
  min,
  max,
  label,
  unit,
  size = 120,
  warningThreshold,
  criticalThreshold,
}) => {
  // Calculate angle for gauge
  const angle = Math.min(270, Math.max(0, ((value - min) / (max - min)) * 270));

  // Get color based on thresholds
  const getColor = () => {
    if (criticalThreshold && value >= criticalThreshold) return '#f56565';
    if (warningThreshold && value >= warningThreshold) return '#ed8936';
    return '#48bb78';
  };

  return (
    <div className="flex flex-col items-center" style={{ width: `${size}px` }}>
      <div className="text-white font-bold mb-1 text-center">{label}</div>
      <div
        className="relative rounded-full bg-gray-800 border border-gray-600"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Gauge background track */}
        <div
          className="absolute"
          style={{
            width: `${size - 20}px`,
            height: `${size - 20}px`,
            borderRadius: '50%',
            top: '10px',
            left: '10px',
            background: 'conic-gradient(#334 0deg, transparent 0deg)',
          }}
        />

        {/* Gauge value fill */}
        <div
          className="absolute"
          style={{
            width: `${size - 20}px`,
            height: `${size - 20}px`,
            borderRadius: '50%',
            top: '10px',
            left: '10px',
            background: `conic-gradient(${getColor()} 0deg, ${getColor()} ${angle}deg, transparent ${angle}deg)`,
            transition: 'background 0.3s ease',
          }}
        />

        {/* Inner circle to create a donut */}
        <div
          className="absolute bg-gray-900 rounded-full"
          style={{
            width: `${size - 40}px`,
            height: `${size - 40}px`,
            top: '20px',
            left: '20px',
          }}
        />

        {/* Value */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-white font-bold text-xl">
            {Math.round(value)}
          </span>
          <span className="text-gray-400 text-xs">{unit}</span>
        </div>

        {/* Ticks */}
        {Array.from({ length: 10 }).map((_, i) => {
          const tickAngle = i * 30;
          const isMajor = i % 3 === 0;

          return (
            <div
              key={i}
              className={`absolute bg-white ${isMajor ? 'h-3 w-1' : 'h-2 w-0.5'}`}
              style={{
                top: `${size / 2}px`,
                left: `${size / 2}px`,
                transformOrigin: '50% 0',
                transform: `rotate(${tickAngle - 135}deg) translateY(${size / 2 - 10}px)`,
              }}
            />
          );
        })}
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between w-full mt-1">
        <span className="text-gray-400 text-xs">
          {min}
          {unit}
        </span>
        <span className="text-gray-400 text-xs">
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
};

// Alarm indicator component
const AlarmIndicator: React.FC<{
  active: boolean;
  label: string;
  severity?: 'warning' | 'critical';
}> = ({ active, label, severity = 'warning' }) => {
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(
      () => {
        setFlash(prev => !prev);
      },
      severity === 'critical' ? 500 : 1000,
    );

    return () => clearInterval(interval);
  }, [active, severity]);

  const bgColor = severity === 'critical' ? 'bg-red-600' : 'bg-yellow-600';

  return (
    <div
      className={`px-3 py-1 rounded ${active ? `${flash ? bgColor : 'bg-gray-800'} transition-colors duration-200` : 'bg-gray-800'} border border-gray-700`}
    >
      <span className="text-white text-sm">{label}</span>
    </div>
  );
};

// Event Log component
const EventLog: React.FC = () => {
  const events = useStore(state => state.eventLog);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new events are added
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  // Get color based on severity
  const getEventColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-white">Event Log</h3>
        <span className="text-xs text-gray-400">{events.length} events</span>
      </div>
      <div
        ref={containerRef}
        className="h-40 overflow-y-auto text-sm custom-scrollbar"
      >
        {events.length === 0 ? (
          <div className="text-gray-500 italic">No events recorded</div>
        ) : (
          <table className="w-full">
            <tbody>
              {events.map((event, i) => (
                <tr key={i} className="border-b border-gray-800 last:border-0">
                  <td className="py-1 pr-2 text-gray-500 whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </td>
                  <td className={`py-1 ${getEventColor(event.severity)}`}>
                    {event.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

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
      applyVesselControls(throttle, rudderAngle, controls.ballast || 0.5);
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
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

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

          {/* Gauges */}
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <CircularGauge
              label="Speed"
              value={(velocity?.surge || 0) * 1.94384} // convert to knots
              min={0}
              max={20}
              unit="kts"
              warningThreshold={15}
            />

            <CircularGauge
              label="Engine RPM"
              value={engineState?.rpm || 0}
              min={0}
              max={1500}
              unit="rpm"
              warningThreshold={1200}
              criticalThreshold={1400}
            />

            <CircularGauge
              label="Engine Temp"
              value={engineState?.temperature || 25}
              min={0}
              max={120}
              unit="°C"
              warningThreshold={85}
              criticalThreshold={95}
            />

            <CircularGauge
              label="Fuel"
              value={(engineState?.fuelLevel || 0) * 100}
              min={0}
              max={100}
              unit="%"
              warningThreshold={20}
              criticalThreshold={10}
            />

            <CircularGauge
              label="Oil Pressure"
              value={engineState?.oilPressure || 0}
              min={0}
              max={8}
              unit="bar"
              warningThreshold={3}
              criticalThreshold={2}
            />
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

          <div className="flex flex-wrap justify-around mb-4">
            <div>
              <ControlLever
                label="Throttle"
                value={throttle}
                min={0}
                max={1}
                onChange={setThrottle}
                scale={[
                  { label: 'Stop', value: 0 },
                  { label: 'Slow', value: 0.25 },
                  { label: 'Half', value: 0.5 },
                  { label: 'Full', value: 1 },
                ]}
              />
            </div>

            <div>
              <ControlLever
                label="Rudder"
                value={rudderAngle}
                min={-0.6}
                max={0.6}
                onChange={setRudderAngle}
                scale={[
                  { label: 'Port', value: -0.6 },
                  { label: 'Mid', value: 0 },
                  { label: 'Stbd', value: 0.6 },
                ]}
              />
            </div>
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

      <style jsx>{`
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
