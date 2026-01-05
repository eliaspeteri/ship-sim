import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store';
import { getSimulationLoop } from '../simulation';
import { AlarmIndicator } from './alarms/AlarmIndicator';
import { CompassRose } from './CompassRose';
import { TelegraphLever } from './TelegraphLever';
import { CircularGauge } from './CircularGauge';
import RudderAngleIndicator from './RudderAngleIndicator';
import { HelmControl } from './HelmControl';
import socketManager from '../networking/socket';
import { RUDDER_STALL_ANGLE_DEG, clampRudderAngle } from '../constants/vessel';

interface DashboardProps {
  className?: string;
}

// Main Dashboard component
const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const vessel = useStore(state => state.vessel);
  const environment = useStore(state => state.environment);
  const mode = useStore(state => state.mode);

  // Destructure vessel state for easier access
  const {
    position,
    orientation,
    angularVelocity,
    velocity,
    controls,
    engineState,
    alarms,
  } = vessel || {};

  // Control state
  const [throttleLocal, setThrottleLocal] = useState(controls?.throttle || 0);
  const [rudderAngleLocal, setRudderAngleLocal] = useState(
    controls?.rudderAngle || 0,
  );

  // Keep local lever state in sync with store changes (e.g., keyboard input)
  useEffect(() => {
    if (!controls) return;
    setThrottleLocal(controls.throttle ?? 0);
    setRudderAngleLocal(controls.rudderAngle ?? 0);
  }, [controls?.throttle, controls?.rudderAngle, controls]);

  // Track last applied values to prevent redundant updates
  const lastAppliedRef = useRef({
    throttle: controls?.throttle || 0,
    rudderAngle: controls?.rudderAngle || 0,
  });

  // Apply controls whenever throttle or rudder changes, but use a debounce pattern
  useEffect(() => {
    if (mode === 'spectator') return;
    // Skip the effect if controls don't exist
    if (!controls) return;

    // Only apply controls if values actually changed
    if (
      throttleLocal !== lastAppliedRef.current.throttle ||
      rudderAngleLocal !== lastAppliedRef.current.rudderAngle
    ) {
      // Update the reference to current values
      lastAppliedRef.current = {
        throttle: throttleLocal,
        rudderAngle: clampRudderAngle(rudderAngleLocal),
      };

      // Apply the controls directly to the simulation engine
      const simulationLoop = getSimulationLoop();
      try {
        const clampedRudder = clampRudderAngle(rudderAngleLocal);
        simulationLoop.applyControls({
          throttle: throttleLocal,
          rudderAngle: clampedRudder,
          ballast: controls.ballast || 0.5,
        });
        socketManager.sendControlUpdate(throttleLocal, clampedRudder);
      } catch (error) {
        console.error('Error applying controls directly:', error);
      }
    }
  }, [throttleLocal, rudderAngleLocal, controls, mode]);

  // Reset controls only when dashboard unmounts
  useEffect(
    () => () => {
      const state = useStore.getState();
      const ctrl = state.vessel.controls;
      try {
        const simulationLoop = getSimulationLoop();
        simulationLoop.applyControls({
          throttle: 0,
          rudderAngle: 0,
          ballast: ctrl?.ballast || 0.5,
        });
      } catch (error) {
        console.error('Error resetting controls on unmount:', error);
      }
    },
    [],
  );

  const navOffset = 'calc(var(--nav-height, 0px) + 1rem)';
  const panelMaxHeight = 'calc(92vh - var(--nav-height, 0px))';

  return (
    <div className={`${className} pointer-events-none text-white`}>
      <div
        className="fixed left-4 z-30 w-96 space-y-4 rounded-xl bg-gray-900/85 p-4 backdrop-blur pointer-events-auto shadow-lg overflow-y-auto"
        style={{ top: navOffset, maxHeight: panelMaxHeight }}
      >
        <div className="flex items-center justify-between">
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

        <div className="flex justify-center">
          <CompassRose heading={orientation?.heading || 0} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-800/70 p-2 rounded">
            <div className="text-gray-400 text-xs">Position X</div>
            <div className="font-mono">
              {position?.x?.toFixed(1) || '0.0'} m
            </div>
          </div>
          <div className="bg-gray-800/70 p-2 rounded">
            <div className="text-gray-400 text-xs">Position Y</div>
            <div className="font-mono">
              {position?.y?.toFixed(1) || '0.0'} m
            </div>
          </div>
          <div className="bg-gray-800/70 p-2 rounded">
            <div className="text-gray-400 text-xs">Lat</div>
            <div className="font-mono">
              {position?.lat !== undefined ? position.lat.toFixed(6) : '—'}&deg;
            </div>
          </div>
          <div className="bg-gray-800/70 p-2 rounded">
            <div className="text-gray-400 text-xs">Lon</div>
            <div className="font-mono">
              {position?.lon !== undefined ? position.lon.toFixed(6) : '—'}&deg;
            </div>
          </div>
          <div className="bg-gray-800/70 p-2 rounded">
            <div className="text-gray-400 text-xs">Speed</div>
            <div className="font-mono">
              {((velocity?.surge || 0) * 1.94384).toFixed(1)} kts
            </div>
          </div>
          <div className="bg-gray-800/70 p-2 rounded">
            <div className="text-gray-400 text-xs">Sway</div>
            <div className="font-mono">
              {((velocity?.sway || 0) * 1.94384).toFixed(1)} kts
            </div>
          </div>
          <div className="bg-gray-800/70 p-2 rounded">
            <div className="text-gray-400 text-xs">Course</div>
            <div className="font-mono">
              {(() => {
                const deg = ((orientation?.heading || 0) * 180) / Math.PI;
                const normalized = ((deg % 360) + 360) % 360;
                return Math.round(normalized);
              })()}
              ?
            </div>
          </div>
          <div className="bg-gray-800/70 p-2 rounded">
            <div className="text-gray-400 text-xs">Yaw rate</div>
            <div className="font-mono">
              {Math.round(
                (((angularVelocity?.yaw || 0) * 180) / Math.PI) % 360,
              )}
              ?/s
            </div>
          </div>
          <div className="bg-gray-800/70 p-2 rounded">
            <div className="text-gray-400 text-xs">Wind</div>
            <div className="font-mono">
              {environment.wind.speed?.toFixed(1) || '0.0'} m/s @{' '}
              {(((environment.wind.direction || 0) * 180) / Math.PI).toFixed(0)}
              ?
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CircularGauge
            label="Speed"
            value={(velocity?.surge || 0) * 1.94384}
            min={-20}
            max={20}
            unit="kts"
            size={140}
          />
          <CircularGauge
            label="Engine RPM"
            value={engineState?.rpm || 0}
            min={0}
            max={1500}
            unit="rpm"
            size={140}
          />
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 flex items-start gap-6 rounded-2xl bg-gray-900/90 p-4 backdrop-blur pointer-events-auto shadow-2xl">
        <TelegraphLever
          label="Throttle"
          value={throttleLocal}
          min={-1}
          max={1}
          onChange={setThrottleLocal}
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

        <HelmControl
          value={(rudderAngleLocal * 180) / Math.PI}
          minAngle={-RUDDER_STALL_ANGLE_DEG}
          maxAngle={RUDDER_STALL_ANGLE_DEG}
          onChange={deg =>
            setRudderAngleLocal(clampRudderAngle((deg * Math.PI) / 180))
          }
        />

        <RudderAngleIndicator
          angle={(rudderAngleLocal * 180) / Math.PI}
          maxAngle={RUDDER_STALL_ANGLE_DEG}
          size={220}
        />
      </div>
    </div>
  );
};

export default Dashboard;
