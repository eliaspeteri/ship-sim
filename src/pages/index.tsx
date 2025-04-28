import React from 'react';
import { useEffect, useState } from 'react';
import Scene from '../components/Scene';
import Dashboard from '../components/Dashboard';
import EnvironmentControls from '../components/EnvironmentControls';
import LoginPanel from '../components/LoginPanel';
import useStore from '../store';
import {
  initializeSimulation,
  startSimulation,
  stopSimulation,
} from '../simulation';
import socketManager from '../networking/socket';

/**
 * Home component for the Ship Simulator application
 * Manages application state and authentication flow
 */
const Home = () => {
  // Get relevant state from Zustand store
  const vessel = useStore(state => state.vessel);

  // Local state for UI controls
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('Anonymous');
  const [isAdmin, setIsAdmin] = useState(false);

  // Check authentication status from localStorage
  const checkAuthStatus = (): boolean => {
    try {
      const storedAuth = localStorage.getItem('ship-sim-auth');
      if (storedAuth) {
        const auth = JSON.parse(storedAuth);
        if (auth.accessToken) {
          setCurrentUsername(auth.username || 'Anonymous');
          setIsAdmin(auth.isAdmin || false);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  };

  // Session expiry handling
  useEffect(() => {
    const handleSessionExpired = () => {
      setIsAuthenticated(false);
      setCurrentUsername('Anonymous');
      setIsAdmin(false);
      useStore.getState().addEvent({
        category: 'system',
        type: 'auth',
        message: 'Your session has expired. Please log in again.',
        severity: 'warning',
      });
    };

    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, []);

  // Initialize simulation on component mount
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await initializeSimulation();
        startSimulation();

        // Initialize WebSocket connection
        socketManager.connect();

        // Check if user is already authenticated (from localStorage)
        setIsAuthenticated(checkAuthStatus());

        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize simulation:', error);
        setLoading(false);
      }
    };

    init();

    // Set up auth change listener
    const handleAuthChange = () => {
      const isAuth = checkAuthStatus();
      setIsAuthenticated(isAuth);
    };

    // Subscribe to auth state changes
    window.addEventListener('auth-changed', handleAuthChange);

    // Clean up on unmount
    return () => {
      stopSimulation();
      socketManager.disconnect();
      window.removeEventListener('auth-changed', handleAuthChange);
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

  // Toggle user panel
  const toggleUserPanel = () => {
    setShowUserPanel(!showUserPanel);
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
      ) : !isAuthenticated ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-gray-900 to-black">
          <div className="w-full max-w-md">
            <LoginPanel className="mx-auto" />
          </div>
        </div>
      ) : (
        <>
          {/* 3D Scene */}
          <Scene vesselPosition={vesselPosition} />

          {/* User Account Button */}
          <button
            onClick={toggleUserPanel}
            className="fixed top-4 right-24 z-10 rounded bg-gray-800 bg-opacity-70 px-4 py-2 text-white hover:bg-gray-700 transition-colors"
          >
            {currentUsername}
            {isAdmin && (
              <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                Admin
              </span>
            )}
          </button>

          {/* User Panel */}
          {showUserPanel && (
            <div className="fixed top-16 right-24 z-10 w-64">
              <LoginPanel className="mx-auto" />
            </div>
          )}

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
