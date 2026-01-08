export type Role = 'guest' | 'spectator' | 'player' | 'admin';

export type Permission = { resource: string; action: string };

// Order reflects cumulative power; higher roles inherit all below.
const ROLE_ORDER: Role[] = ['guest', 'spectator', 'player', 'admin'];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  guest: [],
  spectator: [
    { resource: 'vessel', action: 'list' }, // read-only vessel visibility
    { resource: 'mission', action: 'list' },
    { resource: 'economy', action: 'read' },
  ],
  player: [
    { resource: 'vessel', action: 'list' },
    { resource: 'vessel', action: 'update' }, // send control/position updates
    { resource: 'chat', action: 'send' }, // can chat once chat system enabled
    { resource: 'mission', action: 'list' },
    { resource: 'mission', action: 'assign' },
    { resource: 'mission', action: 'progress' },
    { resource: 'economy', action: 'read' },
  ],
  admin: [{ resource: '*', action: '*' }],
};

export const DEFAULT_REGISTRATION_ROLE: Role = 'player';

/**
 * Expand a set of roles to include inherited roles from the hierarchy.
 */
export function expandRoles(inputRoles: Role[]): Role[] {
  if (!inputRoles.length) return ['guest'];
  const highestIndex = Math.max(
    ...inputRoles.map(r => ROLE_ORDER.indexOf(r)).filter(i => i >= 0),
  );
  const expanded = ROLE_ORDER.slice(0, Math.max(highestIndex + 1, 1));
  // Preserve explicit admin if present even if index lookup failed for some reason.
  const hasAdmin = inputRoles.includes('admin');
  return hasAdmin && !expanded.includes('admin')
    ? [...expanded, 'admin']
    : expanded;
}

/**
 * Build a unique permission list for the provided roles (after expansion).
 */
export function permissionsForRoles(roles: Role[]): Permission[] {
  const expanded = expandRoles(roles);
  const seen = new Set<string>();
  const permissions: Permission[] = [];

  for (const role of expanded) {
    const perms = ROLE_PERMISSIONS[role] || [];
    for (const perm of perms) {
      const key = `${perm.resource}:${perm.action}`;
      if (seen.has(key)) continue;
      seen.add(key);
      permissions.push(perm);
    }
  }

  return permissions;
}
