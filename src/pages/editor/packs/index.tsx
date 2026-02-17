import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import React from 'react';

import EditorGate from '../../../features/editor/EditorGate';

import type { EditorPack } from '../../../features/editor/types';

const EditorPacksPage: React.FC & { fullBleedLayout?: boolean } = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userId =
    (session?.user as { name?: string; id?: string } | undefined)?.name ||
    (session?.user as { name?: string; id?: string } | undefined)?.id ||
    'demo';
  const [packs, setPacks] = React.useState<EditorPack[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [modalMode, setModalMode] = React.useState<'create' | 'edit' | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = React.useState<EditorPack | null>(
    null,
  );
  const [activePack, setActivePack] = React.useState<EditorPack | null>(null);
  const [formName, setFormName] = React.useState('');
  const [formDescription, setFormDescription] = React.useState('');
  const [formRegion, setFormRegion] = React.useState('');
  const [formSubmitForReview, setFormSubmitForReview] = React.useState(false);

  const NAME_MIN = 3;
  const NAME_MAX = 64;
  const DESC_MIN = 10;
  const DESC_MAX = 400;
  const REGION_MAX = 80;

  React.useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setPacks([]);
      try {
        const res = await fetch(`/api/editor/packs?userId=${userId}`);
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const data = (await res.json()) as { packs?: EditorPack[] };
        if (!cancelled && data?.packs) {
          setPacks(data.packs);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load packs.');
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
  }, [status, userId]);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormRegion('');
    setFormSubmitForReview(false);
    setFormError(null);
  };

  const openCreate = () => {
    resetForm();
    setActivePack(null);
    setModalMode('create');
  };

  const openEdit = (pack: EditorPack) => {
    setActivePack(pack);
    setFormName(pack.name);
    setFormDescription(pack.description);
    setFormRegion(pack.regionSummary ?? '');
    setFormSubmitForReview(Boolean(pack.submitForReview));
    setFormError(null);
    setModalMode('edit');
  };

  const validateForm = () => {
    const name = formName.trim();
    const description = formDescription.trim();
    const region = formRegion.trim();
    if (name.length < NAME_MIN || name.length > NAME_MAX) {
      return `Title must be ${NAME_MIN}-${NAME_MAX} characters.`;
    }
    if (description.length < DESC_MIN || description.length > DESC_MAX) {
      return `Description must be ${DESC_MIN}-${DESC_MAX} characters.`;
    }
    if (region.length > REGION_MAX) {
      return `Region must be at most ${REGION_MAX} characters.`;
    }
    return null;
  };

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
            className="cursor-pointer rounded-full border border-editor-accent-strong-border bg-editor-accent-gradient px-5 py-2.5 font-semibold text-editor-accent-text"
            onClick={openCreate}
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
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="cursor-pointer text-[13px] text-editor-muted underline-offset-4 hover:underline"
                    onClick={() => openEdit(pack)}
                    title="Edit pack"
                  >
                    Edit
                  </button>
                  <Link
                    className="cursor-pointer text-[14px] text-editor-link no-underline hover:underline"
                    href={`/editor/${encodeURIComponent(
                      pack.ownerId || userId,
                    )}/packs/${encodeURIComponent(pack.slug || pack.id)}`}
                  >
                    Open workspace
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      {modalMode ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6"
          onClick={() => {
            setModalMode(null);
            setFormError(null);
          }}
        >
          <div
            className="w-full max-w-lg rounded-[16px] border border-editor-panel-border bg-editor-panel p-5 text-editor-text"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-4 text-lg font-semibold">
              {modalMode === 'create' ? 'Create Map Pack' : 'Edit Map Pack'}
            </div>
            <div className="grid gap-3">
              <label className="grid gap-1 text-[12px] text-editor-muted">
                Title
                <input
                  className="rounded-[10px] border border-editor-control-border bg-editor-control-bg px-3 py-2 text-sm text-editor-text"
                  value={formName}
                  onChange={event => setFormName(event.target.value)}
                  placeholder="e.g. Port of Rotterdam"
                  title="Pack title. Must be unique per user."
                  maxLength={NAME_MAX}
                />
              </label>
              <label className="grid gap-1 text-[12px] text-editor-muted">
                Description
                <textarea
                  className="min-h-[90px] rounded-[10px] border border-editor-control-border bg-editor-control-bg px-3 py-2 text-sm text-editor-text"
                  value={formDescription}
                  onChange={event => setFormDescription(event.target.value)}
                  placeholder="Scope, intent, and notes for reviewers."
                  title="Describe what the pack contains and why it exists."
                  maxLength={DESC_MAX}
                />
              </label>
              <label className="grid gap-1 text-[12px] text-editor-muted">
                Region / Area
                <input
                  className="rounded-[10px] border border-editor-control-border bg-editor-control-bg px-3 py-2 text-sm text-editor-text"
                  value={formRegion}
                  onChange={event => setFormRegion(event.target.value)}
                  placeholder="Region or harbor name"
                  title="Human-readable region for discovery."
                  maxLength={REGION_MAX}
                />
              </label>
              <label className="flex items-start gap-3 rounded-[10px] border border-editor-control-border bg-editor-control-bg px-3 py-2 text-[12px] text-editor-muted">
                <input
                  type="checkbox"
                  className="mt-1 cursor-pointer"
                  checked={formSubmitForReview}
                  onChange={event =>
                    setFormSubmitForReview(event.target.checked)
                  }
                  disabled={activePack?.status === 'published'}
                  title="Consent to submit this pack for review after publishing."
                />
                <span>
                  Submit for review after publish
                  <span className="block text-[11px] text-editor-muted">
                    Allows this pack to be considered for global usage.
                  </span>
                </span>
              </label>
            </div>
            {formError ? (
              <div className="mt-3 text-[12px] text-editor-warning">
                {formError}
              </div>
            ) : null}
            <div className="mt-5 flex items-center justify-between gap-3">
              {modalMode === 'edit' ? (
                <button
                  type="button"
                  className="cursor-pointer rounded-full border border-transparent bg-[#B73636] px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => {
                    if (activePack) {
                      setDeleteTarget(activePack);
                      setModalMode(null);
                    }
                  }}
                >
                  Delete
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="cursor-pointer rounded-full border border-editor-control-border bg-editor-control-bg px-4 py-2 text-sm text-editor-muted"
                  onClick={() => {
                    setModalMode(null);
                    setFormError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-full border border-transparent bg-editor-accent-gradient px-4 py-2 text-sm font-semibold text-editor-accent-text"
                  onClick={() => {
                    void (async () => {
                      const validationError = validateForm();
                      if (validationError) {
                        setFormError(validationError);
                        return;
                      }
                      setLoading(true);
                      setFormError(null);
                      try {
                        if (modalMode === 'create') {
                          const res = await fetch('/api/editor/packs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              name: formName.trim(),
                              description: formDescription.trim(),
                              regionSummary: formRegion.trim(),
                              ownerId: userId,
                              submitForReview: formSubmitForReview,
                            }),
                          });
                          if (res.status === 409) {
                            setFormError(
                              'You already have a pack with that title.',
                            );
                            return;
                          }
                          if (!res.ok) {
                            throw new Error(`Request failed: ${res.status}`);
                          }
                          const data = (await res.json()) as {
                            pack?: EditorPack;
                          };
                          if (data?.pack) {
                            setPacks(prev => [data.pack!, ...prev]);
                            setModalMode(null);
                            resetForm();
                            void router.push(
                              `/editor/${encodeURIComponent(
                                userId,
                              )}/packs/${encodeURIComponent(
                                data.pack.slug || data.pack.id,
                              )}`,
                            );
                          }
                        } else if (activePack) {
                          const res = await fetch(
                            `/api/editor/packs/${activePack.id}`,
                            {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                name: formName.trim(),
                                description: formDescription.trim(),
                                regionSummary: formRegion.trim(),
                                submitForReview: formSubmitForReview,
                              }),
                            },
                          );
                          if (res.status === 409) {
                            setFormError(
                              'You already have a pack with that title.',
                            );
                            return;
                          }
                          if (!res.ok) {
                            throw new Error(`Request failed: ${res.status}`);
                          }
                          const data = (await res.json()) as {
                            pack?: EditorPack;
                          };
                          if (data?.pack) {
                            setPacks(prev =>
                              prev.map(item =>
                                item.id === data.pack!.id ? data.pack! : item,
                              ),
                            );
                            setModalMode(null);
                          }
                        }
                      } catch {
                        setFormError('Unable to save pack.');
                      } finally {
                        setLoading(false);
                      }
                    })();
                  }}
                >
                  {modalMode === 'create' ? 'Create & Open' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6"
          onClick={() => {
            setDeleteTarget(null);
            if (activePack) {
              setModalMode('edit');
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-[16px] border border-editor-panel-border bg-editor-panel p-5 text-editor-text"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-2 text-lg font-semibold">Delete pack?</div>
            <div className="text-[13px] text-editor-muted">
              This cannot be undone. The pack and its artifacts will be removed.
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                className="cursor-pointer rounded-full bg-transparent px-4 py-2 text-sm text-editor-muted"
                onClick={() => {
                  setDeleteTarget(null);
                  if (activePack) {
                    setModalMode('edit');
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-full border border-transparent bg-[#B73636] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  void (async () => {
                    try {
                      const res = await fetch(
                        `/api/editor/packs/${deleteTarget.id}`,
                        { method: 'DELETE' },
                      );
                      if (!res.ok) {
                        throw new Error(`Request failed: ${res.status}`);
                      }
                      setPacks(prev =>
                        prev.filter(item => item.id !== deleteTarget.id),
                      );
                      setDeleteTarget(null);
                    } catch {
                      setError('Unable to delete pack.');
                    }
                  })();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </EditorGate>
  );
};

EditorPacksPage.fullBleedLayout = true;

export default EditorPacksPage;
