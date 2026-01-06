import React, { useMemo, useState } from 'react';
import EnvironmentControls from './EnvironmentControls';
import useStore from '../store';

type HudTab = 'navigation' | 'weather' | 'systems';

const tabs: { id: HudTab; label: string }[] = [
  { id: 'navigation', label: 'Navigation' },
  { id: 'weather', label: 'Weather' },
  { id: 'systems', label: 'Systems' },
];

const formatDegrees = (rad?: number) => {
  if (rad === undefined) return '—';
  const deg = (rad * 180) / Math.PI;
  const normalized = ((deg % 360) + 360) % 360;
  return `${Math.round(normalized)}°`;
};

const formatKnots = (val?: number) =>
  `${((val || 0) * 1.94384).toFixed(1)} kts`;

export function HudDrawer() {
  const [tab, setTab] = useState<HudTab>('navigation');
  const vessel = useStore(state => state.vessel);
  const environment = useStore(state => state.environment);
  const mode = useStore(state => state.mode);
  const helm = vessel.helm;

  const navStats = useMemo(
    () => [
      {
        label: 'Heading',
        value: formatDegrees(vessel.orientation.heading),
      },
      {
        label: 'Speed',
        value: formatKnots(vessel.velocity.surge),
      },
      {
        label: 'Rudder',
        value: `${((vessel.controls.rudderAngle || 0) * 180) / Math.PI > 0 ? '+' : ''}${(
          ((vessel.controls.rudderAngle || 0) * 180) /
          Math.PI
        ).toFixed(1)}°`,
      },
      {
        label: 'Throttle',
        value: `${((vessel.controls.throttle || 0) * 100).toFixed(0)}%`,
      },
      {
        label: 'Ballast',
        value: `${((vessel.controls.ballast || 0.5) * 100).toFixed(0)}%`,
      },
      {
        label: 'Sea state',
        value: `${Math.round(environment.seaState ?? 0)}`,
        detail: `${(environment.waveHeight ?? 0).toFixed(1)} m waves`,
      },
      {
        label: 'Time',
        value: formatTime(environment.timeOfDay ?? 12),
        detail: 'UTC',
      },
      {
        label: 'Wind',
        value: `${formatKnots(environment.wind.speed)} @ ${formatDegrees(environment.wind.direction)}`,
      },
    ],
    [
      environment.seaState,
      environment.timeOfDay,
      environment.waveHeight,
      environment.wind.direction,
      environment.wind.speed,
      vessel.controls.ballast,
      vessel.controls.rudderAngle,
      vessel.controls.throttle,
      vessel.orientation.heading,
      vessel.velocity.surge,
    ],
  );

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-40 w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-800 bg-gray-900/85 text-white shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            HUD
          </p>
          <p className="text-sm text-gray-200">
            {mode === 'spectator' ? 'Spectator' : 'Player'} mode
            {helm?.userId ? ` • Helm: ${helm.username || helm.userId}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-750'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[320px] overflow-y-auto border-t border-gray-800 p-4">
        {tab === 'navigation' ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {navStats.map(stat => (
              <div
                key={stat.label}
                className="rounded-lg border border-gray-800 bg-gray-800/60 px-3 py-2"
              >
                <div className="text-[11px] uppercase tracking-wide text-gray-400">
                  {stat.label}
                </div>
                <div className="text-base font-semibold">{stat.value}</div>
                {stat.detail ? (
                  <div className="text-xs text-gray-400">{stat.detail}</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        {tab === 'weather' ? (
          <EnvironmentControls />
        ) : null}
        {tab === 'systems' ? (
          <div className="rounded-lg border border-gray-800 bg-gray-800/60 p-3 text-sm text-gray-300">
            Systems, fuel, ballast, and electrics panels will live here. For now,
            use the dashboard controls while this drawer is built out.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatTime(time: number): string {
  const hours = Math.floor(time);
  const minutes = Math.round((time % 1) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
}
