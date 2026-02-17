import { useSession } from 'next-auth/react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getApiBase } from '../lib/api';
import {
  applyOffsetToTimeOfDay,
  estimateTimeZoneOffsetHours,
  formatTimeOfDay as formatClockTime,
} from '../lib/time';
import { socketManager } from '../networking/socket';
import useStore from '../store';

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

type EnvironmentEvent = {
  id: string;
  name?: string | null;
  pattern?: string | null;
  runAt: string;
  endAt?: string | null;
  executedAt?: string | null;
  endedAt?: string | null;
  enabled: boolean;
  createdBy?: string | null;
};

const ui = {
  panel:
    'rounded-[18px] border border-[rgba(27,154,170,0.35)] bg-[rgba(10,20,34,0.86)] p-4 text-[var(--ink)] shadow-[0_18px_45px_rgba(2,8,18,0.45)]',
  header: 'flex justify-between gap-4',
  headerMeta: 'flex flex-col items-end gap-2',
  eyebrow:
    'text-[11px] uppercase tracking-[0.2em] text-[rgba(160,179,192,0.7)]',
  title: 'my-1 text-lg font-semibold',
  summary: 'text-xs text-[rgba(180,198,210,0.8)]',
  meta: 'text-[11px] text-[rgba(150,168,182,0.7)]',
  pill: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]',
  pillDot: 'h-2 w-2 rounded-full bg-current',
  pillOk: 'bg-[rgba(32,148,106,0.75)] text-[#e6fff6]',
  pillWarn: 'bg-[rgba(186,88,64,0.8)] text-[#ffe9e3]',
  pillTag: 'bg-[rgba(45,88,142,0.7)] text-[#e3f0ff]',
  collapseButton:
    'cursor-pointer rounded-[10px] border border-[rgba(60,88,104,0.7)] bg-[rgba(18,34,48,0.85)] px-2.5 py-1.5 text-[11px] text-[rgba(226,236,240,0.9)]',
  grid: 'mt-4 grid grid-cols-2 gap-3 max-[900px]:grid-cols-1',
  metricCard:
    'rounded-xl border border-[rgba(27,154,170,0.2)] bg-[rgba(12,28,44,0.7)] p-2.5',
  metricLabel:
    'text-[11px] uppercase tracking-[0.18em] text-[rgba(160,179,192,0.7)]',
  metricValue: 'text-base font-semibold text-[#f2f7f8]',
  metricDetail: 'text-[11px] text-[rgba(170,186,198,0.7)]',
  presetPanel:
    'mt-[18px] rounded-[14px] border border-[rgba(40,60,80,0.6)] bg-[rgba(12,24,38,0.85)] p-3',
  presetHeader: 'flex items-center justify-between',
  presetGrid: 'mt-2.5 grid grid-cols-3 gap-2 max-[900px]:grid-cols-2',
  presetButton:
    'cursor-pointer rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(18,32,46,0.9)] p-2 text-xs text-[rgba(230,238,240,0.9)] disabled:cursor-not-allowed disabled:opacity-50',
  inlineNote: 'mt-2 text-[11px] text-[rgba(150,168,182,0.7)]',
  schedulePanel:
    'mt-4 rounded-[14px] border border-[rgba(40,60,80,0.6)] bg-[rgba(8,18,30,0.9)] p-3',
  scheduleHeader: 'flex items-center justify-between',
  scheduleList: 'mt-2 grid gap-2',
  scheduleItem:
    'flex items-center justify-between gap-3 rounded-[10px] border border-[rgba(30,52,74,0.7)] bg-[rgba(8,18,30,0.8)] px-2.5 py-2',
  scheduleMeta: 'text-xs text-[rgba(210,222,230,0.9)]',
  scheduleSub: 'text-[11px] text-[rgba(150,168,182,0.7)]',
  scheduleForm:
    'mt-2.5 grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 max-[900px]:grid-cols-1',
  input:
    'rounded-[10px] border border-[rgba(50,72,92,0.7)] bg-[rgba(12,24,38,0.9)] px-2 py-1.5 text-xs text-[rgba(230,238,240,0.95)]',
  actionButton:
    'cursor-pointer rounded-[10px] border-none bg-[linear-gradient(135deg,#1b9aaa,#0c6670)] px-3 py-1.5 text-xs font-semibold text-[#eef7f8] disabled:cursor-not-allowed disabled:opacity-60',
  dangerButton:
    'cursor-pointer rounded-lg border border-[rgba(145,65,50,0.7)] bg-[rgba(92,32,24,0.8)] px-2 py-1 text-[11px] text-[#ffdcd4]',
  feedback: 'mt-2 text-[11px] text-[rgba(170,186,198,0.8)]',
} as const;

const EnvironmentControls: React.FC<EnvironmentControlsProps> = ({
  className = '',
}) => {
  const environment = useStore(state => state.environment);
  const roles = useStore(state => state.roles);
  const spaceId = useStore(state => state.spaceId);
  const spaceInfo = useStore(state => state.spaceInfo);
  const vesselPosition = useStore(state => state.vessel.position);
  const { data: session } = useSession();
  const apiBase = useMemo(() => getApiBase(), []);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [events, setEvents] = useState<EnvironmentEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [scheduleName, setScheduleName] = useState('');
  const [schedulePattern, setSchedulePattern] = useState(PRESETS[0]?.key || '');
  const [scheduleTime, setScheduleTime] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 30 * 60 * 1000)),
  );
  const [scheduleEndTime, setScheduleEndTime] = useState('');

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
  const isHost = spaceInfo?.role === 'host';
  const canManageWeather = isAdmin || isHost;

  const metrics = useMemo(() => {
    const windSpeedMs = environment.wind?.speed ?? 0;
    const windDeg = normalizeDegrees(environment.wind?.direction ?? 0);
    const currentSpeed = environment.current?.speed ?? 0;
    const currentDeg = normalizeDegrees(environment.current?.direction ?? 0);
    const seaState = normalizeSeaState(
      environment.seaState ?? seaStateFromWind(windSpeedMs),
    );
    const waveHeight = calculateWaveHeight(seaState);
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

  const timeZone = useMemo(
    () => estimateTimeZoneOffsetHours(vesselPosition?.lon),
    [vesselPosition?.lon],
  );
  const localTime = useMemo(() => {
    const base = environment.timeOfDay ?? 12;
    if (!timeZone) return base;
    return applyOffsetToTimeOfDay(base, timeZone.offsetHours);
  }, [environment.timeOfDay, timeZone]);
  const timeLabel = useMemo(() => {
    const part = describeDayPart(localTime);
    return `${formatClockTime(localTime)} (${part})`;
  }, [localTime]);
  const timeZoneLabel = timeZone?.label || 'UTC';

  const handlePreset = (pattern: string) => {
    if (!canManageWeather) {
      setFeedback('Only hosts or admins can change weather.');
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

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const res = await fetch(
        `${apiBase}/api/environment/events?spaceId=${spaceId}`,
        {
          credentials: 'include',
        },
      );
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      const data = await res.json();
      const nextEvents = Array.isArray(data?.events) ? data.events : [];
      setEvents(nextEvents);
    } catch (err) {
      console.error('Failed to load environment events', err);
      setEventsError('Unable to load scheduled events.');
    } finally {
      setEventsLoading(false);
    }
  }, [apiBase, spaceId]);

  const createEvent = async () => {
    if (!canManageWeather) {
      setEventsError('Not authorized to schedule events.');
      return;
    }
    setEventsLoading(true);
    setEventsError(null);
    try {
      const runAt = new Date(scheduleTime);
      if (Number.isNaN(runAt.getTime())) {
        setEventsError('Select a valid time for the event.');
        return;
      }
      const endAt = scheduleEndTime ? new Date(scheduleEndTime) : null;
      if (scheduleEndTime && Number.isNaN(endAt?.getTime() ?? NaN)) {
        setEventsError('Select a valid end time for the event.');
        return;
      }
      if (endAt && endAt <= runAt) {
        setEventsError('End time must be after the start time.');
        return;
      }
      const res = await fetch(`${apiBase}/api/environment/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          spaceId,
          name: scheduleName.trim() || null,
          pattern: schedulePattern || null,
          runAt: runAt.toISOString(),
          endAt: endAt ? endAt.toISOString() : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      const created = await res.json();
      setEvents(prev => [...prev, created].sort(sortEvents));
      setScheduleName('');
      setScheduleTime(toLocalInputValue(new Date(Date.now() + 30 * 60 * 1000)));
      setScheduleEndTime('');
    } catch (err) {
      console.error('Failed to schedule environment event', err);
      setEventsError(
        err instanceof Error ? err.message : 'Unable to schedule event.',
      );
    } finally {
      setEventsLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!canManageWeather) return;
    setEventsLoading(true);
    setEventsError(null);
    try {
      const res = await fetch(`${apiBase}/api/environment/events/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      console.error('Failed to delete environment event', err);
      setEventsError(
        err instanceof Error ? err.message : 'Unable to delete event.',
      );
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (!collapsed && canManageWeather) {
      void loadEvents();
    }
  }, [collapsed, canManageWeather, loadEvents, spaceId]);

  const summaryLines = [
    `${(metrics.windSpeedMs * 1.94384).toFixed(1)} kt @ ${metrics.windDeg}°`,
    `${metrics.seaState} sea • ${metrics.waveHeight.toFixed(1)} m waves`,
    `${metrics.visibility.toFixed(1)} nm vis • ${timeLabel} ${timeZoneLabel}`,
  ];

  const modeBadge =
    environment.name && environment.name.toLowerCase().includes('auto')
      ? 'Auto'
      : 'Preset';

  return (
    <div className={`${ui.panel} ${className}`}>
      <div className={ui.header}>
        <div>
          <div className={ui.eyebrow}>Environment</div>
          <div className={ui.title}>
            {environment.name || 'Live weather feed'}
          </div>
          <div className={ui.summary}>{summaryLines.join(' • ')}</div>
          <div className={ui.meta}>
            {lastUpdated
              ? `Updated ${formatRelativeTime(lastUpdated)}`
              : 'Waiting for server...'}
          </div>
        </div>
        <div className={ui.headerMeta}>
          <div
            className={`${ui.pill} ${isConnected ? ui.pillOk : ui.pillWarn}`}
          >
            <span className={ui.pillDot} />
            {isConnected ? 'Connected' : 'Offline'}
          </div>
          <div className={`${ui.pill} ${ui.pillTag}`}>{modeBadge}</div>
          <div className={`${ui.pill} ${ui.pillTag}`}>
            {spaceInfo?.name || spaceId}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(prev => !prev)}
            className={ui.collapseButton}
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>

      {!collapsed ? (
        <>
          <div className={ui.grid}>
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
              detail={`Time ${timeLabel} ${timeZoneLabel}`}
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

          <div className={ui.presetPanel}>
            <div className={ui.presetHeader}>
              <div>
                <div className={ui.eyebrow}>Weather presets</div>
                <div className={ui.summary}>
                  Push a pattern to the server for this space
                </div>
              </div>
              <div className={`${ui.pill} ${ui.pillTag}`}>
                {isAdmin ? 'Admin' : isHost ? 'Host' : 'View only'}
              </div>
            </div>
            <div className={ui.presetGrid}>
              {PRESETS.map(preset => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handlePreset(preset.key)}
                  disabled={!canManageWeather}
                  className={ui.presetButton}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className={ui.inlineNote}>
              Presets lock weather/time until you switch back to auto.
            </div>
            <div className={ui.inlineNote}>
              {canManageWeather
                ? 'Controls unlocked for space hosts and admins.'
                : 'Ask a space host or admin to adjust conditions.'}
            </div>
            <button
              type="button"
              onClick={() => {
                if (!canManageWeather) {
                  setFeedback('Only hosts or admins can change weather.');
                  return;
                }
                socketManager.sendWeatherControl({ mode: 'auto' });
                setFeedback('Server is now picking weather + real-time.');
                if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
                feedbackTimer.current = setTimeout(
                  () => setFeedback(null),
                  3200,
                );
              }}
              disabled={!canManageWeather}
              className={ui.actionButton}
            >
              Return to auto
            </button>
            {feedback ? <div className={ui.feedback}>{feedback}</div> : null}
          </div>

          <div className={ui.schedulePanel}>
            <div className={ui.scheduleHeader}>
              <div>
                <div className={ui.eyebrow}>Timed events</div>
                <div className={ui.summary}>
                  Schedule environment presets by local time
                </div>
              </div>
              <div className={`${ui.pill} ${ui.pillTag}`}>{timeZoneLabel}</div>
            </div>
            {eventsLoading ? (
              <div className={ui.feedback}>Loading schedule…</div>
            ) : null}
            {eventsError ? (
              <div className={ui.feedback}>{eventsError}</div>
            ) : null}
            <div className={ui.scheduleList}>
              {events.length === 0 ? (
                <div className={ui.feedback}>No scheduled events yet.</div>
              ) : (
                events.map(event => (
                  <div key={event.id} className={ui.scheduleItem}>
                    <div>
                      <div className={ui.scheduleMeta}>
                        {event.name || event.pattern || 'Scheduled preset'}
                      </div>
                      <div className={ui.scheduleSub}>
                        {formatEventTime(event.runAt, timeZone?.offsetHours)}
                        {event.endAt
                          ? ` → ${formatEventTime(
                              event.endAt,
                              timeZone?.offsetHours,
                            )}`
                          : ''}
                      </div>
                    </div>
                    <div>
                      <span className={`${ui.pill} ${ui.pillTag}`}>
                        {event.endedAt
                          ? 'Ended'
                          : event.executedAt
                            ? 'Active'
                            : 'Scheduled'}
                      </span>
                      {canManageWeather ? (
                        <button
                          type="button"
                          onClick={() => void deleteEvent(event.id)}
                          className={ui.dangerButton}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className={ui.scheduleForm}>
              <input
                className={ui.input}
                value={scheduleName}
                onChange={e => setScheduleName(e.target.value)}
                placeholder="Event label (optional)"
                disabled={!canManageWeather}
              />
              <select
                className={ui.input}
                value={schedulePattern}
                onChange={e => setSchedulePattern(e.target.value)}
                disabled={!canManageWeather}
              >
                {PRESETS.map(preset => (
                  <option key={preset.key} value={preset.key}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <input
                className={ui.input}
                type="datetime-local"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                disabled={!canManageWeather}
              />
              <input
                className={ui.input}
                type="datetime-local"
                value={scheduleEndTime}
                onChange={e => setScheduleEndTime(e.target.value)}
                placeholder="End time (optional)"
                disabled={!canManageWeather}
              />
              <button
                type="button"
                className={ui.actionButton}
                onClick={() => void createEvent()}
                disabled={!canManageWeather}
              >
                Schedule
              </button>
            </div>
            <div className={ui.inlineNote}>
              Times are scheduled in your browser locale; display adapts to the
              vessel&apos;s inferred time zone. End times restore the prior
              weather snapshot or fall back to auto if missing.
            </div>
          </div>
        </>
      ) : null}
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
  <div className={ui.metricCard}>
    <div className={ui.metricLabel}>{label}</div>
    <div className={ui.metricValue}>{value}</div>
    {detail ? <div className={ui.metricDetail}>{detail}</div> : null}
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
  const waveHeight =
    waveHeights[
      Math.min(Math.max(Math.round(state), 0), waveHeights.length - 1)
    ];

  return waveHeight;
}

function seaStateFromWind(speedMs: number): number {
  return Math.min(Math.round(speedMs / 2.5), 12);
}

function normalizeSeaState(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), 12);
}

function describePrecipitation(type: string, intensity: number): string {
  if (type === 'none') return 'Clear';
  const bucket =
    intensity < 0.3 ? 'Light' : intensity < 0.7 ? 'Moderate' : 'Heavy';
  return `${bucket} ${type}`;
}

function describeDayPart(time: number): string {
  if (time >= 5 && time < 8) return 'dawn';
  if (time >= 8 && time < 18) return 'day';
  if (time >= 18 && time < 21) return 'dusk';
  return 'night';
}

function formatEventTime(runAt: string, offsetHours?: number): string {
  const base = new Date(runAt).getTime();
  if (!Number.isFinite(base)) return 'Invalid time';
  const adjusted =
    offsetHours !== undefined ? base + offsetHours * 60 * 60 * 1000 : base;
  return new Date(adjusted).toISOString().replace('T', ' ').slice(0, 16);
}

function toLocalInputValue(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function sortEvents(a: EnvironmentEvent, b: EnvironmentEvent): number {
  return new Date(a.runAt).getTime() - new Date(b.runAt).getTime();
}
