import React, { useMemo } from 'react';

import useStore from '../store';
import { AlarmIndicator } from './alarms/AlarmIndicator';
import { CircularGauge } from './CircularGauge';
import { CompassRose } from './CompassRose';
import {
  courseFromWorldVelocity,
  speedFromWorldVelocity,
  worldVelocityFromBody,
} from '../lib/position';

interface DashboardProps {
  className?: string;
}

const ui = {
  root: 'pointer-events-none text-[#f1f7f8]',
  panel:
    'pointer-events-auto fixed left-4 z-30 flex w-[min(384px,92vw)] flex-col gap-4 overflow-y-auto rounded-2xl bg-[rgba(9,15,23,0.88)] p-4 shadow-[0_18px_44px_rgba(4,10,18,0.55)] backdrop-blur-[12px] max-[900px]:landscape:left-2 max-[900px]:landscape:w-[min(320px,60vw)] max-[900px]:landscape:gap-3 max-[900px]:landscape:p-3',
  alarmRow: 'flex flex-wrap items-center justify-between gap-2',
  crewCard: 'rounded-xl bg-[rgba(16,28,42,0.7)] px-3 py-2.5',
  crewTitle:
    'mb-1.5 text-[11px] uppercase tracking-[0.18em] text-[rgba(160,179,192,0.7)]',
  crewHint: 'text-xs text-[rgba(200,214,226,0.8)]',
  crewList: 'm-0 grid list-none gap-1.5 p-0',
  crewRow: 'flex items-center justify-between gap-2',
  crewName: 'font-mono text-xs text-[rgba(226,234,240,0.95)]',
  crewRole:
    'text-[10px] uppercase tracking-[0.12em] text-[rgba(150,170,180,0.7)]',
  compassWrap:
    'flex justify-center max-[900px]:landscape:origin-top max-[900px]:landscape:scale-[0.85]',
  statGrid: 'grid grid-cols-2 gap-3 max-[900px]:landscape:gap-2',
  statCard: 'rounded-[10px] bg-[rgba(16,28,42,0.7)] px-2.5 py-2',
  statLabel:
    'text-[11px] uppercase tracking-[0.14em] text-[rgba(160,179,192,0.7)]',
  statValue:
    'mt-1 font-mono text-[13px] text-[rgba(236,242,246,0.95)] max-[900px]:landscape:text-xs',
  gaugeGrid:
    'grid grid-cols-2 justify-items-center gap-3 max-[900px]:landscape:grid-cols-1 max-[900px]:landscape:gap-2',
} as const;

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
  const currentVector = useMemo(() => {
    const speed = environment.current?.speed ?? 0;
    const direction = environment.current?.direction ?? 0;
    return {
      x: speed * Math.cos(direction),
      y: speed * Math.sin(direction),
    };
  }, [environment]);
  const worldVelocity = useMemo(() => {
    const base = worldVelocityFromBody(headingRad, velocity ?? {});
    return {
      x: base.x + currentVector.x,
      y: base.y + currentVector.y,
    };
  }, [currentVector.x, currentVector.y, headingRad, velocity]);
  const speedRaw = speedFromWorldVelocity(worldVelocity);
  const speedMs = Number.isFinite(speedRaw) ? speedRaw : 0;
  const courseRaw = courseFromWorldVelocity(worldVelocity);
  const courseDeg =
    speedMs > 0.05 && Number.isFinite(courseRaw)
      ? courseRaw
      : compassHeadingDeg;

  const navOffset = 'calc(var(--nav-height, 0px) + 1rem)';
  const panelMaxHeight = 'calc(92vh - var(--nav-height, 0px))';

  return (
    <div className={`${ui.root} ${className}`}>
      <div
        className={ui.panel}
        style={{ top: navOffset, maxHeight: panelMaxHeight }}
      >
        <div className={ui.alarmRow}>
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

        <div className={ui.crewCard}>
          <div className={ui.crewTitle}>Crew</div>
          {helm?.userId && (
            <div className={ui.crewHint}>
              Helm: {helm.username || helm.userId}
            </div>
          )}
          {crewIds.length === 0 ? (
            <div className={ui.crewHint}>You are alone on this vessel</div>
          ) : (
            <ul className={ui.crewList}>
              {crewIds.map(id => (
                <li key={id} className={ui.crewRow}>
                  <span className={ui.crewName}>
                    {crewNames[id] || id}
                    {id === helm?.userId ? ' (helm)' : ''}
                    {id === sessionUserId ? ' (you)' : ''}
                  </span>
                  <span className={ui.crewRole}>
                    {helm?.userId === id ? 'Helm' : 'Crew'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={ui.compassWrap}>
          <CompassRose heading={compassHeadingRad} />
        </div>

        <div className={ui.statGrid}>
          <div className={ui.statCard}>
            <div className={ui.statLabel}>Lat</div>
            <div className={ui.statValue}>
              {position?.lat !== undefined ? position.lat.toFixed(6) : '—'}°
            </div>
          </div>
          <div className={ui.statCard}>
            <div className={ui.statLabel}>Lon</div>
            <div className={ui.statValue}>
              {position?.lon !== undefined ? position.lon.toFixed(6) : '—'}°
            </div>
          </div>
          <div className={ui.statCard}>
            <div className={ui.statLabel}>SOG</div>
            <div className={ui.statValue}>
              {(speedMs * 1.94384).toFixed(1)} kts
            </div>
          </div>
          <div className={ui.statCard}>
            <div className={ui.statLabel}>Sway</div>
            <div className={ui.statValue}>
              {((velocity?.sway || 0) * 1.94384).toFixed(1)} kts
            </div>
          </div>
          <div className={ui.statCard}>
            <div className={ui.statLabel}>Course</div>
            <div className={ui.statValue}>{Math.round(courseDeg)}°</div>
          </div>
          <div className={ui.statCard}>
            <div className={ui.statLabel}>Yaw rate</div>
            <div className={ui.statValue}>
              {(((vessel.angularVelocity?.yaw || 0) * 180) / Math.PI).toFixed(
                2,
              )}
              °/s
            </div>
          </div>
          <div className={ui.statCard}>
            <div className={ui.statLabel}>Wind</div>
            <div className={ui.statValue}>
              {environment.wind.speed?.toFixed(1) || '0.0'} m/s @{' '}
              {(((environment.wind.direction || 0) * 180) / Math.PI).toFixed(0)}
              °
            </div>
          </div>
        </div>

        <div className={ui.gaugeGrid}>
          <CircularGauge
            label="SOG"
            value={speedMs * 1.94384}
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
