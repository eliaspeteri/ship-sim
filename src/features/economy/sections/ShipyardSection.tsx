import React from 'react';
import EconomySectionCard from '../components/EconomySectionCard';
import { VesselCatalogEntry } from '../types';

type ShipyardSectionProps = {
  catalog: VesselCatalogEntry[];
  selectedPortName: string;
  shopNotice: string | null;
  onShipyardAction: (templateId: string, action: 'purchase' | 'charter' | 'lease') => void;
};

const ShipyardSection: React.FC<ShipyardSectionProps> = ({
  catalog,
  selectedPortName,
  shopNotice,
  onShipyardAction,
}) => {
  return (
    <EconomySectionCard
      title="Shipyard"
      actions={
        <div className="text-[12px] text-[rgba(170,192,202,0.7)]">
          Delivery port: <span className="text-[var(--ink)]">{selectedPortName}</span>
        </div>
      }
    >
      {shopNotice ? (
        <div className="mb-4 rounded-[10px] border border-[rgba(97,137,160,0.35)] bg-[rgba(12,28,44,0.7)] px-3 py-2 text-[12px] text-[rgba(210,226,236,0.9)]">
          {shopNotice}
        </div>
      ) : null}
      {catalog.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.5)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
          No vessel listings available.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {catalog.map(entry => (
            <div
              key={entry.id}
              className="rounded-[16px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.65)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[15px] font-semibold text-[var(--ink)]">
                    {entry.name}
                  </div>
                  <div className="mt-1 text-[12px] text-[rgba(170,192,202,0.7)]">
                    {entry.description || 'No description available.'}
                  </div>
                </div>
                {entry.tags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="rounded-full border border-[rgba(97,137,160,0.35)] bg-[rgba(12,28,44,0.7)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[rgba(210,226,236,0.85)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-[rgba(170,192,202,0.7)]">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em]">Max Speed</div>
                  <div className="mt-1 text-[13px] text-[var(--ink)]">
                    {entry.properties.maxSpeed} kn
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em]">Cargo</div>
                  <div className="mt-1 text-[13px] text-[var(--ink)]">
                    {entry.capacities?.cargoTons.toFixed(1) ?? '--'} t
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em]">Passengers</div>
                  <div className="mt-1 text-[13px] text-[var(--ink)]">
                    {entry.capacities?.passengers ?? '--'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em]">Draft</div>
                  <div className="mt-1 text-[13px] text-[var(--ink)]">
                    {entry.properties.draft.toFixed(2)} m
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-[10px] bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)] px-3 py-2 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => onShipyardAction(entry.id, 'purchase')}
                  disabled={!entry.commerce?.purchasePrice}
                >
                  Buy {entry.commerce?.purchasePrice?.toFixed(0) ?? '--'} cr
                </button>
                <button
                  type="button"
                  className="rounded-[10px] border border-[rgba(97,137,160,0.35)] bg-[rgba(12,28,44,0.7)] px-3 py-2 text-[12px] font-semibold text-[rgba(235,245,250,0.9)] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => onShipyardAction(entry.id, 'charter')}
                  disabled={!entry.commerce?.charterRatePerHour}
                >
                  Charter {entry.commerce?.charterRatePerHour?.toFixed(0) ?? '--'} cr/hr
                </button>
                <button
                  type="button"
                  className="rounded-[10px] border border-[rgba(97,137,160,0.35)] bg-[rgba(12,28,44,0.7)] px-3 py-2 text-[12px] font-semibold text-[rgba(235,245,250,0.9)] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => onShipyardAction(entry.id, 'lease')}
                  disabled={!entry.commerce?.leaseRatePerHour}
                >
                  Lease {entry.commerce?.leaseRatePerHour?.toFixed(0) ?? '--'} cr/hr
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </EconomySectionCard>
  );
};

export default ShipyardSection;
