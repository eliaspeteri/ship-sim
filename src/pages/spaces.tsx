import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getApiBase } from '../lib/api';
import { getDefaultRules, mapToRulesetType, Rules } from '../types/rules.types';

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

const ui = {
  page: 'mx-auto max-w-[1080px] px-4 pb-[60px] pt-8 text-[var(--ink)]',
  header:
    'mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center',
  title: 'text-2xl font-bold',
  subtitle: 'text-[13px] text-[rgba(170,192,202,0.7)]',
  status: 'text-xs text-[rgba(170,192,202,0.7)]',
  notice: 'mb-3 rounded-[10px] px-2.5 py-2 text-xs',
  noticeInfo: 'bg-[rgba(28,88,130,0.7)] text-[#e6f2ff]',
  noticeError: 'bg-[rgba(120,36,32,0.8)] text-[#ffe7e1]',
  spaceGrid: 'grid gap-4',
  spaceCard:
    'grid gap-3 rounded-2xl border border-[rgba(27,154,170,0.35)] bg-[rgba(10,20,34,0.9)] p-4',
  cardHeader: 'flex items-baseline justify-between gap-3',
  cardMeta: 'text-[11px] text-[rgba(170,192,202,0.7)]',
  formRow: 'flex flex-wrap items-center gap-2.5',
  formGrid: 'grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3',
  input:
    'rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2.5 py-1.5 text-xs text-[#f1f7f8]',
  select:
    'rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2.5 py-1.5 text-xs text-[#f1f7f8]',
  button:
    'cursor-pointer rounded-[10px] border-0 px-3 py-1.5 text-xs font-semibold text-[#f1f7f8]',
  buttonPrimary: 'bg-gradient-to-br from-[#1b9aaa] to-[#0f6d75]',
  buttonSecondary: 'bg-[rgba(52,72,98,0.9)]',
  buttonDanger: 'bg-[rgba(120,36,32,0.85)]',
  tag:
    'rounded-full border border-[rgba(60,88,104,0.6)] bg-[rgba(12,28,44,0.7)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#e6f2f6]',
  tagPrivate:
    'border-[rgba(162,66,120,0.7)] bg-[rgba(92,28,60,0.7)]',
  mono: 'font-mono',
  actionsRow: 'flex flex-wrap gap-2',
  toggleGroup: 'flex gap-1.5',
  rulesSection:
    'grid gap-2.5 rounded-xl border border-[rgba(60,88,104,0.4)] bg-[rgba(8,16,28,0.6)] p-2.5',
  rulesGrid: 'grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3',
  rulesGroup: 'grid gap-1.5',
  checkboxRow: 'flex items-center gap-1.5 text-xs text-[#e6f2f6]',
  rulesInputs: 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5',
};

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
    async (spaceId: string, totalVessels: number, activeVessels: number) => {
      if (totalVessels > 0 || activeVessels > 0) {
        setNotice('Cannot delete a space while vessels exist.');
        return;
      }
      if (typeof window !== 'undefined') {
        const ok = window.confirm(
          'Delete this space? This cannot be undone and will remove access for everyone.',
        );
        if (!ok) return;
        const typed = window.prompt('Type DELETE to confirm.');
        if (typed !== 'DELETE') return;
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
    return <div className={ui.page}>Loading your spaces…</div>;
  }

  if (status !== 'authenticated') {
    return (
      <div className={ui.page}>
        <div className={ui.title}>Manage spaces</div>
        <p className={ui.subtitle}>
          Sign in to view and manage your spaces.
        </p>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <div className={ui.header}>
        <div>
          <div className={ui.title}>Manage spaces</div>
          <p className={ui.subtitle}>
            {scope === 'all' && isAdmin
              ? `${spaceCountLabel} spaces across all creators.`
              : `${spaceCountLabel} created by you.`}{' '}
            Update visibility, share invites, or rotate passwords.
          </p>
        </div>
        <div className={ui.actionsRow}>
          {isAdmin ? (
            <div className={ui.toggleGroup}>
              <button
                type="button"
                onClick={() => setScope('mine')}
                className={`${ui.button} ${
                  scope === 'mine'
                    ? ui.buttonPrimary
                    : ui.buttonSecondary
                }`}
                disabled={loading}
              >
                My spaces
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`${ui.button} ${
                  scope === 'all'
                    ? ui.buttonPrimary
                    : ui.buttonSecondary
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
            className={`${ui.button} ${ui.buttonSecondary}`}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {notice ? (
        <div className={`${ui.notice} ${ui.noticeInfo}`}>{notice}</div>
      ) : null}

      {error ? (
        <div className={`${ui.notice} ${ui.noticeError}`}>{error}</div>
      ) : null}

      {loading ? <div className={ui.status}>Loading spaces…</div> : null}

      {!loading && spaces.length === 0 ? (
        <div className={ui.notice}>
          You have not created any spaces yet. Create one from the simulator
          modal to manage it here.
        </div>
      ) : null}

      <div className={ui.spaceGrid}>
        {spaces.map(space => {
          const draft = drafts[space.id];
          const inviteToken = space.inviteToken || '—';
          const totalVessels = space.totalVessels ?? 0;
          const activeVessels = space.activeVessels ?? 0;
          const hasTraffic = activeVessels > 0;
          return (
            <div
              key={space.id}
              className={ui.spaceCard}
              data-testid={`space-card-${space.id}`}
            >
              <div className={ui.cardHeader}>
                <div>
                  <div className={ui.cardMeta}>Space ID</div>
                  <div className={`${ui.cardMeta} ${ui.mono}`}>
                    {space.id}
                  </div>
                </div>
                <div className={ui.actionsRow}>
                  <span
                    className={`${ui.tag} ${
                      space.visibility === 'private' ? ui.tagPrivate : ''
                    }`}
                  >
                    {space.visibility}
                  </span>
                  <span className={ui.tag}>
                    {space.rulesetType || 'CASUAL'}
                  </span>
                  {space.passwordProtected ? (
                    <span className={ui.tag}>Password</span>
                  ) : null}
                  <span className={ui.tag}>Vessels {totalVessels}</span>
                  {hasTraffic ? (
                    <span className={ui.tag}>Active {activeVessels}</span>
                  ) : null}
                </div>
              </div>
              {scope === 'all' && isAdmin ? (
                <div className={ui.cardMeta}>
                  Owner: {space.createdBy || 'Unknown'}
                </div>
              ) : null}

              <div className={ui.formGrid}>
                <label className={ui.cardMeta}>
                  Name
                  <input
                    className={ui.input}
                    value={draft?.name || space.name}
                    onChange={e =>
                      updateDraft(space.id, { name: e.target.value })
                    }
                  />
                </label>

                <label className={ui.cardMeta}>
                  Visibility
                  <select
                    className={ui.select}
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

                <label className={ui.cardMeta}>
                  Ruleset
                  <select
                    className={ui.select}
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

                <label className={ui.cardMeta}>
                  New password
                  <input
                    className={ui.input}
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
                <div className={ui.rulesSection}>
                  <div className={ui.cardMeta}>Rules overrides</div>
                  {draft?.rules ? (
                    <>
                      <div className={ui.rulesGrid}>
                        <div className={ui.rulesGroup}>
                          <div className={ui.cardMeta}>Assists</div>
                          <label className={ui.checkboxRow}>
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
                          <label className={ui.checkboxRow}>
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
                          <label className={ui.checkboxRow}>
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

                        <div className={ui.rulesGroup}>
                          <div className={ui.cardMeta}>Realism</div>
                          <label className={ui.checkboxRow}>
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
                          <label className={ui.checkboxRow}>
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
                          <label className={ui.checkboxRow}>
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

                        <div className={ui.rulesGroup}>
                          <div className={ui.cardMeta}>Enforcement</div>
                          <label className={ui.checkboxRow}>
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
                          <label className={ui.checkboxRow}>
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
                          <label className={ui.checkboxRow}>
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

                        <div className={ui.rulesGroup}>
                          <div className={ui.cardMeta}>Progression</div>
                          <label className={ui.checkboxRow}>
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
                      <div className={ui.rulesInputs}>
                        <label className={ui.cardMeta}>
                          Allowed vessels
                          <input
                            className={ui.input}
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
                        <label className={ui.cardMeta}>
                          Allowed mods
                          <input
                            className={ui.input}
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
                      <div className={ui.formRow}>
                        <button
                          type="button"
                          className={`${ui.button} ${ui.buttonSecondary}`}
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
                    <div className={ui.formRow}>
                      <div className={ui.cardMeta}>
                        Using{' '}
                        {draft?.rulesetType || space.rulesetType || 'CASUAL'}{' '}
                        defaults.
                      </div>
                      <button
                        type="button"
                        className={`${ui.button} ${ui.buttonSecondary}`}
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

              <div className={ui.formRow}>
                <div className={ui.cardMeta}>
                  Invite token:{' '}
                  <span className={`${ui.mono} ${ui.cardMeta}`}>
                    {inviteToken}
                  </span>
                </div>
                <div className={ui.actionsRow}>
                  <button
                    type="button"
                    className={`${ui.button} ${ui.buttonSecondary}`}
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
                    className={`${ui.button} ${ui.buttonSecondary}`}
                    onClick={() => void handleRegenerateInvite(space.id)}
                    disabled={draft?.saving}
                  >
                    Regenerate invite
                  </button>
                  <button
                    type="button"
                    className={`${ui.button} ${ui.buttonSecondary}`}
                    onClick={() => void handleClearPassword(space.id)}
                    disabled={draft?.saving}
                  >
                    Clear password
                  </button>
                  <button
                    type="button"
                    className={`${ui.button} ${ui.buttonPrimary}`}
                    onClick={() => void handleSave(space.id)}
                    disabled={draft?.saving}
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    className={`${ui.button} ${ui.buttonDanger}`}
                    onClick={() =>
                      void handleDelete(space.id, totalVessels, activeVessels)
                    }
                    disabled={draft?.saving || totalVessels > 0}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {draft?.error ? (
                <div className={`${ui.notice} ${ui.noticeError}`}>
                  {draft.error}
                </div>
              ) : null}
              {totalVessels > 0 ? (
                <div className={ui.cardMeta}>
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
