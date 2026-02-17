import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import React, { useState } from 'react';

import AuthCard from '../features/auth/components/AuthCard';
import AuthField from '../features/auth/components/AuthField';
import AuthNotice from '../features/auth/components/AuthNotice';
import AuthPageLayout from '../features/auth/components/AuthPageLayout';

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
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState(0);

  const formatLockout = React.useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins <= 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  }, []);

  const parseSignInError = React.useCallback(
    (raw: string) => {
      if (raw.startsWith('LOCKED_OUT:')) {
        const parsed = Number(raw.slice('LOCKED_OUT:'.length));
        const seconds = Number.isFinite(parsed)
          ? Math.max(1, Math.floor(parsed))
          : 1;
        setLockoutRemainingSeconds(seconds);
        return `Too many failed attempts. Try again in ${formatLockout(seconds)}.`;
      }
      return raw;
    },
    [formatLockout],
  );

  // Redirect authenticated users to sim
  React.useEffect(() => {
    if (session) {
      void router.replace('/sim');
    }
  }, [session, router]);

  React.useEffect(() => {
    if (lockoutRemainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemainingSeconds(previous => Math.max(0, previous - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemainingSeconds]);

  React.useEffect(() => {
    if (lockoutRemainingSeconds <= 0) return;
    setError(
      `Too many failed attempts. Try again in ${formatLockout(lockoutRemainingSeconds)}.`,
    );
  }, [formatLockout, lockoutRemainingSeconds]);

  /**
   * Handles form submission for login.
   * Uses NextAuth.js signIn with credentials provider.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (lockoutRemainingSeconds > 0) {
      return;
    }
    setLoading(true);
    setError(null);
    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
      callbackUrl: '/sim',
    });
    if (res?.error) {
      setError(parseSignInError(res.error));
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
      <AuthPageLayout>
        <AuthCard
          title="Ship Simulator"
          subtitle="Sign in to access the live bridge and crew tools."
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
              autoComplete="current-password"
            />
            {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)] px-3.5 py-2.5 text-[14px] font-semibold text-white cursor-pointer"
              disabled={loading || lockoutRemainingSeconds > 0}
            >
              {loading
                ? 'Logging in...'
                : lockoutRemainingSeconds > 0
                  ? `Locked (${formatLockout(lockoutRemainingSeconds)})`
                  : 'Login'}
            </button>
          </form>
          <div className="mt-[18px] text-center text-[12px] text-[rgba(170,192,202,0.7)]">
            <p>Access the simulation environment</p>
            <Link
              href="/register"
              className="mt-2 inline-flex items-center justify-center rounded-[12px] border border-[rgba(60,88,104,0.7)] bg-[rgba(12,28,44,0.8)] px-3.5 py-2.5 text-[13px] font-semibold text-[rgba(230,238,240,0.9)] cursor-pointer"
            >
              Register New Account
            </Link>
          </div>
        </AuthCard>
      </AuthPageLayout>
    </>
  );
};

export default LoginPage;
