import React from 'react';
import EconomySectionCard from '../components/EconomySectionCard';
import type { EconomyDashboard } from '../types';

type FinancesSectionProps = {
  dashboard: EconomyDashboard;
};

const FinancesSection: React.FC<FinancesSectionProps> = ({ dashboard }) => {
  return (
    <EconomySectionCard title="Company Finances">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[14px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.7)] px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[rgba(170,192,202,0.7)]">
            Credits
          </div>
          <div className="mt-2 text-[20px] font-semibold text-[var(--ink)]">
            {dashboard.profile.credits.toFixed(0)}
          </div>
        </div>
        <div className="rounded-[14px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.7)] px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[rgba(170,192,202,0.7)]">
            Rank
          </div>
          <div className="mt-2 text-[20px] font-semibold text-[var(--ink)]">
            {dashboard.profile.rank}
          </div>
        </div>
        <div className="rounded-[14px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.7)] px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[rgba(170,192,202,0.7)]">
            Safety
          </div>
          <div className="mt-2 text-[20px] font-semibold text-[var(--ink)]">
            {dashboard.profile.safetyScore.toFixed(2)}
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[14px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[rgba(170,192,202,0.7)]">
            Current Port
          </div>
          <div className="mt-2 text-[14px] font-semibold text-[var(--ink)]">
            {dashboard.currentPort?.name || 'At sea'}
          </div>
        </div>
        <div className="rounded-[14px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[rgba(170,192,202,0.7)]">
            Active Fleet
          </div>
          <div className="mt-2 text-[14px] font-semibold text-[var(--ink)]">
            {dashboard.fleet.length}
          </div>
        </div>
      </div>
      <div className="mt-4 text-[12px] text-[rgba(170,192,202,0.7)]">
        Monitor your company balance sheet and operational status before
        deploying ships.
      </div>
    </EconomySectionCard>
  );
};

export default FinancesSection;
