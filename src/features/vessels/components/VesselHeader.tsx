import Link from 'next/link';
import React from 'react';

type VesselHeaderProps = {
  title: string;
  subtitle: string;
};

const VesselHeader: React.FC<VesselHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-[26px] font-bold text-[var(--ink)]">{title}</div>
        <div className="text-[13px] text-[rgba(170,192,202,0.7)]">
          {subtitle}
        </div>
      </div>
      <Link
        href="/sim"
        className="rounded-[10px] bg-[rgba(52,72,98,0.9)] px-3.5 py-2 text-[12px] font-semibold text-[#f1f7f8] no-underline"
      >
        Back to sim
      </Link>
    </div>
  );
};

export default VesselHeader;
