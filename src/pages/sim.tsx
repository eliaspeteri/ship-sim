import React, { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Scene from '../components/Scene';
import Dashboard from '../components/Dashboard';
import useStore from '../store';
import socketManager from '../networking/socket';
import { initializeSimulation, startSimulation } from '../simulation';
import { getSimulationLoop } from '../simulation';

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
  const hasStartedRef = useRef(false);
  const navHeightVar = 'var(--nav-height, 0px)';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/login');
      return;
    }
  }, [session, status, router]);

  // Start simulation and socket once per mount (avoid reconnects on tab focus)
  useEffect(() => {
    if (status !== 'authenticated' || !session) return;
    if (hasStartedRef.current) return;

    hasStartedRef.current = true;
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
    socketManager.connect(process.env.NEXTPUBLIC_SOCKET_URL || '');
    initializeSimulation();
    startSimulation();
  }, [session, status]);

  // Clean up only on unmount
  useEffect(
    () => () => {
      if (hasStartedRef.current) {
        socketManager.disconnect();
        hasStartedRef.current = false;
      }
    },
    [],
  );

  // Keyboard controls (W/S throttle, A/D rudder, arrows also)
  useEffect(() => {
    const clamp = (val: number, min: number, max: number) =>
      Math.min(Math.max(val, min), max);

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
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
          rudder = clamp(rudder - rudderStep, -0.6, 0.6);
          changed = true;
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          rudder = clamp(rudder + rudderStep, -0.6, 0.6);
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
        socketManager.sendControlUpdate(throttle, rudder);
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
        <span className="text-xs uppercase tracking-wide text-gray-300">
          Mode
        </span>
        <button
          type="button"
          onClick={() => setMode('player')}
          className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
            mode === 'player'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Player
        </button>
        <button
          type="button"
          onClick={() => setMode('spectator')}
          className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
            mode === 'spectator'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Spectator
        </button>
      </div>

      {mode !== 'spectator' ? <Dashboard /> : null}
      <Scene vesselPosition={vesselPosition} mode={mode} />
    </div>
  );
};

SimPage.fullBleedLayout = true;

export default SimPage;
