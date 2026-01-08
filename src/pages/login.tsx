import React, { useState } from 'react';
import Head from 'next/head';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import styles from './Auth.module.css';

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
      <main className={styles.page}>
        <div className={styles.card}>
          <div className={styles.title}>Ship Simulator</div>
          <div className={styles.subtitle}>
            Sign in to access the live bridge and crew tools.
          </div>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={styles.input}
                required
                autoComplete="username"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={styles.input}
                required
                autoComplete="current-password"
              />
            </div>
            {error ? <div className={styles.error}>{error}</div> : null}
            <button
              type="submit"
              className={styles.buttonPrimary}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className={styles.footer}>
            <p>Access the simulation environment</p>
            <button
              type="button"
              className={styles.buttonSecondary}
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
