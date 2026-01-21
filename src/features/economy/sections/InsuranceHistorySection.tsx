import React from 'react';
import EconomySectionCard from '../components/EconomySectionCard';

const InsuranceHistorySection: React.FC = () => {
  return (
    <EconomySectionCard title="Insurance History">
      <div className="rounded-[12px] border border-dashed border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.5)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
        No insurance history recorded yet.
      </div>
    </EconomySectionCard>
  );
};

export default InsuranceHistorySection;
