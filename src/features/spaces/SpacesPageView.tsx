import { useSession } from 'next-auth/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { SpaceCard } from './components/SpaceCard';
import { SpacesHeader } from './components/SpacesHeader';
import { deleteSpace, fetchManagedSpaces, patchSpace } from './spacesService';
import { spacesUi as ui } from './spacesUi';
import { useSpaceDrafts } from './useSpaceDrafts';
import { getApiBase } from '../../lib/api';
import { getDefaultRules, mapToRulesetType } from '../../types/rules.types';

import type { ManagedSpace } from './types';

const rulesetLabels: Record<string, string> = {
  CASUAL: 'Casual',
  REALISM: 'Realism',
  CUSTOM: 'Custom',
  EXAM: 'Exam',
};

const parseListInput = (value: string) =>
  value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

export const SpacesPageView: React.FC = () => {
  const { status, data: session } = useSession();
  const apiBase = useMemo(() => getApiBase(), []);
  const [spaces, setSpaces] = useState<ManagedSpace[]>([]);
  const { drafts, syncDrafts, updateDraft, updateRules, cloneRules } =
    useSpaceDrafts();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const role = (session?.user as { role?: string })?.role || 'guest';
  const isAdmin = role === 'admin';
  const [scope, setScope] = useState<'mine' | 'all'>('mine');

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const queryScope = scope === 'all' && isAdmin ? 'all' : 'mine';
      const incoming = await fetchManagedSpaces(apiBase, queryScope);
      setSpaces(incoming);
      syncDrafts(incoming);
    } catch (err) {
      console.error('Failed to load spaces', err);
      setError('Failed to load your spaces. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, [apiBase, isAdmin, scope, syncDrafts]);

  useEffect(() => {
    if (!isAdmin && scope !== 'mine') setScope('mine');
  }, [isAdmin, scope]);

  useEffect(() => {
    if (status === 'authenticated') void fetchSpaces();
  }, [fetchSpaces, status]);

  const ensureCustomRules = useCallback(
    (spaceId: string, rulesetType: string) => {
      const base = getDefaultRules(mapToRulesetType(rulesetType));
      updateDraft(spaceId, { rules: cloneRules(base), rulesTouched: true });
    },
    [cloneRules, updateDraft],
  );

  const updateSpace = useCallback(
    async (
      spaceId: string,
      payload: Record<string, unknown>,
      successMessage: string,
    ) => {
      updateDraft(spaceId, { saving: true, error: null });
      try {
        const updated = await patchSpace(apiBase, spaceId, payload);
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
    [apiBase, updateDraft],
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
      if (draft.rulesTouched) payload.rules = draft.rules;
      if (draft.password.trim().length > 0) payload.password = draft.password;
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
        await deleteSpace(apiBase, spaceId);
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
    [apiBase, updateDraft],
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
        <p className={ui.subtitle}>Sign in to view and manage your spaces.</p>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <SpacesHeader
        isAdmin={isAdmin}
        scope={scope}
        setScope={setScope}
        loading={loading}
        fetchSpaces={() => void fetchSpaces()}
        spaceCountLabel={spaceCountLabel}
      />

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
        {spaces.map(space => (
          <SpaceCard
            key={space.id}
            space={space}
            draft={drafts[space.id]}
            isAdmin={isAdmin}
            scope={scope}
            updateDraft={updateDraft}
            updateRules={updateRules}
            ensureCustomRules={ensureCustomRules}
            handleRegenerateInvite={spaceId =>
              void handleRegenerateInvite(spaceId)
            }
            handleClearPassword={spaceId => void handleClearPassword(spaceId)}
            handleSave={spaceId => void handleSave(spaceId)}
            handleDelete={(spaceId, totalVessels, activeVessels) =>
              void handleDelete(spaceId, totalVessels, activeVessels)
            }
            setNotice={setNotice}
            parseListInput={parseListInput}
          />
        ))}
      </div>
    </div>
  );
};

export default SpacesPageView;
