import React from 'react';

import VesselListCard from './VesselListCard';

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

type VesselListGridProps = {
  vessels: VesselSummary[];
};

const VesselListGrid: React.FC<VesselListGridProps> = ({ vessels }) => {
  if (vessels.length === 0) {
    return (
      <div className="rounded-[14px] border border-[rgba(40,60,80,0.6)] bg-[rgba(8,18,30,0.9)] px-4 py-3 text-[12px] text-[rgba(150,168,182,0.7)]">
        No vessels match the current filters.
      </div>
    );
  }

  return (
    <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
      {vessels.map(vessel => (
        <VesselListCard key={vessel.id} {...vessel} />
      ))}
    </div>
  );
};

export default VesselListGrid;
