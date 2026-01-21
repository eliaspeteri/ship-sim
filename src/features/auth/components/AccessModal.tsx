import React from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import AuthField from './AuthField';
import AuthNotice from './AuthNotice';

type AccessModalProps = {
  open: boolean;
  onClose: () => void;
};

const AccessModal: React.FC<AccessModalProps> = ({ open, onClose }) => {
  const router = useRouter();
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = React.useState<'login' | 'register'>('login');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(false);
    setLoading(false);
    setUsername('');
    setPassword('');
    setMode('login');
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as globalThis.Node | null;
      if (modalRef.current && target && modalRef.current.contains(target)) {
        event.stopPropagation();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleToggle = () => {
    setError(null);
    setSuccess(false);
    setMode(prev => (prev === 'login' ? 'register' : 'login'));
  };

  const refreshAfterAuth = async () => {
    onClose();
    await router.replace(router.asPath);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        username,
        password,
        callbackUrl: router.asPath,
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
      await refreshAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Registration failed');
      }
      setSuccess(true);
      const loginResult = await signIn('credentials', {
        redirect: false,
        username,
        password,
        callbackUrl: router.asPath,
      });
      if (loginResult?.error) {
        throw new Error(loginResult.error);
      }
      await refreshAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(4,10,18,0.72)]"
        aria-label="Close access modal"
        onClick={handleClose}
      />
      <div
        ref={modalRef}
        className="relative z-10 w-[min(420px,90vw)] rounded-[18px] border border-[rgba(27,154,170,0.35)] bg-[rgba(10,20,34,0.95)] p-7 text-[var(--ink)] shadow-[0_24px_60px_rgba(4,10,18,0.6)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[22px] font-bold">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </div>
            <div className="mt-1 text-[13px] text-[rgba(170,192,202,0.7)]">
              {mode === 'login'
                ? 'Sign in to access crew tools and shared spaces.'
                : 'Register to save progress and join shared spaces.'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2.5 py-1.5 text-[12px] font-semibold text-[#f1f7f8] cursor-pointer"
          >
            Close
          </button>
        </div>
        <form
          className="mt-5 grid gap-3.5"
          onSubmit={event => {
            event.preventDefault();
            if (loading) return;
            if (mode === 'login') {
              void handleLogin();
            } else {
              void handleRegister();
            }
          }}
        >
          <AuthField
            id="access-username"
            name="username"
            label="Username"
            type="text"
            value={username}
            onChange={setUsername}
            autoComplete="username"
          />
          <AuthField
            id="access-password"
            name="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
          />
          {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}
          {success ? (
            <AuthNotice tone="success">
              Registration successful. Signing you in...
            </AuthNotice>
          ) : null}
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)] px-3.5 py-2.5 text-[14px] font-semibold text-white cursor-pointer"
            disabled={loading}
          >
            {loading
              ? mode === 'login'
                ? 'Logging in...'
                : 'Registering...'
              : mode === 'login'
                ? 'Login'
                : 'Register'}
          </button>
        </form>
        <div className="mt-4 text-center text-[12px] text-[rgba(170,192,202,0.7)]">
          {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={handleToggle}
            className="text-[#f1f7f8] underline cursor-pointer"
          >
            {mode === 'login' ? 'Register' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessModal;
