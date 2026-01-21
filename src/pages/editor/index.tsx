import React from 'react';
import { useRouter } from 'next/router';

const EditorIndexPage: React.FC = () => {
  const router = useRouter();

  React.useEffect(() => {
    void router.replace('/editor/packs');
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center bg-editor-page text-editor-text">
      <div className="rounded-[18px] border border-editor-surface-border bg-editor-surface px-8 py-7 text-center">
        <div className="mb-1.5 text-xl font-semibold">Opening editor</div>
        <div className="text-sm text-editor-muted">
          Routing you to map packs...
        </div>
      </div>
    </div>
  );
};

EditorIndexPage.fullBleedLayout = true;

export default EditorIndexPage;
