import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getApiBase } from '../lib/api';
import { getDefaultRules, mapToRulesetType, Rules } from '../types/rules.types';
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
  totalVessels?: number;
  activeVessels?: number;
  rulesetType?: string;
  rules?: Rules | null;
};

type SpaceDraft = {
  name: string;
  visibility: SpaceVisibility;
  rulesetType: string;
  rules: Rules | null;
  password: string;
  saving?: boolean;
  rulesTouched?: boolean;
  error?: string | null;
};

const rulesetLabels: Record<string, string> = {
  CASUAL: 'Casual',
  REALISM: 'Realism',
  CUSTOM: 'Custom',
  EXAM: 'Exam',
};

const cloneRules = (rules: Rules): Rules =>
  JSON.parse(JSON.stringify(rules)) as Rules;

const parseListInput = (value: string) =>
  value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

const SpacesPage: React.FC = () => {
  const { status, data: session } = useSession();
  const [spaces, setSpaces] = useState<ManagedSpace[]>([]);
  const [drafts, setDrafts] = useState<Record<string, SpaceDraft>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const role = (session?.user as { role?: string })?.role || 'guest';
  const isAdmin = role === 'admin';
  const [scope, setScope] = useState<'mine' | 'all'>('mine');

  const syncDrafts = useCallback((incoming: ManagedSpace[]) => {
    setDrafts(prev => {
      const next: Record<string, SpaceDraft> = {};
      incoming.forEach(space => {
        next[space.id] = {
          name: space.name,
          visibility: space.visibility,
          rulesetType: space.rulesetType || 'CASUAL',
          rules: space.rules ? cloneRules(space.rules) : null,
          password: prev[space.id]?.password || '',
          saving: prev[space.id]?.saving || false,
          rulesTouched: false,
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
      const queryScope = scope === 'all' && isAdmin ? 'all' : 'mine';
      const res = await fetch(
        `${getApiBase()}/api/spaces/manage?scope=${queryScope}`,
        {
          credentials: 'include',
        },
      );
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
  }, [isAdmin, scope, syncDrafts]);

  useEffect(() => {
    if (!isAdmin && scope !== 'mine') {
      setScope('mine');
    }
  }, [isAdmin, scope]);

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

  const ensureCustomRules = useCallback(
    (spaceId: string, rulesetType: string) => {
      const base = getDefaultRules(mapToRulesetType(rulesetType));
      updateDraft(spaceId, {
        rules: cloneRules(base),
        rulesTouched: true,
      });
    },
    [updateDraft],
  );

  const updateRules = useCallback(
    (spaceId: string, updater: (rules: Rules) => Rules) => {
      setDrafts(prev => {
        const current = prev[spaceId];
        if (!current?.rules) return prev;
        const nextRules = updater(cloneRules(current.rules));
        return {
          ...prev,
          [spaceId]: {
            ...current,
            rules: nextRules,
            rulesTouched: true,
          },
        };
      });
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
      const space = spaces.find(item => item.id === spaceId);
      const currentRuleset = space?.rulesetType || 'CASUAL';
      const nextRuleset = draft.rulesetType || currentRuleset;
      if (space && currentRuleset !== nextRuleset) {
        const currentLabel = rulesetLabels[currentRuleset] || currentRuleset;
        const nextLabel = rulesetLabels[nextRuleset] || nextRuleset;
        const activeNotice =
          (space.activeVessels || 0) > 0
            ? ' Active vessels in this space will feel the change immediately.'
            : '';
        if (typeof window !== 'undefined') {
          const ok = window.confirm(
            `Change ruleset from ${currentLabel} to ${nextLabel}? This can change assists, HUD limits, and enforcement behavior.${activeNotice}`,
          );
          if (!ok) return;
        }
      }
      const payload: Record<string, unknown> = {
        name: draft.name.trim(),
        visibility: draft.visibility,
        rulesetType: draft.rulesetType,
      };
      if (draft.rulesTouched) {
        payload.rules = draft.rules;
      }
      if (draft.password.trim().length > 0) {
        payload.password = draft.password;
      }
      await updateSpace(spaceId, payload, 'Space updated.');
    },
    [drafts, spaces, updateSpace],
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
    () =>
      scope === 'all' && isAdmin
        ? `${spaces.length} total`
        : `${spaces.length} space${spaces.length === 1 ? '' : 's'}`,
    [isAdmin, scope, spaces.length],
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
            {scope === 'all' && isAdmin
              ? `${spaceCountLabel} spaces across all creators.`
              : `${spaceCountLabel} created by you.`}{' '}
            Update visibility, share invites, or rotate passwords.
          </p>
        </div>
        <div className={styles.actionsRow}>
          {isAdmin ? (
            <div className={styles.toggleGroup}>
              <button
                type="button"
                onClick={() => setScope('mine')}
                className={`${styles.button} ${
                  scope === 'mine'
                    ? styles.buttonPrimary
                    : styles.buttonSecondary
                }`}
                disabled={loading}
              >
                My spaces
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`${styles.button} ${
                  scope === 'all'
                    ? styles.buttonPrimary
                    : styles.buttonSecondary
                }`}
                disabled={loading}
              >
                All spaces
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void fetchSpaces()}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
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
          const totalVessels = space.totalVessels ?? 0;
          const activeVessels = space.activeVessels ?? 0;
          const hasTraffic = activeVessels > 0;
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
                  <span className={styles.tag}>
                    {space.rulesetType || 'CASUAL'}
                  </span>
                  {space.passwordProtected ? (
                    <span className={styles.tag}>Password</span>
                  ) : null}
                  <span className={styles.tag}>Vessels {totalVessels}</span>
                  {hasTraffic ? (
                    <span className={styles.tag}>Active {activeVessels}</span>
                  ) : null}
                </div>
              </div>
              {scope === 'all' && isAdmin ? (
                <div className={styles.cardMeta}>
                  Owner: {space.createdBy || 'Unknown'}
                </div>
              ) : null}

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
                  Ruleset
                  <select
                    className={styles.select}
                    value={
                      draft?.rulesetType || space.rulesetType || 'CASUAL_PUBLIC'
                    }
                    onChange={e =>
                      updateDraft(space.id, {
                        rulesetType: e.target.value,
                      })
                    }
                  >
                    <option value="CASUAL">Casual</option>
                    <option value="REALISM">Realism</option>
                    <option value="CUSTOM">Custom</option>
                    <option value="EXAM">Exam</option>
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

              {isAdmin ? (
                <div className={styles.rulesSection}>
                  <div className={styles.cardMeta}>Rules overrides</div>
                  {draft?.rules ? (
                    <>
                      <div className={styles.rulesGrid}>
                        <div className={styles.rulesGroup}>
                          <div className={styles.cardMeta}>Assists</div>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={draft.rules.assists.stability}
                              onChange={e =>
                                updateRules(space.id, rules => ({
                                  ...rules,
                                  assists: {
                                    ...rules.assists,
                                    stability: e.target.checked,
                                  },
                                }))
                              }
                            />
                            <span>Stability</span>
                          </label>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={draft.rules.assists.autopilot}
                              onChange={e =>
                                updateRules(space.id, rules => ({
                                  ...rules,
                                  assists: {
                                    ...rules.assists,
                                    autopilot: e.target.checked,
                                  },
                                }))
                              }
                            />
                            <span>Autopilot</span>
                          </label>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={draft.rules.assists.docking}
                              onChange={e =>
                                updateRules(space.id, rules => ({
                                  ...rules,
                                  assists: {
                                    ...rules.assists,
                                    docking: e.target.checked,
                                  },
                                }))
                              }
                            />
                            <span>Docking</span>
                          </label>
                        </div>

                        <div className={styles.rulesGroup}>
                          <div className={styles.cardMeta}>Realism</div>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={draft.rules.realism.damage}
                              onChange={e =>
                                updateRules(space.id, rules => ({
                                  ...rules,
                                  realism: {
                                    ...rules.realism,
                                    damage: e.target.checked,
                                  },
                                }))
                              }
                            />
                            <span>Damage</span>
                          </label>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={draft.rules.realism.wear}
                              onChange={e =>
                                updateRules(space.id, rules => ({
                                  ...rules,
                                  realism: {
                                    ...rules.realism,
                                    wear: e.target.checked,
                                  },
                                }))
                              }
                            />
                            <span>Wear</span>
                          </label>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={draft.rules.realism.failures}
                              onChange={e =>
                                updateRules(space.id, rules => ({
                                  ...rules,
                                  realism: {
                                    ...rules.realism,
                                    failures: e.target.checked,
                                  },
                                }))
                              }
                            />
                            <span>Failures</span>
                          </label>
                        </div>

                        <div className={styles.rulesGroup}>
                          <div className={styles.cardMeta}>Enforcement</div>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={draft.rules.enforcement.colregs}
                              onChange={e =>
                                updateRules(space.id, rules => ({
                                  ...rules,
                                  enforcement: {
                                    ...rules.enforcement,
                                    colregs: e.target.checked,
                                  },
                                }))
                              }
                            />
                            <span>COLREGS</span>
                          </label>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={draft.rules.enforcement.penalties}
                              onChange={e =>
                                updateRules(space.id, rules => ({
                                  ...rules,
                                  enforcement: {
                                    ...rules.enforcement,
                                    penalties: e.target.checked,
                                  },
                                }))
                              }
                            />
                            <span>Penalties</span>
                          </label>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={draft.rules.enforcement.investigations}
                              onChange={e =>
                                updateRules(space.id, rules => ({
                                  ...rules,
                                  enforcement: {
                                    ...rules.enforcement,
                                    investigations: e.target.checked,
                                  },
                                }))
                              }
                            />
                            <span>Investigations</span>
                          </label>
                        </div>

                        <div className={styles.rulesGroup}>
                          <div className={styles.cardMeta}>Progression</div>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={draft.rules.progression.scoring}
                              onChange={e =>
                                updateRules(space.id, rules => ({
                                  ...rules,
                                  progression: {
                                    ...rules.progression,
                                    scoring: e.target.checked,
                                  },
                                }))
                              }
                            />
                            <span>Scoring</span>
                          </label>
                        </div>
                      </div>
                      <div className={styles.rulesInputs}>
                        <label className={styles.cardMeta}>
                          Allowed vessels
                          <input
                            className={styles.input}
                            value={draft.rules.allowedVessels.join(', ')}
                            onChange={e =>
                              updateRules(space.id, rules => ({
                                ...rules,
                                allowedVessels: parseListInput(e.target.value),
                              }))
                            }
                            placeholder="cargo, tug, ferry"
                          />
                        </label>
                        <label className={styles.cardMeta}>
                          Allowed mods
                          <input
                            className={styles.input}
                            value={draft.rules.allowedMods.join(', ')}
                            onChange={e =>
                              updateRules(space.id, rules => ({
                                ...rules,
                                allowedMods: parseListInput(e.target.value),
                              }))
                            }
                            placeholder="mod-id, mod-id-2"
                          />
                        </label>
                      </div>
                      <div className={styles.formRow}>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.buttonSecondary}`}
                          onClick={() =>
                            updateDraft(space.id, {
                              rules: null,
                              rulesTouched: true,
                            })
                          }
                        >
                          Clear overrides
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={styles.formRow}>
                      <div className={styles.cardMeta}>
                        Using {draft?.rulesetType || space.rulesetType || 'CASUAL'} defaults.
                      </div>
                      <button
                        type="button"
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        onClick={() =>
                          ensureCustomRules(
                            space.id,
                            draft?.rulesetType || space.rulesetType || 'CASUAL',
                          )
                        }
                      >
                        Customize rules
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

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
                    disabled={draft?.saving || totalVessels > 0}
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
              {totalVessels > 0 ? (
                <div className={styles.cardMeta}>
                  Delete is disabled while vessels exist in this space.
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
