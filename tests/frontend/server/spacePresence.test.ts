import {
  addPresence,
  getPresenceCount,
  getPresenceCounts,
  removePresence,
} from '../../../src/server/spacePresence';

describe('spacePresence', () => {
  it('tracks unique user presence per space', () => {
    addPresence(' Global ', 'user-1');
    addPresence('global', 'user-1');
    addPresence('global', 'user-2');

    expect(getPresenceCount('GLOBAL')).toBe(2);

    removePresence('global', 'user-1');
    expect(getPresenceCount('global')).toBe(2);

    removePresence('global', 'user-1');
    expect(getPresenceCount('global')).toBe(1);

    removePresence('global', 'user-2');
    expect(getPresenceCount('global')).toBe(0);
  });

  it('returns counts for multiple spaces', () => {
    addPresence('alpha', 'user-1');
    addPresence('beta', 'user-2');
    addPresence('beta', 'user-3');

    const counts = getPresenceCounts(['alpha', 'beta', 'gamma']);
    expect(counts.get('alpha')).toBe(1);
    expect(counts.get('beta')).toBe(2);
    expect(counts.get('gamma')).toBe(0);

    removePresence('alpha', 'user-1');
    removePresence('beta', 'user-2');
    removePresence('beta', 'user-3');
  });
});
