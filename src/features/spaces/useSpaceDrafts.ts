import { useCallback, useState } from 'react';
import type { Rules } from '../../types/rules.types';
import type { ManagedSpace, SpaceDraft } from './types';

const cloneRules = (rules: Rules): Rules =>
  JSON.parse(JSON.stringify(rules)) as Rules;

export function useSpaceDrafts() {
  const [drafts, setDrafts] = useState<Record<string, SpaceDraft>>({});

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

  const updateDraft = useCallback(
    (spaceId: string, patch: Partial<SpaceDraft>) => {
      setDrafts(prev => ({
        ...prev,
        [spaceId]: { ...prev[spaceId], ...patch },
      }));
    },
    [],
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

  return { drafts, syncDrafts, updateDraft, updateRules, cloneRules };
}
