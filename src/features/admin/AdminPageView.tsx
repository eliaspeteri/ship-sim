import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { socketManager } from '../../networking/socket';
import { getApiBase } from '../../lib/api';
import {
  clearLogsRequest,
  createModerationRequest,
  deleteModerationRequest,
  fetchLogsRequest,
  fetchMetricsRequest,
  fetchModerationRequest,
  updateUserRoleRequest,
} from './adminService';
import type { LogEntry, ModerationEntry, ServerMetrics } from './types';
import { useAdminForms } from './useAdminForms';

const metricTargets: Record<string, number> = {
  api: 120,
  broadcast: 16,
  ai: 12,
  socketLatency: 120,
};

const ui = {
  page: 'mx-auto max-w-[1200px] px-4 pb-[60px] pt-8 text-[var(--ink)]',
  header:
    'mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start',
  title: 'text-[26px] font-bold',
  subtitle: 'text-[13px] text-[rgba(170,192,202,0.7)]',
  section:
    'mt-5 rounded-[18px] border border-[rgba(27,154,170,0.35)] bg-[rgba(10,20,34,0.9)] p-4',
  sectionHeader: 'mb-3 flex items-center justify-between gap-3',
  sectionTitle:
    'text-sm uppercase tracking-[0.18em] text-[rgba(170,192,202,0.8)]',
  grid: 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3',
  spaceSection: 'mt-4 grid gap-2.5',
  spaceTable:
    'grid gap-1.5 rounded-xl border border-[rgba(40,60,80,0.6)] bg-[rgba(6,12,20,0.7)] p-2.5',
  spaceHeader:
    'grid grid-cols-[minmax(120px,1.4fr)_repeat(4,minmax(60px,0.6fr))_minmax(110px,0.9fr)] items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-[rgba(160,179,192,0.75)]',
  spaceRow:
    'grid grid-cols-[minmax(120px,1.4fr)_repeat(4,minmax(60px,0.6fr))_minmax(110px,0.9fr)] items-center gap-2 rounded-lg bg-[rgba(10,20,34,0.6)] px-2 py-1.5 text-xs text-[#eef6f8]',
  card: 'rounded-xl border border-[rgba(40,60,80,0.6)] bg-[rgba(8,18,30,0.8)] p-3',
  cardLabel:
    'text-[11px] uppercase tracking-[0.16em] text-[rgba(160,179,192,0.7)]',
  cardValue: 'mt-1.5 text-lg font-semibold text-[#f2f7f8]',
  formRow: 'flex flex-wrap items-center gap-2.5',
  input:
    'rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2.5 py-1.5 text-xs text-[#f1f7f8]',
  select:
    'rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2.5 py-1.5 text-xs text-[#f1f7f8]',
  button:
    'cursor-pointer rounded-[10px] border-0 px-3 py-1.5 text-xs font-semibold text-[#f1f7f8]',
  buttonPrimary: 'bg-gradient-to-br from-[#1b9aaa] to-[#0f6d75]',
  buttonSecondary: 'bg-[rgba(52,72,98,0.9)]',
  buttonDanger: 'bg-[rgba(120,36,32,0.85)]',
  logList: 'grid max-h-[260px] gap-2 overflow-y-auto',
  logItem:
    'rounded-[10px] border border-[rgba(40,60,80,0.6)] bg-[rgba(6,12,20,0.8)] px-2.5 py-2 text-xs',
  logMeta: 'text-[10px] text-[rgba(160,179,192,0.7)]',
  notice: 'mt-2 rounded-[10px] px-2.5 py-2 text-xs',
  noticeError: 'bg-[rgba(120,36,32,0.8)] text-[#ffe7e1]',
  noticeInfo: 'bg-[rgba(28,88,130,0.7)] text-[#e6f2ff]',
};

export const AdminPageView: React.FC = () => {
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
  const {
    banForm,
    setBanForm,
    muteForm,
    setMuteForm,
    kickForm,
    setKickForm,
    kickMessage,
    setKickMessage,
    roleUserId,
    setRoleUserId,
    roleValue,
    setRoleValue,
    roleMessage,
    setRoleMessage,
    moveForm,
    setMoveForm,
    moveMessage,
    setMoveMessage,
  } = useAdminForms();
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
      const data = await fetchMetricsRequest(apiBase);
      setMetrics(data as ServerMetrics);
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
        const nextLogs = await fetchLogsRequest(apiBase, since);
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
      await clearLogsRequest(apiBase);
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
      const data = await fetchModerationRequest(apiBase, moderationSpace);
      setBans(data.bans);
      setMutes(data.mutes);
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
        await createModerationRequest(apiBase, endpoint, {
          userId: payload.userId || undefined,
          username: payload.username || undefined,
          reason: payload.reason || undefined,
          expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
          spaceId: moderationSpace,
        });
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
        await deleteModerationRequest(apiBase, endpoint, id);
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
      await updateUserRoleRequest(apiBase, roleUserId, roleValue);
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
      if (
        typeof document === 'undefined' ||
        document.visibilityState === 'visible'
      ) {
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
    return <div className={ui.page}>Loading admin console…</div>;
  }

  if (!isAdmin) {
    return (
      <div className={ui.page}>
        <div className={ui.title}>Admin console</div>
        <div className={ui.subtitle}>You do not have access to this view.</div>
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
    <div className={ui.page}>
      <div className={ui.header}>
        <div>
          <div className={ui.title}>Admin console</div>
          <div className={ui.subtitle}>
            Moderation, environment control, and performance budgets.
          </div>
        </div>
        <div className={ui.subtitle}>
          Socket status: {socketConnected ? 'connected' : 'offline'}
        </div>
      </div>

      <div className={ui.section}>
        <div className={ui.sectionHeader}>
          <div className={ui.sectionTitle}>Performance budgets</div>
          <div className={ui.subtitle}>
            Target 60 Hz sim • 16 ms render budget
          </div>
        </div>
        {metricsError ? (
          <div className={`${ui.notice} ${ui.noticeError}`}>{metricsError}</div>
        ) : null}
        <div className={ui.grid}>
          {metricCards.map(card => {
            const target = metricTargets[card.key] ?? 0;
            const last = card.bucket.lastMs ?? 0;
            return (
              <div key={card.key} className={ui.card}>
                <div className={ui.cardLabel}>{card.label}</div>
                <div className={ui.cardValue}>{last.toFixed(1)} ms</div>
                <div className={ui.subtitle}>
                  avg {card.bucket.avgMs.toFixed(1)} • max{' '}
                  {card.bucket.maxMs.toFixed(1)} • target {target} ms
                </div>
              </div>
            );
          })}
          {metrics ? (
            <div className={ui.card}>
              <div className={ui.cardLabel}>Sockets</div>
              <div className={ui.cardValue}>{metrics.sockets.connected}</div>
              <div className={ui.subtitle}>
                Updated {new Date(metrics.updatedAt).toLocaleTimeString()}
              </div>
            </div>
          ) : null}
        </div>
        <div className={ui.spaceSection}>
          <div className={ui.sectionTitle}>Space health</div>
          {spaceMetrics.length === 0 ? (
            <div className={`${ui.notice} ${ui.noticeInfo}`}>
              No space metrics available yet.
            </div>
          ) : (
            <div className={ui.spaceTable}>
              <div className={ui.spaceHeader}>
                <span>Space</span>
                <span>Users</span>
                <span>Vessels</span>
                <span>AI</span>
                <span>Players</span>
                <span>Updated</span>
              </div>
              {spaceMetrics.map(space => (
                <div key={space.spaceId} className={ui.spaceRow}>
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

      <div className={ui.section}>
        <div className={ui.sectionHeader}>
          <div className={ui.sectionTitle}>Live logs</div>
          <div className={ui.formRow}>
            <button
              type="button"
              className={`${ui.button} ${ui.buttonSecondary}`}
              onClick={() => void fetchLogs(true)}
            >
              Refresh
            </button>
            <button
              type="button"
              className={`${ui.button} ${ui.buttonDanger}`}
              onClick={() => void clearLogs()}
            >
              Clear
            </button>
          </div>
        </div>
        {logsError ? (
          <div className={`${ui.notice} ${ui.noticeError}`}>{logsError}</div>
        ) : null}
        <div className={ui.logList}>
          {logs.length === 0 ? (
            <div className={ui.notice}>No logs collected yet.</div>
          ) : (
            logs.map(entry => (
              <div key={entry.id} className={ui.logItem}>
                <div className={ui.logMeta}>
                  {new Date(entry.timestamp).toLocaleTimeString()} •{' '}
                  {entry.level.toUpperCase()} • {entry.source}
                </div>
                <div>{entry.message}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={ui.section}>
        <div className={ui.sectionHeader}>
          <div className={ui.sectionTitle}>Moderation</div>
          <div className={ui.formRow}>
            <input
              className={ui.input}
              value={moderationSpace}
              onChange={e => setModerationSpace(e.target.value)}
              placeholder="space id"
            />
            <button
              type="button"
              className={`${ui.button} ${ui.buttonSecondary}`}
              onClick={() => void fetchModeration()}
            >
              Load
            </button>
          </div>
        </div>
        {moderationError ? (
          <div className={`${ui.notice} ${ui.noticeError}`}>
            {moderationError}
          </div>
        ) : null}
        <div className={ui.grid}>
          <div className={ui.card}>
            <div className={ui.cardLabel}>Bans</div>
            <div className={ui.formRow}>
              <input
                className={ui.input}
                value={banForm.userId}
                onChange={e =>
                  setBanForm(prev => ({ ...prev, userId: e.target.value }))
                }
                placeholder="user id"
              />
              <input
                className={ui.input}
                value={banForm.username}
                onChange={e =>
                  setBanForm(prev => ({ ...prev, username: e.target.value }))
                }
                placeholder="username"
              />
              <input
                className={ui.input}
                value={banForm.reason}
                onChange={e =>
                  setBanForm(prev => ({ ...prev, reason: e.target.value }))
                }
                placeholder="reason"
              />
              <input
                className={ui.input}
                value={banForm.expiresAt}
                onChange={e =>
                  setBanForm(prev => ({ ...prev, expiresAt: e.target.value }))
                }
                type="datetime-local"
                placeholder="expires"
              />
              <button
                type="button"
                className={`${ui.button} ${ui.buttonPrimary}`}
                onClick={() => void submitModeration('bans', banForm)}
              >
                Ban
              </button>
            </div>
            <div className={ui.logList}>
              {bans.length === 0 ? (
                <div className={ui.subtitle}>No active bans.</div>
              ) : (
                bans.map(entry => (
                  <div key={entry.id} className={ui.logItem}>
                    <div className={ui.logMeta}>
                      {entry.userId || entry.username || 'Unknown'} •{' '}
                      {entry.reason || 'No reason'}
                    </div>
                    <button
                      type="button"
                      className={`${ui.button} ${ui.buttonDanger}`}
                      onClick={() => void deleteModeration('bans', entry.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className={ui.card}>
            <div className={ui.cardLabel}>Mutes</div>
            <div className={ui.formRow}>
              <input
                className={ui.input}
                value={muteForm.userId}
                onChange={e =>
                  setMuteForm(prev => ({ ...prev, userId: e.target.value }))
                }
                placeholder="user id"
              />
              <input
                className={ui.input}
                value={muteForm.username}
                onChange={e =>
                  setMuteForm(prev => ({ ...prev, username: e.target.value }))
                }
                placeholder="username"
              />
              <input
                className={ui.input}
                value={muteForm.reason}
                onChange={e =>
                  setMuteForm(prev => ({ ...prev, reason: e.target.value }))
                }
                placeholder="reason"
              />
              <input
                className={ui.input}
                value={muteForm.expiresAt}
                onChange={e =>
                  setMuteForm(prev => ({ ...prev, expiresAt: e.target.value }))
                }
                type="datetime-local"
                placeholder="expires"
              />
              <button
                type="button"
                className={`${ui.button} ${ui.buttonPrimary}`}
                onClick={() => void submitModeration('mutes', muteForm)}
              >
                Mute
              </button>
            </div>
            <div className={ui.logList}>
              {mutes.length === 0 ? (
                <div className={ui.subtitle}>No active mutes.</div>
              ) : (
                mutes.map(entry => (
                  <div key={entry.id} className={ui.logItem}>
                    <div className={ui.logMeta}>
                      {entry.userId || entry.username || 'Unknown'} •{' '}
                      {entry.reason || 'No reason'}
                    </div>
                    <button
                      type="button"
                      className={`${ui.button} ${ui.buttonDanger}`}
                      onClick={() => void deleteModeration('mutes', entry.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className={ui.card}>
            <div className={ui.cardLabel}>Kick user</div>
            <div className={ui.formRow}>
              <input
                className={ui.input}
                value={kickForm.userId}
                onChange={e =>
                  setKickForm(prev => ({ ...prev, userId: e.target.value }))
                }
                placeholder="user id"
              />
              <input
                className={ui.input}
                value={kickForm.reason}
                onChange={e =>
                  setKickForm(prev => ({ ...prev, reason: e.target.value }))
                }
                placeholder="reason"
              />
              <button
                type="button"
                className={`${ui.button} ${ui.buttonDanger}`}
                onClick={() => void sendKick()}
              >
                Kick now
              </button>
            </div>
            {kickMessage ? (
              <div className={`${ui.notice} ${ui.noticeInfo}`}>
                {kickMessage}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={ui.section}>
        <div className={ui.sectionHeader}>
          <div className={ui.sectionTitle}>Role management</div>
        </div>
        <div className={ui.formRow}>
          <input
            className={ui.input}
            value={roleUserId}
            onChange={e => setRoleUserId(e.target.value)}
            placeholder="user id"
          />
          <select
            className={ui.select}
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
            className={`${ui.button} ${ui.buttonPrimary}`}
            onClick={() => void updateUserRole()}
          >
            Update role
          </button>
        </div>
        {roleMessage ? (
          <div className={`${ui.notice} ${ui.noticeInfo}`}>{roleMessage}</div>
        ) : null}
      </div>

      <div className={ui.section}>
        <div className={ui.sectionHeader}>
          <div className={ui.sectionTitle}>Reposition vessel</div>
        </div>
        <div className={ui.formRow}>
          <input
            className={ui.input}
            value={moveForm.vesselId}
            onChange={e =>
              setMoveForm(prev => ({ ...prev, vesselId: e.target.value }))
            }
            placeholder="vessel id"
          />
          <input
            className={ui.input}
            value={moveForm.lat}
            onChange={e =>
              setMoveForm(prev => ({ ...prev, lat: e.target.value }))
            }
            placeholder="lat"
          />
          <input
            className={ui.input}
            value={moveForm.lon}
            onChange={e =>
              setMoveForm(prev => ({ ...prev, lon: e.target.value }))
            }
            placeholder="lon"
          />
          <button
            type="button"
            className={`${ui.button} ${ui.buttonPrimary}`}
            onClick={() => void sendMove()}
          >
            Teleport
          </button>
        </div>
        {moveMessage ? (
          <div className={`${ui.notice} ${ui.noticeError}`}>{moveMessage}</div>
        ) : null}
        <div className={ui.subtitle}>
          Spectator drag handles are also available in the sim view.
        </div>
      </div>
    </div>
  );
};

export default AdminPageView;
