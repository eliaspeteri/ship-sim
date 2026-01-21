import React from 'react';

const VesselHistorySection: React.FC = () => {
  return (
    <section className="mt-6 rounded-2xl border border-[rgba(40,60,80,0.6)] bg-[rgba(8,18,30,0.9)] p-4">
      <div className="text-[14px] font-semibold text-[#f1f7f8]">History</div>
      <div className="mt-1.5 text-[12px] text-[rgba(150,168,182,0.7)]">
        Port call history, speed traces, and voyage stats will appear here once
        tracking is enabled.
      </div>
    </section>
  );
};

export default VesselHistorySection;
