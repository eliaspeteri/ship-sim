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
  ports: {
    id: string;
    name: string;
    listedCargo: number;
    listedPassengers?: number;
    congestion?: number;
  }[];
  passengerContracts?: Array<{
    id: string;
    originPortId: string;
    destinationPortId: string;
    passengerType: string;
    paxCount: number;
    rewardCredits: number;
    status: string;
  }>;
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
    ownerId?: string | null;
    lesseeId?: string | null;
    endsAt?: string | null;
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
  destinationPortId?: string | null;
  status: string;
};

type PassengerContract = {
  id: string;
  originPortId: string;
  destinationPortId: string;
  passengerType: string;
  paxCount: number;
  rewardCredits: number;
  status: string;
};

type CareerStatus = {
  id: string;
  careerId: string;
  level: number;
  experience: number;
  active: boolean;
  career?: { id: string; name: string; description?: string | null };
};

type License = {
  id: string;
  licenseKey: string;
  status: string;
  expiresAt?: string | null;
};

type Exam = {
  id: string;
  name: string;
  description?: string;
  minScore: number;
  careerId?: string;
  licenseKey?: string;
};

type Reputation = {
  id: string;
  scopeType: string;
  scopeId: string;
  value: number;
};

type SpaceSummary = {
  id: string;
  name: string;
  visibility?: string;
  rulesetType?: string;
};

type VesselCatalogEntry = {
  id: string;
  name: string;
  description?: string;
  shipType: string;
  modelPath?: string | null;
  properties: {
    mass: number;
    length: number;
    beam: number;
    draft: number;
    blockCoefficient: number;
    maxSpeed: number;
  };
  commerce?: {
    purchasePrice?: number;
    charterRatePerHour?: number;
    leaseRatePerHour?: number;
    revenueShare?: number;
    minRank?: number;
  };
  capacities?: {
    cargoTons: number;
    passengers: number;
  };
  tags?: string[];
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
  const [passengers, setPassengers] = React.useState<PassengerContract[]>([]);
  const [passengerMeta, setPassengerMeta] = React.useState<{
    capacity?: number;
    onboard?: number;
  }>({});
  const [careers, setCareers] = React.useState<CareerStatus[]>([]);
  const [licenses, setLicenses] = React.useState<License[]>([]);
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [reputation, setReputation] = React.useState<Reputation[]>([]);
  const [catalog, setCatalog] = React.useState<VesselCatalogEntry[]>([]);
  const [spaces, setSpaces] = React.useState<SpaceSummary[]>([]);
  const [spaceId, setSpaceId] = React.useState<string>('global');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);
  const [shopNotice, setShopNotice] = React.useState<string | null>(null);

  const portNameById = React.useMemo(() => {
    if (!dashboard) return new Map<string, string>();
    return new Map(dashboard.ports.map(port => [port.id, port.name]));
  }, [dashboard]);

  const loadDashboard = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        dashboardRes,
        careerRes,
        licenseRes,
        examRes,
        reputationRes,
        catalogRes,
      ] = await Promise.all([
        fetch(`${apiBase}/api/economy/dashboard`, { credentials: 'include' }),
        fetch(`${apiBase}/api/careers/status`, { credentials: 'include' }),
        fetch(`${apiBase}/api/licenses`, { credentials: 'include' }),
        fetch(`${apiBase}/api/exams`, { credentials: 'include' }),
        fetch(`${apiBase}/api/reputation`, { credentials: 'include' }),
        fetch(`${apiBase}/api/economy/vessels/catalog`, {
          credentials: 'include',
        }),
      ]);
      const responses = [
        dashboardRes,
        careerRes,
        licenseRes,
        examRes,
        reputationRes,
        catalogRes,
      ];
      for (const res of responses) {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Request failed: ${res.status}`);
        }
      }
      const data = (await dashboardRes.json()) as EconomyDashboard;
      const careerData = await careerRes.json();
      const licenseData = await licenseRes.json();
      const examData = await examRes.json();
      const reputationData = await reputationRes.json();
      const catalogData = await catalogRes.json();
      setDashboard(data);
      setCareers(Array.isArray(careerData?.careers) ? careerData.careers : []);
      setLicenses(
        Array.isArray(licenseData?.licenses) ? licenseData.licenses : [],
      );
      setExams(Array.isArray(examData?.exams) ? examData.exams : []);
      setReputation(
        Array.isArray(reputationData?.reputation)
          ? reputationData.reputation
          : [],
      );
      setCatalog(
        Array.isArray(catalogData?.vessels) ? catalogData.vessels : [],
      );
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
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('ship-sim-space');
    if (stored) {
      setSpaceId(stored);
    }
  }, []);

  React.useEffect(() => {
    if (!spaceId || typeof window === 'undefined') return;
    window.localStorage.setItem('ship-sim-space', spaceId);
  }, [spaceId]);

  React.useEffect(() => {
    const loadSpaces = async () => {
      try {
        const res = await fetch(`${apiBase}/api/spaces`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        setSpaces(Array.isArray(data?.spaces) ? data.spaces : []);
      } catch (err) {
        setSpaces([]);
      }
    };
    void loadSpaces();
  }, [apiBase]);

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

  React.useEffect(() => {
    const loadPassengers = async () => {
      if (!selectedPortId) return;
      setPassengers([]);
      const query = new URLSearchParams({ portId: selectedPortId });
      if (selectedVesselId) {
        query.set('vesselId', selectedVesselId);
      }
      try {
        const res = await fetch(
          `${apiBase}/api/economy/passengers?${query.toString()}`,
          {
            credentials: 'include',
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Request failed: ${res.status}`);
        }
        const data = await res.json();
        setPassengers(Array.isArray(data?.contracts) ? data.contracts : []);
        setPassengerMeta({
          capacity: data?.capacity,
          onboard: data?.onboard,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load passengers.',
        );
      }
    };
    void loadPassengers();
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

  const handleAcceptPassengers = async (contractId: string) => {
    if (!selectedVesselId) {
      setActionNotice('Select a vessel to board passengers.');
      return;
    }
    setActionNotice(null);
    try {
      const res = await fetch('/api/economy/passengers/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contractId, vesselId: selectedVesselId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      setActionNotice('Passengers boarded.');
      await loadDashboard();
    } catch (err) {
      setActionNotice(
        err instanceof Error ? err.message : 'Unable to board passengers.',
      );
    }
  };

  const handleEndLease = async (leaseId: string) => {
    setActionNotice(null);
    try {
      const res = await fetch(`${apiBase}/api/economy/leases/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leaseId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      setActionNotice('Lease ended.');
      await loadDashboard();
    } catch (err) {
      setActionNotice(
        err instanceof Error ? err.message : 'Unable to end lease.',
      );
    }
  };

  const handleShipyardAction = async (
    templateId: string,
    action: 'purchase' | 'charter' | 'lease',
  ) => {
    if (!selectedPortId) {
      setShopNotice('Select a port for delivery first.');
      return;
    }
    setShopNotice(null);
    const endpoint =
      action === 'purchase'
        ? `${apiBase}/api/economy/vessels/purchase`
        : `${apiBase}/api/economy/vessels/lease`;
    const payload =
      action === 'purchase'
        ? { templateId, portId: selectedPortId, spaceId }
        : { templateId, portId: selectedPortId, type: action, spaceId };
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      setShopNotice(
        action === 'purchase'
          ? 'Vessel purchased and delivered to port storage.'
          : 'Lease contract activated.',
      );
      await loadDashboard();
    } catch (err) {
      setShopNotice(
        err instanceof Error ? err.message : 'Unable to complete action.',
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
          <div className={styles.spaceSelect}>
            <div className={styles.selectorLabel}>Active Space</div>
            <select
              className={styles.select}
              value={spaceId}
              onChange={e => setSpaceId(e.target.value)}
            >
              <option value="global">global</option>
              {spaces.map(space => (
                <option key={space.id} value={space.id}>
                  {space.name || space.id}
                </option>
              ))}
            </select>
          </div>
          <Link
            href={{
              pathname: '/sim',
              query: {
                ...(selectedVesselId ? { vesselId: selectedVesselId } : {}),
                ...(spaceId ? { space: spaceId } : {}),
              },
            }}
            className={styles.primaryButton}
          >
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
                <div className={styles.statValue}>{dashboard.profile.rank}</div>
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
                <div className={styles.statValue}>{dashboard.fleet.length}</div>
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
                onChange={e => {
                  const next = e.target.value || null;
                  setSelectedVesselId(next);
                  if (typeof window !== 'undefined') {
                    if (next) {
                      sessionStorage.setItem(
                        'ship-sim-active-vessel',
                        next,
                      );
                    } else {
                      sessionStorage.removeItem('ship-sim-active-vessel');
                    }
                  }
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
            <div className={styles.list}>
              {dashboard.fleet.length === 0 ? (
                <div className={styles.emptyState}>
                  No fleet vessels yet. Create one in the simulator.
                </div>
              ) : (
                dashboard.fleet.map(vessel => (
                  <div key={vessel.id} className={styles.listRow}>
                    <div>
                      <div className={styles.listTitle}>{vessel.id}</div>
                      <div className={styles.listMeta}>
                        Status: {vessel.status || 'active'} · Space{' '}
                        {vessel.spaceId || 'global'}
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
            <div className={styles.cardTitle}>Shipyard</div>
            <div className={styles.catalogHeader}>
              <div className={styles.listMeta}>
                Delivery port:{' '}
                {dashboard.currentPort?.name ||
                  dashboard.ports.find(port => port.id === selectedPortId)
                    ?.name ||
                  'Select a port'}
              </div>
              {shopNotice ? (
                <div className={styles.noticeInline}>{shopNotice}</div>
              ) : null}
            </div>
            {catalog.length === 0 ? (
              <div className={styles.emptyState}>
                No vessel listings available.
              </div>
            ) : (
              <div className={styles.catalogGrid}>
                {catalog.map(entry => (
                  <div key={entry.id} className={styles.catalogCard}>
                    <div className={styles.catalogTitleRow}>
                      <div className={styles.listTitle}>{entry.name}</div>
                      {entry.tags?.length ? (
                        <div className={styles.tagRow}>
                          {entry.tags.slice(0, 3).map(tag => (
                            <span key={tag} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className={styles.listMeta}>
                      {entry.description || 'No description available.'}
                    </div>
                    <div className={styles.catalogStats}>
                      <div>
                        <div className={styles.statLabel}>Max Speed</div>
                        <div className={styles.statValueSmall}>
                          {entry.properties.maxSpeed} kn
                        </div>
                      </div>
                      <div>
                        <div className={styles.statLabel}>Cargo</div>
                        <div className={styles.statValueSmall}>
                          {entry.capacities?.cargoTons.toFixed(1) ?? '--'} t
                        </div>
                      </div>
                      <div>
                        <div className={styles.statLabel}>Passengers</div>
                        <div className={styles.statValueSmall}>
                          {entry.capacities?.passengers ?? '--'}
                        </div>
                      </div>
                      <div>
                        <div className={styles.statLabel}>Draft</div>
                        <div className={styles.statValueSmall}>
                          {entry.properties.draft.toFixed(2)} m
                        </div>
                      </div>
                    </div>
                    <div className={styles.catalogActions}>
                      <button
                        type="button"
                        className={`${styles.primaryButton} ${
                          entry.commerce?.purchasePrice
                            ? ''
                            : styles.buttonDisabled
                        }`}
                        onClick={() =>
                          handleShipyardAction(entry.id, 'purchase')
                        }
                        disabled={!entry.commerce?.purchasePrice}
                      >
                        Buy {entry.commerce?.purchasePrice?.toFixed(0) ?? '--'}{' '}
                        cr
                      </button>
                      <button
                        type="button"
                        className={`${styles.secondaryButton} ${
                          entry.commerce?.charterRatePerHour
                            ? ''
                            : styles.buttonDisabled
                        }`}
                        onClick={() =>
                          handleShipyardAction(entry.id, 'charter')
                        }
                        disabled={!entry.commerce?.charterRatePerHour}
                      >
                        Charter{' '}
                        {entry.commerce?.charterRatePerHour?.toFixed(0) ?? '--'}{' '}
                        cr/hr
                      </button>
                      <button
                        type="button"
                        className={`${styles.secondaryButton} ${
                          entry.commerce?.leaseRatePerHour
                            ? ''
                            : styles.buttonDisabled
                        }`}
                        onClick={() => handleShipyardAction(entry.id, 'lease')}
                        disabled={!entry.commerce?.leaseRatePerHour}
                      >
                        Lease{' '}
                        {entry.commerce?.leaseRatePerHour?.toFixed(0) ?? '--'}{' '}
                        cr/hr
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                        {port.listedCargo} cargo · {port.listedPassengers || 0}{' '}
                        pax · Congestion{' '}
                        {Math.round((port.congestion || 0) * 100)}%
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
                            {portNameById.get(
                              (item as { destinationPortId?: string })
                                .destinationPortId || '',
                            ) || 'Unknown route'}{' '}
                            · Liability{' '}
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
                <div className={styles.passengerHeader}>
                  <div className={styles.listTitle}>Passenger Requests</div>
                  <div className={styles.listMeta}>
                    {passengerMeta.capacity !== undefined
                      ? `Capacity ${passengerMeta.onboard ?? 0} / ${passengerMeta.capacity}`
                      : 'Select a vessel to see capacity'}
                  </div>
                </div>
                {passengers.length === 0 ? (
                  <div className={styles.emptyState}>
                    No passenger requests available.
                  </div>
                ) : (
                  <div className={styles.cargoList}>
                    {passengers.map(contract => (
                      <div key={contract.id} className={styles.cargoRow}>
                        <div>
                          <div className={styles.listTitle}>
                            {contract.passengerType.replace('_', ' ')} ·{' '}
                            {contract.paxCount} pax
                          </div>
                          <div className={styles.listMeta}>
                            Reward {contract.rewardCredits} cr · Destination{' '}
                            {portNameById.get(contract.destinationPortId) ||
                              contract.destinationPortId}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => handleAcceptPassengers(contract.id)}
                        >
                          Board
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className={styles.helper}>
                  Load cargo or passengers while in port, then return to the
                  simulator to execute the run.
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
                dashboard.leases.map(lease => (
                  <div key={lease.id} className={styles.listRow}>
                    <div>
                      <div className={styles.listTitle}>
                        {lease.type} · {lease.status}
                      </div>
                      <div className={styles.listMeta}>
                        {lease.ratePerHour} cr/hr · Revenue share{' '}
                        {(lease.revenueShare || 0) * 100}%
                        {lease.endsAt
                          ? ` · Ends ${new Date(lease.endsAt).toLocaleString()}`
                          : ''}
                      </div>
                    </div>
                    <div className={styles.leaseActions}>
                      <div className={styles.listMeta}>
                        Vessel {lease.vesselId}
                      </div>
                      {lease.status === 'active' ? (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => handleEndLease(lease.id)}
                        >
                          End
                        </button>
                      ) : null}
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
          <section className={styles.card}>
            <div className={styles.cardTitle}>Careers</div>
            <div className={styles.list}>
              {careers.length === 0 ? (
                <div className={styles.emptyState}>
                  No careers registered yet.
                </div>
              ) : (
                careers.map(career => (
                  <div key={career.id} className={styles.listRow}>
                    <div>
                      <div className={styles.listTitle}>
                        {career.career?.name || career.careerId}
                      </div>
                      <div className={styles.listMeta}>
                        Level {career.level} · {career.experience} XP
                      </div>
                    </div>
                    {career.active ? (
                      <span className={styles.badge}>Active</span>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>
          <section className={styles.card}>
            <div className={styles.cardTitle}>Licenses &amp; Exams</div>
            <div className={styles.list}>
              {licenses.length === 0 ? (
                <div className={styles.emptyState}>No licenses issued yet.</div>
              ) : (
                licenses.slice(0, 4).map(license => (
                  <div key={license.id} className={styles.listRow}>
                    <div>
                      <div className={styles.listTitle}>
                        {license.licenseKey}
                      </div>
                      <div className={styles.listMeta}>
                        {license.status} ·{' '}
                        {license.expiresAt
                          ? new Date(license.expiresAt).toLocaleDateString()
                          : 'no expiry'}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div className={styles.listTitle}>Available Exams</div>
              {exams.length === 0 ? (
                <div className={styles.emptyState}>No exams published.</div>
              ) : (
                exams.slice(0, 4).map(exam => (
                  <div key={exam.id} className={styles.listRow}>
                    <div>
                      <div className={styles.listTitle}>{exam.name}</div>
                      <div className={styles.listMeta}>
                        {exam.description || 'Exam'} · Pass {exam.minScore}%
                      </div>
                    </div>
                    <Link href="/sim" className={styles.secondaryButton}>
                      Launch
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>
          <section className={styles.card}>
            <div className={styles.cardTitle}>Reputation</div>
            <div className={styles.list}>
              {reputation.length === 0 ? (
                <div className={styles.emptyState}>No reputation data yet.</div>
              ) : (
                reputation.slice(0, 5).map(item => (
                  <div key={item.id} className={styles.listRow}>
                    <div>
                      <div className={styles.listTitle}>
                        {item.scopeType} · {item.scopeId}
                      </div>
                      <div className={styles.listMeta}>
                        Standing {item.value.toFixed(1)}
                      </div>
                    </div>
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
