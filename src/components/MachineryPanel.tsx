import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { applyVesselControls } from '../simulation';
import { Pipe } from './Pipe';
import { MachineGauge } from './MachineGauge';
import { Tank } from './Tank';
import { Valve } from './Valve';
import { Pump } from './Pump';

interface MachineryPanelProps {
  className?: string;
}

// Main Component
const MachineryPanel: React.FC<MachineryPanelProps> = ({ className = '' }) => {
  // Get data from store
  const vessel = useStore(state => state.vessel);
  const machinerySystems = useStore(state => state.machinerySystems);
  const triggerFailure = useStore(state => state.triggerFailure);
  const addEvent = useStore(state => state.addEvent);

  // Local state for system components
  const [fuelValveOpen, setFuelValveOpen] = useState(true);
  const [fuelPumpRunning, setFuelPumpRunning] = useState(true);
  const [coolantValveOpen, setCoolantValveOpen] = useState(true);
  const [coolantPumpRunning, setCoolantPumpRunning] = useState(true);
  const [lubePumpRunning, setLubePumpRunning] = useState(true);
  const [startAirValveOpen, setStartAirValveOpen] = useState(false);

  // Engine state
  const engineRunning = vessel.engineState.running;
  const engineRPM = vessel.engineState.rpm;
  const engineLoad = vessel.engineState.load;
  const fuelLevel = vessel.engineState.fuelLevel;
  const fuelConsumption = vessel.engineState.fuelConsumption;
  const engineTemp = vessel.engineState.temperature;
  const oilPressure = vessel.engineState.oilPressure;

  // Health values
  const engineHealth = machinerySystems.engineHealth;
  const propulsionEfficiency = machinerySystems.propulsionEfficiency;

  // Failures
  const engineFailure = machinerySystems.failures.engineFailure;
  const propellerDamage = machinerySystems.failures.propellerDamage;

  // Calculated flow rates for animations
  const fuelFlow =
    fuelValveOpen && fuelPumpRunning ? Math.max(0.1, fuelConsumption / 100) : 0;
  const coolantFlow =
    coolantValveOpen && coolantPumpRunning
      ? Math.max(0.2, engineRPM / 1000)
      : 0;
  const lubeFlow = lubePumpRunning ? Math.max(0.1, engineRPM / 1200) : 0;
  const startAirFlow = startAirValveOpen ? 0.8 : 0;

  // Update engine state based on system component states
  useEffect(() => {
    // In a real system, we'd update the engine state based on all these factors
    // For now, let's implement a simple logic:

    // If fuel system fails, engine stops
    if (!fuelValveOpen || !fuelPumpRunning || fuelLevel <= 0.05) {
      if (engineRunning) {
        addEvent({
          category: 'engine',
          type: 'engine_stopped',
          message: !fuelValveOpen
            ? 'Engine stopped: Fuel valve closed'
            : !fuelPumpRunning
              ? 'Engine stopped: Fuel pump not running'
              : 'Engine stopped: Low fuel level',
          severity: 'warning',
        });
      }

      // Update vessel state in the next frame
      setTimeout(() => {
        // Add null safety check before accessing vessel.controls properties
        applyVesselControls({
          throttle: 0,
          rudderAngle: vessel.controls?.rudderAngle || 0,
          ballast: vessel.controls?.ballast || 0.5,
        });
      }, 0);
    }

    // If cooling system fails, temperature rises
    if (!coolantValveOpen || !coolantPumpRunning) {
      // Increase engine temperature simulation (would be handled by physics in real impl)
      if (engineRunning && engineRPM > 100) {
        setTimeout(() => {
          const currentTemp = vessel.engineState.temperature;
          if (currentTemp < 120) {
            // Max temp
            // Temperature rises faster with higher RPM
            const tempIncrease = (engineRPM / 1000) * 0.5;

            // Update vessel engine temperature
            useStore.getState().updateVessel({
              engineState: {
                ...vessel.engineState,
                temperature: currentTemp + tempIncrease,
              },
            });

            // If temperature gets too high, trigger overheat alarm
            if (currentTemp + tempIncrease > 95 && currentTemp <= 95) {
              addEvent({
                category: 'alarm',
                type: 'engine_overheat',
                message: 'WARNING: Engine temperature critical',
                severity: 'critical',
              });

              // Update alarms
              useStore.getState().updateVessel({
                alarms: {
                  ...vessel.alarms,
                  engineOverheat: true,
                },
              });
            }
          }
        }, 1000); // Update every second
      }
    }

    // If lube oil system fails, pressure drops
    if (!lubePumpRunning) {
      // Decrease oil pressure simulation
      if (engineRunning) {
        setTimeout(() => {
          const currentPressure = vessel.engineState.oilPressure;
          if (currentPressure > 0.5) {
            // Update vessel oil pressure
            useStore.getState().updateVessel({
              engineState: {
                ...vessel.engineState,
                oilPressure: currentPressure - 0.2,
              },
            });

            // If pressure gets too low, trigger alarm
            if (currentPressure - 0.2 < 2.0 && currentPressure >= 2.0) {
              addEvent({
                category: 'alarm',
                type: 'low_oil_pressure',
                message: 'WARNING: Low oil pressure',
                severity: 'critical',
              });

              // Update alarms
              useStore.getState().updateVessel({
                alarms: {
                  ...vessel.alarms,
                  lowOilPressure: true,
                },
              });
            }
          }
        }, 1000);
      }
    }
  }, [
    fuelValveOpen,
    fuelPumpRunning,
    coolantValveOpen,
    coolantPumpRunning,
    lubePumpRunning,
    vessel,
    engineRunning,
    engineRPM,
    fuelLevel,
    addEvent,
  ]);

  // Handle engine start
  const handleEngineStart = () => {
    // Check if we can start the engine
    if (!fuelValveOpen || !fuelPumpRunning || fuelLevel <= 0.05) {
      addEvent({
        category: 'engine',
        type: 'start_failed',
        message: !fuelValveOpen
          ? 'Engine start failed: Fuel valve closed'
          : !fuelPumpRunning
            ? 'Engine start failed: Fuel pump not running'
            : 'Engine start failed: Low fuel level',
        severity: 'warning',
      });
      return;
    }

    if (!startAirValveOpen) {
      addEvent({
        category: 'engine',
        type: 'start_failed',
        message: 'Engine start failed: Start air valve closed',
        severity: 'info',
      });
      return;
    }

    // Start sequence
    addEvent({
      category: 'engine',
      type: 'start_sequence',
      message: 'Engine start sequence initiated',
      severity: 'info',
    });

    // Apply minimal throttle to start turning the engine
    setTimeout(() => {
      applyVesselControls({
        throttle: 0.1,
        rudderAngle: vessel.controls?.rudderAngle || 0,
        ballast: vessel.controls?.ballast || 0.5,
      });
    }, 0);

    // Set engine running status
    useStore.getState().updateVessel({
      engineState: {
        ...vessel.engineState,
        running: true,
      },
    });

    // Close the start air valve after 2 seconds
    setTimeout(() => {
      setStartAirValveOpen(false);
      addEvent({
        category: 'engine',
        type: 'start_complete',
        message: 'Engine started successfully',
        severity: 'info',
      });
    }, 2000);
  };

  // Handle engine stop
  const handleEngineStop = () => {
    // Stop the engine by setting throttle to zero
    applyVesselControls({
      throttle: 0,
      rudderAngle: vessel.controls?.rudderAngle || 0,
      ballast: vessel.controls?.ballast || 0.5,
    });

    // Set engine running status
    useStore.getState().updateVessel({
      engineState: {
        ...vessel.engineState,
        running: false,
      },
    });

    addEvent({
      category: 'engine',
      type: 'stop',
      message: 'Engine stopped',
      severity: 'info',
    });
  };

  // Handle failure simulation
  const handleSimulateFailure = (failureType: string) => {
    switch (failureType) {
      case 'engine':
        triggerFailure('engineFailure', !engineFailure);
        break;
      case 'propeller':
        triggerFailure('propellerDamage', !propellerDamage);
        break;
      case 'cooling':
        setCoolantPumpRunning(false);
        addEvent({
          category: 'alarm',
          type: 'coolant_pump_failure',
          message: 'Coolant pump failure',
          severity: 'warning',
        });
        break;
      case 'fuel':
        setFuelPumpRunning(false);
        addEvent({
          category: 'alarm',
          type: 'fuel_pump_failure',
          message: 'Fuel pump failure',
          severity: 'warning',
        });
        break;
    }
  };

  return (
    <div
      className={`${className} bg-gray-800 bg-opacity-80 rounded-lg shadow-lg p-4 border border-gray-700 text-white`}
    >
      <h2 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2">
        Machinery Controls
      </h2>

      {/* Machinery Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-900 p-3 rounded-lg text-center">
          <div className="text-sm opacity-70">Engine Status</div>
          <div className="text-lg font-mono flex items-center justify-center">
            <div
              className={`w-3 h-3 rounded-full ${engineRunning ? 'bg-green-500' : 'bg-red-500'} mr-2`}
            ></div>
            {engineRunning ? 'RUNNING' : 'STOPPED'}
          </div>
        </div>

        <div className="bg-gray-900 p-3 rounded-lg text-center">
          <div className="text-sm opacity-70">Engine Hours</div>
          <div className="text-lg font-mono">
            {(vessel.engineState.hours || 0).toFixed(1)} hrs
          </div>
        </div>

        <div className="bg-gray-900 p-3 rounded-lg text-center">
          <div className="text-sm opacity-70">Engine Health</div>
          <div
            className="text-lg font-mono"
            style={{
              color:
                engineHealth > 0.7
                  ? '#48bb78'
                  : engineHealth > 0.3
                    ? '#ecc94b'
                    : '#f56565',
            }}
          >
            {Math.round(engineHealth * 100)}%
          </div>
        </div>

        <div className="bg-gray-900 p-3 rounded-lg text-center">
          <div className="text-sm opacity-70">Propulsion</div>
          <div
            className="text-lg font-mono"
            style={{
              color:
                propulsionEfficiency > 0.7
                  ? '#48bb78'
                  : propulsionEfficiency > 0.3
                    ? '#ecc94b'
                    : '#f56565',
            }}
          >
            {Math.round(propulsionEfficiency * 100)}%
          </div>
        </div>
      </div>

      {/* Engine Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gauges */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h3 className="font-bold mb-2 text-center">Engine Instruments</h3>

          <div className="flex flex-wrap justify-center gap-4">
            <MachineGauge
              label="RPM"
              value={engineRPM}
              min={0}
              max={1500}
              unit=""
              yellowThreshold={1200}
              redThreshold={1400}
            />

            <MachineGauge
              label="Temperature"
              value={engineTemp}
              min={0}
              max={120}
              unit="°C"
              yellowThreshold={85}
              redThreshold={95}
            />

            <MachineGauge
              label="Oil Press."
              value={oilPressure}
              min={0}
              max={8}
              unit="bar"
              yellowThreshold={2.5}
              redThreshold={2}
            />

            <MachineGauge
              label="Load"
              value={engineLoad * 100}
              min={0}
              max={120}
              unit="%"
              yellowThreshold={90}
              redThreshold={110}
            />
          </div>

          {/* Engine Start/Stop Controls */}
          <div className="mt-4 flex justify-center gap-4">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
              onClick={handleEngineStart}
              disabled={engineRunning}
            >
              Start Engine
            </button>

            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
              onClick={handleEngineStop}
              disabled={!engineRunning}
            >
              Stop Engine
            </button>
          </div>
        </div>

        {/* Schematic View */}
        <div className="bg-gray-900 p-4 rounded-lg lg:col-span-2">
          <h3 className="font-bold mb-2 text-center">Systems Schematic</h3>

          <div className="relative w-full" style={{ height: '350px' }}>
            {/* Fuel System */}
            <Tank
              x={100}
              y={80}
              level={fuelLevel}
              label="Fuel Tank"
              color="#dd6b20"
            />

            <Valve
              x={100}
              y={150}
              isOpen={fuelValveOpen}
              onChange={setFuelValveOpen}
              label="Fuel Valve"
            />

            <Pump
              x={180}
              y={150}
              isRunning={fuelPumpRunning}
              onChange={setFuelPumpRunning}
              health={engineFailure ? 0.2 : 1.0}
              label="Fuel Pump"
            />

            {/* Engine Block */}
            <div
              className="absolute bg-gray-700 border-2 border-gray-600 rounded-md"
              style={{
                left: '250px',
                top: '100px',
                width: '180px',
                height: '150px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                textAlign: 'center',
              }}
            >
              <div className="font-bold text-sm mb-2">Main Engine</div>
              <div className="text-xs mb-2">
                {engineRunning ? 'Running' : 'Stopped'}
              </div>
              <div className="text-xs">{(engineRPM || 0).toFixed(0)} RPM</div>

              {/* Engine health indicator */}
              <div className="mt-3 w-full bg-gray-800 h-3 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${engineHealth * 100}%`,
                    backgroundColor:
                      engineHealth > 0.7
                        ? '#48bb78'
                        : engineHealth > 0.3
                          ? '#ecc94b'
                          : '#f56565',
                  }}
                ></div>
              </div>
            </div>

            {/* Propeller */}
            <div className="absolute" style={{ left: '500px', top: '150px' }}>
              <div className="relative w-16 h-16">
                <div
                  className={`absolute inset-0 rounded-full border-4 border-gray-500 ${propellerDamage ? 'bg-red-900 border-red-700' : 'bg-gray-700'}`}
                ></div>

                <div
                  className="absolute"
                  style={{
                    width: '8px',
                    height: '50px',
                    background: '#a0aec0',
                    left: '50%',
                    top: '50%',
                    marginLeft: '-4px',
                    marginTop: '-25px',
                    borderRadius: '4px',
                    transform: `rotate(${engineRunning ? (Date.now() / 10) % 360 : 0}deg)`,
                    transformOrigin: 'center center',
                    transition: engineRunning
                      ? 'none'
                      : 'transform 1s ease-out',
                  }}
                ></div>

                <div
                  className="absolute"
                  style={{
                    width: '50px',
                    height: '8px',
                    background: '#a0aec0',
                    left: '50%',
                    top: '50%',
                    marginLeft: '-25px',
                    marginTop: '-4px',
                    borderRadius: '4px',
                    transform: `rotate(${engineRunning ? (Date.now() / 10) % 360 : 90}deg)`,
                    transformOrigin: 'center center',
                    transition: engineRunning
                      ? 'none'
                      : 'transform 1s ease-out',
                  }}
                ></div>
              </div>
              <div className="text-xs text-white text-center mt-1">
                Propeller
              </div>
            </div>

            {/* Cooling System */}
            <Tank
              x={100}
              y={270}
              level={0.8}
              label="Coolant"
              color="#3182ce"
              width={50}
              height={80}
            />

            <Valve
              x={170}
              y={270}
              isOpen={coolantValveOpen}
              onChange={setCoolantValveOpen}
              label="Coolant Valve"
            />

            <Pump
              x={230}
              y={270}
              isRunning={coolantPumpRunning}
              onChange={setCoolantPumpRunning}
              label="Coolant Pump"
            />

            {/* Lube Oil System */}
            <Tank
              x={380}
              y={270}
              level={0.7}
              label="Lube Oil"
              color="#9f7f2b"
              width={50}
              height={80}
            />

            <Pump
              x={440}
              y={270}
              isRunning={lubePumpRunning}
              onChange={setLubePumpRunning}
              label="Lube Pump"
            />

            {/* Start Air System */}
            <div
              className="absolute bg-gray-700 border border-gray-600 rounded-full flex items-center justify-center"
              style={{
                left: '520px',
                top: '270px',
                width: '40px',
                height: '40px',
              }}
            >
              <div className="text-xs text-center">Air</div>
            </div>

            <Valve
              x={470}
              y={270}
              isOpen={startAirValveOpen}
              onChange={setStartAirValveOpen}
              label="Start Air"
            />

            {/* Pipe connections */}
            {/* Fuel system connections */}
            <Pipe
              x1={100}
              y1={130}
              x2={100}
              y2={150}
              color="#dd6b20"
              flow={fuelFlow}
              animated
            />
            <Pipe
              x1={100}
              y1={150}
              x2={160}
              y2={150}
              color="#dd6b20"
              flow={fuelFlow}
              animated
            />
            <Pipe
              x1={200}
              y1={150}
              x2={250}
              y2={150}
              color="#dd6b20"
              flow={fuelFlow}
              animated
            />

            {/* Cooling system connections */}
            <Pipe
              x1={125}
              y1={270}
              x2={170}
              y2={270}
              color="#3182ce"
              flow={coolantFlow}
              animated
            />
            <Pipe
              x1={170}
              y1={270}
              x2={210}
              y2={270}
              color="#3182ce"
              flow={coolantFlow}
              animated
            />
            <Pipe
              x1={250}
              y1={270}
              x2={300}
              y2={270}
              color="#3182ce"
              flow={coolantFlow}
              animated
            />
            <Pipe
              x1={300}
              y1={270}
              x2={300}
              y2={180}
              color="#3182ce"
              flow={coolantFlow}
              animated
            />
            <Pipe
              x1={300}
              y1={180}
              x2={250}
              y2={180}
              color="#3182ce"
              flow={coolantFlow}
              animated
            />

            {/* Lube system connections */}
            <Pipe
              x1={380}
              y1={270}
              x2={420}
              y2={270}
              color="#9f7f2b"
              flow={lubeFlow}
              animated
            />
            <Pipe
              x1={460}
              y1={270}
              x2={380}
              y2={200}
              color="#9f7f2b"
              flow={lubeFlow}
              animated
            />
            <Pipe
              x1={380}
              y1={200}
              x2={350}
              y2={200}
              color="#9f7f2b"
              flow={lubeFlow}
              animated
            />
            <Pipe
              x1={350}
              y1={200}
              x2={350}
              y2={180}
              color="#9f7f2b"
              flow={lubeFlow}
              animated
            />
            <Pipe
              x1={350}
              y1={180}
              x2={320}
              y2={180}
              color="#9f7f2b"
              flow={lubeFlow}
              animated
            />

            {/* Start air connections */}
            <Pipe
              x1={520}
              y1={270}
              x2={490}
              y2={270}
              color="#a0aec0"
              flow={startAirFlow}
              animated
            />
            <Pipe
              x1={450}
              y1={270}
              x2={400}
              y2={230}
              color="#a0aec0"
              flow={startAirFlow}
              animated
            />
            <Pipe
              x1={400}
              y1={230}
              x2={400}
              y2={180}
              color="#a0aec0"
              flow={startAirFlow}
              animated
            />
            <Pipe
              x1={400}
              y1={180}
              x2={370}
              y2={180}
              color="#a0aec0"
              flow={startAirFlow}
              animated
            />

            {/* Engine to propeller connection */}
            <Pipe x1={430} y1={150} x2={490} y2={150} width={8} color="#888" />
          </div>
        </div>
      </div>

      {/* Failure Simulation Controls (for testing) */}
      <div className="mt-4 bg-gray-900 p-3 rounded-lg">
        <h3 className="font-bold mb-2">Failure Simulation</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 rounded-md text-white text-sm ${engineFailure ? 'bg-red-700' : 'bg-gray-700'}`}
            onClick={() => handleSimulateFailure('engine')}
          >
            {engineFailure ? 'Fix Engine' : 'Engine Failure'}
          </button>

          <button
            className={`px-3 py-1 rounded-md text-white text-sm ${propellerDamage ? 'bg-red-700' : 'bg-gray-700'}`}
            onClick={() => handleSimulateFailure('propeller')}
          >
            {propellerDamage ? 'Repair Propeller' : 'Propeller Damage'}
          </button>

          <button
            className="px-3 py-1 rounded-md text-white text-sm bg-gray-700"
            onClick={() => handleSimulateFailure('cooling')}
          >
            Cooling Failure
          </button>

          <button
            className="px-3 py-1 rounded-md text-white text-sm bg-gray-700"
            onClick={() => handleSimulateFailure('fuel')}
          >
            Fuel Pump Failure
          </button>
        </div>
      </div>
    </div>
  );
};

export default MachineryPanel;
