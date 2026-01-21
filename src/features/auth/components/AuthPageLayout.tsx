import React from 'react';

type AuthPageLayoutProps = {
  children: React.ReactNode;
};

const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({ children }) => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(100%_120%_at_15%_20%,rgba(38,91,130,0.35)_0%,rgba(9,22,38,0.95)_45%,rgba(6,13,24,0.98)_100%),linear-gradient(135deg,rgba(13,26,42,0.92),rgba(4,10,18,0.98))] px-4 py-10 text-[var(--ink)]">
      {children}
    </main>
  );
};

export default AuthPageLayout;
