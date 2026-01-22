import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import styles from './Layout.module.css';
import AccessModal from '../features/auth/components/AccessModal';
import { ECONOMY_CONTEXTS } from '../features/economy/economyContexts';

type LayoutProps = {
  children: React.ReactNode;
  fullBleed?: boolean;
  navBack?: boolean;
};

const NAV_HEIGHT = 72;

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/sim', label: 'Simulator' },
  { href: '/vessels', label: 'Vessels' },
  { href: '/globe', label: 'Map', tag: 'beta' },
];

const protectedNavLinks = [{ href: '/spaces', label: 'Spaces' }];

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
      className={styles.layout}
      style={{ ['--nav-height' as string]: `${NAV_HEIGHT}px` }}
    >
      <header className={styles.header}>
        <div className={styles.navContainer}>
          {navBack ? (
            <button
              type="button"
              className={styles.navBack}
              onClick={() => router.back()}
            >
              <span aria-hidden="true">←</span>
              <span>Back</span>
            </button>
          ) : null}
          <Link href="/" className={styles.brand}>
            <div className={styles.brandMark}>SS</div>
            <div className={styles.brandLabel}>
              <div className={styles.brandOverline}>Ship Simulator</div>
              <div className={styles.brandSub}>
                Live prototype &amp; crew tools
              </div>
            </div>
          </Link>

          <nav className={styles.navLinksMobile}>
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
                className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ''}`}
              >
                {link.label}
                {link.tag ? (
                  <span className={styles.navTag}>{link.tag}</span>
                ) : null}
              </Link>
            ))}
          </nav>

          <nav className={styles.navLinks}>
            {[...navLinks, ...(isAuthed ? protectedNavLinks : [])].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${
                  isActive(link.href) ? styles.navLinkActive : ''
                }`}
              >
                {link.label}
                {link.tag ? (
                  <span className={styles.navTag}>{link.tag}</span>
                ) : null}
              </Link>
            ))}
            {isAuthed ? (
              canReview ? (
                <div
                  className={`${styles.navDropdown} ${
                    pathname.startsWith('/editor')
                      ? styles.navDropdownActive
                      : ''
                  }`}
                >
                  <span className={styles.navDropdownLabel}>Editor</span>
                  <div className={styles.navDropdownMenu}>
                    <Link
                      href="/editor/packs"
                      className={styles.navDropdownItem}
                    >
                      Packs
                    </Link>
                    <Link
                      href="/editor/review"
                      className={styles.navDropdownItem}
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  href="/editor/packs"
                  className={`${styles.navLink} ${
                    isActive('/editor/packs') ? styles.navLinkActive : ''
                  }`}
                >
                  Editor
                </Link>
              )
            ) : null}
            {isAdmin ? (
              <Link
                href="/admin"
                className={`${styles.navLink} ${
                  isActive('/admin') ? styles.navLinkActive : ''
                }`}
              >
                Admin
              </Link>
            ) : null}
            {isAuthed ? (
              <div
                className={`${styles.navDropdown} ${
                  economyActive ? styles.navDropdownActive : ''
                }`}
              >
                <span className={styles.navDropdownLabel}>Operations</span>
                <div className={styles.navDropdownMenu}>
                  {ECONOMY_CONTEXTS.map(context => (
                    <Link
                      key={context.id}
                      href={`/economy#${context.id}`}
                      className={styles.navDropdownItem}
                    >
                      {context.navLabel || context.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </nav>

          <div className={styles.userArea}>
            {isAuthed ? (
              <>
                <div className={styles.userInfo}>
                  <Link href="/profile" className={styles.userNameLink}>
                    {username || 'Signed in'}
                  </Link>
                </div>
                <span className={styles.roleBadge}>{role}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={styles.secondaryButton}
                >
                  Logout
                </button>
              </>
            ) : !isAuthPage ? (
              <div className={styles.userArea}>
                <button
                  type="button"
                  onClick={() => setAccessOpen(true)}
                  className={styles.primaryButton}
                >
                  Access
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {fullBleed ? (
          children
        ) : (
          <div className={styles.mainInner}>{children}</div>
        )}
      </main>
      {!isAuthed && !isAuthPage ? (
        <AccessModal open={accessOpen} onClose={() => setAccessOpen(false)} />
      ) : null}
    </div>
  );
};

export default Layout;
