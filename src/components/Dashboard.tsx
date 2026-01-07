import React from 'react';
import useStore from '../store';
import { AlarmIndicator } from './alarms/AlarmIndicator';
import { CompassRose } from './CompassRose';
import { CircularGauge } from './CircularGauge';

interface DashboardProps {
  className?: string;
}

// Compact left-side dashboard (crew + basic nav instruments)
const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const vessel = useStore(state => state.vessel);
  const environment = useStore(state => state.environment);
  const crewIds = useStore(state => state.crewIds);
  const crewNames = useStore(state => state.crewNames);
  const helm = useStore(state => state.vessel.helm);
  const sessionUserId = useStore(state => state.sessionUserId);

  const { position, orientation, velocity, engineState, alarms } = vessel || {};
  const headingRad = orientation?.heading || 0;
  const headingDeg = ((headingRad * 180) / Math.PI + 360) % 360;
  const compassHeadingDeg = (((90 - headingDeg) % 360) + 360) % 360;
  const compassHeadingRad = (compassHeadingDeg * Math.PI) / 180;

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

        <div className="bg-gray-800/70 p-2 rounded">
          <div className="text-gray-400 text-xs mb-1">Crew</div>
          {helm?.userId && (
            <div className="text-[11px] text-amber-300 mb-1">
              Helm: {helm.username || helm.userId}
            </div>
          )}
          {crewIds.length === 0 ? (
            <div className="text-sm text-gray-300">
              You are alone on this vessel
            </div>
          ) : (
            <ul className="text-sm space-y-1">
              {crewIds.map(id => (
                <li key={id} className="flex items-center justify-between">
                  <span className="font-mono text-gray-200">
                    {crewNames[id] || id}
                    {id === helm?.userId ? ' (helm)' : ''}
                    {id === sessionUserId ? ' (you)' : ''}
                  </span>
                  <span className="text-[10px] uppercase text-gray-500">
                    {helm?.userId === id ? 'Helm' : 'Crew'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-center">
          <CompassRose heading={compassHeadingRad} />
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
              {position?.lat !== undefined ? position.lat.toFixed(6) : '—'}°
            </div>
          </div>
          <div className="bg-gray-800/70 p-2 rounded">
            <div className="text-gray-400 text-xs">Lon</div>
            <div className="font-mono">
              {position?.lon !== undefined ? position.lon.toFixed(6) : '—'}°
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
                const heading = orientation?.heading || 0;
                const surge = velocity?.surge || 0;
                const sway = velocity?.sway || 0;
                const worldX =
                  surge * Math.cos(heading) - sway * Math.sin(heading);
                const worldY =
                  surge * Math.sin(heading) + sway * Math.cos(heading);
                const bearing =
                  ((Math.atan2(worldX, worldY) * 180) / Math.PI + 360) % 360;
                return Math.round(bearing);
              })()}
              °
            </div>
          </div>
          <div className="bg-gray-800/70 p-2 rounded">
            <div className="text-gray-400 text-xs">Yaw rate</div>
            <div className="font-mono">
              {(((vessel.angularVelocity?.yaw || 0) * 180) / Math.PI).toFixed(
                2,
              )}
              °/s
            </div>
          </div>
          <div className="bg-gray-800/70 p-2 rounded">
            <div className="text-gray-400 text-xs">Wind</div>
            <div className="font-mono">
              {environment.wind.speed?.toFixed(1) || '0.0'} m/s @{' '}
              {(((environment.wind.direction || 0) * 180) / Math.PI).toFixed(0)}
              °
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
    </div>
  );
};

export default Dashboard;
