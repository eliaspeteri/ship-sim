import React from 'react';

import EconomySectionCard from '../components/EconomySectionCard';

import type { EconomyDashboard } from '../types';

type InsuranceSectionProps = {
  dashboard: EconomyDashboard;
};

const InsuranceSection: React.FC<InsuranceSectionProps> = ({ dashboard }) => {
  return (
    <EconomySectionCard title="Insurance">
      <div className="grid gap-3">
        {dashboard.insurance.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.5)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
            No active policies.
          </div>
        ) : (
          dashboard.insurance.map(policy => (
            <div
              key={policy.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] px-4 py-3"
            >
              <div>
                <div className="text-[14px] font-semibold text-[var(--ink)]">
                  {policy.type} policy
                </div>
                <div className="text-[11px] text-[rgba(170,192,202,0.7)]">
                  {policy.premiumRate} cr/hr · {policy.status}
                </div>
              </div>
              <div className="text-[11px] text-[rgba(170,192,202,0.7)]">
                Vessel {policy.vesselId}
              </div>
            </div>
          ))
        )}
      </div>
    </EconomySectionCard>
  );
};

export default InsuranceSection;
