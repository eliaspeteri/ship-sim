import React from 'react';
import Link from 'next/link';
import EconomySectionCard from '../components/EconomySectionCard';
import type { EconomyDashboard } from '../types';

type MissionsSectionProps = {
  dashboard: EconomyDashboard;
};

const MissionsSection: React.FC<MissionsSectionProps> = ({ dashboard }) => {
  return (
    <EconomySectionCard title="Missions & Contracts">
      <div className="grid gap-3">
        {dashboard.missions.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.5)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
            No missions available for this space.
          </div>
        ) : (
          dashboard.missions.map(mission => (
            <div
              key={mission.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] px-4 py-3"
            >
              <div>
                <div className="text-[14px] font-semibold text-[var(--ink)]">
                  {mission.name}
                </div>
                <div className="text-[11px] text-[rgba(170,192,202,0.7)]">
                  Reward {mission.rewardCredits} cr · Rank{' '}
                  {mission.requiredRank}
                </div>
              </div>
              <Link
                href="/sim"
                className="rounded-[10px] border border-[rgba(97,137,160,0.35)] bg-[rgba(12,28,44,0.7)] px-3 py-2 text-[12px] font-semibold text-[rgba(235,245,250,0.9)]"
              >
                View in Sim
              </Link>
            </div>
          ))
        )}
      </div>
    </EconomySectionCard>
  );
};

export default MissionsSection;
