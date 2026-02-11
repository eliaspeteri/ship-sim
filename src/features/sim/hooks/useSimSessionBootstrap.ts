import React from 'react';
import { Session } from 'next-auth';
import { NextRouter } from 'next/router';
import socketManager from '../../../networking/socket';
import { initializeSimulation, startSimulation } from '../../../simulation';
import useStore from '../../../store';
import {
  NOTICE_CLEAR_MS,
  STORAGE_ACTIVE_VESSEL_KEY,
  STORAGE_JOIN_CHOICE_KEY,
} from '../constants';

type SimMode = 'player' | 'spectator';
type SimNotice = { type: 'info' | 'error'; message: string } | null;

type UseSimSessionBootstrapParams = {
  router: NextRouter;
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  hasChosenSpace: boolean;
  spaceSelectionHydrated: boolean;
  canEnterPlayerMode: boolean;
  mode: SimMode;
  notice: SimNotice;
  currentVesselId: string | null;
  setMode: (mode: SimMode) => void;
  setNotice: (notice: SimNotice) => void;
  setSessionUserId: (id: string | null) => void;
  openSpaceModal: () => void;
};

type UseSimSessionBootstrapResult = {
  showJoinChoice: boolean;
  setShowJoinChoice: React.Dispatch<React.SetStateAction<boolean>>;
  rememberJoinChoice: (choice: 'join' | 'create' | 'spectate') => void;
};

export function useSimSessionBootstrap({
  router,
  session,
  status,
  hasChosenSpace,
  spaceSelectionHydrated,
  canEnterPlayerMode,
  mode,
  notice,
  currentVesselId,
  setMode,
  setNotice,
  setSessionUserId,
  openSpaceModal,
}: UseSimSessionBootstrapParams): UseSimSessionBootstrapResult {
  const hasStartedRef = React.useRef(false);
  const pendingJoinRef = React.useRef<string | null>(null);
  const [showJoinChoice, setShowJoinChoice] = React.useState(false);

  const rememberJoinChoice = React.useCallback(
    (choice: 'join' | 'create' | 'spectate') => {
      if (typeof window === 'undefined') return;
      window.sessionStorage.setItem(STORAGE_JOIN_CHOICE_KEY, choice);
    },
    [],
  );

  const userId = (session?.user as { id?: string } | undefined)?.id;

  React.useEffect(() => {
    if (userId) setSessionUserId(userId);
  }, [userId, setSessionUserId]);

  React.useEffect(() => {
    if (status === 'loading') return;
    const token = (session as Session & { socketToken?: string })?.socketToken;
    const nextUserId =
      (session?.user as { id?: string } | undefined)?.id ||
      session?.user?.name ||
      undefined;
    const nextUsername = session?.user?.name || undefined;
    socketManager.refreshAuth(token ?? null, nextUserId, nextUsername);
  }, [session, status]);

  React.useEffect(() => {
    if (status !== 'authenticated') return;
    if (!hasChosenSpace) return;

    const seen =
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem(STORAGE_JOIN_CHOICE_KEY);
    if (seen || showJoinChoice) return;

    let cancelled = false;

    (async () => {
      try {
        await socketManager.waitForSelfSnapshot();
      } catch {
        return;
      }
      if (cancelled) return;

      const assignedVessel = useStore.getState().currentVesselId;
      if (!assignedVessel) {
        setShowJoinChoice(true);
        if (canEnterPlayerMode) {
          setMode('spectator');
          socketManager.setJoinPreference('spectator', false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canEnterPlayerMode, hasChosenSpace, setMode, showJoinChoice, status]);

  React.useEffect(() => {
    if (!currentVesselId) return;
    setShowJoinChoice(false);
  }, [currentVesselId]);

  React.useEffect(() => {
    if (!pendingJoinRef.current || !canEnterPlayerMode) return;

    let cancelled = false;

    (async () => {
      try {
        await socketManager.waitForConnection();
        if (cancelled) return;

        const vesselId = pendingJoinRef.current;
        if (!vesselId) return;

        socketManager.setJoinPreference('player', true);
        socketManager.requestJoinVessel(vesselId);

        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(STORAGE_ACTIVE_VESSEL_KEY);
        }

        if (router.isReady && typeof router.query.vesselId === 'string') {
          void router.replace('/sim', undefined, { shallow: true });
        }

        pendingJoinRef.current = null;
      } catch (error) {
        console.warn('Failed to auto-join selected vessel:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canEnterPlayerMode, router]);

  React.useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), NOTICE_CLEAR_MS);
    return () => window.clearTimeout(timer);
  }, [notice, setNotice]);

  React.useEffect(() => {
    if (!router.isReady) return;

    const queryVesselId =
      typeof router.query.vesselId === 'string' ? router.query.vesselId : null;

    if (queryVesselId) {
      pendingJoinRef.current = queryVesselId;
      return;
    }

    if (typeof window === 'undefined') return;
    const stored = window.sessionStorage.getItem(STORAGE_ACTIVE_VESSEL_KEY);
    if (stored) {
      pendingJoinRef.current = stored;
    }
  }, [router.isReady, router.query.vesselId]);

  React.useEffect(() => {
    if (status === 'loading') return;
    if (!spaceSelectionHydrated) return;

    if (!hasChosenSpace) {
      openSpaceModal();
      return;
    }

    if (hasStartedRef.current) return;

    hasStartedRef.current = true;
    let cancelled = false;

    const socketToken = (session as Session & { socketToken?: string })
      ?.socketToken;
    const nextUserId =
      (session?.user as { id?: string } | undefined)?.id ||
      session?.user?.name ||
      undefined;
    const username = session?.user?.name || undefined;

    if (socketToken) {
      socketManager.setAuthToken(socketToken, nextUserId, username);
    }

    if (typeof window !== 'undefined') {
      const joinChoice = window.sessionStorage.getItem(STORAGE_JOIN_CHOICE_KEY);
      if (!joinChoice || joinChoice === 'spectate') {
        socketManager.setJoinPreference('spectator', false);
      } else {
        socketManager.setJoinPreference('player', true);
      }
      if (!session) {
        socketManager.setJoinPreference('spectator', false);
      }
    }

    socketManager.connect(process.env.NEXT_PUBLIC_SOCKET_URL || '');

    (async () => {
      try {
        await socketManager.waitForSelfSnapshot();
        if (cancelled) return;
        await initializeSimulation();
        if (cancelled) return;
        startSimulation();
      } catch (error) {
        console.error('Failed to hydrate simulation before start:', error);
      }
    })();

    const handleUnload = () => {
      socketManager.disconnect();
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      cancelled = true;
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      if (hasStartedRef.current) {
        socketManager.disconnect();
        hasStartedRef.current = false;
      }
    };
  }, [hasChosenSpace, openSpaceModal, session, spaceSelectionHydrated, status]);

  React.useEffect(() => {
    if (status === 'loading') return;
    if (!canEnterPlayerMode && mode !== 'spectator') {
      setMode('spectator');
      socketManager.setJoinPreference('spectator', false);
      socketManager.notifyModeChange('spectator');
    }
  }, [canEnterPlayerMode, mode, setMode, status]);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (!canEnterPlayerMode) return;

      const joinChoice = window.sessionStorage.getItem(STORAGE_JOIN_CHOICE_KEY);
      if (!joinChoice || joinChoice === 'spectate') return;

      const state = useStore.getState();
      if (state.mode !== 'spectator') return;

      socketManager.setJoinPreference('player', true);
      socketManager.notifyModeChange('player');
      if (state.currentVesselId) {
        socketManager.requestJoinVessel(state.currentVesselId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [canEnterPlayerMode]);

  return {
    showJoinChoice,
    setShowJoinChoice,
    rememberJoinChoice,
  };
}
