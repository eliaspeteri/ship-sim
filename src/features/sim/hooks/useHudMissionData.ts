import React from 'react';
import type { AccountState } from '../../../store';
import type { MissionAssignmentData } from '../../../types/mission.types';
import type { EconomyTransaction, HudTab } from '../../../components/hud/types';

type NoticeState = { type: 'info' | 'error'; message: string } | null;

type UseHudMissionDataParams = {
  apiBase: string;
  tab: HudTab | null;
  currentVesselId: string | null;
  setAccount: (account: Partial<AccountState>) => void;
  setNotice: (notice: NoticeState) => void;
  upsertMissionAssignment: (assignment: MissionAssignmentData) => void;
};

export function useHudMissionData({
  apiBase,
  tab,
  currentVesselId,
  setAccount,
  setNotice,
  upsertMissionAssignment,
}: UseHudMissionDataParams) {
  const [missionError, setMissionError] = React.useState<string | null>(null);
  const [missionBusyId, setMissionBusyId] = React.useState<string | null>(null);
  const [economyTransactions, setEconomyTransactions] = React.useState<
    EconomyTransaction[]
  >([]);
  const [economyLoading, setEconomyLoading] = React.useState(false);
  const [economyError, setEconomyError] = React.useState<string | null>(null);

  const handleAssignMission = React.useCallback(
    async (missionId: string) => {
      if (!missionId) return;
      setMissionError(null);
      setMissionBusyId(missionId);
      try {
        const res = await fetch(`${apiBase}/api/missions/${missionId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ vesselId: currentVesselId }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Request failed: ${res.status}`);
        }

        const data = await res.json();
        if (data?.assignment) {
          upsertMissionAssignment(data.assignment);
        }

        setNotice({
          type: 'info',
          message: 'Mission assignment updated.',
        });
      } catch (err) {
        console.error('Failed to assign mission', err);
        setMissionError(
          err instanceof Error ? err.message : 'Failed to assign mission.',
        );
      } finally {
        setMissionBusyId(null);
      }
    },
    [apiBase, currentVesselId, setNotice, upsertMissionAssignment],
  );

  React.useEffect(() => {
    if (tab !== 'missions') return;

    let active = true;

    const loadEconomy = async () => {
      setEconomyLoading(true);
      setEconomyError(null);

      try {
        const res = await fetch(`${apiBase}/api/economy/summary`, {
          credentials: 'include',
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Request failed: ${res.status}`);
        }

        const data = await res.json();
        if (!active) return;

        if (data?.profile) {
          setAccount(data.profile);
        }

        setEconomyTransactions(
          Array.isArray(data?.transactions) ? data.transactions : [],
        );
      } catch (err) {
        if (!active) return;
        console.error('Failed to load economy summary', err);
        setEconomyError(
          err instanceof Error
            ? err.message
            : 'Unable to load economy summary.',
        );
      } finally {
        if (active) {
          setEconomyLoading(false);
        }
      }
    };

    void loadEconomy();

    return () => {
      active = false;
    };
  }, [apiBase, setAccount, tab]);

  return {
    missionError,
    missionBusyId,
    economyTransactions,
    economyLoading,
    economyError,
    handleAssignMission,
  };
}
