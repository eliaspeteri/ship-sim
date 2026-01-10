import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import useStore from '../store';
import socketManager from '../networking/socket';
import {
  applyOffsetToTimeOfDay,
  estimateTimeZoneOffsetHours,
  formatTimeOfDay as formatClockTime,
} from '../lib/time';
import { getApiBase } from '../lib/api';
import styles from './EnvironmentControls.module.css';

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

  const loadEvents = async () => {
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
  };

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
  }, [collapsed, canManageWeather, spaceId]);

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
    <div className={`${styles.panel} ${className}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Environment</div>
          <div className={styles.title}>
            {environment.name || 'Live weather feed'}
          </div>
          <div className={styles.summary}>{summaryLines.join(' • ')}</div>
          <div className={styles.meta}>
            {lastUpdated
              ? `Updated ${formatRelativeTime(lastUpdated)}`
              : 'Waiting for server...'}
          </div>
        </div>
        <div className={styles.headerMeta}>
          <div
            className={`${styles.pill} ${
              isConnected ? styles.pillOk : styles.pillWarn
            }`}
          >
            <span className={styles.pillDot} />
            {isConnected ? 'Connected' : 'Offline'}
          </div>
          <div className={`${styles.pill} ${styles.pillTag}`}>{modeBadge}</div>
          <div className={`${styles.pill} ${styles.pillTag}`}>
            {spaceInfo?.name || spaceId}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(prev => !prev)}
            className={styles.collapseButton}
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>

      {!collapsed ? (
        <>
          <div className={styles.grid}>
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

          <div className={styles.presetPanel}>
            <div className={styles.presetHeader}>
              <div>
                <div className={styles.eyebrow}>Weather presets</div>
                <div className={styles.summary}>
                  Push a pattern to the server for this space
                </div>
              </div>
              <div className={`${styles.pill} ${styles.pillTag}`}>
                {isAdmin ? 'Admin' : isHost ? 'Host' : 'View only'}
              </div>
            </div>
            <div className={styles.presetGrid}>
              {PRESETS.map(preset => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handlePreset(preset.key)}
                  disabled={!canManageWeather}
                  className={styles.presetButton}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className={styles.inlineNote}>
              Presets lock weather/time until you switch back to auto.
            </div>
            <div className={styles.inlineNote}>
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
              className={styles.actionButton}
            >
              Return to auto
            </button>
            {feedback ? (
              <div className={styles.feedback}>{feedback}</div>
            ) : null}
          </div>

          <div className={styles.schedulePanel}>
            <div className={styles.scheduleHeader}>
              <div>
                <div className={styles.eyebrow}>Timed events</div>
                <div className={styles.summary}>
                  Schedule environment presets by local time
                </div>
              </div>
              <div className={`${styles.pill} ${styles.pillTag}`}>
                {timeZoneLabel}
              </div>
            </div>
            {eventsLoading ? (
              <div className={styles.feedback}>Loading schedule…</div>
            ) : null}
            {eventsError ? (
              <div className={styles.feedback}>{eventsError}</div>
            ) : null}
            <div className={styles.scheduleList}>
              {events.length === 0 ? (
                <div className={styles.feedback}>No scheduled events yet.</div>
              ) : (
                events.map(event => (
                  <div key={event.id} className={styles.scheduleItem}>
                    <div>
                      <div className={styles.scheduleMeta}>
                        {event.name || event.pattern || 'Scheduled preset'}
                      </div>
                      <div className={styles.scheduleSub}>
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
                      <span className={`${styles.pill} ${styles.pillTag}`}>
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
                          className={styles.dangerButton}
                        >
                          Remove
                        </button>
                      ) : (
                        <span className={`${styles.pill} ${styles.pillTag}`}>
                          View
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className={styles.scheduleForm}>
              <input
                className={styles.input}
                value={scheduleName}
                onChange={e => setScheduleName(e.target.value)}
                placeholder="Event label (optional)"
                disabled={!canManageWeather}
              />
              <select
                className={styles.input}
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
                className={styles.input}
                type="datetime-local"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                disabled={!canManageWeather}
              />
              <input
                className={styles.input}
                type="datetime-local"
                value={scheduleEndTime}
                onChange={e => setScheduleEndTime(e.target.value)}
                placeholder="End time (optional)"
                disabled={!canManageWeather}
              />
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => void createEvent()}
                disabled={!canManageWeather}
              >
                Schedule
              </button>
            </div>
            <div className={styles.inlineNote}>
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
  <div className={styles.metricCard}>
    <div className={styles.metricLabel}>{label}</div>
    <div className={styles.metricValue}>{value}</div>
    {detail ? <div className={styles.metricDetail}>{detail}</div> : null}
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
  return waveHeights[
    Math.min(Math.max(Math.round(state), 0), waveHeights.length - 1)
  ];
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
