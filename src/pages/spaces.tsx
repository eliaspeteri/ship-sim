import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getApiBase } from '../lib/api';
import styles from './Spaces.module.css';

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
    return <div className={styles.page}>Loading your spaces…</div>;
  }

  if (status !== 'authenticated') {
    return (
      <div className={styles.page}>
        <div className={styles.title}>Manage spaces</div>
        <p className={styles.subtitle}>
          Sign in to view and manage your spaces.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Manage spaces</div>
          <p className={styles.subtitle}>
            {spaceCountLabel} created by you. Update visibility, share invites,
            or rotate passwords.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchSpaces()}
          className={`${styles.button} ${styles.buttonSecondary}`}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {notice ? (
        <div className={`${styles.notice} ${styles.noticeInfo}`}>{notice}</div>
      ) : null}

      {error ? (
        <div className={`${styles.notice} ${styles.noticeError}`}>{error}</div>
      ) : null}

      {loading ? <div className={styles.status}>Loading spaces…</div> : null}

      {!loading && spaces.length === 0 ? (
        <div className={styles.notice}>
          You have not created any spaces yet. Create one from the simulator
          modal to manage it here.
        </div>
      ) : null}

      <div className={styles.spaceGrid}>
        {spaces.map(space => {
          const draft = drafts[space.id];
          const inviteToken = space.inviteToken || '—';
          return (
            <div key={space.id} className={styles.spaceCard}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardMeta}>Space ID</div>
                  <div className={`${styles.cardMeta} ${styles.mono}`}>
                    {space.id}
                  </div>
                </div>
                <div className={styles.actionsRow}>
                  <span
                    className={`${styles.tag} ${
                      space.visibility === 'private' ? styles.tagPrivate : ''
                    }`}
                  >
                    {space.visibility}
                  </span>
                  {space.passwordProtected ? (
                    <span className={styles.tag}>Password</span>
                  ) : null}
                </div>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.cardMeta}>
                  Name
                  <input
                    className={styles.input}
                    value={draft?.name || space.name}
                    onChange={e =>
                      updateDraft(space.id, { name: e.target.value })
                    }
                  />
                </label>

                <label className={styles.cardMeta}>
                  Visibility
                  <select
                    className={styles.select}
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

                <label className={styles.cardMeta}>
                  New password
                  <input
                    className={styles.input}
                    value={draft?.password || ''}
                    onChange={e =>
                      updateDraft(space.id, { password: e.target.value })
                    }
                    type="password"
                    placeholder="Leave blank to keep"
                  />
                </label>
              </div>

              <div className={styles.formRow}>
                <div className={styles.cardMeta}>
                  Invite token:{' '}
                  <span className={`${styles.mono} ${styles.cardMeta}`}>
                    {inviteToken}
                  </span>
                </div>
                <div className={styles.actionsRow}>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonSecondary}`}
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
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    onClick={() => void handleRegenerateInvite(space.id)}
                    disabled={draft?.saving}
                  >
                    Regenerate invite
                  </button>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    onClick={() => void handleClearPassword(space.id)}
                    disabled={draft?.saving}
                  >
                    Clear password
                  </button>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={() => void handleSave(space.id)}
                    disabled={draft?.saving}
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonDanger}`}
                    onClick={() => void handleDelete(space.id)}
                    disabled={draft?.saving}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {draft?.error ? (
                <div className={`${styles.notice} ${styles.noticeError}`}>
                  {draft.error}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpacesPage;
