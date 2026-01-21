import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import EditorGate from '../../../features/editor/EditorGate';
import EditorShell from '../../../features/editor/EditorShell';
import { editorLayers, editorPacks } from '../../../features/editor/mockData';

const EditorPackWorkspace: React.FC & { fullBleedLayout?: boolean } = () => {
  const router = useRouter();
  const { packId } = router.query;
  const resolvedPackId = Array.isArray(packId) ? packId[0] : packId;
  const pack = editorPacks.find(item => item.id === resolvedPackId);

  if (!router.isReady) {
    return (
      <EditorGate>
        <main className="min-h-screen bg-editor-page px-8 py-7 text-editor-text">
          <div className="text-[28px] font-semibold">Loading workspace</div>
          <div className="text-editor-muted-strong">
            Preparing editor session.
          </div>
        </main>
      </EditorGate>
    );
  }

  if (!pack) {
    return (
      <EditorGate>
        <main className="min-h-screen bg-editor-page px-8 py-7 text-editor-text">
          <div className="text-[28px] font-semibold">Pack not found</div>
          <div className="text-editor-muted-strong">
            This map pack does not exist or you no longer have access.
          </div>
        </main>
      </EditorGate>
    );
  }

  return (
    <EditorGate>
      <Head>
        <title>Map Editor - {pack.name}</title>
        <meta name="description" content="Map editor workspace" />
      </Head>
      <EditorShell pack={pack} layers={editorLayers} />
    </EditorGate>
  );
};

EditorPackWorkspace.fullBleedLayout = true;

export default EditorPackWorkspace;
