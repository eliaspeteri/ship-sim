import type { ManagedSpace } from './types';

export async function fetchManagedSpaces(
  apiBase: string,
  scope: 'mine' | 'all',
): Promise<ManagedSpace[]> {
  const res = await fetch(`${apiBase}/api/spaces/manage?scope=${scope}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data?.spaces) ? data.spaces : [];
}

export async function patchSpace(
  apiBase: string,
  spaceId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase}/api/spaces/${spaceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string })?.error ||
        `Request failed with ${res.status}`,
    );
  }
  return (await res.json()) as Record<string, unknown>;
}

export async function deleteSpace(
  apiBase: string,
  spaceId: string,
): Promise<void> {
  const res = await fetch(`${apiBase}/api/spaces/${spaceId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string })?.error ||
        `Request failed with ${res.status}`,
    );
  }
}
