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
  const { data: session, status } = useSession();
  const router = useRouter();
  const vessel = useStore(state => state.vessel);
  const mode = useStore(state => state.mode);
  const setMode = useStore(state => state.setMode);
  const setSpaceId = useStore(state => state.setSpaceId);
  const roles = useStore(state => state.roles);
  const notice = useStore(state => state.notice);
  const setNotice = useStore(state => state.setNotice);
  const crewIds = useStore(state => state.crewIds);
  const setSessionUserId = useStore(state => state.setSessionUserId);
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

  useEffect(() => {
    if (userId) setSessionUserId(userId);
  }, [userId, setSessionUserId]);

  useEffect(() => {
    const querySpace =
      typeof router.query.space === 'string'
        ? router.query.space.trim().toLowerCase()
        : null;
    if (querySpace) {
      setSpaceId(querySpace);
      socketManager.setSpaceId(querySpace);
    }
  }, [router.query.space, setSpaceId]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const seen = typeof window !== 'undefined' && sessionStorage.getItem('ship-sim-join-choice');
    if (!seen) {
      setShowJoinChoice(true);
    }
  }, [status]);

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
  }, [session, status]);

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
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
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

      {mode !== 'spectator' ? <Dashboard /> : null}
      <Scene vesselPosition={vesselPosition} mode={mode} />
      <HudDrawer />
      {showJoinChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-lg bg-gray-900 p-6 text-white shadow-2xl w-[420px] space-y-4">
            <h2 className="text-xl font-bold">Choose how to join</h2>
            <p className="text-sm text-gray-300">
              You can join an available vessel with open crew slots or start your own.
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
                  const port = PORTS.find(p => p.name === selectedPort) || PORTS[0];
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

SimPage.fullBleedLayout = true;

export default SimPage;
