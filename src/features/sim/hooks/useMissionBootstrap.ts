import React from 'react';

import { getApiBase } from '../../../lib/api';
import useStore from '../../../store';

type UseMissionBootstrapParams = {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  spaceId: string;
};

export function useMissionBootstrap({
  status,
  spaceId,
}: UseMissionBootstrapParams): void {
  const setMissions = useStore(state => state.setMissions);
  const setMissionAssignments = useStore(state => state.setMissionAssignments);

  React.useEffect(() => {
    if (status !== 'authenticated') return;
    if (!spaceId) return;

    const controller = new AbortController();

    const loadMissions = async () => {
      try {
        const apiBase = getApiBase();
        const [missionsRes, assignmentsRes] = await Promise.all([
          fetch(`${apiBase}/api/missions?spaceId=${spaceId}`, {
            credentials: 'include',
            signal: controller.signal,
          }),
          fetch(`${apiBase}/api/missions/assignments`, {
            credentials: 'include',
            signal: controller.signal,
          }),
        ]);

        if (missionsRes.ok) {
          const data = await missionsRes.json();
          setMissions(Array.isArray(data?.missions) ? data.missions : []);
        }

        if (assignmentsRes.ok) {
          const data = await assignmentsRes.json();
          setMissionAssignments(
            Array.isArray(data?.assignments) ? data.assignments : [],
          );
        }
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') return;
        console.error('Failed to load missions', error);
      }
    };

    void loadMissions();

    return () => controller.abort();
  }, [setMissions, setMissionAssignments, spaceId, status]);
}
