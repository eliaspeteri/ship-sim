import React from 'react';
import EconomySectionCard from '../components/EconomySectionCard';
import { CareerStatus } from '../types';

type CareersSectionProps = {
  careers: CareerStatus[];
};

const CareersSection: React.FC<CareersSectionProps> = ({ careers }) => {
  return (
    <EconomySectionCard title="Careers">
      <div className="grid gap-3">
        {careers.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.5)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
            No careers registered yet.
          </div>
        ) : (
          careers.map(career => (
            <div
              key={career.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] px-4 py-3"
            >
              <div>
                <div className="text-[14px] font-semibold text-[var(--ink)]">
                  {career.career?.name || career.careerId}
                </div>
                <div className="text-[11px] text-[rgba(170,192,202,0.7)]">
                  Level {career.level} · {career.experience} XP
                </div>
              </div>
              {career.active ? (
                <span className="rounded-full border border-[rgba(27,154,170,0.6)] bg-[rgba(16,48,68,0.8)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#d9f7ff]">
                  Active
                </span>
              ) : null}
            </div>
          ))
        )}
      </div>
    </EconomySectionCard>
  );
};

export default CareersSection;
