import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import EditorGate from '../../../features/editor/EditorGate';
import { editorPacks } from '../../../features/editor/mockData';
import type { EditorPack } from '../../../features/editor/types';

const EditorPacksPage: React.FC & { fullBleedLayout?: boolean } = () => {
  const [packs, setPacks] = React.useState<EditorPack[]>(editorPacks);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/editor/packs');
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const data = (await res.json()) as { packs?: EditorPack[] };
        if (!cancelled && data?.packs) {
          setPacks(data.packs);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load packs. Showing local data.');
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
  }, []);

  return (
    <EditorGate>
      <Head>
        <title>Map Editor - Packs</title>
        <meta name="description" content="Manage map packs" />
      </Head>
      <main className="min-h-screen bg-editor-page px-8 py-7 text-editor-text">
        <header className="mb-6 flex items-center justify-between">
          <div className="grid gap-2">
            <div className="text-[28px] font-semibold">Map Packs</div>
            <div className="text-editor-muted-strong">
              Draft, publish, and collaborate on overlay packs.
            </div>
          </div>
          <button
            type="button"
            className="rounded-full border border-editor-accent-strong-border bg-editor-accent-gradient px-5 py-2.5 font-semibold text-editor-accent-text"
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const res = await fetch('/api/editor/packs', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: 'New Pack',
                    description: 'Draft pack created from editor.',
                  }),
                });
                if (!res.ok) {
                  throw new Error(`Request failed: ${res.status}`);
                }
                const data = (await res.json()) as { pack?: EditorPack };
                if (data?.pack) {
                  setPacks(prev => [data.pack!, ...prev]);
                }
              } catch {
                setError('Unable to create pack.');
              } finally {
                setLoading(false);
              }
            }}
          >
            New Pack
          </button>
        </header>

        {error ? <div className="text-editor-muted-strong">{error}</div> : null}
        <section className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[18px]">
          {loading && packs.length === 0 ? (
            <div className="text-editor-muted-strong">Loading packs...</div>
          ) : null}
          {packs.map(pack => (
            <div
              key={pack.id}
              className="grid gap-2.5 rounded-[18px] border border-editor-card-border bg-editor-card px-5 py-[18px]"
            >
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">{pack.name}</div>
                <span className="rounded-full border border-editor-tag-border bg-editor-tag-bg px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-editor-tag-text">
                  {pack.visibility}
                </span>
              </div>
              <div className="text-[13px] text-editor-muted">
                {pack.regionSummary}
              </div>
              <div className="text-[14px] leading-[1.4] text-editor-soft">
                {pack.description}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[13px] text-editor-muted">
                  Updated {new Date(pack.updatedAt).toLocaleDateString()}
                </div>
                <Link
                  className="text-[14px] text-editor-link no-underline hover:underline"
                  href={`/editor/packs/${pack.id}`}
                >
                  Open workspace
                </Link>
              </div>
            </div>
          ))}
        </section>
      </main>
    </EditorGate>
  );
};

EditorPacksPage.fullBleedLayout = true;

export default EditorPacksPage;
