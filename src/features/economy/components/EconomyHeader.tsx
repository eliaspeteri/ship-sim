import React from 'react';

type SpaceOption = {
  id: string;
  label: string;
};

type EconomyHeaderProps = {
  spaceId: string;
  spaceOptions: SpaceOption[];
  onSpaceChange: (value: string) => void;
  actions?: React.ReactNode;
};

const EconomyHeader: React.FC<EconomyHeaderProps> = ({
  spaceId,
  spaceOptions,
  onSpaceChange,
  actions,
}) => {
  return (
    <div className="flex flex-col gap-6 rounded-[20px] border border-[rgba(97,137,160,0.25)] bg-[rgba(6,14,24,0.75)] px-6 py-6 shadow-[0_20px_50px_rgba(4,10,20,0.45)] lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-[560px]">
        <div className="text-[11px] uppercase tracking-[0.3em] text-[rgba(170,192,202,0.7)]">
          Company Operations
        </div>
        <div className="mt-2 text-[28px] font-semibold text-[var(--ink)]">
          Economy &amp; Logistics
        </div>
        <div className="mt-2 text-[14px] text-[rgba(170,192,202,0.7)]">
          Manage fleet assets, contracts, and cargo loadouts before heading back
          into the simulator.
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[180px]">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[rgba(170,192,202,0.7)]">
            Active Space
          </div>
          <select
            className="mt-2 w-full rounded-[10px] border border-[rgba(97,137,160,0.35)] bg-[rgba(9,18,28,0.92)] px-3 py-2 text-[13px] text-[var(--ink)]"
            value={spaceId}
            onChange={event => onSpaceChange(event.target.value)}
          >
            {spaceOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {actions}
      </div>
    </div>
  );
};

export default EconomyHeader;
