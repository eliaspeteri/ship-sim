import Head from 'next/head';
import React from 'react';

import VesselListGrid from '../../features/vessels/components/VesselListGrid';
import VesselListHeader from '../../features/vessels/components/VesselListHeader';
import VesselListStatus from '../../features/vessels/components/VesselListStatus';
import { getApiBase } from '../../lib/api';

type VesselSummary = {
  id: string;
  spaceId?: string | null;
  ownerId?: string | null;
  mode?: string | null;
  isAi?: boolean | null;
  lastUpdate?: number | null;
  position?: {
    lat: number;
    lon: number;
  };
};

const VesselListPage: React.FC = () => {
  const [vessels, setVessels] = React.useState<VesselSummary[]>([]);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const loadVessels = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/api/vessels`, {
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data?.error || `Unable to load vessels (${res.status}).`,
          );
        }
        const data = await res.json();
        if (!active) return;
        setVessels(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) return;
        console.error('Failed to load vessels', err);
        setError(
          err instanceof Error ? err.message : 'Unable to load vessels.',
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadVessels();
    return () => {
      active = false;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return vessels;
    return vessels.filter(vessel => {
      const id = vessel.id?.toLowerCase() || '';
      const space = vessel.spaceId?.toLowerCase() || '';
      const owner = vessel.ownerId?.toLowerCase() || '';
      return id.includes(term) || space.includes(term) || owner.includes(term);
    });
  }, [query, vessels]);

  return (
    <>
      <Head>
        <title>Vessels - Ship Simulator</title>
        <meta
          name="description"
          content="Browse live vessels in global space"
        />
      </Head>
      <div className="mx-auto max-w-[1100px] px-4 pb-[60px] pt-8 text-[var(--ink)]">
        <VesselListHeader
          query={query}
          onQueryChange={setQuery}
          vesselCount={filtered.length}
        />
        <div className="mt-4">
          <VesselListStatus loading={loading} error={error} />
        </div>
        <div className="mt-5">
          <VesselListGrid vessels={filtered} />
        </div>
      </div>
    </>
  );
};

export default VesselListPage;
