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
import { RUDDER_STALL_ANGLE_RAD } from '../constants/vessel';

const PORTS = [
  { name: 'Harbor Alpha', position: { x: 0, y: 0 } },
  { name: 'Bay Delta', position: { x: 2000, y: -1500 } },
  { name: 'Island Anchorage', position: { x: -2500, y: 1200 } },
  { name: 'Channel Gate', position: { x: 800, y: 2400 } },
];

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
  const setSessionUserId = useStore(state => state.setSessionUserId);
  const setChatMessages = useStore(state => state.setChatMessages);
  const currentVesselId = useStore(state => state.currentVesselId);
  const hasStartedRef = useRef(false);
  const navHeightVar = 'var(--nav-height, 0px)';
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

  const getApiBase = React.useCallback(() => {
    const envBase =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      '';
    if (envBase) return envBase.replace(/\/$/, '');
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      const port = process.env.NEXT_PUBLIC_SERVER_PORT || '3001';
      return `${protocol}//${hostname}:${port}`;
    }
    return 'http://localhost:3001';
  }, []);

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
    [getApiBase],
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
    [getApiBase, mergeSpaces, saveKnownSpace],
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
    getApiBase,
    joinSpace,
    mergeSpaces,
    saveKnownSpace,
    newSpaceName,
    newSpacePassword,
    newSpaceVisibility,
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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasChosenSpace, showJoinChoice, status]);

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

      switch (event.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
          throttle = clamp(throttle + throttleStep, -1, 1);
          changed = true;
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          throttle = clamp(throttle - throttleStep, -1, 1);
          changed = true;
          break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
          rudder = clamp(
            rudder - rudderStep,
            -RUDDER_STALL_ANGLE_RAD,
            RUDDER_STALL_ANGLE_RAD,
          );
          changed = true;
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          rudder = clamp(
            rudder + rudderStep,
            -RUDDER_STALL_ANGLE_RAD,
            RUDDER_STALL_ANGLE_RAD,
          );
          changed = true;
          break;
        default:
          break;
      }

      if (!changed) return;

      state.updateVessel({
        controls: {
          ...controls,
          throttle,
          rudderAngle: rudder,
        },
      });

      try {
        const simulationLoop = getSimulationLoop();
        simulationLoop.applyControls({
          throttle,
          rudderAngle: rudder,
          ballast: controls.ballast,
        });
        socketManager.sendControlUpdate(throttle, rudder, controls.ballast);
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

  const vesselPosition = {
    x: vessel?.position?.x || 0,
    y: vessel?.position?.y || 0,
    z: vessel?.position?.z || 0,
    heading: vessel?.orientation?.heading || 0,
  };

  return (
    <div
      className="w-full"
      style={{
        minHeight: `calc(100vh - ${navHeightVar})`,
        height: `calc(100vh - ${navHeightVar})`,
      }}
    >
      <div className="fixed right-4 top-[calc(var(--nav-height,0px)+8px)] z-40 flex items-center gap-2 rounded-lg bg-gray-900/80 px-3 py-2 text-sm text-white shadow-lg backdrop-blur">
        {notice ? (
          <div
            className={`mr-3 rounded px-2 py-1 text-xs ${notice.type === 'error' ? 'bg-red-700' : 'bg-blue-700'}`}
          >
            {notice.message}
          </div>
        ) : null}
        {userId && crewIds.includes(userId) && (
          <button
            type="button"
            className="rounded bg-amber-600 px-3 py-1 text-xs font-semibold hover:bg-amber-700"
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
          className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold hover:bg-indigo-700"
          onClick={() => {
            socketManager.requestNewVessel();
            setNotice({
              type: 'info',
              message: 'Requesting a new vessel...',
            });
          }}
        >
          Create My Vessel
        </button>
        <span className="text-xs uppercase tracking-wide text-gray-300">
          Mode
        </span>
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
            socketManager.notifyModeChange(nextMode);
          }}
          className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
            mode === 'player'
              ? 'bg-blue-600 text-white'
              : 'bg-emerald-600 text-white'
          } ${!canEnterPlayerMode && mode !== 'player' ? 'opacity-60 cursor-not-allowed' : ''}`}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => {
            setSpaceModalOpen(false);
            setSpaceFlow('choice');
            setSpaceError(null);
          }}
        >
          <div
            className="relative w-[560px] max-w-[90vw] rounded-lg bg-gray-900 p-4 text-white shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {spaceFlow !== 'choice' ? (
                  <button
                    className="flex items-center gap-1 rounded-md bg-gray-800 px-4 py-2 text-sm font-semibold hover:bg-gray-700"
                    onClick={() => {
                      setSpaceFlow('choice');
                      setSpaceError(null);
                    }}
                  >
                    <span aria-hidden="true">←</span>
                    Back
                  </button>
                ) : (
                  <div className="w-[68px]" />
                )}
                <div className="text-lg font-semibold">Choose a space</div>
              </div>
              <button
                className="rounded-md bg-red-700 px-4 py-2 text-xs font-semibold hover:bg-red-600"
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
              <div className="mb-6 flex gap-3">
                <button
                  className="flex-1 rounded-md bg-blue-700 px-4 py-6 text-center text-sm font-semibold hover:bg-blue-600"
                  onClick={() => {
                    setSpaceFlow('join');
                    setSpaceError(null);
                  }}
                >
                  Join space
                </button>
                <button
                  className="flex-1 rounded-md bg-emerald-700 px-4 py-6 text-center text-sm font-semibold hover:bg-emerald-600"
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
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs uppercase text-gray-300">Space</span>
                  <input
                    className="w-32 rounded-md bg-gray-800 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={spaceInput}
                    onChange={e => setSpaceInput(e.target.value)}
                    placeholder="global"
                  />
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold hover:bg-blue-700"
                    onClick={() => {
                      setSpaceError(null);
                      joinSpace(spaceInput);
                    }}
                  >
                    Join
                  </button>
                  <button
                    className="rounded-md bg-gray-800 px-3 py-1 text-xs hover:bg-gray-700"
                    onClick={() => {
                      setSpaceFlow('choice');
                      setSpaceError(null);
                    }}
                  >
                    Back
                  </button>
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-300">
                  {spacesLoading ? <span>Loading spaces...</span> : null}
                  {spaces.map(space => (
                    <button
                      key={space.id}
                      className={`rounded-full border px-3 py-1 text-white hover:border-blue-500 hover:text-blue-200 ${
                        space.visibility === 'private'
                          ? 'border-pink-700 bg-pink-900/60'
                          : 'border-gray-700 bg-gray-800'
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
                    <span className="text-gray-400">No public spaces yet</span>
                  ) : null}
                  {(knownSpaces?.length || 0) > 0 ? (
                    <span className="rounded-full border border-indigo-700 bg-indigo-900/60 px-2 py-1 text-[11px] text-indigo-100">
                      Known spaces: {knownSpaces.length}
                    </span>
                  ) : null}
                </div>
                {spaces.length > 0 ? (
                  <div className="mb-3 rounded-md border border-gray-800 bg-gray-800 px-3 py-2 text-xs text-gray-200">
                    <div className="flex items-center justify-between">
                      <span>
                        Details for: <strong>{spaceInput || '—'}</strong>
                      </span>
                      {spaces.find(s => s.id === spaceInput)?.inviteToken ? (
                        <button
                          className="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600"
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
                    <div className="text-gray-400">
                      Invite token:{' '}
                      {spaces.find(s => s.id === spaceInput)?.inviteToken ||
                        '—'}
                    </div>
                  </div>
                ) : null}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <input
                    className="w-32 rounded-md bg-gray-800 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={inviteToken}
                    onChange={e => setInviteToken(e.target.value)}
                    placeholder="Invite code"
                  />
                  <input
                    className="w-32 rounded-md bg-gray-800 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={invitePassword}
                    onChange={e => setInvitePassword(e.target.value)}
                    type="password"
                    placeholder="Invite password"
                  />
                  <button
                    type="button"
                    className="rounded-md bg-gray-700 px-3 py-1 text-xs font-semibold hover:bg-gray-600"
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
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs uppercase text-gray-300">
                    Create a new space
                  </span>
                  <button
                    className="rounded-md bg-gray-800 px-3 py-1 text-xs hover:bg-gray-700"
                    onClick={() => {
                      setSpaceFlow('choice');
                      setSpaceError(null);
                    }}
                  >
                    Back
                  </button>
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <input
                    className="w-32 flex-1 rounded-md bg-gray-800 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={newSpaceName}
                    onChange={e => setNewSpaceName(e.target.value)}
                    placeholder="New space name"
                  />
                  <select
                    className="rounded-md bg-gray-800 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="w-32 rounded-md bg-gray-800 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={newSpacePassword}
                    onChange={e => setNewSpacePassword(e.target.value)}
                    type="password"
                    placeholder="Password (optional)"
                  />
                  <button
                    type="button"
                    className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold hover:bg-emerald-700"
                    onClick={() => void handleCreateSpace()}
                  >
                    Create
                  </button>
                </div>
              </>
            ) : null}

            {spaceError ? (
              <div className="text-xs text-red-400">{spaceError}</div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-lg bg-gray-900 p-6 text-white shadow-2xl w-[420px] space-y-4">
            <h2 className="text-xl font-bold">Choose how to join</h2>
            <p className="text-sm text-gray-300">
              You can join an available vessel with open crew slots or start
              your own.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-300">
                Spawn location
                <select
                  className="mt-1 w-full rounded bg-gray-800 px-2 py-1 text-white"
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
              <button
                className="rounded bg-emerald-600 px-4 py-2 text-left font-semibold hover:bg-emerald-700"
                onClick={() => {
                  setShowJoinChoice(false);
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('ship-sim-join-choice', 'join');
                  }
                }}
              >
                Join existing crew (auto-assign)
              </button>
              <button
                className="rounded bg-indigo-600 px-4 py-2 text-left font-semibold hover:bg-indigo-700"
                onClick={() => {
                  const port =
                    PORTS.find(p => p.name === selectedPort) || PORTS[0];
                  socketManager.requestNewVessel({
                    x: port.position.x,
                    y: port.position.y,
                  });
                  setShowJoinChoice(false);
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('ship-sim-join-choice', 'create');
                  }
                }}
              >
                Create my own vessel
              </button>
              <button
                className="rounded bg-gray-700 px-4 py-2 text-left font-semibold hover:bg-gray-600"
                onClick={() => {
                  setMode('spectator');
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

SimPage.fullBleedLayout = true;

export default SimPage;
