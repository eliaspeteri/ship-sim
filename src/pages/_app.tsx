import React, { useEffect } from 'react';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import socketManager from '../networking/socket';
import useStore from '../store';

function MyApp({ Component, pageProps }: AppProps) {
  // Initialize socket connection
  useEffect(() => {
    // Get the admin parameter from URL (for testing purposes)
    // Using typeof check to ensure we're in browser environment before accessing window
    const isAdmin =
      typeof window !== 'undefined' &&
      window.location.search &&
      new URLSearchParams(window.location.search).get('admin') === 'true';

    // Connect to socket server with admin privileges if requested
    socketManager.connect('http://localhost:3001', isAdmin);

    // Add connection status to event log
    const addEvent = useStore.getState().addEvent;
    addEvent({
      category: 'system',
      type: 'connection',
      message: `Connected to server${isAdmin ? ' with admin privileges' : ''}`,
      severity: 'info',
    });

    // Clean up socket connection on unmount
    return () => {
      socketManager.disconnect();
    };
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
