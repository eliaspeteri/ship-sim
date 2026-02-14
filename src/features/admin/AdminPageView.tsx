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
import { adminUi as ui } from './adminUi';
import { AdminHeader } from './components/AdminHeader';
import { AdminPerformanceSection } from './components/AdminPerformanceSection';
import { AdminLogsSection } from './components/AdminLogsSection';
import { AdminModerationSection } from './components/AdminModerationSection';
import {
  AdminRepositionSection,
  AdminRoleSection,
} from './components/AdminRoleMoveSections';

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
    if (!isAdmin) router.replace('/sim');
  }, [isAdmin, router, session, status]);

  const fetchMetrics = useCallback(async () => {
    setMetricsError(null);
    try {
      setMetrics((await fetchMetricsRequest(apiBase)) as ServerMetrics);
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
          setLogsSince(nextLogs[nextLogs.length - 1].timestamp);
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
    [apiBase, fetchModeration, moderationSpace, setBanForm, setMuteForm],
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
  }, [apiBase, roleUserId, roleValue, setRoleMessage]);

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
  }, [apiBase, moveForm, setMoveMessage]);

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
  }, [kickForm, setKickForm, setKickMessage]);

  useEffect(() => {
    if (!isAdmin || typeof window === 'undefined') return;
    const socketToken = (session as { socketToken?: string })?.socketToken;
    const userId = (session?.user as { id?: string })?.id;
    const username = session?.user?.name || userId || 'Admin';

    if (socketToken) socketManager.setAuthToken(socketToken, userId, username);
    if (!socketManager.isConnected()) socketManager.connect(apiBase);

    let active = true;
    const unsubscribe = socketManager.subscribeConnectionStatus(connected => {
      if (active) setSocketConnected(connected);
    });

    socketManager.waitForConnection().then(() => {
      if (active) setSocketConnected(true);
    });

    return () => {
      active = false;
      unsubscribe();
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

  if (status === 'loading')
    return <div className={ui.page}>Loading admin console…</div>;

  if (!isAdmin) {
    return (
      <div className={ui.page}>
        <div className={ui.title}>Admin console</div>
        <div className={ui.subtitle}>You do not have access to this view.</div>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <AdminHeader socketConnected={socketConnected} />
      <AdminPerformanceSection metrics={metrics} metricsError={metricsError} />
      <AdminLogsSection
        logs={logs}
        logsError={logsError}
        onRefresh={() => void fetchLogs(true)}
        onClear={() => void clearLogs()}
      />
      <AdminModerationSection
        moderationSpace={moderationSpace}
        setModerationSpace={setModerationSpace}
        moderationError={moderationError}
        fetchModeration={() => void fetchModeration()}
        banForm={banForm}
        setBanForm={setBanForm}
        muteForm={muteForm}
        setMuteForm={setMuteForm}
        bans={bans}
        mutes={mutes}
        submitModeration={(endpoint, payload) =>
          void submitModeration(endpoint, payload)
        }
        deleteModeration={(endpoint, id) => void deleteModeration(endpoint, id)}
        kickForm={kickForm}
        setKickForm={setKickForm}
        kickMessage={kickMessage}
        sendKick={sendKick}
      />
      <AdminRoleSection
        roleUserId={roleUserId}
        setRoleUserId={setRoleUserId}
        roleValue={roleValue}
        setRoleValue={setRoleValue}
        roleMessage={roleMessage}
        updateUserRole={() => void updateUserRole()}
      />
      <AdminRepositionSection
        moveForm={moveForm}
        setMoveForm={setMoveForm}
        moveMessage={moveMessage}
        sendMove={sendMove}
      />
    </div>
  );
};

export default AdminPageView;
