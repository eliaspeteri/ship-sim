import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getApiBase } from '../lib/api';
import {
  ECONOMY_CONTEXTS,
  ECONOMY_DEFAULT_CONTEXT,
  isEconomyContext,
} from '../features/economy/economyContexts';
import EconomyHeader from '../features/economy/components/EconomyHeader';
import EconomySidebar from '../features/economy/components/EconomySidebar';
import FinancesSection from '../features/economy/sections/FinancesSection';
import FleetSection from '../features/economy/sections/FleetSection';
import ShipyardSection from '../features/economy/sections/ShipyardSection';
import PortMarketSection from '../features/economy/sections/PortMarketSection';
import LoansSection from '../features/economy/sections/LoansSection';
import InsuranceSection from '../features/economy/sections/InsuranceSection';
import InsuranceHistorySection from '../features/economy/sections/InsuranceHistorySection';
import MissionsSection from '../features/economy/sections/MissionsSection';
import CareersSection from '../features/economy/sections/CareersSection';
import LicensesSection from '../features/economy/sections/LicensesSection';
import ReputationSection from '../features/economy/sections/ReputationSection';
import type {
  CargoLot,
  CareerStatus,
  EconomyDashboard,
  Exam,
  License,
  PassengerContract,
  Reputation,
  SpaceSummary,
  VesselCatalogEntry,
} from '../features/economy/types';

const EconomyPage = () => {
  const apiBase = useMemo(() => getApiBase(), []);
  const router = useRouter();
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
  const [activeContext, setActiveContext] = React.useState(
    ECONOMY_DEFAULT_CONTEXT,
  );

  const portNameById = React.useMemo(() => {
    if (!dashboard) return new Map<string, string>();
    return new Map(dashboard.ports.map(port => [port.id, port.name]));
  }, [dashboard]);

  const spaceOptions = React.useMemo(() => {
    const options = new Map<string, string>();
    spaces.forEach(space => {
      options.set(space.id, space.name || space.id);
    });
    if (!options.has('global')) {
      options.set('global', 'Global');
    }
    return Array.from(options.entries()).map(([id, label]) => ({
      id,
      label,
    }));
  }, [spaces]);

  const selectedPortName = React.useMemo(() => {
    if (!dashboard) return 'Select a port';
    return (
      dashboard.currentPort?.name ||
      dashboard.ports.find(port => port.id === selectedPortId)?.name ||
      'Select a port'
    );
  }, [dashboard, selectedPortId]);

  const handleContextChange = React.useCallback((nextId: string) => {
    const next = isEconomyContext(nextId) ? nextId : ECONOMY_DEFAULT_CONTEXT;
    setActiveContext(next);
    if (typeof window !== 'undefined') {
      const nextHash = `#${next}`;
      if (window.location.hash !== nextHash) {
        window.location.hash = next;
      }
    }
  }, []);

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
  }, [apiBase]);

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
      } catch {
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
  }, [apiBase, selectedPortId, selectedVesselId]);

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
  }, [apiBase, selectedPortId, selectedVesselId]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && isEconomyContext(hash)) {
        setActiveContext(hash);
      } else {
        setActiveContext(ECONOMY_DEFAULT_CONTEXT);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  React.useEffect(() => {
    if (!router.isReady) return;
    const hash = router.asPath.split('#')[1];
    if (hash && isEconomyContext(hash)) {
      setActiveContext(hash);
    }
  }, [router.asPath, router.isReady]);

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
      const res = await fetch(`${apiBase}/api/economy/passengers/accept`, {
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

  const handleSelectVessel = (next: string | null) => {
    setSelectedVesselId(next);
    if (typeof window !== 'undefined') {
      if (next) {
        sessionStorage.setItem('ship-sim-active-vessel', next);
      } else {
        sessionStorage.removeItem('ship-sim-active-vessel');
      }
    }
  };

  const renderContext = () => {
    if (!dashboard) return null;
    switch (activeContext) {
      case 'shipyard':
        return (
          <ShipyardSection
            catalog={catalog}
            selectedPortName={selectedPortName}
            shopNotice={shopNotice}
            onShipyardAction={(...args) => {
              void handleShipyardAction(...args);
            }}
          />
        );
      case 'fleet':
        return (
          <FleetSection
            dashboard={dashboard}
            selectedVesselId={selectedVesselId}
            onSelectVessel={handleSelectVessel}
            onEndLease={leaseId => {
              void handleEndLease(leaseId);
            }}
          />
        );
      case 'finances':
        return <FinancesSection dashboard={dashboard} />;
      case 'port-market':
        return (
          <PortMarketSection
            dashboard={dashboard}
            selectedPortId={selectedPortId}
            onSelectPort={setSelectedPortId}
            cargo={cargo}
            cargoMeta={cargoMeta}
            passengers={passengers}
            passengerMeta={passengerMeta}
            portNameById={portNameById}
            actionNotice={actionNotice}
            onAssignCargo={(...args) => {
              void handleAssignCargo(...args);
            }}
            onAcceptPassengers={(...args) => {
              void handleAcceptPassengers(...args);
            }}
          />
        );
      case 'loans':
        return <LoansSection dashboard={dashboard} />;
      case 'insurance':
        return <InsuranceSection dashboard={dashboard} />;
      case 'insurance-history':
        return <InsuranceHistorySection />;
      case 'missions':
        return <MissionsSection dashboard={dashboard} />;
      case 'careers':
        return <CareersSection careers={careers} />;
      case 'licenses':
        return <LicensesSection licenses={licenses} exams={exams} />;
      case 'reputation':
        return <ReputationSection reputation={reputation} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-[80px] pt-8 text-[var(--ink)]">
      <EconomyHeader
        spaceId={spaceId}
        spaceOptions={spaceOptions}
        onSpaceChange={setSpaceId}
        actions={
          <Link
            href="/spaces"
            className="rounded-[10px] border border-[rgba(97,137,160,0.35)] bg-[rgba(12,28,44,0.7)] px-4 py-2 text-[12px] font-semibold text-[rgba(235,245,250,0.9)]"
          >
            Browse Spaces
          </Link>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-[calc(var(--nav-height,0px)+24px)] lg:self-start">
          <EconomySidebar
            contexts={ECONOMY_CONTEXTS}
            activeId={activeContext}
            onSelect={handleContextChange}
          />
        </div>
        <div className="space-y-6">
          {loading ? (
            <div className="rounded-[14px] border border-[rgba(97,137,160,0.35)] bg-[rgba(8,18,30,0.6)] px-4 py-3 text-[12px] text-[rgba(170,192,202,0.7)]">
              Loading economy dashboard...
            </div>
          ) : null}
          {error ? (
            <div className="rounded-[14px] border border-[rgba(145,40,32,0.6)] bg-[rgba(52,18,22,0.7)] px-4 py-3 text-[12px] text-[#f7d9d3]">
              {error}
            </div>
          ) : null}
          {!loading && dashboard ? renderContext() : null}
        </div>
      </div>
    </div>
  );
};

export default EconomyPage;
