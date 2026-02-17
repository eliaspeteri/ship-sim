import React from 'react';

import EconomySectionCard from '../components/EconomySectionCard';

import type { CargoLot, EconomyDashboard, PassengerContract } from '../types';

type PortMarketSectionProps = {
  dashboard: EconomyDashboard;
  selectedPortId: string | null;
  onSelectPort: (portId: string) => void;
  cargo: CargoLot[];
  cargoMeta: { capacityTons?: number; loadedTons?: number };
  passengers: PassengerContract[];
  passengerMeta: { capacity?: number; onboard?: number };
  portNameById: Map<string, string>;
  actionNotice: string | null;
  onAssignCargo: (cargoId: string) => void;
  onAcceptPassengers: (contractId: string) => void;
};

const PortMarketSection: React.FC<PortMarketSectionProps> = ({
  dashboard,
  selectedPortId,
  onSelectPort,
  cargo,
  cargoMeta,
  passengers,
  passengerMeta,
  portNameById,
  actionNotice,
  onAssignCargo,
  onAcceptPassengers,
}) => {
  return (
    <EconomySectionCard title="Port Market">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="space-y-3">
          {dashboard.ports.map(port => (
            <button
              key={port.id}
              type="button"
              className={`w-full rounded-[12px] border px-3 py-3 text-left transition ${
                selectedPortId === port.id
                  ? 'border-[rgba(27,154,170,0.65)] bg-[rgba(15,52,72,0.7)]'
                  : 'border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] hover:border-[rgba(97,137,160,0.5)]'
              }`}
              onClick={() => onSelectPort(port.id)}
            >
              <div className="text-[14px] font-semibold text-[var(--ink)]">
                {port.name}
              </div>
              <div className="mt-1 text-[11px] text-[rgba(170,192,202,0.7)]">
                {port.listedCargo} cargo · {port.listedPassengers || 0} pax ·
                Congestion {Math.round((port.congestion || 0) * 100)}%
              </div>
              {dashboard.currentPort?.id === port.id ? (
                <div className="mt-2 inline-flex rounded-full border border-[rgba(27,154,170,0.6)] bg-[rgba(16,48,68,0.8)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#d9f7ff]">
                  You are here
                </div>
              ) : null}
            </button>
          ))}
        </div>
        <div className="space-y-5">
          <div className="rounded-[14px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold text-[var(--ink)]">
                  Available Cargo
                </div>
                <div className="mt-1 text-[11px] text-[rgba(170,192,202,0.7)]">
                  {cargoMeta.capacityTons !== undefined
                    ? `Capacity ${cargoMeta.loadedTons?.toFixed(1) ?? 0} / ${cargoMeta.capacityTons.toFixed(1)} tons`
                    : 'Select a vessel to see capacity'}
                </div>
              </div>
              {actionNotice ? (
                <div className="rounded-[10px] border border-[rgba(97,137,160,0.35)] bg-[rgba(12,28,44,0.7)] px-3 py-1.5 text-[11px] text-[rgba(210,226,236,0.9)]">
                  {actionNotice}
                </div>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3">
              {cargo.length === 0 ? (
                <div className="rounded-[12px] border border-dashed border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.5)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
                  No cargo listed for this port.
                </div>
              ) : (
                cargo.map(item => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.5)] px-4 py-3"
                  >
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--ink)]">
                        {item.description || 'Cargo lot'}
                      </div>
                      <div className="text-[11px] text-[rgba(170,192,202,0.7)]">
                        {item.weightTons.toFixed(1)} t · {item.value} cr ·{' '}
                        {portNameById.get(item.destinationPortId || '') ||
                          'Unknown route'}{' '}
                        · Liability{' '}
                        {((item.liabilityRate || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-[10px] border border-[rgba(97,137,160,0.35)] bg-[rgba(12,28,44,0.7)] px-3 py-2 text-[12px] font-semibold text-[rgba(235,245,250,0.9)]"
                      onClick={() => onAssignCargo(item.id)}
                    >
                      Load
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-[14px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.6)] p-4">
            <div>
              <div className="text-[14px] font-semibold text-[var(--ink)]">
                Passenger Requests
              </div>
              <div className="mt-1 text-[11px] text-[rgba(170,192,202,0.7)]">
                {passengerMeta.capacity !== undefined
                  ? `Capacity ${passengerMeta.onboard ?? 0} / ${passengerMeta.capacity}`
                  : 'Select a vessel to see capacity'}
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {passengers.length === 0 ? (
                <div className="rounded-[12px] border border-dashed border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.5)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
                  No passenger requests available.
                </div>
              ) : (
                passengers.map(contract => (
                  <div
                    key={contract.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.5)] px-4 py-3"
                  >
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--ink)]">
                        {contract.passengerType.replace('_', ' ')} ·{' '}
                        {contract.paxCount} pax
                      </div>
                      <div className="text-[11px] text-[rgba(170,192,202,0.7)]">
                        Reward {contract.rewardCredits} cr · Destination{' '}
                        {portNameById.get(contract.destinationPortId) ||
                          contract.destinationPortId}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-[10px] border border-[rgba(97,137,160,0.35)] bg-[rgba(12,28,44,0.7)] px-3 py-2 text-[12px] font-semibold text-[rgba(235,245,250,0.9)]"
                      onClick={() => onAcceptPassengers(contract.id)}
                    >
                      Board
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 text-[11px] text-[rgba(170,192,202,0.65)]">
              Load cargo or passengers while in port, then return to the
              simulator to execute the run.
            </div>
          </div>
        </div>
      </div>
    </EconomySectionCard>
  );
};

export default PortMarketSection;
