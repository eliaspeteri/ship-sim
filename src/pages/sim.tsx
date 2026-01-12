import React, { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Scene from '../components/Scene';
import Dashboard from '../components/Dashboard';
import { HudDrawer } from '../components/HudDrawer';
import useStore from '../store';
import socketManager from '../networking/socket';
import { initializeSimulation, startSimulation } from '../simulation';
import { getSimulationLoop } from '../simulation';
import { MAX_CREW, RUDDER_MAX_ANGLE_RAD } from '../constants/vessel';
import { positionFromXY, positionToXY } from '../lib/position';
import { getScenarios, ScenarioDefinition } from '../lib/scenarios';
import { getApiBase } from '../lib/api';
import styles from './SimPage.module.css';
import { bboxAroundLatLon } from '../lib/geo';

const PORTS = [
  { name: 'Harbor Alpha', position: positionFromXY({ x: 0, y: 0 }) },
  { name: 'Bay Delta', position: positionFromXY({ x: 2000, y: -1500 }) },
  { name: 'Island Anchorage', position: positionFromXY({ x: -2500, y: 1200 }) },
  { name: 'Channel Gate', position: positionFromXY({ x: 800, y: 2400 }) },
];

const SEAMARK_RADIUS_M = 25_000;
const REQUERY_DISTANCE_M = 5_000; // tune
const REQUERY_MIN_MS = 2000; // tune

function haversineMeters(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const h = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function bboxKey(b: {
  south: number;
  west: number;
  north: number;
  east: number;
}) {
  // quantize to reduce churn
  const q = (n: number) => n.toFixed(5);
  return `${q(b.south)}:${q(b.west)}:${q(b.north)}:${q(b.east)}`;
}

/**
 * Simulation page for Ship Simulator.
 * Requires authentication. Shows the simulation UI if authenticated.
 */
const SimPage: React.FC & { fullBleedLayout?: boolean } = () => {
  type SpaceSummary = {
    id: string;
    name: string;
    visibility: string;
    inviteToken?: string;
  };
  const { data: session, status } = useSession();
  const router = useRouter();
  const vessel = useStore(state => state.vessel);
  const mode = useStore(state => state.mode);
  const setMode = useStore(state => state.setMode);
  const setSpaceId = useStore(state => state.setSpaceId);
  const spaceId = useStore(state => state.spaceId);
  const roles = useStore(state => state.roles);
  const notice = useStore(state => state.notice);
  const setNotice = useStore(state => state.setNotice);
  const crewIds = useStore(state => state.crewIds);
  const otherVessels = useStore(state => state.otherVessels);
  const setSessionUserId = useStore(state => state.setSessionUserId);
  const setChatMessages = useStore(state => state.setChatMessages);
  const currentVesselId = useStore(state => state.currentVesselId);
  const account = useStore(state => state.account);
  const setMissions = useStore(state => state.setMissions);
  const setMissionAssignments = useStore(state => state.setMissionAssignments);
  const seamarks = useStore(state => state.seamarks);
  const setSeamarks = useStore(state => state.setSeamarks);
  const hasStartedRef = useRef(false);
  const sessionRole = (session?.user as { role?: string })?.role;
  const canEnterPlayerMode =
    sessionRole === 'admin' ||
    sessionRole === 'player' ||
    roles.includes('admin') ||
    roles.includes('player');
  const userId = (session?.user as { id?: string })?.id;
  const [showJoinChoice, setShowJoinChoice] = React.useState(false);
  const [selectedPort, setSelectedPort] = React.useState(PORTS[0].name);
  const [spaceInput, setSpaceInput] = React.useState(spaceId || 'global');
  const [spaces, setSpaces] = React.useState<SpaceSummary[]>([]);
  const [spacesLoading, setSpacesLoading] = React.useState(false);
  const [spaceError, setSpaceError] = React.useState<string | null>(null);
  const [inviteToken, setInviteToken] = React.useState('');
  const [invitePassword, setInvitePassword] = React.useState('');
  const [newSpaceName, setNewSpaceName] = React.useState('');
  const [newSpaceVisibility, setNewSpaceVisibility] = React.useState<
    'public' | 'private'
  >('public');
  const [newSpacePassword, setNewSpacePassword] = React.useState('');
  const [spaceModalOpen, setSpaceModalOpen] = React.useState(false);
  const [hasChosenSpace, setHasChosenSpace] = React.useState(false);
  const [spaceSelectionHydrated, setSpaceSelectionHydrated] =
    React.useState(false);
  const [knownSpaces, setKnownSpaces] = React.useState<SpaceSummary[]>([]);
  const [spaceFlow, setSpaceFlow] = React.useState<
    'choice' | 'join' | 'create'
  >('choice');
  const scenarios = React.useMemo(() => getScenarios(), []);
  const [scenarioLoadingId, setScenarioLoadingId] = React.useState<
    string | null
  >(null);
  const [scenarioError, setScenarioError] = React.useState<string | null>(null);
  const joinableVessels = React.useMemo(() => {
    return Object.entries(otherVessels || {})
      .filter(([, vessel]) => {
        if (!vessel) return false;
        const crewCount = vessel.crewCount ?? vessel.crewIds?.length ?? 0;
        return (
          vessel.mode === 'player' && crewCount > 0 && crewCount < MAX_CREW
        );
      })
      .map(([id, vessel]) => {
        const crewCount = vessel.crewCount ?? vessel.crewIds?.length ?? 0;
        const label =
          vessel.helm?.username || vessel.helm?.userId || vessel.ownerId || id;
        return { id, crewCount, label };
      })
      .sort((a, b) => a.crewCount - b.crewCount);
  }, [otherVessels]);

  const joinSpace = React.useCallback(
    (next: string) => {
      const normalized = next.trim().toLowerCase() || 'global';
      setSpaceInput(normalized);
      setSpaceId(normalized);
      setChatMessages([]);
      socketManager.switchSpace(normalized);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ship-sim-space', normalized);
        window.localStorage.setItem('ship-sim-space-selected', 'true');
      }
      setHasChosenSpace(true);
      setSpaceModalOpen(false);
      setSpaceFlow('choice');
      router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, space: normalized },
        },
        undefined,
        { shallow: true },
      );
    },
    [router, setChatMessages, setSpaceId],
  );

  const startScenario = React.useCallback(
    async (scenario: ScenarioDefinition) => {
      setScenarioError(null);
      setScenarioLoadingId(scenario.id);
      try {
        const apiBase = getApiBase();
        const res = await fetch(
          `${apiBase}/api/scenarios/${scenario.id}/start`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Request failed: ${res.status}`);
        }
        const data = await res.json();
        if (!data?.space?.id) {
          throw new Error('Scenario space missing from response');
        }
        socketManager.setJoinPreference('player', true);
        setMode('player');
        joinSpace(data.space.id);
        await socketManager.waitForConnection();
        socketManager.requestNewVessel({
          lat: scenario.spawn.lat,
          lon: scenario.spawn.lon,
        });
        setShowJoinChoice(false);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('ship-sim-join-choice', 'create');
        }
        setNotice({
          type: 'info',
          message: `Scenario "${scenario.name}" started.`,
        });
      } catch (err) {
        console.error('Failed to start scenario', err);
        setScenarioError(
          err instanceof Error ? err.message : 'Failed to start scenario',
        );
      } finally {
        setScenarioLoadingId(null);
      }
    },
    [joinSpace, setMode, setNotice],
  );

  const mergeSpaceLists = React.useCallback(
    (prev: SpaceSummary[], incoming: SpaceSummary[]): SpaceSummary[] => {
      const map = new Map<string, SpaceSummary>();
      [...prev, ...incoming].forEach((space: SpaceSummary) => {
        map.set(space.id, {
          ...space,
          visibility: space.visibility || 'public',
        });
      });
      return Array.from(map.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    },
    [],
  );

  const mergeSpaces = React.useCallback(
    (incoming: SpaceSummary[]) => {
      setSpaces(prev => mergeSpaceLists(prev, incoming));
    },
    [mergeSpaceLists],
  );

  const saveKnownSpace = React.useCallback(
    async (spaceId: string, inviteToken?: string) => {
      try {
        const apiBase = getApiBase();
        await fetch(`${apiBase}/api/spaces/known`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ spaceId, inviteToken }),
        });
      } catch (err) {
        console.warn('Failed to save known space', err);
      }
    },
    [],
  );

  const fetchSpaces = React.useCallback(
    async (opts?: { inviteToken?: string; password?: string }) => {
      setSpacesLoading(true);
      setSpaceError(null);
      try {
        const apiBase = getApiBase();
        const params = new URLSearchParams();
        if (opts?.inviteToken)
          params.set('inviteToken', opts.inviteToken.trim());
        if (opts?.password) params.set('password', opts.password);
        params.set('includeKnown', 'true');
        const qs = params.toString();
        const res = await fetch(`${apiBase}/api/spaces${qs ? `?${qs}` : ''}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        const data = await res.json();
        const incoming = Array.isArray(data?.spaces) ? data.spaces : [];
        mergeSpaces(incoming);
        setKnownSpaces(prev => mergeSpaceLists(prev, incoming));
        if (opts?.inviteToken && incoming.length > 0) {
          await Promise.all(
            incoming.map((space: { id: string; inviteToken: string }) =>
              saveKnownSpace(space.id, space.inviteToken || opts.inviteToken),
            ),
          );
        }
        if (opts?.inviteToken && incoming.length > 0) {
          setSpaceInput(incoming[0].id);
        }
      } catch (error) {
        console.error('Failed to load spaces', error);
        setSpaceError('Failed to load spaces. Check invite or try again.');
      } finally {
        setSpacesLoading(false);
      }
    },
    [mergeSpaces, saveKnownSpace],
  );

  const handleCreateSpace = React.useCallback(async () => {
    const name = newSpaceName.trim();
    if (!name) {
      setSpaceError('Space name is required');
      return;
    }
    const creatingPublicDuplicate =
      newSpaceVisibility === 'public' &&
      spaces.some(
        s =>
          s.visibility === 'public' &&
          s.name.toLowerCase() === name.toLowerCase(),
      );
    if (creatingPublicDuplicate) {
      setSpaceError('A public space with that name already exists');
      return;
    }
    setSpaceError(null);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/spaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          visibility: newSpaceVisibility,
          password: newSpacePassword || undefined,
        }),
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message =
          (body as { error?: string })?.error ||
          `Request failed with status ${res.status}`;
        throw new Error(message);
      }
      const created = await res.json();
      mergeSpaces([created]);
      setKnownSpaces(prev => mergeSpaceLists(prev, [created]));
      setNewSpaceName('');
      setNewSpacePassword('');
      void saveKnownSpace(created.id, created.inviteToken);
      joinSpace(created.id);
    } catch (error) {
      console.error('Failed to create space', error);
      setSpaceError('Failed to create space');
    }
  }, [
    joinSpace,
    mergeSpaces,
    saveKnownSpace,
    newSpaceName,
    newSpacePassword,
    newSpaceVisibility,
  ]);

  useEffect(() => {
    // require socket ready + lat/lon sane
    const lat = vessel.position.lat;
    const lon = vessel.position.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    const now = Date.now();
    if (seamarks.updatedAt && now - seamarks.updatedAt < REQUERY_MIN_MS) return;

    const center = { lat, lon };
    const lastCenter = seamarks.center;

    if (lastCenter) {
      const d = haversineMeters(lastCenter, center);
      if (d < REQUERY_DISTANCE_M) return;
    }

    const bbox = bboxAroundLatLon({
      lat,
      lon,
      radiusMeters: SEAMARK_RADIUS_M,
      corner: true,
    });
    const key = bboxKey(bbox);

    // avoid sending same bbox repeatedly
    if (seamarks.bboxKey === key) return;

    // optimistic update so other effects don't duplicate
    setSeamarks({
      bboxKey: key,
      center,
      radiusMeters: SEAMARK_RADIUS_M,
      updatedAt: now,
    });

    socketManager.requestSeamarksNearby({
      lat,
      lon,
      radiusMeters: SEAMARK_RADIUS_M,
      bbox,
      bboxKey: key,
      limit: 5000,
    });
  }, [
    vessel.position.lat,
    vessel.position.lon,
    seamarks.bboxKey,
    seamarks.center,
    seamarks.updatedAt,
    setSeamarks,
  ]);

  useEffect(() => {
    if (userId) setSessionUserId(userId);
  }, [userId, setSessionUserId]);

  useEffect(() => {
    setSpaceInput(spaceId || 'global');
  }, [spaceId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedSpace = window.localStorage.getItem('ship-sim-space');
    const savedSelected = window.localStorage.getItem(
      'ship-sim-space-selected',
    );
    if (savedSpace) {
      setSpaceId(savedSpace);
      setSpaceInput(savedSpace);
      setHasChosenSpace(true);
    } else if (!savedSelected) {
      setSpaceModalOpen(true);
      setSpaceFlow('choice');
    }
    setSpaceSelectionHydrated(true);
  }, [setSpaceId]);

  useEffect(() => {
    const querySpace =
      typeof router.query.space === 'string'
        ? router.query.space.trim().toLowerCase()
        : null;
    if (querySpace && querySpace !== spaceId) {
      setSpaceId(querySpace);
      socketManager.switchSpace(querySpace);
      setChatMessages([]);
      setHasChosenSpace(true);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ship-sim-space', querySpace);
        window.localStorage.setItem('ship-sim-space-selected', 'true');
      }
    }
  }, [router.query.space, setSpaceId, spaceId, setChatMessages]);

  useEffect(() => {
    void fetchSpaces();
  }, [fetchSpaces]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!spaceId) return;
    const controller = new AbortController();
    const loadMissions = async () => {
      try {
        const apiBase = getApiBase();
        const [missionsRes, assignmentsRes] = await Promise.all([
          fetch(`${apiBase}/api/missions?spaceId=${spaceId}`, {
            credentials: 'include',
            signal: controller.signal,
          }),
          fetch(`${apiBase}/api/missions/assignments`, {
            credentials: 'include',
            signal: controller.signal,
          }),
        ]);
        if (missionsRes.ok) {
          const data = await missionsRes.json();
          setMissions(Array.isArray(data?.missions) ? data.missions : []);
        }
        if (assignmentsRes.ok) {
          const data = await assignmentsRes.json();
          setMissionAssignments(
            Array.isArray(data?.assignments) ? data.assignments : [],
          );
        }
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') return;
        console.error('Failed to load missions', error);
      }
    };
    void loadMissions();
    return () => controller.abort();
  }, [setMissions, setMissionAssignments, spaceId, status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!hasChosenSpace) return;
    const seen =
      typeof window !== 'undefined' &&
      sessionStorage.getItem('ship-sim-join-choice');
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

  useEffect(() => {
    if (!currentVesselId) return;
    setShowJoinChoice(false);
  }, [currentVesselId]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/login');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);

  // Start simulation after hydrating from the first self snapshot over the socket
  useEffect(() => {
    if (status !== 'authenticated' || !session) return;
    if (!spaceSelectionHydrated) return;
    if (!hasChosenSpace) {
      setSpaceModalOpen(true);
      return;
    }
    if (hasStartedRef.current) return;

    hasStartedRef.current = true;
    let cancelled = false;
    // Attach auth token for socket if available from session callback
    const socketToken = (session as unknown as { socketToken?: string })
      ?.socketToken;
    const userId =
      (session?.user as { id?: string })?.id ||
      session?.user?.name ||
      undefined;
    const username = session?.user?.name || undefined;
    if (socketToken) {
      socketManager.setAuthToken(socketToken, userId, username);
    }
    if (typeof window !== 'undefined') {
      const joinChoice = sessionStorage.getItem('ship-sim-join-choice');
      if (!joinChoice) {
        socketManager.setJoinPreference('spectator', false);
      } else if (joinChoice === 'spectate') {
        socketManager.setJoinPreference('spectator', false);
      } else {
        socketManager.setJoinPreference('player', true);
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
  }, [hasChosenSpace, session, spaceSelectionHydrated, status]);

  // If the user role cannot drive, keep them in spectator mode.
  useEffect(() => {
    if (status === 'loading') return;
    if (!canEnterPlayerMode && mode !== 'spectator') {
      setMode('spectator');
      socketManager.setJoinPreference('spectator', false);
      socketManager.notifyModeChange('spectator');
    }
  }, [canEnterPlayerMode, mode, setMode, status]);

  // Keyboard controls (W/S throttle, A/D rudder, arrows also)
  useEffect(() => {
    const clamp = (val: number, min: number, max: number) =>
      Math.min(Math.max(val, min), max);

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const active = document.activeElement as globalThis.HTMLElement | null;
      if (
        active &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
      ) {
        return;
      }

      const state = useStore.getState();
      if (state.mode === 'spectator') return;
      const controls = state.vessel.controls;
      if (!controls) return;

      let throttle = controls.throttle ?? 0;
      let rudder = controls.rudderAngle ?? 0;
      const throttleStep = 0.05;
      const rudderStep = 0.05;
      let changed = false;
      const sessionUserId = state.sessionUserId;
      const helmStation = state.vessel.stations?.helm || state.vessel.helm;
      const engineStation = state.vessel.stations?.engine;
      const isHelm =
        sessionUserId && (helmStation?.userId || null) === sessionUserId;
      const isEngine =
        sessionUserId && (engineStation?.userId || null) === sessionUserId;
      const canAdjustThrottle = isEngine || (!engineStation?.userId && isHelm);
      const canAdjustRudder = isHelm;

      switch (event.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
          if (canAdjustThrottle) {
            throttle = clamp(throttle + throttleStep, -1, 1);
            changed = true;
          }
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          if (canAdjustThrottle) {
            throttle = clamp(throttle - throttleStep, -1, 1);
            changed = true;
          }
          break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
          if (canAdjustRudder) {
            rudder = clamp(
              rudder - rudderStep,
              -RUDDER_MAX_ANGLE_RAD,
              RUDDER_MAX_ANGLE_RAD,
            );
            changed = true;
          }
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          if (canAdjustRudder) {
            rudder = clamp(
              rudder + rudderStep,
              -RUDDER_MAX_ANGLE_RAD,
              RUDDER_MAX_ANGLE_RAD,
            );
            changed = true;
          }
          break;
        default:
          break;
      }

      if (!changed) return;

      state.updateVessel({
        controls: {
          ...controls,
          throttle: canAdjustThrottle ? throttle : controls.throttle,
          rudderAngle: canAdjustRudder ? rudder : controls.rudderAngle,
        },
      });

      try {
        const simulationLoop = getSimulationLoop();
        const nextControls: {
          throttle?: number;
          rudderAngle?: number;
          ballast?: number;
        } = {};
        if (canAdjustThrottle) {
          nextControls.throttle = throttle;
          nextControls.ballast = controls.ballast;
        }
        if (canAdjustRudder) {
          nextControls.rudderAngle = rudder;
        }
        simulationLoop.applyControls(nextControls);
        socketManager.sendControlUpdate(
          nextControls.throttle,
          nextControls.rudderAngle,
          nextControls.ballast,
        );
      } catch (error) {
        console.error('Error applying keyboard controls:', error);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (status === 'loading' || !session) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-lg bg-black bg-opacity-70 p-8 text-center text-white">
          <h1 className="mb-4 text-2xl font-bold">Loading Ship Simulator</h1>
          <p className="mb-4">Initializing...</p>
          <div className="mx-auto h-2 w-64 overflow-hidden rounded-full bg-gray-700">
            <div className="h-full w-1/2 animate-pulse bg-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  const vesselXY = positionToXY({
    lat: vessel.position.lat,
    lon: vessel.position.lon,
  });
  const vesselPosition = {
    x: vesselXY.x,
    y: vesselXY.y,
    z: vessel.position.z || 0,
    heading: vessel.orientation.heading || 0,
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        {notice ? (
          <div
            className={`${styles.notice} ${
              notice.type === 'error' ? styles.noticeError : styles.noticeInfo
            }`}
          >
            {notice.message}
          </div>
        ) : null}
        {userId && crewIds.includes(userId) && (
          <button
            type="button"
            className={`${styles.topButton} ${styles.topButtonWarn}`}
            onClick={() =>
              socketManager.requestHelm(
                vessel.helm?.userId === userId ? 'release' : 'claim',
              )
            }
          >
            {vessel.helm?.userId === userId
              ? 'Release Helm'
              : `Claim Helm${vessel.helm?.username ? ` (${vessel.helm.username})` : ''}`}
          </button>
        )}
        <button
          type="button"
          disabled={!canEnterPlayerMode}
          className={`${styles.topButton} ${styles.topButtonPrimary}`}
          onClick={() => {
            socketManager.setJoinPreference('player', true);
            socketManager.requestNewVessel();
            setNotice({
              type: 'info',
              message: 'Requesting a new vessel...',
            });
          }}
        >
          Create My Vessel
        </button>
        <span className={styles.modeLabel}>Mode</span>
        <button
          type="button"
          disabled={!canEnterPlayerMode && mode !== 'player'}
          onClick={() => {
            const nextMode = mode === 'player' ? 'spectator' : 'player';
            if (nextMode === 'player' && !canEnterPlayerMode) {
              setNotice({
                type: 'error',
                message: 'Your role is spectator-only',
              });
              return;
            }
            setMode(nextMode);
            socketManager.setJoinPreference(nextMode, nextMode === 'player');
            socketManager.notifyModeChange(nextMode);
          }}
          className={`${styles.modeToggle} ${
            mode === 'player' ? styles.modeToggleActive : ''
          }`}
          title={
            !canEnterPlayerMode && mode !== 'player'
              ? 'Spectator-only role'
              : undefined
          }
        >
          {mode === 'player' ? 'Player' : 'Spectator'}
        </button>
      </div>
      {spaceModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setSpaceModalOpen(false);
            setSpaceFlow('choice');
            setSpaceError(null);
          }}
        >
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                {spaceFlow !== 'choice' ? (
                  <button
                    className={styles.modalBack}
                    onClick={() => {
                      setSpaceFlow('choice');
                      setSpaceError(null);
                    }}
                  >
                    <span aria-hidden="true">←</span>
                    Back
                  </button>
                ) : (
                  <div className={styles.modalSpacer} />
                )}
                <div className={styles.modalTitle}>Choose a space</div>
              </div>
              <button
                className={styles.modalClose}
                onClick={() => {
                  setSpaceModalOpen(false);
                  setSpaceFlow('choice');
                  setSpaceError(null);
                }}
              >
                ✕ Close
              </button>
            </div>
            {spaceFlow === 'choice' ? (
              <div className={styles.choiceGrid}>
                <button
                  className={`${styles.choiceButton} ${styles.choiceButtonPrimary}`}
                  onClick={() => {
                    setSpaceFlow('join');
                    setSpaceError(null);
                  }}
                >
                  Join space
                </button>
                <button
                  className={styles.choiceButton}
                  onClick={() => {
                    setSpaceFlow('create');
                    setSpaceError(null);
                  }}
                >
                  Create space
                </button>
              </div>
            ) : null}

            {spaceFlow === 'join' ? (
              <>
                <div className={styles.formRow}>
                  <span className={styles.modeLabel}>Space</span>
                  <input
                    className={styles.input}
                    value={spaceInput}
                    onChange={e => setSpaceInput(e.target.value)}
                    placeholder="global"
                  />
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={() => {
                      setSpaceError(null);
                      joinSpace(spaceInput);
                    }}
                  >
                    Join
                  </button>
                  <button
                    className={`${styles.button} ${styles.buttonNeutral}`}
                    onClick={() => {
                      setSpaceFlow('choice');
                      setSpaceError(null);
                    }}
                  >
                    Back
                  </button>
                </div>
                <div className={styles.pillRow}>
                  {spacesLoading ? <span>Loading spaces...</span> : null}
                  {spaces.map(space => (
                    <button
                      key={space.id}
                      className={`${styles.pill} ${
                        space.visibility === 'private' ? styles.pillPrivate : ''
                      }`}
                      onClick={() => joinSpace(space.id)}
                      title={
                        space.visibility === 'private'
                          ? 'Private space'
                          : 'Public space'
                      }
                    >
                      {space.name}{' '}
                      <span className="uppercase text-[10px]">
                        {space.visibility === 'private' ? 'Private' : 'Public'}
                      </span>
                    </button>
                  ))}
                  {!spacesLoading && spaces.length === 0 ? (
                    <span className={styles.helperText}>
                      No public spaces yet
                    </span>
                  ) : null}
                  {(knownSpaces?.length || 0) > 0 ? (
                    <span className={styles.helperText}>
                      Known spaces: {knownSpaces.length}
                    </span>
                  ) : null}
                </div>
                {spaces.length > 0 ? (
                  <div className={styles.detailsCard}>
                    <div className={styles.detailsHeader}>
                      <span>
                        Details for: <strong>{spaceInput || '—'}</strong>
                      </span>
                      {spaces.find(s => s.id === spaceInput)?.inviteToken ? (
                        <button
                          className={`${styles.button} ${styles.buttonSecondary}`}
                          onClick={async () => {
                            const invite = spaces.find(
                              s => s.id === spaceInput,
                            )?.inviteToken;
                            if (invite) {
                              try {
                                await navigator.clipboard.writeText(invite);
                                setSpaceError(null);
                              } catch {
                                setSpaceError('Failed to copy invite token');
                              }
                            }
                          }}
                        >
                          Copy invite token
                        </button>
                      ) : null}
                    </div>
                    <div className={styles.helperText}>
                      Invite token:{' '}
                      {spaces.find(s => s.id === spaceInput)?.inviteToken ||
                        '—'}
                    </div>
                  </div>
                ) : null}
                <div className={styles.formRow}>
                  <input
                    className={styles.input}
                    value={inviteToken}
                    onChange={e => setInviteToken(e.target.value)}
                    placeholder="Invite code"
                  />
                  <input
                    className={styles.input}
                    value={invitePassword}
                    onChange={e => setInvitePassword(e.target.value)}
                    type="password"
                    placeholder="Invite password"
                  />
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    onClick={() => {
                      setSpaceError(null);
                      fetchSpaces({ inviteToken, password: invitePassword });
                    }}
                  >
                    Use invite
                  </button>
                </div>
              </>
            ) : null}

            {spaceFlow === 'create' ? (
              <>
                <div className={styles.formRow}>
                  <span className={styles.modeLabel}>Create a new space</span>
                  <button
                    className={`${styles.button} ${styles.buttonNeutral}`}
                    onClick={() => {
                      setSpaceFlow('choice');
                      setSpaceError(null);
                    }}
                  >
                    Back
                  </button>
                </div>
                <div className={styles.formRow}>
                  <input
                    className={`${styles.input}`}
                    value={newSpaceName}
                    onChange={e => setNewSpaceName(e.target.value)}
                    placeholder="New space name"
                  />
                  <select
                    className={styles.select}
                    value={newSpaceVisibility}
                    onChange={e =>
                      setNewSpaceVisibility(
                        e.target.value === 'private' ? 'private' : 'public',
                      )
                    }
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                  <input
                    className={styles.input}
                    value={newSpacePassword}
                    onChange={e => setNewSpacePassword(e.target.value)}
                    type="password"
                    placeholder="Password (optional)"
                  />
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={() => void handleCreateSpace()}
                  >
                    Create
                  </button>
                </div>
              </>
            ) : null}

            {spaceError ? (
              <div className={styles.errorText}>{spaceError}</div>
            ) : null}
          </div>
        </div>
      )}

      {mode !== 'spectator' ? <Dashboard /> : null}
      <Scene vesselPosition={vesselPosition} mode={mode} />
      <HudDrawer
        onOpenSpaces={() => {
          setSpaceModalOpen(true);
          setSpaceError(null);
          setSpaceFlow('choice');
        }}
      />
      {showJoinChoice && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 className={styles.modalTitle}>Choose how to join</h2>
            <p className={styles.helperText}>
              You can join an available vessel with open crew slots or start
              your own.
            </p>
            <div className="flex flex-col gap-3">
              <label className={styles.helperText}>
                Spawn location
                <select
                  className={styles.select}
                  value={selectedPort}
                  onChange={e => setSelectedPort(e.target.value)}
                >
                  {PORTS.map(port => (
                    <option key={port.name} value={port.name}>
                      {port.name}
                    </option>
                  ))}
                </select>
              </label>
              {canEnterPlayerMode ? (
                <>
                  <div className={styles.detailsCard}>
                    <div className={styles.modeLabel}>Join an active crew</div>
                    <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
                      {joinableVessels.length === 0 ? (
                        <div className={styles.helperText}>
                          No open crews. Create your own vessel instead.
                        </div>
                      ) : (
                        joinableVessels.map(vessel => (
                          <button
                            key={vessel.id}
                            className={`${styles.button} ${styles.buttonPrimary}`}
                            onClick={() => {
                              socketManager.setJoinPreference('player', true);
                              socketManager.requestJoinVessel(vessel.id);
                              setMode('player');
                              setShowJoinChoice(false);
                              if (typeof window !== 'undefined') {
                                sessionStorage.setItem(
                                  'ship-sim-join-choice',
                                  'join',
                                );
                              }
                            }}
                          >
                            {vessel.label} • {vessel.crewCount}/{MAX_CREW} crew
                          </button>
                        ))
                      )}
                    </div>
                    {joinableVessels.length > 0 ? (
                      <button
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        onClick={() => {
                          socketManager.setJoinPreference('player', true);
                          socketManager.requestJoinVessel();
                          setMode('player');
                          setShowJoinChoice(false);
                          if (typeof window !== 'undefined') {
                            sessionStorage.setItem(
                              'ship-sim-join-choice',
                              'join',
                            );
                          }
                        }}
                      >
                        Quick join smallest crew
                      </button>
                    ) : null}
                  </div>
                </>
              ) : null}
              {canEnterPlayerMode ? (
                <button
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={() => {
                    const port =
                      PORTS.find(p => p.name === selectedPort) || PORTS[0];
                    socketManager.setJoinPreference('player', true);
                    socketManager.requestNewVessel({
                      lat: port.position.lat,
                      lon: port.position.lon,
                    });
                    setMode('player');
                    setShowJoinChoice(false);
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('ship-sim-join-choice', 'create');
                    }
                  }}
                >
                  Create my own vessel
                </button>
              ) : (
                <div className={styles.detailsCard}>
                  Your role is spectator-only in this space.
                </div>
              )}
              <button
                className={`${styles.button} ${styles.buttonNeutral}`}
                onClick={() => {
                  setMode('spectator');
                  socketManager.setJoinPreference('spectator', false);
                  socketManager.notifyModeChange('spectator');
                  setShowJoinChoice(false);
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('ship-sim-join-choice', 'spectate');
                  }
                  setNotice({
                    type: 'info',
                    message: 'Spectator mode enabled.',
                  });
                }}
              >
                Spectate the world
              </button>
              <div className={styles.detailsCard}>
                <div className={styles.modeLabel}>Quick-start scenarios</div>
                {scenarioError ? (
                  <div className={styles.errorText}>{scenarioError}</div>
                ) : null}
                <div className={styles.scenarioGrid}>
                  {scenarios.map(scenario => {
                    const locked = account.rank < scenario.rankRequired;
                    const loading = scenarioLoadingId === scenario.id;
                    return (
                      <div key={scenario.id} className={styles.scenarioCard}>
                        <div className={styles.scenarioHeader}>
                          <div>
                            <div className={styles.scenarioTitle}>
                              {scenario.name}
                            </div>
                            <div className={styles.scenarioMeta}>
                              {scenario.description}
                            </div>
                          </div>
                          <div className={styles.scenarioMeta}>
                            Rank {scenario.rankRequired}
                          </div>
                        </div>
                        <button
                          className={`${styles.button} ${styles.buttonPrimary} ${styles.scenarioAction}`}
                          disabled={locked || loading}
                          onClick={() => void startScenario(scenario)}
                        >
                          {locked
                            ? 'Locked'
                            : loading
                              ? 'Starting…'
                              : 'Start scenario'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

SimPage.fullBleedLayout = true;

export default SimPage;
