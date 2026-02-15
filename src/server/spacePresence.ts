const presenceBySpace = new Map<string, Map<string, number>>();

const normalizeSpaceId = (spaceId?: string | null) =>
  (spaceId ?? 'global').trim().toLowerCase();

export const addPresence = (spaceId: string, userId: string): void => {
  const key = normalizeSpaceId(spaceId);
  const spaceMap = presenceBySpace.get(key) ?? new Map<string, number>();
  spaceMap.set(userId, (spaceMap.get(userId) ?? 0) + 1);
  presenceBySpace.set(key, spaceMap);
};

export const removePresence = (spaceId: string, userId: string): void => {
  const key = normalizeSpaceId(spaceId);
  const spaceMap = presenceBySpace.get(key);
  if (!spaceMap) return;
  const next = (spaceMap.get(userId) ?? 0) - 1;
  if (next <= 0) {
    spaceMap.delete(userId);
  } else {
    spaceMap.set(userId, next);
  }
  if (spaceMap.size === 0) {
    presenceBySpace.delete(key);
  }
};

export const getPresenceCount = (spaceId: string): number => {
  const key = normalizeSpaceId(spaceId);
  return presenceBySpace.get(key)?.size ?? 0;
};

export const getPresenceCounts = (spaceIds: string[]): Map<string, number> => {
  const counts = new Map<string, number>();
  spaceIds.forEach(id => {
    counts.set(id, getPresenceCount(id));
  });
  return counts;
};
