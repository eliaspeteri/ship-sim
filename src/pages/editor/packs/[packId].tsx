import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import React from 'react';

import EditorGate from '../../../features/editor/EditorGate';
import EditorShell from '../../../features/editor/EditorShell';
import { editorLayers, editorPacks } from '../../../features/editor/mockData';

import type { EditorPack } from '../../../features/editor/types';

const EditorPackWorkspace: React.FC & {
  fullBleedLayout?: boolean;
  navBack?: boolean;
} = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { packId } = router.query;
  const resolvedPackId = Array.isArray(packId) ? packId[0] : packId;
  const ownerId =
    (session?.user as { name?: string; id?: string } | undefined)?.name ||
    (session?.user as { name?: string; id?: string } | undefined)?.id ||
    'demo';
  const [pack, setPack] = React.useState<EditorPack | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!router.isReady || !resolvedPackId || status === 'loading') return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/editor/packs/${resolvedPackId}?ownerId=${ownerId}`,
        );
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
            item => item.id === resolvedPackId || item.slug === resolvedPackId,
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
  }, [ownerId, resolvedPackId, router.isReady, status]);

  if (!router.isReady || loading) {
    return (
      <EditorGate>
        <main className="min-h-screen bg-editor-page px-8 py-7 text-editor-text">
          <div className="text-[28px] font-semibold">Loading workspace</div>
          <div className="text-editor-muted-strong">
            Preparing editor session.
          </div>
          {error ? (
            <div className="text-editor-muted-strong">{error}</div>
          ) : null}
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
          {error ? (
            <div className="text-editor-muted-strong">{error}</div>
          ) : null}
        </main>
      </EditorGate>
    );
  }

  if (pack.ownerId && pack.slug) {
    const target = `/editor/${pack.ownerId}/packs/${pack.slug}`;
    if (router.asPath !== target) {
      void router.replace(target);
      return (
        <EditorGate>
          <main className="min-h-screen bg-editor-page px-8 py-7 text-editor-text">
            <div className="text-[28px] font-semibold">Redirecting...</div>
            <div className="text-editor-muted-strong">
              Moving to the new pack URL.
            </div>
          </main>
        </EditorGate>
      );
    }
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
EditorPackWorkspace.navBack = true;

export default EditorPackWorkspace;
