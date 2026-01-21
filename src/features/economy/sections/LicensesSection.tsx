import React from 'react';
import Link from 'next/link';
import EconomySectionCard from '../components/EconomySectionCard';
import { Exam, License } from '../types';

type LicensesSectionProps = {
  licenses: License[];
  exams: Exam[];
};

const LicensesSection: React.FC<LicensesSectionProps> = ({
  licenses,
  exams,
}) => {
  return (
    <EconomySectionCard title="Licenses & Exams">
      <div className="grid gap-4">
        <div>
          <div className="text-[13px] font-semibold text-[var(--ink)]">
            Licenses
          </div>
          <div className="mt-3 grid gap-3">
            {licenses.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.5)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
                No licenses issued yet.
              </div>
            ) : (
              licenses.slice(0, 4).map(license => (
                <div
                  key={license.id}
                  className="rounded-[12px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] px-4 py-3"
                >
                  <div className="text-[14px] font-semibold text-[var(--ink)]">
                    {license.licenseKey}
                  </div>
                  <div className="text-[11px] text-[rgba(170,192,202,0.7)]">
                    {license.status} ·{' '}
                    {license.expiresAt
                      ? new Date(license.expiresAt).toLocaleDateString()
                      : 'no expiry'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="text-[13px] font-semibold text-[var(--ink)]">
            Available Exams
          </div>
          <div className="mt-3 grid gap-3">
            {exams.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.5)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
                No exams published.
              </div>
            ) : (
              exams.slice(0, 4).map(exam => (
                <div
                  key={exam.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] px-4 py-3"
                >
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--ink)]">
                      {exam.name}
                    </div>
                    <div className="text-[11px] text-[rgba(170,192,202,0.7)]">
                      {exam.description || 'Exam'} · Pass {exam.minScore}%
                    </div>
                  </div>
                  <Link
                    href="/sim"
                    className="rounded-[10px] border border-[rgba(97,137,160,0.35)] bg-[rgba(12,28,44,0.7)] px-3 py-2 text-[12px] font-semibold text-[rgba(235,245,250,0.9)]"
                  >
                    Launch
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </EconomySectionCard>
  );
};

export default LicensesSection;
