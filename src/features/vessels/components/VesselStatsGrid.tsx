import React from 'react';

import VesselStatCard from './VesselStatCard';

type VesselStatsGridProps = {
  cards: {
    label: string;
    value: React.ReactNode;
    meta?: React.ReactNode[];
  }[];
};

const VesselStatsGrid: React.FC<VesselStatsGridProps> = ({ cards }) => {
  return (
    <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
      {cards.map(card => (
        <VesselStatCard
          key={card.label}
          label={card.label}
          value={card.value}
          meta={card.meta}
        />
      ))}
    </div>
  );
};

export default VesselStatsGrid;
