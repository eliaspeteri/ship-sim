import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import AuthCard from '../features/auth/components/AuthCard';
import AuthField from '../features/auth/components/AuthField';
import AuthNotice from '../features/auth/components/AuthNotice';
import AuthPageLayout from '../features/auth/components/AuthPageLayout';

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
      <AuthPageLayout>
        <AuthCard
          title="Register"
          subtitle="Create your pilot profile and enter the simulator."
        >
          <form
            onSubmit={event => {
              void handleSubmit(event);
            }}
            className="grid gap-3.5"
          >
            <AuthField
              id="username"
              name="username"
              label="Username"
              type="text"
              value={username}
              onChange={setUsername}
              autoComplete="username"
            />
            <AuthField
              id="password"
              name="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
            {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}
            {success ? (
              <AuthNotice tone="success">
                Registration successful! Signing you in...
              </AuthNotice>
            ) : null}
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)] px-3.5 py-2.5 text-[14px] font-semibold text-white cursor-pointer"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          <div className="mt-[18px] text-center text-[12px] text-[rgba(170,192,202,0.7)]">
            <p>
              Already have an account?{' '}
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-[12px] border border-[rgba(60,88,104,0.7)] bg-[rgba(12,28,44,0.8)] px-3.5 py-2.5 text-[13px] font-semibold text-[rgba(230,238,240,0.9)] cursor-pointer"
              >
                Login
              </Link>
            </p>
          </div>
        </AuthCard>
      </AuthPageLayout>
    </>
  );
};

export default RegisterPage;
