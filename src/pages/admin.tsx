import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { socketManager } from '../networking/socket';
import { getApiBase } from '../lib/api';
import styles from './Admin.module.css';

type MetricBucket = {
  lastMs: number;
  avgMs: number;
  maxMs: number;
  count: number;
};

type ServerMetrics = {
  api: MetricBucket;
  broadcast: MetricBucket;
  ai: MetricBucket;
  socketLatency: MetricBucket;
  sockets: { connected: number };
  spaces: Record<
    string,
    {
      spaceId: string;
      name: string;
      connected: number;
      vessels: number;
      aiVessels: number;
      playerVessels: number;
      lastBroadcastAt: number;
      updatedAt: number;
    }
  >;
  updatedAt: number;
};

type LogEntry = {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  meta?: Record<string, unknown>;
};

type ModerationEntry = {
  id: string;
  userId?: string | null;
  username?: string | null;
  reason?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
};

const metricTargets: Record<string, number> = {
  api: 120,
  broadcast: 16,
  ai: 12,
  socketLatency: 120,
};

const AdminPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string })?.role || 'guest';
  const isAdmin = role === 'admin';
  const apiBase = useMemo(() => getApiBase(), []);

  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsSince, setLogsSince] = useState(0);
  const [moderationSpace, setModerationSpace] = useState('global');
  const [bans, setBans] = useState<ModerationEntry[]>([]);
  const [mutes, setMutes] = useState<ModerationEntry[]>([]);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [banForm, setBanForm] = useState({
    userId: '',
    username: '',
    reason: '',
    expiresAt: '',
  });
  const [muteForm, setMuteForm] = useState({
    userId: '',
    username: '',
    reason: '',
    expiresAt: '',
  });
  const [kickForm, setKickForm] = useState({ userId: '', reason: '' });
  const [kickMessage, setKickMessage] = useState<string | null>(null);
  const [roleUserId, setRoleUserId] = useState('');
  const [roleValue, setRoleValue] = useState('player');
  const [roleMessage, setRoleMessage] = useState<string | null>(null);
  const [moveForm, setMoveForm] = useState({
    vesselId: '',
    lat: '',
    lon: '',
  });
  const [moveMessage, setMoveMessage] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(
    socketManager.isConnected(),
  );

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (!isAdmin) {
      router.replace('/sim');
    }
  }, [isAdmin, router, session, status]);

  const fetchMetrics = useCallback(async () => {
    setMetricsError(null);
    try {
      const res = await fetch(`${apiBase}/api/metrics`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = (await res.json()) as ServerMetrics;
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics', err);
      setMetricsError('Unable to load metrics.');
    }
  }, [apiBase]);

  const fetchLogs = useCallback(
    async (reset = false) => {
      setLogsError(null);
      try {
        const since = reset ? 0 : logsSince;
        const res = await fetch(
          `${apiBase}/api/logs?since=${since}&limit=200`,
          {
            credentials: 'include',
          },
        );
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        const nextLogs = Array.isArray(data?.logs) ? data.logs : [];
        setLogs(nextLogs);
        if (nextLogs.length > 0) {
          const last = nextLogs[nextLogs.length - 1];
          setLogsSince(last.timestamp);
        }
      } catch (err) {
        console.error('Failed to load logs', err);
        setLogsError('Unable to load logs.');
      }
    },
    [apiBase, logsSince],
  );

  const clearLogs = useCallback(async () => {
    setLogsError(null);
    try {
      const res = await fetch(`${apiBase}/api/logs`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setLogs([]);
      setLogsSince(0);
    } catch (err) {
      console.error('Failed to clear logs', err);
      setLogsError('Unable to clear logs.');
    }
  }, [apiBase]);

  const fetchModeration = useCallback(async () => {
    setModerationError(null);
    try {
      const res = await fetch(
        `${apiBase}/api/admin/moderation?spaceId=${moderationSpace}`,
        { credentials: 'include' },
      );
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setBans(Array.isArray(data?.bans) ? data.bans : []);
      setMutes(Array.isArray(data?.mutes) ? data.mutes : []);
    } catch (err) {
      console.error('Failed to load moderation', err);
      setModerationError('Unable to load moderation list.');
    }
  }, [apiBase, moderationSpace]);

  const submitModeration = useCallback(
    async (
      endpoint: 'bans' | 'mutes',
      payload: {
        userId: string;
        username: string;
        reason: string;
        expiresAt: string;
      },
    ) => {
      setModerationError(null);
      try {
        const expiresAt = payload.expiresAt
          ? new Date(payload.expiresAt)
          : null;
        if (expiresAt && Number.isNaN(expiresAt.getTime())) {
          setModerationError('Enter a valid expiry date/time.');
          return;
        }
        const res = await fetch(`${apiBase}/api/admin/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: payload.userId || undefined,
            username: payload.username || undefined,
            reason: payload.reason || undefined,
            expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
            spaceId: moderationSpace,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Request failed: ${res.status}`);
        }
        if (endpoint === 'bans') {
          setBanForm({ userId: '', username: '', reason: '', expiresAt: '' });
        } else {
          setMuteForm({ userId: '', username: '', reason: '', expiresAt: '' });
        }
        await fetchModeration();
      } catch (err) {
        console.error('Failed to update moderation', err);
        setModerationError(
          err instanceof Error ? err.message : 'Moderation update failed.',
        );
      }
    },
    [apiBase, fetchModeration, moderationSpace],
  );

  const deleteModeration = useCallback(
    async (endpoint: 'bans' | 'mutes', id: string) => {
      setModerationError(null);
      try {
        const res = await fetch(`${apiBase}/api/admin/${endpoint}/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        await fetchModeration();
      } catch (err) {
        console.error('Failed to remove moderation entry', err);
        setModerationError('Unable to remove moderation entry.');
      }
    },
    [apiBase, fetchModeration],
  );

  const updateUserRole = useCallback(async () => {
    setRoleMessage(null);
    if (!roleUserId.trim()) {
      setRoleMessage('User id is required.');
      return;
    }
    try {
      const res = await fetch(`${apiBase}/api/admin/users/${roleUserId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: roleValue }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      setRoleMessage('Role updated.');
    } catch (err) {
      console.error('Failed to update role', err);
      setRoleMessage(
        err instanceof Error ? err.message : 'Failed to update role.',
      );
    }
  }, [apiBase, roleUserId, roleValue]);

  const sendMove = useCallback(() => {
    setMoveMessage(null);
    if (!moveForm.vesselId.trim()) {
      setMoveMessage('Vessel id is required for repositioning.');
      return;
    }
    const lat = Number(moveForm.lat);
    const lon = Number(moveForm.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setMoveMessage('Valid latitude and longitude are required.');
      return;
    }
    const payload = { lat, lon };
    const send = () => {
      socketManager.sendAdminVesselMove(moveForm.vesselId.trim(), payload);
      setMoveMessage('Move command sent.');
    };
    if (!socketManager.isConnected()) {
      setMoveMessage('Connecting to admin socket…');
      socketManager.connect(apiBase);
      void socketManager
        .waitForConnection()
        .then(() => send())
        .catch(() => setMoveMessage('Socket offline; move not sent.'));
      return;
    }
    send();
  }, [apiBase, moveForm]);

  const sendKick = useCallback(() => {
    setKickMessage(null);
    if (!kickForm.userId.trim()) {
      setKickMessage('User id is required to kick.');
      return;
    }
    socketManager.sendAdminKick(
      kickForm.userId.trim(),
      kickForm.reason.trim() || undefined,
    );
    setKickForm({ userId: '', reason: '' });
    setKickMessage('Kick sent.');
  }, [kickForm]);

  useEffect(() => {
    if (!isAdmin) return;
    if (typeof window === 'undefined') return;
    const socketToken = (session as { socketToken?: string })?.socketToken;
    const userId = (session?.user as { id?: string })?.id;
    const username = session?.user?.name || userId || 'Admin';
    if (socketToken) {
      socketManager.setAuthToken(socketToken, userId, username);
    }
    if (!socketManager.isConnected()) {
      socketManager.connect(apiBase);
    }
    let active = true;
    const unsubscribeConnection = socketManager.subscribeConnectionStatus(
      connected => {
        if (active) setSocketConnected(connected);
      },
    );
    socketManager.waitForConnection().then(() => {
      if (active) setSocketConnected(true);
    });
    return () => {
      active = false;
      unsubscribeConnection();
    };
  }, [apiBase, isAdmin, session]);

  useEffect(() => {
    if (!isAdmin) return;
    void fetchMetrics();
    void fetchLogs(true);
    void fetchModeration();
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        void fetchMetrics();
      }
    };
    const interval = setInterval(run, 8000);
    const onVisibilityChange = () => run();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, [fetchLogs, fetchMetrics, fetchModeration, isAdmin]);

  if (status === 'loading') {
    return <div className={styles.page}>Loading admin console…</div>;
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.title}>Admin console</div>
        <div className={styles.subtitle}>
          You do not have access to this view.
        </div>
      </div>
    );
  }

  const metricCards = metrics
    ? [
        { key: 'api', label: 'API latency', bucket: metrics.api },
        {
          key: 'broadcast',
          label: 'Broadcast loop',
          bucket: metrics.broadcast,
        },
        { key: 'ai', label: 'AI loop', bucket: metrics.ai },
        {
          key: 'socketLatency',
          label: 'Socket RTT',
          bucket: metrics.socketLatency,
        },
      ]
    : [];
  const spaceMetrics = metrics
    ? Object.values(metrics.spaces || {}).sort((a, b) =>
        a.name.localeCompare(b.name),
      )
    : [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Admin console</div>
          <div className={styles.subtitle}>
            Moderation, environment control, and performance budgets.
          </div>
        </div>
        <div className={styles.subtitle}>
          Socket status: {socketConnected ? 'connected' : 'offline'}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Performance budgets</div>
          <div className={styles.subtitle}>
            Target 60 Hz sim • 16 ms render budget
          </div>
        </div>
        {metricsError ? (
          <div className={`${styles.notice} ${styles.noticeError}`}>
            {metricsError}
          </div>
        ) : null}
        <div className={styles.grid}>
          {metricCards.map(card => {
            const target = metricTargets[card.key] ?? 0;
            const last = card.bucket.lastMs ?? 0;
            return (
              <div key={card.key} className={styles.card}>
                <div className={styles.cardLabel}>{card.label}</div>
                <div className={styles.cardValue}>{last.toFixed(1)} ms</div>
                <div className={styles.subtitle}>
                  avg {card.bucket.avgMs.toFixed(1)} • max{' '}
                  {card.bucket.maxMs.toFixed(1)} • target {target} ms
                </div>
              </div>
            );
          })}
          {metrics ? (
            <div className={styles.card}>
              <div className={styles.cardLabel}>Sockets</div>
              <div className={styles.cardValue}>
                {metrics.sockets.connected}
              </div>
              <div className={styles.subtitle}>
                Updated {new Date(metrics.updatedAt).toLocaleTimeString()}
              </div>
            </div>
          ) : null}
        </div>
        <div className={styles.spaceSection}>
          <div className={styles.sectionTitle}>Space health</div>
          {spaceMetrics.length === 0 ? (
            <div className={`${styles.notice} ${styles.noticeInfo}`}>
              No space metrics available yet.
            </div>
          ) : (
            <div className={styles.spaceTable}>
              <div className={styles.spaceHeader}>
                <span>Space</span>
                <span>Users</span>
                <span>Vessels</span>
                <span>AI</span>
                <span>Players</span>
                <span>Updated</span>
              </div>
              {spaceMetrics.map(space => (
                <div key={space.spaceId} className={styles.spaceRow}>
                  <span>{space.name}</span>
                  <span>{space.connected}</span>
                  <span>{space.vessels}</span>
                  <span>{space.aiVessels}</span>
                  <span>{space.playerVessels}</span>
                  <span>{new Date(space.updatedAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Live logs</div>
          <div className={styles.formRow}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={() => void fetchLogs(true)}
            >
              Refresh
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonDanger}`}
              onClick={() => void clearLogs()}
            >
              Clear
            </button>
          </div>
        </div>
        {logsError ? (
          <div className={`${styles.notice} ${styles.noticeError}`}>
            {logsError}
          </div>
        ) : null}
        <div className={styles.logList}>
          {logs.length === 0 ? (
            <div className={styles.notice}>No logs collected yet.</div>
          ) : (
            logs.map(entry => (
              <div key={entry.id} className={styles.logItem}>
                <div className={styles.logMeta}>
                  {new Date(entry.timestamp).toLocaleTimeString()} •{' '}
                  {entry.level.toUpperCase()} • {entry.source}
                </div>
                <div>{entry.message}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Moderation</div>
          <div className={styles.formRow}>
            <input
              className={styles.input}
              value={moderationSpace}
              onChange={e => setModerationSpace(e.target.value)}
              placeholder="space id"
            />
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={() => void fetchModeration()}
            >
              Load
            </button>
          </div>
        </div>
        {moderationError ? (
          <div className={`${styles.notice} ${styles.noticeError}`}>
            {moderationError}
          </div>
        ) : null}
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Bans</div>
            <div className={styles.formRow}>
              <input
                className={styles.input}
                value={banForm.userId}
                onChange={e =>
                  setBanForm(prev => ({ ...prev, userId: e.target.value }))
                }
                placeholder="user id"
              />
              <input
                className={styles.input}
                value={banForm.username}
                onChange={e =>
                  setBanForm(prev => ({ ...prev, username: e.target.value }))
                }
                placeholder="username"
              />
              <input
                className={styles.input}
                value={banForm.reason}
                onChange={e =>
                  setBanForm(prev => ({ ...prev, reason: e.target.value }))
                }
                placeholder="reason"
              />
              <input
                className={styles.input}
                value={banForm.expiresAt}
                onChange={e =>
                  setBanForm(prev => ({ ...prev, expiresAt: e.target.value }))
                }
                type="datetime-local"
                placeholder="expires"
              />
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => void submitModeration('bans', banForm)}
              >
                Ban
              </button>
            </div>
            <div className={styles.logList}>
              {bans.length === 0 ? (
                <div className={styles.subtitle}>No active bans.</div>
              ) : (
                bans.map(entry => (
                  <div key={entry.id} className={styles.logItem}>
                    <div className={styles.logMeta}>
                      {entry.userId || entry.username || 'Unknown'} •{' '}
                      {entry.reason || 'No reason'}
                    </div>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonDanger}`}
                      onClick={() => void deleteModeration('bans', entry.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Mutes</div>
            <div className={styles.formRow}>
              <input
                className={styles.input}
                value={muteForm.userId}
                onChange={e =>
                  setMuteForm(prev => ({ ...prev, userId: e.target.value }))
                }
                placeholder="user id"
              />
              <input
                className={styles.input}
                value={muteForm.username}
                onChange={e =>
                  setMuteForm(prev => ({ ...prev, username: e.target.value }))
                }
                placeholder="username"
              />
              <input
                className={styles.input}
                value={muteForm.reason}
                onChange={e =>
                  setMuteForm(prev => ({ ...prev, reason: e.target.value }))
                }
                placeholder="reason"
              />
              <input
                className={styles.input}
                value={muteForm.expiresAt}
                onChange={e =>
                  setMuteForm(prev => ({ ...prev, expiresAt: e.target.value }))
                }
                type="datetime-local"
                placeholder="expires"
              />
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => void submitModeration('mutes', muteForm)}
              >
                Mute
              </button>
            </div>
            <div className={styles.logList}>
              {mutes.length === 0 ? (
                <div className={styles.subtitle}>No active mutes.</div>
              ) : (
                mutes.map(entry => (
                  <div key={entry.id} className={styles.logItem}>
                    <div className={styles.logMeta}>
                      {entry.userId || entry.username || 'Unknown'} •{' '}
                      {entry.reason || 'No reason'}
                    </div>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonDanger}`}
                      onClick={() => void deleteModeration('mutes', entry.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Kick user</div>
            <div className={styles.formRow}>
              <input
                className={styles.input}
                value={kickForm.userId}
                onChange={e =>
                  setKickForm(prev => ({ ...prev, userId: e.target.value }))
                }
                placeholder="user id"
              />
              <input
                className={styles.input}
                value={kickForm.reason}
                onChange={e =>
                  setKickForm(prev => ({ ...prev, reason: e.target.value }))
                }
                placeholder="reason"
              />
              <button
                type="button"
                className={`${styles.button} ${styles.buttonDanger}`}
                onClick={() => void sendKick()}
              >
                Kick now
              </button>
            </div>
            {kickMessage ? (
              <div className={`${styles.notice} ${styles.noticeInfo}`}>
                {kickMessage}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Role management</div>
        </div>
        <div className={styles.formRow}>
          <input
            className={styles.input}
            value={roleUserId}
            onChange={e => setRoleUserId(e.target.value)}
            placeholder="user id"
          />
          <select
            className={styles.select}
            value={roleValue}
            onChange={e => setRoleValue(e.target.value)}
          >
            <option value="guest">Guest</option>
            <option value="spectator">Spectator</option>
            <option value="player">Player</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => void updateUserRole()}
          >
            Update role
          </button>
        </div>
        {roleMessage ? (
          <div className={`${styles.notice} ${styles.noticeInfo}`}>
            {roleMessage}
          </div>
        ) : null}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Reposition vessel</div>
        </div>
        <div className={styles.formRow}>
          <input
            className={styles.input}
            value={moveForm.vesselId}
            onChange={e =>
              setMoveForm(prev => ({ ...prev, vesselId: e.target.value }))
            }
            placeholder="vessel id"
          />
          <input
            className={styles.input}
            value={moveForm.lat}
            onChange={e =>
              setMoveForm(prev => ({ ...prev, lat: e.target.value }))
            }
            placeholder="lat"
          />
          <input
            className={styles.input}
            value={moveForm.lon}
            onChange={e =>
              setMoveForm(prev => ({ ...prev, lon: e.target.value }))
            }
            placeholder="lon"
          />
          <button
            type="button"
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => void sendMove()}
          >
            Teleport
          </button>
        </div>
        {moveMessage ? (
          <div className={`${styles.notice} ${styles.noticeError}`}>
            {moveMessage}
          </div>
        ) : null}
        <div className={styles.subtitle}>
          Spectator drag handles are also available in the sim view.
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
