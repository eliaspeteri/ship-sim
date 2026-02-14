export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export function withDefaults<T>(defaults: T, patch: DeepPartial<T> = {}): T {
  return {
    ...defaults,
    ...patch,
  } as T;
}

export type SessionUser = {
  id: string;
  role: 'admin' | 'player' | 'guest';
  name?: string;
};

export function buildSessionUser(
  patch: DeepPartial<SessionUser> = {},
): SessionUser {
  return withDefaults<SessionUser>(
    {
      id: 'user-1',
      role: 'player',
      name: 'Test User',
    },
    patch,
  );
}
