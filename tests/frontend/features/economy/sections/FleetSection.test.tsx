import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import FleetSection from '../../../../../src/features/economy/sections/FleetSection';
import type { EconomyDashboard } from '../../../../../src/features/economy/types';

const buildDashboard = (overrides: Partial<EconomyDashboard> = {}) => ({
  profile: { rank: 1, experience: 0, credits: 0, safetyScore: 10 },
  currentPort: null,
  ports: [],
  fleet: [],
  loans: [],
  insurance: [],
  leases: [],
  sales: [],
  missions: [],
  ...overrides,
});

describe('FleetSection', () => {
  it('renders empty states', () => {
    render(
      <FleetSection
        dashboard={buildDashboard()}
        selectedVesselId={null}
        onSelectVessel={jest.fn()}
        onEndLease={jest.fn()}
      />,
    );

    expect(
      screen.getByText('No fleet vessels yet. Create one in the simulator.'),
    ).toBeInTheDocument();
    expect(screen.getByText('No lease activity.')).toBeInTheDocument();
    expect(screen.getByText('No vessel sales.')).toBeInTheDocument();
    expect(screen.getByText('No vessels')).toBeInTheDocument();
  });

  it('renders fleet entries and handles actions', () => {
    const onSelectVessel = jest.fn();
    const onEndLease = jest.fn();
    render(
      <FleetSection
        dashboard={buildDashboard({
          fleet: [
            {
              id: 'v-1',
              status: 'active',
              spaceId: 'space-1',
              lastUpdate: '2024-01-01T00:00:00Z',
            },
          ],
          leases: [
            {
              id: 'l-1',
              vesselId: 'v-1',
              type: 'charter',
              status: 'active',
              ratePerHour: 12,
              revenueShare: 0.1,
            },
          ],
          sales: [
            {
              id: 's-1',
              vesselId: 'v-2',
              type: 'sale',
              status: 'listed',
              price: 100,
            },
          ],
        })}
        selectedVesselId={null}
        onSelectVessel={onSelectVessel}
        onEndLease={onEndLease}
      />,
    );

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'v-1' },
    });
    expect(onSelectVessel).toHaveBeenCalledWith('v-1');

    fireEvent.click(screen.getByRole('button', { name: 'End' }));
    expect(onEndLease).toHaveBeenCalledWith('l-1');

    expect(screen.getByText('sale · listed')).toBeInTheDocument();
  });
});
