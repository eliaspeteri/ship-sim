import type { LogEntry, ModerationEntry, ServerMetrics } from './types';

type JsonResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

async function parseJson<T>(res: JsonResponse): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string })?.error || `Request failed: ${res.status}`,
    );
  }
  return (await res.json()) as T;
}

export async function fetchMetricsRequest(
  apiBase: string,
): Promise<ServerMetrics> {
  const res = await fetch(`${apiBase}/api/metrics`, { credentials: 'include' });
  return parseJson<ServerMetrics>(res);
}

export async function fetchLogsRequest(
  apiBase: string,
  since: number,
): Promise<LogEntry[]> {
  const res = await fetch(`${apiBase}/api/logs?since=${since}&limit=200`, {
    credentials: 'include',
  });
  const data = await parseJson<{ logs?: LogEntry[] }>(res);
  return Array.isArray(data.logs) ? data.logs : [];
}

export async function clearLogsRequest(apiBase: string): Promise<void> {
  const res = await fetch(`${apiBase}/api/logs`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
}

export async function fetchModerationRequest(
  apiBase: string,
  moderationSpace: string,
): Promise<{ bans: ModerationEntry[]; mutes: ModerationEntry[] }> {
  const res = await fetch(
    `${apiBase}/api/admin/moderation?spaceId=${moderationSpace}`,
    { credentials: 'include' },
  );
  const data = await parseJson<{
    bans?: ModerationEntry[];
    mutes?: ModerationEntry[];
  }>(res);
  return {
    bans: Array.isArray(data.bans) ? data.bans : [],
    mutes: Array.isArray(data.mutes) ? data.mutes : [],
  };
}

export async function createModerationRequest(
  apiBase: string,
  endpoint: 'bans' | 'mutes',
  payload: {
    userId?: string;
    username?: string;
    reason?: string;
    expiresAt?: string;
    spaceId: string;
  },
): Promise<void> {
  const res = await fetch(`${apiBase}/api/admin/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string })?.error || `Request failed: ${res.status}`,
    );
  }
}

export async function deleteModerationRequest(
  apiBase: string,
  endpoint: 'bans' | 'mutes',
  id: string,
): Promise<void> {
  const res = await fetch(`${apiBase}/api/admin/${endpoint}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
}

export async function updateUserRoleRequest(
  apiBase: string,
  roleUserId: string,
  roleValue: string,
): Promise<void> {
  const res = await fetch(`${apiBase}/api/admin/users/${roleUserId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ role: roleValue }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string })?.error || `Request failed: ${res.status}`,
    );
  }
}
