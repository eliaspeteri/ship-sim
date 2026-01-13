import React, { useMemo } from 'react';
import Link from 'next/link';
import styles from './Economy.module.css';
import { getApiBase } from '../lib/api';

type EconomyDashboard = {
  profile: {
    rank: number;
    experience: number;
    credits: number;
    safetyScore: number;
  };
  currentPort?: { id: string; name: string } | null;
  ports: { id: string; name: string; listedCargo: number }[];
  fleet: {
    id: string;
    spaceId?: string | null;
    ownerId?: string | null;
    status?: string | null;
    lastUpdate: string | Date;
  }[];
  loans: Array<{
    id: string;
    balance: number;
    status: string;
    dueAt?: string | null;
  }>;
  insurance: Array<{
    id: string;
    vesselId: string;
    type: string;
    premiumRate: number;
    status: string;
  }>;
  leases: Array<{
    id: string;
    vesselId: string;
    type: string;
    status: string;
    ratePerHour: number;
    revenueShare?: number;
  }>;
  sales: Array<{
    id: string;
    vesselId: string;
    type: string;
    status: string;
    price: number;
  }>;
  missions: Array<{
    id: string;
    name: string;
    rewardCredits: number;
    requiredRank: number;
  }>;
};

type CargoLot = {
  id: string;
  description?: string | null;
  value: number;
  weightTons: number;
  liabilityRate?: number | null;
  status: string;
};

const EconomyPage = () => {
  const apiBase = useMemo(() => getApiBase(), []);
  const [dashboard, setDashboard] = React.useState<EconomyDashboard | null>(
    null,
  );
  const [selectedPortId, setSelectedPortId] = React.useState<string | null>(
    null,
  );
  const [selectedVesselId, setSelectedVesselId] = React.useState<string | null>(
    null,
  );
  const [cargo, setCargo] = React.useState<CargoLot[]>([]);
  const [cargoMeta, setCargoMeta] = React.useState<{
    capacityTons?: number;
    loadedTons?: number;
  }>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  const loadDashboard = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/economy/dashboard`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      const data = (await res.json()) as EconomyDashboard;
      setDashboard(data);
      const defaultVessel = data.fleet?.[0]?.id || null;
      setSelectedVesselId(defaultVessel);
      const portId = data.currentPort?.id || data.ports?.[0]?.id || null;
      setSelectedPortId(portId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load economy.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  React.useEffect(() => {
    const loadCargo = async () => {
      if (!selectedPortId) return;
      setCargo([]);
      setActionNotice(null);
      const query = new URLSearchParams({ portId: selectedPortId });
      if (selectedVesselId) {
        query.set('vesselId', selectedVesselId);
      }
      try {
        const res = await fetch(
          `${apiBase}/api/economy/cargo?${query.toString()}`,
          {
            credentials: 'include',
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Request failed: ${res.status}`);
        }
        const data = await res.json();
        setCargo(Array.isArray(data?.cargo) ? data.cargo : []);
        setCargoMeta({
          capacityTons: data?.capacityTons,
          loadedTons: data?.loadedTons,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cargo.');
      }
    };
    void loadCargo();
  }, [selectedPortId, selectedVesselId]);

  const handleAssignCargo = async (cargoId: string) => {
    if (!selectedVesselId) {
      setActionNotice('Select a vessel to load cargo.');
      return;
    }
    setActionNotice(null);
    try {
      const res = await fetch(`${apiBase}/api/economy/cargo/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cargoId, vesselId: selectedVesselId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      setActionNotice('Cargo added to manifest.');
      await loadDashboard();
    } catch (err) {
      setActionNotice(
        err instanceof Error ? err.message : 'Unable to assign cargo.',
      );
    }
  };

  return (
    <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <div className={styles.overline}>Company Operations</div>
            <h1 className={styles.title}>Economy &amp; Logistics</h1>
            <p className={styles.subtitle}>
              Manage fleet assets, contracts, and cargo loadouts before heading
              back into the simulator.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/sim" className={styles.primaryButton}>
              Return to Simulator
            </Link>
            <Link href="/spaces" className={styles.secondaryButton}>
              Browse Spaces
            </Link>
          </div>
        </div>

        {loading ? (
          <div className={styles.notice}>Loading economy dashboard...</div>
        ) : null}
        {error ? <div className={styles.notice}>{error}</div> : null}

        {dashboard ? (
          <div className={styles.grid}>
            <section className={styles.card}>
              <div className={styles.cardTitle}>Company Snapshot</div>
              <div className={styles.statsRow}>
                <div>
                  <div className={styles.statLabel}>Credits</div>
                  <div className={styles.statValue}>
                    {dashboard.profile.credits.toFixed(0)}
                  </div>
                </div>
                <div>
                  <div className={styles.statLabel}>Rank</div>
                  <div className={styles.statValue}>
                    {dashboard.profile.rank}
                  </div>
                </div>
                <div>
                  <div className={styles.statLabel}>Safety</div>
                  <div className={styles.statValue}>
                    {dashboard.profile.safetyScore.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className={styles.statusRow}>
                <div>
                  <div className={styles.statLabel}>Current Port</div>
                  <div className={styles.statValue}>
                    {dashboard.currentPort?.name || 'At sea'}
                  </div>
                </div>
                <div>
                  <div className={styles.statLabel}>Active Fleet</div>
                  <div className={styles.statValue}>
                    {dashboard.fleet.length}
                  </div>
                </div>
              </div>
              <div className={styles.helper}>
                Use this page to plan runs, pick cargo, and manage your company
                while the simulator stays focused on piloting.
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>Fleet Overview</div>
              <div className={styles.selectorRow}>
                <div className={styles.selectorLabel}>Active Vessel</div>
                <select
                  className={styles.select}
                  value={selectedVesselId || ''}
                  onChange={e => setSelectedVesselId(e.target.value || null)}
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
              <div className={styles.list}>
                {dashboard.fleet.length === 0 ? (
                  <div className={styles.emptyState}>
                    No fleet vessels yet. Create one in the simulator.
                  </div>
                ) : (
                  dashboard.fleet.slice(0, 4).map(vessel => (
                    <div key={vessel.id} className={styles.listRow}>
                      <div>
                        <div className={styles.listTitle}>{vessel.id}</div>
                        <div className={styles.listMeta}>
                          Status: {vessel.status || 'active'}
                        </div>
                      </div>
                      <div className={styles.listMeta}>
                        Updated {new Date(vessel.lastUpdate).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={`${styles.card} ${styles.spanTwo}`}>
              <div className={styles.cardTitle}>Port Market</div>
              <div className={styles.portRow}>
                <div className={styles.portList}>
                  {dashboard.ports.map(port => (
                    <button
                      key={port.id}
                      type="button"
                      className={`${styles.portItem} ${
                        selectedPortId === port.id ? styles.portItemActive : ''
                      }`}
                      onClick={() => setSelectedPortId(port.id)}
                    >
                      <div>
                        <div className={styles.listTitle}>{port.name}</div>
                        <div className={styles.listMeta}>
                          {port.listedCargo} cargo lots available
                        </div>
                      </div>
                      {dashboard.currentPort?.id === port.id ? (
                        <span className={styles.badge}>You are here</span>
                      ) : null}
                    </button>
                  ))}
                </div>
                <div className={styles.portCargo}>
                  <div className={styles.portHeader}>
                    <div>
                      <div className={styles.listTitle}>Available Cargo</div>
                      <div className={styles.listMeta}>
                        {cargoMeta.capacityTons !== undefined
                          ? `Capacity ${cargoMeta.loadedTons?.toFixed(1) ?? 0} / ${cargoMeta.capacityTons.toFixed(1)} tons`
                          : 'Select a vessel to see capacity'}
                      </div>
                    </div>
                    {actionNotice ? (
                      <div className={styles.noticeInline}>{actionNotice}</div>
                    ) : null}
                  </div>
                  {cargo.length === 0 ? (
                    <div className={styles.emptyState}>
                      No cargo listed for this port.
                    </div>
                  ) : (
                    <div className={styles.cargoList}>
                      {cargo.map(item => (
                        <div key={item.id} className={styles.cargoRow}>
                          <div>
                            <div className={styles.listTitle}>
                              {item.description || 'Cargo lot'}
                            </div>
                            <div className={styles.listMeta}>
                              {item.weightTons.toFixed(1)} t · {item.value} cr ·
                              Liability{' '}
                              {((item.liabilityRate || 0) * 100).toFixed(1)}%
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => handleAssignCargo(item.id)}
                          >
                            Load
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={styles.helper}>
                    When you are in port, select cargo and then return to the
                    simulator to begin the journey.
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>Loans &amp; Insurance</div>
              <div className={styles.list}>
                <div className={styles.listTitle}>Loans</div>
                {dashboard.loans.length === 0 ? (
                  <div className={styles.emptyState}>No active loans.</div>
                ) : (
                  dashboard.loans.slice(0, 3).map(loan => (
                    <div key={loan.id} className={styles.listRow}>
                      <div>
                        <div className={styles.listTitle}>
                          Balance {loan.balance.toFixed(0)} cr
                        </div>
                        <div className={styles.listMeta}>
                          Status: {loan.status}
                        </div>
                      </div>
                      <div className={styles.listMeta}>
                        Due{' '}
                        {loan.dueAt
                          ? new Date(loan.dueAt).toLocaleDateString()
                          : '—'}
                      </div>
                    </div>
                  ))
                )}
                <div className={styles.listTitle}>Insurance</div>
                {dashboard.insurance.length === 0 ? (
                  <div className={styles.emptyState}>No active policies.</div>
                ) : (
                  dashboard.insurance.slice(0, 3).map(policy => (
                    <div key={policy.id} className={styles.listRow}>
                      <div>
                        <div className={styles.listTitle}>
                          {policy.type} policy
                        </div>
                        <div className={styles.listMeta}>
                          {policy.premiumRate} cr/hr · {policy.status}
                        </div>
                      </div>
                      <div className={styles.listMeta}>
                        Vessel {policy.vesselId}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>Leases &amp; Sales</div>
              <div className={styles.list}>
                <div className={styles.listTitle}>Leases</div>
                {dashboard.leases.length === 0 ? (
                  <div className={styles.emptyState}>No lease activity.</div>
                ) : (
                  dashboard.leases.slice(0, 3).map(lease => (
                    <div key={lease.id} className={styles.listRow}>
                      <div>
                        <div className={styles.listTitle}>
                          {lease.type} · {lease.status}
                        </div>
                        <div className={styles.listMeta}>
                          {lease.ratePerHour} cr/hr · Revenue share{' '}
                          {(lease.revenueShare || 0) * 100}%
                        </div>
                      </div>
                      <div className={styles.listMeta}>
                        Vessel {lease.vesselId}
                      </div>
                    </div>
                  ))
                )}
                <div className={styles.listTitle}>Sales</div>
                {dashboard.sales.length === 0 ? (
                  <div className={styles.emptyState}>No vessel sales.</div>
                ) : (
                  dashboard.sales.slice(0, 3).map(sale => (
                    <div key={sale.id} className={styles.listRow}>
                      <div>
                        <div className={styles.listTitle}>
                          {sale.type} · {sale.status}
                        </div>
                        <div className={styles.listMeta}>
                          {sale.price} cr · Vessel {sale.vesselId}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>Missions &amp; Contracts</div>
              <div className={styles.list}>
                {dashboard.missions.length === 0 ? (
                  <div className={styles.emptyState}>
                    No missions available for this space.
                  </div>
                ) : (
                  dashboard.missions.map(mission => (
                    <div key={mission.id} className={styles.listRow}>
                      <div>
                        <div className={styles.listTitle}>{mission.name}</div>
                        <div className={styles.listMeta}>
                          Reward {mission.rewardCredits} cr · Rank{' '}
                          {mission.requiredRank}
                        </div>
                      </div>
                      <Link href="/sim" className={styles.secondaryButton}>
                        View in Sim
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : null}
    </div>
  );
};

export default EconomyPage;
