import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import styles from './Layout.module.css';

type LayoutProps = {
  children: React.ReactNode;
  fullBleed?: boolean;
};

const NAV_HEIGHT = 72;

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/sim', label: 'Simulator' },
  { href: '/spaces', label: 'Spaces' },
  { href: '/globe', label: 'Map', tag: 'beta' },
  { href: '/system-schematics', label: 'Systems' },
];

const Layout: React.FC<LayoutProps> = ({ children, fullBleed = false }) => {
  const { pathname } = useRouter();
  const { status, data: session } = useSession();
  const isAuthed = status === 'authenticated';
  const role = (session?.user as { role?: string })?.role || 'guest';
  const isAdmin = role === 'admin';
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
      className={styles.layout}
      style={{ ['--nav-height' as string]: `${NAV_HEIGHT}px` }}
    >
      <header className={styles.header}>
        <div className={styles.navContainer}>
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
              ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <nav className={styles.navLinks}>
            {[
              ...navLinks,
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

          <div className={styles.userArea}>
            {isAuthed ? (
              <>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>
                    {username || 'Signed in'}
                  </span>
                  <span className={styles.userRole}>{role}</span>
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
            ) : (
              <div className={styles.userArea}>
                <Link href="/login" className={styles.secondaryButton}>
                  Login
                </Link>
                <Link href="/register" className={styles.primaryButton}>
                  Register
                </Link>
              </div>
            )}
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
    </div>
  );
};

export default Layout;
