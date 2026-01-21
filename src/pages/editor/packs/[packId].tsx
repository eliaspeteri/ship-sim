import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import EditorGate from '../../../features/editor/EditorGate';
import EditorShell from '../../../features/editor/EditorShell';
import { editorLayers, editorPacks } from '../../../features/editor/mockData';
import type { EditorPack } from '../../../features/editor/types';

const EditorPackWorkspace: React.FC & { fullBleedLayout?: boolean } = () => {
  const router = useRouter();
  const { packId } = router.query;
  const resolvedPackId = Array.isArray(packId) ? packId[0] : packId;
  const [pack, setPack] = React.useState<EditorPack | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!router.isReady || !resolvedPackId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/editor/packs/${resolvedPackId}`);
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const data = (await res.json()) as { pack?: EditorPack };
        if (!cancelled && data?.pack) {
          setPack(data.pack);
          return;
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load pack. Showing local data.');
          const fallback = editorPacks.find(
            item => item.id === resolvedPackId,
          );
          setPack(fallback ?? null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [resolvedPackId, router.isReady]);

  if (!router.isReady || loading) {
    return (
      <EditorGate>
        <main className="min-h-screen bg-editor-page px-8 py-7 text-editor-text">
          <div className="text-[28px] font-semibold">Loading workspace</div>
          <div className="text-editor-muted-strong">
            Preparing editor session.
          </div>
          {error ? <div className="text-editor-muted-strong">{error}</div> : null}
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
          {error ? <div className="text-editor-muted-strong">{error}</div> : null}
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
