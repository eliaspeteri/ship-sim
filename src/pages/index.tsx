import { useEffect, useState } from 'react';
import Scene from '../components/Scene';
import Dashboard from '../components/Dashboard';
import EnvironmentControls from '../components/EnvironmentControls';
import useStore from '../store';
import {
  initializeSimulation,
  startSimulation,
  stopSimulation,
} from '../simulation';
import { socketManager } from '../networking/socket';

const Home = () => {
  // Get relevant state from Zustand store
  const vessel = useStore(state => state.vessel);

  // Local state for UI controls
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize simulation on component mount
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await initializeSimulation();
        startSimulation();

        // Initialize WebSocket connection
        socketManager.connect();

        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize simulation:', error);
        setLoading(false);
      }
    };

    init();

    // Clean up on unmount
    return () => {
      stopSimulation();
      socketManager.disconnect();
    };
  }, []);

  // Get formatted vessel data for display
  const vesselPosition = {
    x: vessel?.position?.x || 0,
    y: vessel?.position?.y || 0,
    heading: vessel?.orientation?.heading || 0,
  };

  // Toggle settings panel
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <div className="h-screen w-full">
      {loading ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="rounded-lg bg-black bg-opacity-70 p-8 text-center text-white">
            <h1 className="mb-4 text-2xl font-bold">Loading Ship Simulator</h1>
            <p className="mb-4">
              Initializing physics engine and 3D environment...
            </p>
            <div className="mx-auto h-2 w-64 overflow-hidden rounded-full bg-gray-700">
              <div className="h-full w-1/2 animate-pulse bg-blue-500"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 3D Scene */}
          <Scene vesselPosition={vesselPosition} />

          {/* Settings Button */}
          <button
            onClick={toggleSettings}
            className="fixed top-4 right-4 z-10 rounded bg-gray-800 bg-opacity-70 px-4 py-2 text-white hover:bg-gray-700 transition-colors"
          >
            {showSettings ? 'Close Settings' : 'Settings'}
          </button>

          {/* Environment Settings Panel - conditionally rendered */}
          {showSettings && (
            <EnvironmentControls className="fixed top-16 right-4 z-10 w-96" />
          )}

          {/* Control Dashboard */}
          <Dashboard className="fixed bottom-4 left-0 right-0" />
        </>
      )}
    </div>
  );
};

export default Home;
