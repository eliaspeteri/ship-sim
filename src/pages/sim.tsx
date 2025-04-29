import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Scene from '../components/Scene';
import Dashboard from '../components/Dashboard';
import EnvironmentControls from '../components/EnvironmentControls';
import useStore from '../store';

/**
 * Simulation page for Ship Simulator.
 * Requires authentication. Shows the simulation UI if authenticated.
 */
const SimPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const vessel = useStore(state => state.vessel);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showUserPanel, setShowUserPanel] = React.useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/login');
    }
  }, [session, status, router]);

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
    <div className="h-screen w-full">
      <Dashboard className="fixed bottom-4 left-0 right-0 z-30" />
      {showSettings && (
        <EnvironmentControls className="fixed top-16 right-4 z-10 w-96" />
      )}
      <Scene vesselPosition={vesselPosition} />
      <button
        onClick={() => setShowUserPanel(!showUserPanel)}
        className="fixed top-4 right-24 z-10 rounded bg-gray-800 bg-opacity-70 px-4 py-2 text-white hover:bg-gray-700 transition-colors"
      >
        {session.user?.name || 'User'}
      </button>
      {/* User panel could go here if needed */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed top-4 right-4 z-10 rounded bg-gray-800 bg-opacity-70 px-4 py-2 text-white hover:bg-gray-700 transition-colors"
      >
        {showSettings ? 'Close Settings' : 'Settings'}
      </button>
    </div>
  );
};

export default SimPage;
