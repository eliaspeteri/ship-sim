import React, { useState } from 'react';
import Head from 'next/head';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

/**
 * Login page for Ship Simulator using NextAuth.js
 * Handles authentication via credentials provider.
 */
const LoginPage: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect authenticated users to sim
  React.useEffect(() => {
    if (session) {
      router.replace('/sim');
    }
  }, [session, router]);

  /**
   * Handles form submission for login.
   * Uses NextAuth.js signIn with credentials provider.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
      callbackUrl: '/sim',
    });
    if (res?.error) {
      setError(res.error);
      setLoading(false);
      return;
    }
    await router.replace(res?.url || '/sim');
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Ship Simulator - Login</title>
        <meta name="description" content="Login to Ship Simulator" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-full flex items-center justify-center bg-gray-900">
        <div className="w-full max-w-md p-6">
          <h1 className="text-3xl font-bold text-white text-center mb-8">
            Ship Simulator
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
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="mb-3 bg-red-800 p-2 rounded text-sm">{error}</div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>Access the simulation environment</p>
            <button
              type="button"
              className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
              onClick={() => router.push('/register')}
            >
              Register New Account
            </button>
          </div>
        </div>
      </main>
    </>
  );
};

export default LoginPage;
