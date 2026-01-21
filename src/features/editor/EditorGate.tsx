import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

type EditorGateProps = {
  children: React.ReactNode;
};

const EditorGate: React.FC<EditorGateProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string })?.role || 'guest';
  const canAccess = role === 'player' || role === 'reviewer' || role === 'admin';

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      void router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading' || (status === 'unauthenticated' && !session)) {
    return (
      <div className="grid min-h-screen place-items-center bg-editor-page text-editor-text">
        <div className="rounded-[18px] border border-editor-surface-border bg-editor-surface px-8 py-7 text-center">
          <div className="mb-1.5 text-xl font-semibold">Loading Editor</div>
          <div className="text-sm text-editor-muted">
            Preparing workspace...
          </div>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="grid min-h-screen place-items-center bg-editor-page text-editor-text">
        <div className="rounded-[18px] border border-editor-surface-border bg-editor-surface px-8 py-7 text-center">
          <div className="mb-1.5 text-xl font-semibold">
            Editor access required
          </div>
          <div className="text-sm text-editor-muted">
            Your account does not have editor permissions yet.
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default EditorGate;
