import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import useStore from '../store';
import socketManager from '../networking/socket';

interface EnvironmentControlsProps {
  className?: string;
}

const PRESETS = [
  { key: 'calm', label: 'Calm' },
  { key: 'moderate', label: 'Moderate' },
  { key: 'stormy', label: 'Storm' },
  { key: 'hurricane', label: 'Hurricane' },
  { key: 'foggy', label: 'Fog' },
  { key: 'night', label: 'Night' },
];

const EnvironmentControls: React.FC<EnvironmentControlsProps> = ({
  className = '',
}) => {
  const environment = useStore(state => state.environment);
  const roles = useStore(state => state.roles);
  const { data: session } = useSession();
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLastUpdated(Date.now());
    return () => {
      if (feedbackTimer.current) {
        clearTimeout(feedbackTimer.current);
      }
    };
  }, [environment]);

  const isConnected = socketManager.isConnected();
  const isAdmin =
    roles.includes('admin') ||
    (session?.user as { role?: string })?.role === 'admin';

  const metrics = useMemo(() => {
    const windSpeedMs = environment.wind?.speed ?? 0;
    const windDeg = normalizeDegrees(environment.wind?.direction ?? 0);
    const currentSpeed = environment.current?.speed ?? 0;
    const currentDeg = normalizeDegrees(environment.current?.direction ?? 0);
    const seaState = normalizeSeaState(
      environment.seaState ?? seaStateFromWind(windSpeedMs),
    );
    const waveHeight = environment.waveHeight ?? calculateWaveHeight(seaState);
    const visibility = environment.visibility ?? 10;
    const timeOfDay = environment.timeOfDay ?? 12;
    const precipitation = environment.precipitation ?? 'none';
    const precipitationIntensity = environment.precipitationIntensity ?? 0;
    const waterDepth = environment.waterDepth ?? null;

    return {
      windSpeedMs,
      windDeg,
      currentSpeed,
      currentDeg,
      seaState,
      waveHeight,
      visibility,
      timeOfDay,
      precipitation,
      precipitationIntensity,
      waterDepth,
    };
  }, [environment]);

  const handlePreset = (pattern: string) => {
    if (!isAdmin) {
      setFeedback('Only admins can change weather.');
      return;
    }
    if (!isConnected) {
      setFeedback('Socket offline; cannot send preset.');
      return;
    }
    socketManager.sendWeatherControl({ pattern, mode: 'manual' });
    setFeedback(`Sent ${pattern} preset to server`);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3200);
  };

  const summaryLines = [
    `${(metrics.windSpeedMs * 1.94384).toFixed(1)} kt @ ${metrics.windDeg}°`,
    `${metrics.seaState} sea • ${metrics.waveHeight.toFixed(1)} m waves`,
    `${metrics.visibility.toFixed(1)} nm vis • ${formatTimeOfDay(metrics.timeOfDay)}`,
  ];

  const modeBadge =
    environment.name && environment.name.toLowerCase().includes('auto')
      ? 'Auto'
      : 'Preset';

  return (
    <div
      className={`${className} rounded-2xl border border-gray-800 bg-gray-900/80 p-4 text-white shadow-2xl backdrop-blur`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Environment
          </p>
          <p className="text-lg font-semibold">
            {environment.name || 'Live weather feed'}
          </p>
          <p className="text-xs text-gray-400">
            {summaryLines.join(' • ')}
          </p>
          <p className="text-[11px] text-gray-500">
            {lastUpdated ? `Updated ${formatRelativeTime(lastUpdated)}` : 'Waiting for server...'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${
              isConnected
                ? 'bg-emerald-600/80 text-emerald-50'
                : 'bg-red-700/80 text-red-50'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            {isConnected ? 'Connected' : 'Offline'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-700/70 px-3 py-1 text-[11px] font-semibold uppercase text-blue-50">
            {modeBadge}
          </span>
          <button
            type="button"
            onClick={() => setCollapsed(prev => !prev)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-500"
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Metric
              label="Wind"
              value={`${(metrics.windSpeedMs * 1.94384).toFixed(1)} kt`}
              detail={`${metrics.windDeg}° ${degreesToCardinal(metrics.windDeg)}`}
            />
            <Metric
              label="Current"
              value={`${metrics.currentSpeed.toFixed(1)} m/s`}
              detail={`${metrics.currentDeg}° ${degreesToCardinal(metrics.currentDeg)}`}
            />
            <Metric
              label="Sea state"
              value={`${metrics.seaState} / 12`}
              detail={`${metrics.waveHeight.toFixed(1)} m • ${getSeaStateDescription(metrics.seaState)}`}
            />
            <Metric
              label="Visibility"
              value={`${metrics.visibility.toFixed(1)} nm`}
              detail={`Time ${formatTimeOfDay(metrics.timeOfDay)}`}
            />
            <Metric
              label="Precip"
              value={describePrecipitation(
                metrics.precipitation,
                metrics.precipitationIntensity,
              )}
              detail={`Intensity ${(metrics.precipitationIntensity * 100).toFixed(0)}%`}
            />
            <Metric
              label="Depth"
              value={
                metrics.waterDepth !== null
                  ? `${metrics.waterDepth.toFixed(0)} m`
                  : 'N/A'
              }
              detail="Under keel"
            />
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-800/60 bg-gray-900/60 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Admin presets
                </p>
                <p className="text-sm text-gray-200">
                  Push a pattern to the weather server
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                  isAdmin
                    ? 'bg-blue-600/80 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {isAdmin ? 'Admin' : 'View only'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  socketManager.sendWeatherControl({ mode: 'auto' });
                  setFeedback('Server is now picking weather + real-time.');
                  if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
                  feedbackTimer.current = setTimeout(
                    () => setFeedback(null),
                    3200,
                  );
                }}
                disabled={!isAdmin}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  isAdmin
                    ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                    : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                }`}
              >
                Let server decide (auto)
              </button>
              <span className="text-[11px] text-gray-500">
                Presets lock weather/time until you switch back to auto.
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {PRESETS.map(preset => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handlePreset(preset.key)}
                  disabled={!isAdmin}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                    isAdmin
                      ? 'bg-gray-800 text-gray-100 hover:bg-blue-600 hover:text-white'
                      : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              Weather is server-driven; presets send a request and live data will update once the server applies it.
            </p>
            {feedback ? (
              <div className="mt-2 rounded-lg bg-gray-800 px-3 py-2 text-xs text-gray-100">
                {feedback}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentControls;

const Metric = ({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) => (
  <div className="rounded-lg border border-gray-800 bg-gray-800/60 bg-gray-900/70 p-3">
    <p className="text-[11px] uppercase tracking-wide text-gray-400">
      {label}
    </p>
    <p className="text-base font-semibold text-white">{value}</p>
    {detail ? <p className="text-xs text-gray-400">{detail}</p> : null}
  </div>
);

function normalizeDegrees(rad: number): number {
  const deg = (rad * 180) / Math.PI;
  const normalized = ((deg % 360) + 360) % 360;
  return Math.round(normalized);
}

function degreesToCardinal(degrees: number): string {
  const cardinals = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return cardinals[index];
}

function formatTimeOfDay(time: number): string {
  const hours = Math.floor(time);
  const minutes = Math.round((time % 1) * 60);
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const label =
    time >= 5 && time < 8
      ? 'dawn'
      : time >= 8 && time < 18
        ? 'day'
        : time >= 18 && time < 21
          ? 'dusk'
          : 'night';
  return `${hh}:${mm} (${label})`;
}

function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'never';
  const delta = Date.now() - timestamp;
  if (delta < 5000) return 'just now';
  if (delta < 60_000) return `${Math.round(delta / 1000)}s ago`;
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m ago`;
  return `${Math.round(delta / 3_600_000)}h ago`;
}

function getSeaStateDescription(state: number): string {
  const descriptions = [
    'Calm',
    'Light air',
    'Light breeze',
    'Gentle breeze',
    'Moderate breeze',
    'Fresh breeze',
    'Strong breeze',
    'Near gale',
    'Gale',
    'Strong gale',
    'Storm',
    'Violent storm',
    'Hurricane',
  ];
  return descriptions[Math.min(Math.max(state, 0), descriptions.length - 1)];
}

function calculateWaveHeight(state: number): number {
  const waveHeights = [0, 0.1, 0.2, 0.6, 1.5, 2.5, 4, 6, 9, 14, 14, 14, 14];
  return waveHeights[Math.min(Math.max(Math.round(state), 0), waveHeights.length - 1)];
}

function seaStateFromWind(speedMs: number): number {
  return Math.min(Math.round(speedMs / 2.5), 12);
}

function normalizeSeaState(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), 12);
}

function describePrecipitation(
  type: string,
  intensity: number,
): string {
  if (type === 'none') return 'Clear';
  const bucket =
    intensity < 0.3 ? 'Light' : intensity < 0.7 ? 'Moderate' : 'Heavy';
  return `${bucket} ${type}`;
}
