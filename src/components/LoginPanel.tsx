import React, { useState, useEffect } from 'react';
import useStore from '../store';

/**
 * Login panel component for user authentication using REST API endpoints
 */
const LoginPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [sessionExpiring, setSessionExpiring] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);

  // Load authentication state from localStorage on component mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const storedAuth = localStorage.getItem('ship-sim-auth');
        if (storedAuth) {
          const auth = JSON.parse(storedAuth);
          setIsAuthenticated(true);
          setCurrentUsername(auth.username || 'Anonymous');
          setIsAdmin(auth.isAdmin || false);
          setStayLoggedIn(auth.stayLoggedIn || false);
          setAccessToken(auth.accessToken || null);
          setRefreshToken(auth.refreshToken || null);

          // Extract expiry from token if available
          if (auth.accessToken) {
            const expiry = parseJwtExpiry(auth.accessToken);
            setTokenExpiry(expiry);
          }
        }
      } catch (error) {
        console.error('Failed to load authentication state:', error);
      }
    };

    loadAuthState();

    // Set up auth change listener
    const handleAuthChanged = () => {
      loadAuthState();
    };

    window.addEventListener('auth-changed', handleAuthChanged);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChanged);
    };
  }, []);

  // Check for session expiration
  useEffect(() => {
    const checkSessionStatus = () => {
      if (isAuthenticated && tokenExpiry) {
        const now = Math.floor(Date.now() / 1000);
        const timeRemaining = tokenExpiry - now;

        // Set session expiring if less than 5 minutes remaining
        if (timeRemaining > 0 && timeRemaining < 300) {
          setSessionExpiring(true);
        } else {
          setSessionExpiring(false);
        }

        // If token is expired, clear auth
        if (timeRemaining <= 0) {
          window.dispatchEvent(new Event('session-expired'));
        }
      }
    };

    // Check immediately
    checkSessionStatus();

    // Set up interval to check periodically (every minute)
    const interval = setInterval(checkSessionStatus, 60000);

    // Handle session expired event
    const handleSessionExpired = () => {
      setError('Your session has expired. Please log in again.');
      clearAuthFromStorage();
      setIsAuthenticated(false);
      setCurrentUsername('');
      setIsAdmin(false);
      setAccessToken(null);
      setRefreshToken(null);
    };

    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      clearInterval(interval);
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [isAuthenticated, tokenExpiry]);

  // Parse JWT token expiry
  const parseJwtExpiry = (token: string): number | null => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      // Decode the payload
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf8'),
      );

      return payload.exp;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  };

  // Save auth state to localStorage
  const saveAuthToStorage = (authData: {
    accessToken: string;
    refreshToken: string;
    userId?: string;
    username: string;
    isAdmin: boolean;
    stayLoggedIn: boolean;
  }): void => {
    try {
      localStorage.setItem('ship-sim-auth', JSON.stringify(authData));
      window.dispatchEvent(new Event('auth-changed'));
    } catch (error) {
      console.error('Failed to save authentication to storage:', error);
    }
  };

  // Clear auth from localStorage
  const clearAuthFromStorage = (): void => {
    try {
      localStorage.removeItem('ship-sim-auth');
      window.dispatchEvent(new Event('auth-changed'));
    } catch (error) {
      console.error('Failed to clear authentication from storage:', error);
    }
  };

  // Handle login/register form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegistering ? '/auth/register' : '/auth/login';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        const { tokens } = data;

        // Update local state
        setIsAuthenticated(true);
        setCurrentUsername(data.username || username);
        setIsAdmin(data.roles?.includes('admin') || false);
        setAccessToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);

        // Extract token expiry
        if (tokens.accessToken) {
          const expiry = parseJwtExpiry(tokens.accessToken);
          setTokenExpiry(expiry);
        }

        // Save auth data to storage
        saveAuthToStorage({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          username: data.username || username,
          isAdmin: data.roles?.includes('admin') || false,
          stayLoggedIn,
        });

        // Clear form fields after successful auth
        setUsername('');
        setPassword('');
        setSessionExpiring(false);
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Clear local auth state
      setIsAuthenticated(false);
      setCurrentUsername('');
      setIsAdmin(false);
      setAccessToken(null);
      setRefreshToken(null);
      setTokenExpiry(null);

      // Clear from storage
      clearAuthFromStorage();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle session refresh
  const handleRefreshSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        const { tokens } = data;

        // Update tokens in state
        setAccessToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);

        // Extract token expiry
        if (tokens.accessToken) {
          const expiry = parseJwtExpiry(tokens.accessToken);
          setTokenExpiry(expiry);
        }

        // Save updated tokens to storage
        const storedAuth = localStorage.getItem('ship-sim-auth');
        if (storedAuth) {
          const auth = JSON.parse(storedAuth);
          saveAuthToStorage({
            ...auth,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
        }

        setSessionExpiring(false);
      } else {
        throw new Error(data.error || 'Session refresh failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session refresh failed');

      // If refresh failed, log out
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleStayLoggedInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setStayLoggedIn(newValue);

    // If authenticated, update the stored preference
    if (isAuthenticated && accessToken && refreshToken) {
      const storedAuth = localStorage.getItem('ship-sim-auth');
      if (storedAuth) {
        const auth = JSON.parse(storedAuth);
        saveAuthToStorage({
          ...auth,
          stayLoggedIn: newValue,
        });
      }
    }
  };

  if (isAuthenticated) {
    return (
      <div
        className={`${className} rounded-lg bg-gray-800 bg-opacity-70 p-4 text-white`}
      >
        <h2 className="mb-3 text-lg font-bold">Account</h2>
        <div className="mb-3">
          <p>
            Logged in as:{' '}
            <span className="text-green-300">{currentUsername}</span>
            {isAdmin && (
              <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                Admin
              </span>
            )}
          </p>
          <div className="mt-3 flex items-center">
            <input
              type="checkbox"
              id="stayLoggedIn"
              checked={stayLoggedIn}
              onChange={handleStayLoggedInChange}
              className="mr-2"
            />
            <label htmlFor="stayLoggedIn" className="text-sm">
              Stay logged in (auto-refresh session)
            </label>
          </div>
        </div>

        {sessionExpiring && (
          <div className="mb-3 bg-yellow-800 p-2 rounded text-sm">
            <p className="mb-2">Your session will expire soon.</p>
            <button
              onClick={handleRefreshSession}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-2 rounded transition-colors mb-2"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Session'}
            </button>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div
      className={`${className} rounded-lg bg-gray-800 bg-opacity-70 p-4 text-white`}
    >
      <h2 className="mb-3 text-lg font-bold">
        {isRegistering ? 'Register New Admin' : 'Login'}
      </h2>

      {error && (
        <div className="mb-3 bg-red-800 p-2 rounded text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="username" className="block mb-1 text-sm font-medium">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="bg-gray-700 text-white rounded-md w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="block mb-1 text-sm font-medium">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-gray-700 text-white rounded-md w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="stayLoggedIn"
            checked={stayLoggedIn}
            onChange={handleStayLoggedInChange}
            className="mr-2"
          />
          <label htmlFor="stayLoggedIn" className="text-sm">
            Stay logged in
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Processing...' : isRegistering ? 'Register' : 'Login'}
          </button>

          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
          >
            {isRegistering ? 'Back to Login' : 'Create Admin Account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPanel;
