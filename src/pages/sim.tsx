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
import { positionToXY } from '../lib/position';
import { getScenarios, ScenarioDefinition } from '../lib/scenarios';
import { getApiBase } from '../lib/api';
import styles from './SimPage.module.css';
import { getDefaultRules, mapToRulesetType } from '../types/rules.types';
import { bboxAroundLatLon } from '../lib/geo';
import { applyFailureControlLimits } from '../lib/failureControls';
import {
  DEFAULT_SPACE_ID,
  NOTICE_CLEAR_MS,
  PORTS,
  REQUERY_DISTANCE_M,
  REQUERY_MIN_MS,
  RUDDER_STEP,
  SEAMARK_RADIUS_M,
  SEAMARK_REQUEST_LIMIT,
  STORAGE_ACTIVE_VESSEL_KEY,
  STORAGE_JOIN_CHOICE_KEY,
  STORAGE_SPACE_KEY,
  STORAGE_SPACE_SELECTED_KEY,
  THROTTLE_MAX,
  THROTTLE_MIN,
  THROTTLE_STEP,
} from '../features/sim/constants';
import { haversineMeters, bboxKey } from '../features/sim/utils';
import { SpaceSummary } from '../features/sim/types';
import { SpaceModal } from '../features/sim/SpaceModal';
import { JoinChoiceModal } from '../features/sim/JoinChoiceModal';

/**
 * Simulation page for Ship Simulator.
 * Requires authentication. Shows the simulation UI if authenticated.
 */
const SimPage: React.FC & { fullBleedLayout?: boolean } = () => {
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
  const pendingJoinRef = useRef<string | null>(null);
  const sessionRole = (session?.user as { role?: string })?.role;
  const canEnterPlayerMode =
    sessionRole === 'admin' ||
    sessionRole === 'player' ||
    roles.includes('admin') ||
    roles.includes('player');
  const userId = (session?.user as { id?: string })?.id;
  const [showJoinChoice, setShowJoinChoice] = React.useState(false);
  const [selectedPort, setSelectedPort] = React.useState(PORTS[0].name);
  const [spaceInput, setSpaceInput] = React.useState(
    spaceId || DEFAULT_SPACE_ID,
  );
  const [spaces, setSpaces] = React.useState<SpaceSummary[]>([]);
  const [spacesLoading, setSpacesLoading] = React.useState(false);
  const [spaceError, setSpaceError] = React.useState<string | null>(null);
  const [inviteToken, setInviteToken] = React.useState('');
  const [invitePassword, setInvitePassword] = React.useState('');
  const [newSpaceName, setNewSpaceName] = React.useState('');
  const [newSpaceVisibility, setNewSpaceVisibility] = React.useState<
    'public' | 'private'
  >('public');
  const [newSpaceRulesetType, setNewSpaceRulesetType] =
    React.useState('CASUAL');
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

  const selectedSpace = React.useMemo(
    () => spaces.find(space => space.id === spaceInput),
    [spaceInput, spaces],
  );
  const selectedSpaceRules = React.useMemo(() => {
    if (!selectedSpace) return null;
    if (selectedSpace.rules) return selectedSpace.rules;
    const type = mapToRulesetType(selectedSpace.rulesetType || 'CASUAL');
    return getDefaultRules(type);
  }, [selectedSpace]);
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
      const normalized = next.trim().toLowerCase() || DEFAULT_SPACE_ID;
      setSpaceInput(normalized);
      setSpaceId(normalized);
      setChatMessages([]);
      socketManager.switchSpace(normalized);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_SPACE_KEY, normalized);
        window.localStorage.setItem(STORAGE_SPACE_SELECTED_KEY, 'true');
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
          rulesetType: newSpaceRulesetType,
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
      setNewSpaceRulesetType('CASUAL');
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
      limit: SEAMARK_REQUEST_LIMIT,
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
    setSpaceInput(spaceId || DEFAULT_SPACE_ID);
  }, [spaceId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedSpace = window.localStorage.getItem(STORAGE_SPACE_KEY);
    const savedSelected = window.localStorage.getItem(
      STORAGE_SPACE_SELECTED_KEY,
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
        window.localStorage.setItem(STORAGE_SPACE_KEY, querySpace);
        window.localStorage.setItem(STORAGE_SPACE_SELECTED_KEY, 'true');
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
      sessionStorage.getItem(STORAGE_JOIN_CHOICE_KEY);
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
          sessionStorage.removeItem(STORAGE_ACTIVE_VESSEL_KEY);
        }
        if (router.isReady && typeof router.query.vesselId === 'string') {
          router.replace('/sim', undefined, { shallow: true });
        }
        pendingJoinRef.current = null;
      } catch (error) {
        console.warn('Failed to auto-join selected vessel:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canEnterPlayerMode, router, status]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_CLEAR_MS);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);

  useEffect(() => {
    if (!router.isReady) return;
    const queryVesselId =
      typeof router.query.vesselId === 'string' ? router.query.vesselId : null;
    if (queryVesselId) {
      pendingJoinRef.current = queryVesselId;
      return;
    }
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem(STORAGE_ACTIVE_VESSEL_KEY);
    if (stored) {
      pendingJoinRef.current = stored;
    }
  }, [router.isReady, router.query.vesselId]);

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
      const joinChoice = sessionStorage.getItem(STORAGE_JOIN_CHOICE_KEY);
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
      const throttleStep = THROTTLE_STEP;
      const rudderStep = RUDDER_STEP;
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
            throttle = clamp(
              throttle + throttleStep,
              THROTTLE_MIN,
              THROTTLE_MAX,
            );
            changed = true;
          }
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          if (canAdjustThrottle) {
            throttle = clamp(
              throttle - throttleStep,
              THROTTLE_MIN,
              THROTTLE_MAX,
            );
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
        const limitedControls = applyFailureControlLimits(
          nextControls,
          state.vessel.failureState,
          state.vessel.damageState,
        );
        simulationLoop.applyControls(limitedControls);
        socketManager.sendControlUpdate(
          limitedControls.throttle,
          limitedControls.rudderAngle,
          limitedControls.ballast,
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
      <SpaceModal
        isOpen={spaceModalOpen}
        flow={spaceFlow}
        spaces={spaces}
        spacesLoading={spacesLoading}
        spaceInput={spaceInput}
        setSpaceInput={setSpaceInput}
        selectedSpaceRules={selectedSpaceRules}
        knownSpaces={knownSpaces}
        inviteToken={inviteToken}
        setInviteToken={setInviteToken}
        invitePassword={invitePassword}
        setInvitePassword={setInvitePassword}
        newSpaceName={newSpaceName}
        setNewSpaceName={setNewSpaceName}
        newSpaceVisibility={newSpaceVisibility}
        setNewSpaceVisibility={setNewSpaceVisibility}
        newSpaceRulesetType={newSpaceRulesetType}
        setNewSpaceRulesetType={setNewSpaceRulesetType}
        newSpacePassword={newSpacePassword}
        setNewSpacePassword={setNewSpacePassword}
        spaceError={spaceError}
        setSpaceError={setSpaceError}
        onJoinSpace={joinSpace}
        onFetchSpaces={fetchSpaces}
        onCreateSpace={handleCreateSpace}
        onClose={() => setSpaceModalOpen(false)}
        onFlowChange={setSpaceFlow}
      />

      {mode !== 'spectator' ? <Dashboard /> : null}
      <Scene vesselPosition={vesselPosition} mode={mode} />
      <HudDrawer
        onOpenSpaces={() => {
          setSpaceModalOpen(true);
          setSpaceError(null);
          setSpaceFlow('choice');
        }}
      />
      <JoinChoiceModal
        isOpen={showJoinChoice}
        ports={PORTS}
        selectedPort={selectedPort}
        onSelectPort={setSelectedPort}
        joinableVessels={joinableVessels}
        maxCrew={MAX_CREW}
        canEnterPlayerMode={canEnterPlayerMode}
        onJoinVessel={vesselId => {
          socketManager.setJoinPreference('player', true);
          socketManager.requestJoinVessel(vesselId);
          setMode('player');
          setShowJoinChoice(false);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(STORAGE_JOIN_CHOICE_KEY, 'join');
          }
        }}
        onQuickJoin={() => {
          socketManager.setJoinPreference('player', true);
          socketManager.requestJoinVessel();
          setMode('player');
          setShowJoinChoice(false);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(STORAGE_JOIN_CHOICE_KEY, 'join');
          }
        }}
        onCreateVessel={portName => {
          const port = PORTS.find(p => p.name === portName) || PORTS[0];
          socketManager.setJoinPreference('player', true);
          socketManager.requestNewVessel({
            lat: port.position.lat,
            lon: port.position.lon,
          });
          setMode('player');
          setShowJoinChoice(false);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(STORAGE_JOIN_CHOICE_KEY, 'create');
          }
        }}
        onSpectate={() => {
          setMode('spectator');
          socketManager.setJoinPreference('spectator', false);
          socketManager.notifyModeChange('spectator');
          setShowJoinChoice(false);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(STORAGE_JOIN_CHOICE_KEY, 'spectate');
          }
          setNotice({
            type: 'info',
            message: 'Spectator mode enabled.',
          });
        }}
        scenarios={scenarios}
        scenarioLoadingId={scenarioLoadingId}
        scenarioError={scenarioError}
        accountRank={account.rank}
        onStartScenario={startScenario}
      />
    </div>
  );
};

SimPage.fullBleedLayout = true;

export default SimPage;
