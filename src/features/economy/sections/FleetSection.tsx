import React from 'react';
import EconomySectionCard from '../components/EconomySectionCard';
import type { EconomyDashboard } from '../types';

type FleetSectionProps = {
  dashboard: EconomyDashboard;
  selectedVesselId: string | null;
  onSelectVessel: (value: string | null) => void;
  onEndLease: (leaseId: string) => void;
};

const FleetSection: React.FC<FleetSectionProps> = ({
  dashboard,
  selectedVesselId,
  onSelectVessel,
  onEndLease,
}) => {
  return (
    <div className="grid gap-6">
      <EconomySectionCard title="Fleet Overview">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[rgba(170,192,202,0.7)]">
              Active Vessel
            </div>
            <select
              className="mt-2 w-full rounded-[10px] border border-[rgba(97,137,160,0.35)] bg-[rgba(9,18,28,0.92)] px-3 py-2 text-[13px] text-[var(--ink)]"
              value={selectedVesselId || ''}
              onChange={event => {
                const next = event.target.value || null;
                onSelectVessel(next);
              }}
            >
              {dashboard.fleet.length === 0 ? (
                <option value="">No vessels</option>
              ) : null}
              {dashboard.fleet.map(vessel => (
                <option key={vessel.id} value={vessel.id}>
                  {vessel.id} ({vessel.status || 'active'})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {dashboard.fleet.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.5)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
              No fleet vessels yet. Create one in the simulator.
            </div>
          ) : (
            dashboard.fleet.map(vessel => (
              <div
                key={vessel.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] px-4 py-3"
              >
                <div>
                  <div className="text-[14px] font-semibold text-[var(--ink)]">
                    {vessel.id}
                  </div>
                  <div className="text-[12px] text-[rgba(170,192,202,0.7)]">
                    Status {vessel.status || 'active'} · Space{' '}
                    {vessel.spaceId || 'global'}
                  </div>
                </div>
                <div className="text-[11px] text-[rgba(170,192,202,0.7)]">
                  Updated {new Date(vessel.lastUpdate).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </EconomySectionCard>

      <EconomySectionCard title="Leases & Sales">
        <div className="grid gap-4">
          <div>
            <div className="text-[13px] font-semibold text-[var(--ink)]">
              Leases
            </div>
            <div className="mt-3 grid gap-3">
              {dashboard.leases.length === 0 ? (
                <div className="rounded-[12px] border border-dashed border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.5)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
                  No lease activity.
                </div>
              ) : (
                dashboard.leases.map(lease => (
                  <div
                    key={lease.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] px-4 py-3"
                  >
                    <div>
                      <div className="text-[14px] font-semibold text-[var(--ink)]">
                        {lease.type} · {lease.status}
                      </div>
                      <div className="text-[12px] text-[rgba(170,192,202,0.7)]">
                        {lease.ratePerHour} cr/hr · Revenue share{' '}
                        {(lease.revenueShare || 0) * 100}%
                        {lease.endsAt
                          ? ` · Ends ${new Date(lease.endsAt).toLocaleString()}`
                          : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-[11px] text-[rgba(170,192,202,0.7)]">
                        Vessel {lease.vesselId}
                      </div>
                      {lease.status === 'active' ? (
                        <button
                          type="button"
                          className="rounded-[10px] border border-[rgba(97,137,160,0.35)] bg-[rgba(12,28,44,0.7)] px-3 py-1.5 text-[12px] font-semibold text-[rgba(235,245,250,0.9)]"
                          onClick={() => onEndLease(lease.id)}
                        >
                          End
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[var(--ink)]">
              Sales
            </div>
            <div className="mt-3 grid gap-3">
              {dashboard.sales.length === 0 ? (
                <div className="rounded-[12px] border border-dashed border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.5)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
                  No vessel sales.
                </div>
              ) : (
                dashboard.sales.map(sale => (
                  <div
                    key={sale.id}
                    className="rounded-[12px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] px-4 py-3"
                  >
                    <div className="text-[14px] font-semibold text-[var(--ink)]">
                      {sale.type} · {sale.status}
                    </div>
                    <div className="text-[12px] text-[rgba(170,192,202,0.7)]">
                      {sale.price} cr · Vessel {sale.vesselId}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </EconomySectionCard>
    </div>
  );
};

export default FleetSection;
