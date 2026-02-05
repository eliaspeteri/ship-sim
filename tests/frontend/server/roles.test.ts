import { expandRoles, permissionsForRoles } from '../../../src/server/roles';

describe('roles', () => {
  it('expands roles based on hierarchy', () => {
    expect(expandRoles([])).toEqual(['guest']);
    expect(expandRoles(['spectator'])).toEqual(['guest', 'spectator']);
    expect(expandRoles(['player'])).toEqual(['guest', 'spectator', 'player']);
    expect(expandRoles(['admin'])).toEqual([
      'guest',
      'spectator',
      'player',
      'admin',
    ]);
  });

  it('preserves admin role when provided', () => {
    expect(expandRoles(['admin'])).toContain('admin');
  });

  it('builds unique permissions for roles', () => {
    const permissions = permissionsForRoles(['player']);
    const keys = permissions.map(p => `${p.resource}:${p.action}`);

    expect(keys).toEqual(
      expect.arrayContaining(['chat:send', 'vessel:update']),
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});
