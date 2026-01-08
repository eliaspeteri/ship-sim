import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import styles from './Auth.module.css';

/**
 * Register page for Ship Simulator.
 * Allows new users to create an account by providing username and password.
 * On success, logs the user in and redirects to the simulation.
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
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Auto-login the new user and send them to the sim
      const loginResult = await signIn('credentials', {
        redirect: false,
        username,
        password,
        callbackUrl: '/sim',
      });
      if (loginResult?.error) {
        setError(loginResult.error);
        return;
      }
      setSuccess(true);
      await router.push('/sim');
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
      <main className={styles.page}>
        <div className={styles.card}>
          <div className={styles.title}>Register</div>
          <div className={styles.subtitle}>
            Create your pilot profile and enter the simulator.
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
                autoComplete="new-password"
              />
            </div>
            {error ? <div className={styles.error}>{error}</div> : null}
            {success ? (
              <div className={styles.success}>
                Registration successful! Signing you in...
              </div>
            ) : null}
            <button
              type="submit"
              className={styles.buttonPrimary}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          <div className={styles.footer}>
            <p>
              Already have an account?{' '}
              <a href="/login" className={styles.buttonSecondary}>
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
