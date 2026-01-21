import React from 'react';
import EconomySectionCard from '../components/EconomySectionCard';
import { EconomyDashboard } from '../types';

type LoansSectionProps = {
  dashboard: EconomyDashboard;
};

const LoansSection: React.FC<LoansSectionProps> = ({ dashboard }) => {
  return (
    <EconomySectionCard title="Loans">
      <div className="grid gap-3">
        {dashboard.loans.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.5)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
            No active loans.
          </div>
        ) : (
          dashboard.loans.map(loan => (
            <div
              key={loan.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] px-4 py-3"
            >
              <div>
                <div className="text-[14px] font-semibold text-[var(--ink)]">
                  Balance {loan.balance.toFixed(0)} cr
                </div>
                <div className="text-[11px] text-[rgba(170,192,202,0.7)]">
                  Status: {loan.status}
                </div>
              </div>
              <div className="text-[11px] text-[rgba(170,192,202,0.7)]">
                Due{' '}
                {loan.dueAt ? new Date(loan.dueAt).toLocaleDateString() : '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </EconomySectionCard>
  );
};

export default LoansSection;
