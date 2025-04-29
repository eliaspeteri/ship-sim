import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

/**
 * Register page for Ship Simulator.
 * Allows new users to create an account by providing username and password.
 * On success, redirects to the login page.
 */
const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   * Handles registration form submission.
   * Sends POST request to backend /auth/register endpoint.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 1200);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register - Ship Simulator</title>
        <meta name="description" content="Register for Ship Simulator" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-full max-w-md p-6">
          <h1 className="text-3xl font-bold text-white text-center mb-8">
            Register
          </h1>
          <form
            onSubmit={handleSubmit}
            className="bg-gray-800 bg-opacity-70 rounded-lg p-6 text-white"
          >
            <div className="mb-4">
              <label
                htmlFor="username"
                className="block mb-1 text-sm font-medium"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
                autoComplete="username"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block mb-1 text-sm font-medium"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
                autoComplete="new-password"
              />
            </div>
            {error && (
              <div className="mb-3 bg-red-800 p-2 rounded text-sm">{error}</div>
            )}
            {success && (
              <div className="mb-3 bg-green-800 p-2 rounded text-sm">
                Registration successful! Redirecting to login...
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>
              Already have an account?{' '}
              <a href="/login" className="text-blue-400 hover:underline">
                Login
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default RegisterPage;
