import React, { useState } from 'react';
import Head from 'next/head';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
      <AuthPageLayout>
        <AuthCard
          title="Ship Simulator"
          subtitle="Sign in to access the live bridge and crew tools."
        >
          <form onSubmit={handleSubmit} className="grid gap-3.5">
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
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
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
