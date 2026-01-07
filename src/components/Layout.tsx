import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { signOut, useSession } from 'next-auth/react';

type LayoutProps = {
  children: React.ReactNode;
  fullBleed?: boolean;
};

const NAV_HEIGHT = 72;

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/sim', label: 'Simulator' },
  { href: '/globe', label: 'Map', tag: 'beta' },
  { href: '/system-schematics', label: 'Systems' },
];

const Layout: React.FC<LayoutProps> = ({ children, fullBleed = false }) => {
  const { pathname } = useRouter();
  const { status, data: session } = useSession();
  const isAuthed = status === 'authenticated';
  const role = (session?.user as { role?: string })?.role || 'guest';
  const username =
    session?.user?.name || (session?.user as { id?: string })?.id;

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await signOut({ callbackUrl: '/login' });
    }
  };

  const isActive = (href: string) =>
    href === '/'
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div
      className="min-h-screen bg-gray-950 text-gray-100"
      style={{ ['--nav-height' as string]: `${NAV_HEIGHT}px` }}
    >
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-semibold">
              SS
            </div>
            <div className="leading-tight">
              <div className="text-xs uppercase tracking-[0.22em] text-gray-400">
                Ship Simulator
              </div>
              <div className="text-sm text-gray-200">
                Live prototype &amp; crew tools
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-1 md:hidden">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                  isActive(link.href)
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-gray-200 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <nav className="hidden items-center gap-2 md:flex">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-gray-200 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {link.label}
                {link.tag ? (
                  <span className="absolute -right-2 -top-2 rounded-full bg-amber-500 px-2 py-[2px] text-[10px] font-semibold uppercase text-gray-900">
                    {link.tag}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthed ? (
              <>
                <div className="hidden flex-col text-right leading-tight sm:flex">
                  <span className="text-sm font-medium text-white">
                    {username || 'Signed in'}
                  </span>
                  <span className="text-[11px] uppercase tracking-wide text-gray-400">
                    {role}
                  </span>
                </div>
                <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs uppercase tracking-wide text-gray-300 sm:hidden">
                  {role}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-100 transition-colors hover:bg-gray-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-800 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-var(--nav-height))]">
        {fullBleed ? (
          children
        ) : (
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">{children}</div>
        )}
      </main>
    </div>
  );
};

export default Layout;
