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
  const engineState = vessel.engineState;
  const engineRunning = engineState.running;
  const engineRPM = engineState.rpm;
  const engineLoad = engineState.load;
  const fuelLevel = engineState.fuelLevel;
  const fuelConsumption = engineState.fuelConsumption;
  const engineTemp = engineState.temperature;
  const oilPressure = engineState.oilPressure;

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
    // Store previous values to prevent unnecessary updates
    const prevValues = {
      engineRunning: engineRunning,
      engineTemp: engineTemp,
      oilPressure: oilPressure,
    };

    // In a real system, we'd update the engine state based on all these factors
    // For now, let's implement a simple logic:

    // If fuel system fails, engine stops
    if (!fuelValveOpen || !fuelPumpRunning || fuelLevel <= 0.05) {
      if (engineRunning && prevValues.engineRunning) {
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

        setTimeout(() => {
          // Only apply controls to stop the engine if it's currently running
          applyVesselControls({
            throttle: 0,
            rudderAngle: vessel.controls?.rudderAngle || 0,
            ballast: vessel.controls?.ballast || 0.5,
          });

          // Update engine running state directly to prevent loops
          useStore.getState().updateVessel({
            engineState: {
              ...vessel.engineState,
              running: false,
            },
          });
        }, 0);
      }
    }

    // If cooling system fails, temperature rises
    if (
      (!coolantValveOpen || !coolantPumpRunning) &&
      engineRunning &&
      engineRPM > 100
    ) {
      // Use a separate interval ID for each effect type
      const tempInterval = setInterval(() => {
        const currentTemp = vessel.engineState.temperature;
        if (currentTemp < 120) {
          // Max temp
          // Temperature rises faster with higher RPM
          const tempIncrease = (engineRPM / 1000) * 0.5;
          const newTemp = currentTemp + tempIncrease;

          // Only update if temperature actually changed significantly
          if (Math.abs(newTemp - currentTemp) > 0.1) {
            // Update vessel engine temperature
            useStore.getState().updateVessel({
              engineState: {
                ...vessel.engineState,
                temperature: newTemp,
              },
            });

            // If temperature gets too high, trigger overheat alarm
            if (newTemp > 95 && currentTemp <= 95) {
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
        }
      }, 1000); // Update every second

      // Clear the interval on cleanup
      return () => clearInterval(tempInterval);
    }

    // If lube oil system fails, pressure drops
    if (!lubePumpRunning && engineRunning) {
      // Decrease oil pressure simulation
      const pressureInterval = setInterval(() => {
        const currentPressure = vessel.engineState.oilPressure;
        if (currentPressure > 0.5) {
          const newPressure = currentPressure - 0.2;

          // Only update if pressure actually changed significantly
          if (Math.abs(newPressure - currentPressure) > 0.05) {
            // Update vessel oil pressure
            useStore.getState().updateVessel({
              engineState: {
                ...vessel.engineState,
                oilPressure: newPressure,
              },
            });

            // If pressure gets too low, trigger alarm
            if (newPressure < 2.0 && currentPressure >= 2.0) {
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
        }
      }, 1000);

      // Clear the interval on cleanup
      return () => clearInterval(pressureInterval);
    }

    // Cleanup function to reset alarms when component unmounts
    return () => {
      console.info('Cleaning up machinery panel...');
      useStore.getState().updateVessel({
        alarms: {
          ...vessel.alarms,
          engineOverheat: false,
          lowOilPressure: false,
        },
      });
    };
  }, [
    fuelValveOpen,
    fuelPumpRunning,
    coolantValveOpen,
    coolantPumpRunning,
    lubePumpRunning,
    // Remove vessel from dependencies to prevent constant rerenders
    // Note: we use getState() to access the latest vessel state
    engineRunning,
    engineRPM,
    fuelLevel,
    addEvent,
  ]);

  /**
   * Handle engine start
   */
  const handleStartEngine = () => {
    if (!engineState) return;

    // Need air and fuel to start
    if (!startAirValveOpen || fuelValveOpen === false) {
      if (!startAirValveOpen) {
        addEvent({
          category: 'engine',
          type: 'engine_start_failed',
          message: 'Engine start failed: Start air valve closed',
          severity: 'warning',
        });
      }

      if (fuelValveOpen === false) {
        addEvent({
          category: 'engine',
          type: 'engine_start_failed',
          message: 'Engine start failed: Fuel valve closed',
          severity: 'warning',
        });
      }
      return;
    }

    // Directly update WASM engine state
    const vesselPtr = useStore.getState().wasmVesselPtr;
    const wasmExports = (window as any).wasmExports;

    if (
      vesselPtr !== null &&
      wasmExports &&
      typeof wasmExports.setEngineRunning === 'function'
    ) {
      console.info('Setting engine running state to TRUE in WASM');
      wasmExports.setEngineRunning(vesselPtr, true);
    } else {
      console.warn(
        'Could not set engine running state in WASM - missing exports or functions',
      );
    }

    // Update UI state
    useStore.getState().updateVessel({
      engineState: {
        ...engineState,
        running: true,
      },
    });

    // Log the event
    addEvent({
      category: 'engine',
      type: 'engine_start',
      message: 'Engine started',
      severity: 'info',
    });
  };

  /**
   * Handle engine stop
   */
  const handleStopEngine = () => {
    if (!engineState) return;

    // Directly update WASM engine state
    const vesselPtr = useStore.getState().wasmVesselPtr;
    const wasmExports = (window as any).wasmExports;

    if (
      vesselPtr !== null &&
      wasmExports &&
      typeof wasmExports.setEngineRunning === 'function'
    ) {
      console.info('Setting engine running state to FALSE in WASM');
      wasmExports.setEngineRunning(vesselPtr, false);
    } else {
      console.warn(
        'Could not set engine running state in WASM - missing exports or functions',
      );
    }

    // Update UI state
    useStore.getState().updateVessel({
      engineState: {
        ...engineState,
        running: false,
        rpm: 0,
      },
    });

    // Log the event
    addEvent({
      category: 'engine',
      type: 'engine_stop',
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
              label="Engine RPM"
              value={engineRPM}
              min={0}
              max={1500}
              unit="rpm"
              zones={[
                { color: '#48bb78', max: 1200 }, // Green up to 1200
                { color: '#ecc94b', min: 1200, max: 1400 }, // Yellow 1200-1400
                { color: '#f56565', min: 1400 }, // Red above 1400
              ]}
              numLabels={7} // Show 0, 250, 500, 750, 1000, 1250, 1500
              size={150}
            />

            <MachineGauge
              label="Coolant Temp"
              value={engineTemp}
              min={0}
              max={120}
              unit="°C"
              zones={[
                { color: '#ecc94b', max: 75 }, // Yellow below 75
                { color: '#48bb78', min: 75, max: 90 }, // Green 75-90
                { color: '#f56565', min: 90 }, // Red above 90
              ]}
              numLabels={7} // 0, 20, 40, 60, 80, 100, 120
              size={150}
            />

            <MachineGauge
              label="Oil Pressure"
              value={oilPressure}
              min={0}
              max={8}
              unit="bar"
              zones={[
                { color: '#f56565', max: 1 }, // Red below 1
                { color: '#ecc94b', min: 1, max: 2 }, // Yellow between 1 and 2
                { color: '#48bb78', min: 2, max: 6 }, // Green between 2 and 6
                { color: '#ecc94b', min: 6 }, // Yellow above 6
              ]}
              numLabels={9} // Show labels 0, 1, 2, 3, 4, 5, 6, 7, 8
              size={150} // Make it larger
            />

            <MachineGauge
              label="Load"
              value={engineLoad * 100}
              min={0}
              max={120}
              unit="%"
              size={150}
              zones={[
                { color: '#48bb78', max: 80 }, // Green below 80%
                { color: '#ecc94b', min: 80, max: 100 }, // Yellow between 80% and 100%
                { color: '#f56565', min: 100 }, // Red above 100%
              ]}
            />
          </div>

          {/* Engine Start/Stop Controls */}
          <div className="mt-4 flex justify-center gap-4">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
              onClick={handleStartEngine}
              disabled={engineRunning}
            >
              Start Engine
            </button>

            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
              onClick={handleStopEngine}
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
