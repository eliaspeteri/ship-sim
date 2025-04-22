import React, { useEffect } from 'react';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import socketManager from '../networking/socket';
import useStore from '../store';

function MyApp({ Component, pageProps }: AppProps) {
  // Initialize socket connection
  useEffect(() => {
    // Make sure we're in the browser environment
    if (typeof window === 'undefined') return;

    // Connect to socket server - auth will be handled automatically
    // through the token stored in localStorage if available
    socketManager.connect('http://localhost:3001');

    // Add connection status to event log
    const addEvent = useStore.getState().addEvent;
    addEvent({
      category: 'system',
      type: 'connection',
      message: 'Connected to server',
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
