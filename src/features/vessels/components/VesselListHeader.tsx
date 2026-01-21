import React from 'react';

type VesselListHeaderProps = {
  query: string;
  onQueryChange: (next: string) => void;
  vesselCount: number;
};

const VesselListHeader: React.FC<VesselListHeaderProps> = ({
  query,
  onQueryChange,
  vesselCount,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-[26px] font-bold text-[var(--ink)]">
          Global vessels
        </div>
        <div className="text-[13px] text-[rgba(170,192,202,0.7)]">
          Search the live vessel registry across all spaces.
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-[320px]">
        <label className="text-[12px] uppercase tracking-[0.16em] text-[rgba(170,192,202,0.8)]">
          Search vessels
        </label>
        <input
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="ID, space, or owner"
          className="rounded-[12px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-3 py-2 text-[14px] text-[#f1f7f8]"
        />
        <div className="text-[12px] text-[rgba(170,192,202,0.7)]">
          {vesselCount} vessels shown
        </div>
      </div>
    </div>
  );
};

export default VesselListHeader;
