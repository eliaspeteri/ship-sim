import React, { useState } from 'react';
import socketManager from '../networking/socket';

/**
 * Login panel component for user authentication
 */
const LoginPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = socketManager.isAuthenticated();
  const currentUsername = socketManager.getUsername();
  const isAdmin = socketManager.isAdminUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        await socketManager.register(username, password);
      } else {
        await socketManager.login(username, password);
      }

      // Clear form fields after successful auth
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    socketManager.logout();
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
        </div>
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

        <div className="mb-4">
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
