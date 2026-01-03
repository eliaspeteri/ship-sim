import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { signOut, useSession } from 'next-auth/react';

type LayoutProps = {
  children: React.ReactNode;
  fullBleed?: boolean;
};

const Layout: React.FC<LayoutProps> = ({ children, fullBleed = false }) => {
  const { pathname } = useRouter();
  const { status } = useSession();
  const isAuthed = status === 'authenticated';

  const baseLinks = [
    { href: '/', label: 'Home' },
    { href: '/sim', label: 'Simulator' },
  ];
  const authLinks = isAuthed
    ? []
    : [
        { href: '/login', label: 'Login' },
        { href: '/register', label: 'Register' },
      ];

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await signOut({ callbackUrl: '/login' });
    }
  };

  const navHeight = '64px';
  return (
    <div
      className="min-h-screen bg-gray-950 text-gray-100"
      style={{ ['--nav-height' as string]: navHeight }}
    >
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="text-lg font-semibold tracking-tight text-white">
            Ship Simulator
          </div>
          <nav className="flex items-center gap-2">
            {[...baseLinks, ...authLinks].map(link => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-200 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAuthed ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-800 hover:text-white"
              >
                Logout
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <main
        className="min-h-[calc(100vh-var(--nav-height))]"
      >
        {fullBleed ? (
          children
        ) : (
          <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
        )}
      </main>
    </div>
  );
};

export default Layout;
