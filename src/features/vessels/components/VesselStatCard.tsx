import React from 'react';

type VesselStatCardProps = {
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode[];
};

const VesselStatCard: React.FC<VesselStatCardProps> = ({
  label,
  value,
  meta = [],
}) => {
  return (
    <div className="grid gap-1.5 rounded-[14px] border border-[rgba(27,154,170,0.35)] bg-[rgba(10,20,34,0.9)] px-4 py-3.5">
      <div className="text-[11px] uppercase tracking-[0.16em] text-[rgba(150,168,182,0.7)]">
        {label}
      </div>
      <div className="text-[15px] font-semibold text-[#f1f7f8]">
        {value}
      </div>
      {meta.map((item, index) => (
        <div
          key={`${label}-meta-${index}`}
          className="text-[11px] text-[rgba(150,168,182,0.7)]"
        >
          {item}
        </div>
      ))}
    </div>
  );
};

export default VesselStatCard;
