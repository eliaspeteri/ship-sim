import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut, useSession } from 'next-auth/react';
import React from 'react';

import AccessModal from '../features/auth/components/AccessModal';
import { ECONOMY_CONTEXTS } from '../features/economy/economyContexts';

type LayoutProps = {
  children: React.ReactNode;
  fullBleed?: boolean;
  navBack?: boolean;
};

const NAV_HEIGHT = 72;

type NavLink = {
  href: string;
  label: string;
  tag?: string;
};

const navLinks: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/sim', label: 'Simulator' },
  { href: '/vessels', label: 'Vessels' },
  { href: '/globe', label: 'Map', tag: 'beta' },
];

const protectedNavLinks: NavLink[] = [{ href: '/spaces', label: 'Spaces' }];

const navLinkBase =
  'relative rounded-[10px] px-[14px] py-2 text-[13px] font-semibold text-[rgba(225,236,240,0.9)] transition-all duration-200 hover:bg-[rgba(19,40,62,0.9)] hover:text-white';
const navLinkActive =
  'bg-[linear-gradient(135deg,rgba(36,176,168,0.9),rgba(20,96,110,0.85))] text-white shadow-[0_14px_28px_rgba(12,60,72,0.4)]';

const Layout: React.FC<LayoutProps> = ({
  children,
  fullBleed = false,
  navBack = false,
}) => {
  const router = useRouter();
  const { pathname } = router;
  const { status, data: session } = useSession();
  const isAuthed = status === 'authenticated';
  const role = (session?.user as { role?: string })?.role || 'guest';
  const isAdmin = role === 'admin';
  const canReview = role === 'reviewer' || role === 'admin';
  const username =
    session?.user?.name || (session?.user as { id?: string })?.id;
  const [accessOpen, setAccessOpen] = React.useState(false);

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
  const economyActive = pathname === '/economy';
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--app-bg)] text-[var(--ink)]"
      style={{ ['--nav-height' as string]: `${NAV_HEIGHT}px` }}
    >
      <header className="sticky top-0 z-40 border-b border-[rgba(22,42,56,0.8)] bg-[rgba(6,16,28,0.9)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[var(--nav-height)] w-full max-w-[1080px] items-center justify-between gap-6 px-5">
          {navBack ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(60,92,112,0.6)] bg-[rgba(12,24,38,0.85)] px-3 py-2 text-xs font-semibold text-[rgba(225,236,240,0.9)] transition-[transform,border,background] duration-200 hover:-translate-y-px hover:border-[rgba(90,132,156,0.85)] hover:bg-[rgba(20,44,66,0.95)]"
              onClick={() => router.back()}
            >
              <span aria-hidden="true">←</span>
              <span>Back</span>
            </button>
          ) : null}

          <Link
            href="/"
            className="flex items-center gap-[14px] text-inherit no-underline"
          >
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#f4c96a,#3bb2a2)] text-[#0c1116] shadow-[0_12px_30px_rgba(23,92,104,0.35)]">
              <span className="text-sm font-bold tracking-[0.06em]">SS</span>
            </div>
            <div className="flex flex-col leading-tight">
              <div className="text-[11px] uppercase tracking-[0.38em] text-[var(--muted)]">
                Ship Simulator
              </div>
              <div className="text-[13px] text-[rgba(225,236,240,0.88)]">
                Live prototype &amp; crew tools
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 max-[960px]:flex">
            {[
              ...navLinks,
              ...(isAuthed ? protectedNavLinks : []),
              ...(isAuthed
                ? canReview
                  ? [
                      { href: '/editor/packs', label: 'Editor Packs' },
                      { href: '/editor/review', label: 'Editor Review' },
                    ]
                  : [{ href: '/editor/packs', label: 'Editor' }]
                : []),
              ...(isAuthed ? [{ href: '/economy', label: 'Economy' }] : []),
              ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`${navLinkBase} ${isActive(link.href) ? navLinkActive : ''}`}
              >
                {link.label}
                {link.tag ? (
                  <span className="absolute -right-2 -top-2 rounded-full bg-[#f4c96a] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#2b2011]">
                    {link.tag}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>

          <nav className="flex items-center gap-1 max-[960px]:hidden">
            {[...navLinks, ...(isAuthed ? protectedNavLinks : [])].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`${navLinkBase} ${
                  isActive(link.href) ? navLinkActive : ''
                }`}
              >
                {link.label}
                {link.tag ? (
                  <span className="absolute -right-2 -top-2 rounded-full bg-[#f4c96a] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#2b2011]">
                    {link.tag}
                  </span>
                ) : null}
              </Link>
            ))}
            {isAuthed ? (
              canReview ? (
                <div
                  className={`group relative rounded-[10px] px-[14px] py-2 text-[13px] font-semibold text-[rgba(225,236,240,0.9)] transition-all duration-200 hover:bg-[rgba(19,40,62,0.9)] hover:text-white ${
                    pathname.startsWith('/editor') ? navLinkActive : ''
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    Editor
                    <span className="text-[10px] opacity-70">▾</span>
                  </span>
                  <div className="pointer-events-none absolute right-0 top-[calc(100%+8px)] grid min-w-[220px] translate-y-[-6px] gap-1.5 rounded-[14px] border border-[rgba(38,60,82,0.7)] bg-[rgba(10,20,34,0.95)] p-2.5 opacity-0 shadow-[0_18px_40px_rgba(6,14,24,0.45)] transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                    <Link
                      href="/editor/packs"
                      className="rounded-[10px] bg-[rgba(12,24,38,0.8)] px-3 py-2.5 text-[13px] font-semibold text-[rgba(225,236,240,0.85)] no-underline transition-colors duration-200 hover:bg-[rgba(28,58,88,0.85)] hover:text-white"
                    >
                      Packs
                    </Link>
                    <Link
                      href="/editor/review"
                      className="rounded-[10px] bg-[rgba(12,24,38,0.8)] px-3 py-2.5 text-[13px] font-semibold text-[rgba(225,236,240,0.85)] no-underline transition-colors duration-200 hover:bg-[rgba(28,58,88,0.85)] hover:text-white"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  href="/editor/packs"
                  className={`${navLinkBase} ${
                    isActive('/editor/packs') ? navLinkActive : ''
                  }`}
                >
                  Editor
                </Link>
              )
            ) : null}
            {isAdmin ? (
              <Link
                href="/admin"
                className={`${navLinkBase} ${isActive('/admin') ? navLinkActive : ''}`}
              >
                Admin
              </Link>
            ) : null}
            {isAuthed ? (
              <div
                className={`group relative rounded-[10px] px-[14px] py-2 text-[13px] font-semibold text-[rgba(225,236,240,0.9)] transition-all duration-200 hover:bg-[rgba(19,40,62,0.9)] hover:text-white ${
                  economyActive ? navLinkActive : ''
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  Operations
                  <span className="text-[10px] opacity-70">▾</span>
                </span>
                <div className="pointer-events-none absolute right-0 top-[calc(100%+8px)] grid min-w-[220px] translate-y-[-6px] gap-1.5 rounded-[14px] border border-[rgba(38,60,82,0.7)] bg-[rgba(10,20,34,0.95)] p-2.5 opacity-0 shadow-[0_18px_40px_rgba(6,14,24,0.45)] transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                  {ECONOMY_CONTEXTS.map(context => (
                    <Link
                      key={context.id}
                      href={`/economy#${context.id}`}
                      className="rounded-[10px] bg-[rgba(12,24,38,0.8)] px-3 py-2.5 text-[13px] font-semibold text-[rgba(225,236,240,0.85)] no-underline transition-colors duration-200 hover:bg-[rgba(28,58,88,0.85)] hover:text-white"
                    >
                      {context.navLabel || context.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </nav>

          <div className="flex items-center gap-2.5">
            {isAuthed ? (
              <>
                <div className="hidden text-right leading-tight min-[961px]:block">
                  <Link
                    href="/profile"
                    className="cursor-pointer text-[13px] font-semibold text-white no-underline hover:text-[#bfe7ea]"
                  >
                    {username || 'Signed in'}
                  </Link>
                </div>
                <span className="rounded-full border border-[rgba(85,108,120,0.6)] bg-[rgba(14,26,36,0.75)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[rgba(210,224,230,0.8)]">
                  {role}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void handleLogout();
                  }}
                  className="cursor-pointer rounded-[10px] bg-[rgba(19,35,48,0.9)] px-3.5 py-2 text-xs font-semibold text-[#dce8ec] transition-transform duration-200 hover:-translate-y-px"
                >
                  Logout
                </button>
              </>
            ) : !isAuthPage ? (
              <button
                type="button"
                onClick={() => setAccessOpen(true)}
                className="cursor-pointer rounded-[10px] bg-[linear-gradient(135deg,#22b4a8,#15707d)] px-3.5 py-2 text-xs font-semibold text-[#f8f8f8] transition-transform duration-200 hover:-translate-y-px"
              >
                Access
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-var(--nav-height))] flex-1">
        {fullBleed ? (
          children
        ) : (
          <div className="mx-auto max-w-[1080px] px-5 pb-12 pt-8">
            {children}
          </div>
        )}
      </main>
      {!isAuthed && !isAuthPage ? (
        <AccessModal open={accessOpen} onClose={() => setAccessOpen(false)} />
      ) : null}
    </div>
  );
};

export default Layout;
