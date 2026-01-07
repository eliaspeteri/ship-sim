import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

type SpaceVisibility = 'public' | 'private';

type ManagedSpace = {
  id: string;
  name: string;
  visibility: SpaceVisibility;
  inviteToken?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  passwordProtected?: boolean;
};

type SpaceDraft = {
  name: string;
  visibility: SpaceVisibility;
  password: string;
  saving?: boolean;
  error?: string | null;
};

const getApiBase = () => {
  const envBase =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    '';
  if (envBase) return envBase.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const port = process.env.NEXT_PUBLIC_SERVER_PORT || '3001';
    return `${protocol}//${hostname}:${port}`;
  }
  return 'http://localhost:3001';
};

const SpacesPage: React.FC = () => {
  const { status } = useSession();
  const [spaces, setSpaces] = useState<ManagedSpace[]>([]);
  const [drafts, setDrafts] = useState<Record<string, SpaceDraft>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const syncDrafts = useCallback((incoming: ManagedSpace[]) => {
    setDrafts(prev => {
      const next: Record<string, SpaceDraft> = {};
      incoming.forEach(space => {
        next[space.id] = {
          name: space.name,
          visibility: space.visibility,
          password: prev[space.id]?.password || '',
          saving: prev[space.id]?.saving || false,
          error: prev[space.id]?.error || null,
        };
      });
      return next;
    });
  }, []);

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`${getApiBase()}/api/spaces/mine`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      const data = await res.json();
      const incoming = Array.isArray(data?.spaces) ? data.spaces : [];
      setSpaces(incoming);
      syncDrafts(incoming);
    } catch (err) {
      console.error('Failed to load spaces', err);
      setError('Failed to load your spaces. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, [syncDrafts]);

  useEffect(() => {
    if (status === 'authenticated') {
      void fetchSpaces();
    }
  }, [fetchSpaces, status]);

  const updateDraft = useCallback(
    (spaceId: string, patch: Partial<SpaceDraft>) => {
      setDrafts(prev => ({
        ...prev,
        [spaceId]: { ...prev[spaceId], ...patch },
      }));
    },
    [],
  );

  const updateSpace = useCallback(
    async (
      spaceId: string,
      payload: Record<string, unknown>,
      successMessage: string,
    ) => {
      updateDraft(spaceId, { saving: true, error: null });
      try {
        const res = await fetch(`${getApiBase()}/api/spaces/${spaceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Request failed with ${res.status}`);
        }
        const updated = await res.json();
        setSpaces(prev =>
          prev.map(space =>
            space.id === spaceId ? { ...space, ...updated } : space,
          ),
        );
        updateDraft(spaceId, { password: '' });
        setNotice(successMessage);
      } catch (err) {
        console.error('Failed to update space', err);
        updateDraft(spaceId, {
          error: err instanceof Error ? err.message : 'Failed to update space',
        });
      } finally {
        updateDraft(spaceId, { saving: false });
      }
    },
    [updateDraft],
  );

  const handleSave = useCallback(
    async (spaceId: string) => {
      const draft = drafts[spaceId];
      if (!draft) return;
      const payload: Record<string, unknown> = {
        name: draft.name.trim(),
        visibility: draft.visibility,
      };
      if (draft.password.trim().length > 0) {
        payload.password = draft.password;
      }
      await updateSpace(spaceId, payload, 'Space updated.');
    },
    [drafts, updateSpace],
  );

  const handleRegenerateInvite = useCallback(
    async (spaceId: string) => {
      await updateSpace(
        spaceId,
        { regenerateInvite: true },
        'Invite regenerated.',
      );
    },
    [updateSpace],
  );

  const handleClearPassword = useCallback(
    async (spaceId: string) => {
      await updateSpace(spaceId, { clearPassword: true }, 'Password cleared.');
    },
    [updateSpace],
  );

  const handleDelete = useCallback(
    async (spaceId: string) => {
      if (typeof window !== 'undefined') {
        const ok = window.confirm(
          'Delete this space? This cannot be undone and will remove access for everyone.',
        );
        if (!ok) return;
      }
      updateDraft(spaceId, { saving: true, error: null });
      try {
        const res = await fetch(`${getApiBase()}/api/spaces/${spaceId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Request failed with ${res.status}`);
        }
        setSpaces(prev => prev.filter(space => space.id !== spaceId));
        setNotice('Space deleted.');
      } catch (err) {
        console.error('Failed to delete space', err);
        updateDraft(spaceId, {
          error: err instanceof Error ? err.message : 'Failed to delete space',
        });
      } finally {
        updateDraft(spaceId, { saving: false });
      }
    },
    [updateDraft],
  );

  const spaceCountLabel = useMemo(
    () => `${spaces.length} space${spaces.length === 1 ? '' : 's'}`,
    [spaces.length],
  );

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-gray-200">
        Loading your spaces…
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-gray-200">
        <h1 className="text-2xl font-semibold text-white">Manage spaces</h1>
        <p className="mt-2 text-sm text-gray-400">
          Sign in to view and manage your spaces.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Manage spaces</h1>
          <p className="mt-1 text-sm text-gray-400">
            {spaceCountLabel} created by you. Update visibility, share invites,
            or rotate passwords.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchSpaces()}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-gray-700"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {notice ? (
        <div className="mt-4 rounded-lg border border-emerald-700/40 bg-emerald-900/30 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-lg border border-red-700/40 bg-red-900/30 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 text-sm text-gray-400">Loading spaces…</div>
      ) : null}

      {!loading && spaces.length === 0 ? (
        <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-6 text-sm text-gray-400">
          You have not created any spaces yet. Create one from the simulator
          modal to manage it here.
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {spaces.map(space => {
          const draft = drafts[space.id];
          const inviteToken = space.inviteToken || '—';
          return (
            <div
              key={space.id}
              className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 text-sm text-gray-200 shadow-lg shadow-black/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    Space ID
                  </div>
                  <div className="font-mono text-xs text-gray-300">
                    {space.id}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs uppercase tracking-wide text-blue-200">
                    {space.visibility}
                  </span>
                  {space.passwordProtected ? (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-wide text-amber-200">
                      Password
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="text-xs text-gray-400">
                  Name
                  <input
                    className="mt-2 w-full rounded-md bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={draft?.name || space.name}
                    onChange={e =>
                      updateDraft(space.id, { name: e.target.value })
                    }
                  />
                </label>

                <label className="text-xs text-gray-400">
                  Visibility
                  <select
                    className="mt-2 w-full rounded-md bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={draft?.visibility || space.visibility}
                    onChange={e =>
                      updateDraft(space.id, {
                        visibility: e.target.value as SpaceVisibility,
                      })
                    }
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </label>

                <label className="text-xs text-gray-400">
                  New password
                  <input
                    className="mt-2 w-full rounded-md bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={draft?.password || ''}
                    onChange={e =>
                      updateDraft(space.id, { password: e.target.value })
                    }
                    type="password"
                    placeholder="Leave blank to keep"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-gray-400">
                  Invite token:{' '}
                  <span className="font-mono text-gray-200">{inviteToken}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-700"
                    onClick={() => {
                      if (typeof navigator !== 'undefined') {
                        void navigator.clipboard.writeText(inviteToken);
                        setNotice('Invite token copied.');
                      }
                    }}
                  >
                    Copy token
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-700"
                    onClick={() => void handleRegenerateInvite(space.id)}
                    disabled={draft?.saving}
                  >
                    Regenerate invite
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-700"
                    onClick={() => void handleClearPassword(space.id)}
                    disabled={draft?.saving}
                  >
                    Clear password
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    onClick={() => void handleSave(space.id)}
                    disabled={draft?.saving}
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    onClick={() => void handleDelete(space.id)}
                    disabled={draft?.saving}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {draft?.error ? (
                <div className="mt-3 text-xs text-red-300">{draft.error}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpacesPage;
