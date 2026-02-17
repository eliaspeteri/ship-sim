import Link from 'next/link';
import React from 'react';

type VesselListCardProps = {
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

const formatTimestamp = (value?: number | null) =>
  value ? new Date(value).toLocaleString() : 'n/a';

const VesselListCard: React.FC<VesselListCardProps> = ({
  id,
  spaceId,
  ownerId,
  mode,
  isAi,
  lastUpdate,
  position,
}) => {
  return (
    <div className="grid gap-2 rounded-[14px] border border-[rgba(27,154,170,0.35)] bg-[rgba(10,20,34,0.9)] px-4 py-3.5">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-semibold text-[#f1f7f8]">{id}</div>
        <span className="rounded-full border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[rgba(150,168,182,0.8)]">
          {mode || 'unknown'}
        </span>
      </div>
      <div className="text-[12px] text-[rgba(150,168,182,0.7)]">
        Space {spaceId || 'n/a'}
      </div>
      <div className="text-[12px] text-[rgba(150,168,182,0.7)]">
        Owner {ownerId || 'n/a'}
      </div>
      <div className="text-[12px] text-[rgba(150,168,182,0.7)]">
        AI {isAi ? 'yes' : 'no'}
      </div>
      <div className="text-[12px] text-[rgba(150,168,182,0.7)]">
        Last update {formatTimestamp(lastUpdate)}
      </div>
      <div className="text-[12px] text-[rgba(150,168,182,0.7)]">
        Position{' '}
        {position
          ? `${position.lat.toFixed(3)}, ${position.lon.toFixed(3)}`
          : 'n/a'}
      </div>
      <Link
        href={`/vessels/${id}`}
        className="inline-flex items-center justify-center rounded-[10px] bg-[rgba(52,72,98,0.9)] px-3 py-2 text-[12px] font-semibold text-[#f1f7f8] no-underline"
      >
        View details
      </Link>
    </div>
  );
};

export default VesselListCard;
