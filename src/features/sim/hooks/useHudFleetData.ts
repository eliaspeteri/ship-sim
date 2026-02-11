import React from 'react';
import {
  EconomyPort,
  FleetVessel,
  HudTab,
} from '../../../components/hud/types';

type UseHudFleetDataParams = {
  apiBase: string;
  tab: HudTab | null;
  fallbackPorts: EconomyPort[];
};

export function useHudFleetData({
  apiBase,
  tab,
  fallbackPorts,
}: UseHudFleetDataParams) {
  const [fleet, setFleet] = React.useState<FleetVessel[]>([]);
  const [fleetLoading, setFleetLoading] = React.useState(false);
  const [fleetError, setFleetError] = React.useState<string | null>(null);
  const [fleetPorts, setFleetPorts] =
    React.useState<EconomyPort[]>(fallbackPorts);

  React.useEffect(() => {
    if (tab !== 'vessels') return;

    let active = true;

    const loadFleet = async () => {
      setFleetLoading(true);
      setFleetError(null);

      try {
        const [fleetRes, portsRes] = await Promise.all([
          fetch(`${apiBase}/api/economy/fleet`, { credentials: 'include' }),
          fetch(`${apiBase}/api/economy/ports`, { credentials: 'include' }),
        ]);

        const responses = [fleetRes, portsRes];
        for (const res of responses) {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.error || `Request failed: ${res.status}`);
          }
        }

        const fleetData = await fleetRes.json();
        const portData = await portsRes.json();
        if (!active) return;

        setFleet(Array.isArray(fleetData?.fleet) ? fleetData.fleet : []);
        setFleetPorts(
          Array.isArray(portData?.ports) && portData.ports.length > 0
            ? portData.ports
            : fallbackPorts,
        );
      } catch (err) {
        if (!active) return;
        console.error('Failed to load fleet', err);
        setFleetError(
          err instanceof Error ? err.message : 'Unable to load fleet.',
        );
      } finally {
        if (active) {
          setFleetLoading(false);
        }
      }
    };

    void loadFleet();

    return () => {
      active = false;
    };
  }, [apiBase, fallbackPorts, tab]);

  return {
    fleet,
    fleetLoading,
    fleetError,
    fleetPorts,
  };
}
