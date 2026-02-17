import React from 'react';

import EconomySectionCard from '../components/EconomySectionCard';

import type { Reputation } from '../types';

type ReputationSectionProps = {
  reputation: Reputation[];
};

const ReputationSection: React.FC<ReputationSectionProps> = ({
  reputation,
}) => {
  return (
    <EconomySectionCard title="Reputation">
      <div className="grid gap-3">
        {reputation.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.5)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
            No reputation data yet.
          </div>
        ) : (
          reputation.slice(0, 5).map(item => (
            <div
              key={item.id}
              className="rounded-[12px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] px-4 py-3"
            >
              <div className="text-[14px] font-semibold text-[var(--ink)]">
                {item.scopeType} · {item.scopeId}
              </div>
              <div className="text-[11px] text-[rgba(170,192,202,0.7)]">
                Standing {item.value.toFixed(1)}
              </div>
            </div>
          ))
        )}
      </div>
    </EconomySectionCard>
  );
};

export default ReputationSection;
