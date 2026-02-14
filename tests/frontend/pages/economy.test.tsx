import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import EconomyPage from '../../../src/pages/economy';

const getApiBaseMock = jest.fn(() => 'http://api.test');
const useRouterMock = jest.fn(() => ({
  isReady: true,
  asPath: '/economy#shipyard',
}));

jest.mock('next/router', () => ({
  useRouter: () => useRouterMock(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

jest.mock('../../../src/lib/api', () => ({
  getApiBase: () => getApiBaseMock(),
}));

jest.mock('../../../src/features/economy/components/EconomyHeader', () => ({
  __esModule: true,
  default: ({ actions }: { actions?: React.ReactNode }) => (
    <div>
      <div>EconomyHeader</div>
      {actions}
    </div>
  ),
}));

jest.mock('../../../src/features/economy/components/EconomySidebar', () => ({
  __esModule: true,
  default: ({
    contexts,
    onSelect,
  }: {
    contexts: Array<{ id: string; label: string }>;
    onSelect: (id: string) => void;
  }) => (
    <div>
      {contexts.map(context => (
        <button
          key={context.id}
          type="button"
          onClick={() => onSelect(context.id)}
        >
          {context.label}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('../../../src/features/economy/sections/ShipyardSection', () => ({
  __esModule: true,
  default: ({
    onShipyardAction,
    shopNotice,
  }: {
    onShipyardAction: (
      templateId: string,
      action: 'purchase' | 'charter' | 'lease',
    ) => void;
    shopNotice?: string | null;
  }) => (
    <div>
      <div>ShipyardSection</div>
      {shopNotice ? <div>{shopNotice}</div> : null}
      <button
        type="button"
        onClick={() => onShipyardAction('tmpl-1', 'purchase')}
      >
        Purchase vessel
      </button>
    </div>
  ),
}));

jest.mock('../../../src/features/economy/sections/FleetSection', () => ({
  __esModule: true,
  default: ({ onEndLease }: { onEndLease: (leaseId: string) => void }) => (
    <div>
      <div>FleetSection</div>
      <button type="button" onClick={() => onEndLease('lease-1')}>
        End lease
      </button>
    </div>
  ),
}));

jest.mock('../../../src/features/economy/sections/PortMarketSection', () => ({
  __esModule: true,
  default: ({
    onAssignCargo,
    onAcceptPassengers,
    actionNotice,
  }: {
    onAssignCargo: (cargoId: string) => void;
    onAcceptPassengers: (contractId: string) => void;
    actionNotice?: string | null;
  }) => (
    <div>
      <div>PortMarketSection</div>
      {actionNotice ? <div>{actionNotice}</div> : null}
      <button type="button" onClick={() => onAssignCargo('cargo-1')}>
        Assign cargo
      </button>
      <button type="button" onClick={() => onAcceptPassengers('contract-1')}>
        Accept passengers
      </button>
    </div>
  ),
}));

jest.mock('../../../src/features/economy/sections/FinancesSection', () => ({
  __esModule: true,
  default: () => <div>FinancesSection</div>,
}));
jest.mock('../../../src/features/economy/sections/LoansSection', () => ({
  __esModule: true,
  default: () => <div>LoansSection</div>,
}));
jest.mock('../../../src/features/economy/sections/InsuranceSection', () => ({
  __esModule: true,
  default: () => <div>InsuranceSection</div>,
}));
jest.mock(
  '../../../src/features/economy/sections/InsuranceHistorySection',
  () => ({
    __esModule: true,
    default: () => <div>InsuranceHistorySection</div>,
  }),
);
jest.mock('../../../src/features/economy/sections/MissionsSection', () => ({
  __esModule: true,
  default: () => <div>MissionsSection</div>,
}));
jest.mock('../../../src/features/economy/sections/CareersSection', () => ({
  __esModule: true,
  default: () => <div>CareersSection</div>,
}));
jest.mock('../../../src/features/economy/sections/LicensesSection', () => ({
  __esModule: true,
  default: () => <div>LicensesSection</div>,
}));
jest.mock('../../../src/features/economy/sections/ReputationSection', () => ({
  __esModule: true,
  default: () => <div>ReputationSection</div>,
}));

describe('pages/economy', () => {
  beforeEach(() => {
    getApiBaseMock.mockReset();
    getApiBaseMock.mockReturnValue('http://api.test');
    useRouterMock.mockReset();
    useRouterMock.mockReturnValue({
      isReady: true,
      asPath: '/economy#shipyard',
    });
    (globalThis as any).fetch = jest.fn((url: string, init?: RequestInit) => {
      const method = init?.method || 'GET';
      if (url === 'http://api.test/api/economy/dashboard') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            fleet: [{ id: 'v1' }],
            ports: [{ id: 'port-1', name: 'Port One' }],
            currentPort: { id: 'port-1', name: 'Port One' },
          }),
        });
      }
      if (url === 'http://api.test/api/careers/status') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ careers: [] }),
        });
      }
      if (url === 'http://api.test/api/licenses') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ licenses: [] }),
        });
      }
      if (url === 'http://api.test/api/exams') {
        return Promise.resolve({ ok: true, json: async () => ({ exams: [] }) });
      }
      if (url === 'http://api.test/api/reputation') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ reputation: [] }),
        });
      }
      if (url === 'http://api.test/api/economy/vessels/catalog') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ vessels: [{ id: 'tmpl-1', name: 'Template' }] }),
        });
      }
      if (url === 'http://api.test/api/spaces') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ spaces: [{ id: 'global', name: 'Global' }] }),
        });
      }
      if (url.startsWith('http://api.test/api/economy/cargo?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ cargo: [], capacityTons: 10, loadedTons: 2 }),
        });
      }
      if (url.startsWith('http://api.test/api/economy/passengers?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ contracts: [], capacity: 25, onboard: 3 }),
        });
      }
      if (
        url === 'http://api.test/api/economy/vessels/purchase' &&
        method === 'POST'
      ) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (
        url === 'http://api.test/api/economy/leases/end' &&
        method === 'POST'
      ) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (
        url === 'http://api.test/api/economy/cargo/assign' &&
        method === 'POST'
      ) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (
        url === 'http://api.test/api/economy/passengers/accept' &&
        method === 'POST'
      ) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: `Unhandled ${method} ${url}` }),
      });
    });
  });

  it('loads dashboard, renders contexts, and performs key actions', async () => {
    const fetchMock = (globalThis as any).fetch as jest.Mock;
    render(<EconomyPage />);

    expect(screen.getByText('EconomyHeader')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Spaces' })).toHaveAttribute(
      'href',
      '/spaces',
    );

    await screen.findByText('ShipyardSection');

    fireEvent.click(screen.getByRole('button', { name: 'Purchase vessel' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/economy/vessels/purchase',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Company Fleet' }));
    await screen.findByText('FleetSection');
    fireEvent.click(screen.getByRole('button', { name: 'End lease' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/economy/leases/end',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Port Market' }));
    await screen.findByText('PortMarketSection');
    fireEvent.click(screen.getByRole('button', { name: 'Assign cargo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Accept passengers' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/economy/cargo/assign',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/economy/passengers/accept',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('shows guard notices when vessel or port selection is missing', async () => {
    const fetchMock = (globalThis as any).fetch as jest.Mock;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method || 'GET';
      if (url === 'http://api.test/api/economy/dashboard') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            fleet: [],
            ports: [],
            currentPort: null,
          }),
        });
      }
      if (
        [
          'http://api.test/api/careers/status',
          'http://api.test/api/licenses',
          'http://api.test/api/exams',
          'http://api.test/api/reputation',
          'http://api.test/api/economy/vessels/catalog',
          'http://api.test/api/spaces',
        ].includes(url)
      ) {
        const key = url.split('/').pop();
        return Promise.resolve({
          ok: true,
          json: async () =>
            key === 'catalog'
              ? { vessels: [] }
              : key === 'spaces'
                ? { spaces: [] }
                : { careers: [], licenses: [], exams: [], reputation: [] },
        });
      }
      if (url.startsWith('http://api.test/api/economy/cargo?')) {
        return Promise.resolve({ ok: true, json: async () => ({ cargo: [] }) });
      }
      if (url.startsWith('http://api.test/api/economy/passengers?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ contracts: [] }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: `Unhandled ${method} ${url}` }),
      });
    });

    render(<EconomyPage />);
    await screen.findByText('ShipyardSection');

    fireEvent.click(screen.getByRole('button', { name: 'Purchase vessel' }));
    expect(
      await screen.findByText('Select a port for delivery first.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Port Market' }));
    await screen.findByText('PortMarketSection');
    fireEvent.click(screen.getByRole('button', { name: 'Assign cargo' }));
    expect(
      await screen.findByText('Select a vessel to load cargo.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Accept passengers' }));
    expect(
      await screen.findByText('Select a vessel to board passengers.'),
    ).toBeInTheDocument();
  });

  it('surfaces server-side action errors to the UI notices', async () => {
    const fetchMock = (globalThis as any).fetch as jest.Mock;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method || 'GET';
      if (url === 'http://api.test/api/economy/dashboard') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            fleet: [{ id: 'v1' }],
            ports: [{ id: 'port-1', name: 'Port One' }],
            currentPort: { id: 'port-1', name: 'Port One' },
          }),
        });
      }
      if (
        [
          'http://api.test/api/careers/status',
          'http://api.test/api/licenses',
          'http://api.test/api/exams',
          'http://api.test/api/reputation',
          'http://api.test/api/economy/vessels/catalog',
          'http://api.test/api/spaces',
        ].includes(url)
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ careers: [], licenses: [], exams: [], reputation: [], vessels: [], spaces: [] }),
        });
      }
      if (url.startsWith('http://api.test/api/economy/cargo?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ cargo: [], capacityTons: 5, loadedTons: 0 }),
        });
      }
      if (url.startsWith('http://api.test/api/economy/passengers?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ contracts: [], capacity: 2, onboard: 0 }),
        });
      }
      if (
        url === 'http://api.test/api/economy/vessels/purchase' &&
        method === 'POST'
      ) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Purchase denied' }),
        });
      }
      if (
        url === 'http://api.test/api/economy/cargo/assign' &&
        method === 'POST'
      ) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Cargo denied' }),
        });
      }
      if (
        url === 'http://api.test/api/economy/passengers/accept' &&
        method === 'POST'
      ) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Passenger denied' }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: `Unhandled ${method} ${url}` }),
      });
    });

    render(<EconomyPage />);
    await screen.findByText('ShipyardSection');

    fireEvent.click(screen.getByRole('button', { name: 'Purchase vessel' }));
    expect(await screen.findByText('Purchase denied')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Port Market' }));
    await screen.findByText('PortMarketSection');
    fireEvent.click(screen.getByRole('button', { name: 'Assign cargo' }));
    expect(await screen.findByText('Cargo denied')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Accept passengers' }));
    expect(await screen.findByText('Passenger denied')).toBeInTheDocument();
  });
});
