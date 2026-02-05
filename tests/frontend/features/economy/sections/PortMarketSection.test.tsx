import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PortMarketSection from '../../../../../src/features/economy/sections/PortMarketSection';

describe('PortMarketSection', () => {
  const dashboard = {
    profile: { rank: 1, experience: 0, credits: 0, safetyScore: 10 },
    currentPort: { id: 'p1', name: 'Port Alpha' },
    ports: [
      { id: 'p1', name: 'Port Alpha', listedCargo: 2, listedPassengers: 1 },
      { id: 'p2', name: 'Port Beta', listedCargo: 0, listedPassengers: 0 },
    ],
    fleet: [],
    loans: [],
    insurance: [],
    leases: [],
    sales: [],
    missions: [],
  };

  it('handles port selection and cargo/passenger actions', () => {
    const onSelectPort = jest.fn();
    const onAssignCargo = jest.fn();
    const onAcceptPassengers = jest.fn();
    const portNameById = new Map([['p2', 'Port Beta']]);

    render(
      <PortMarketSection
        dashboard={dashboard}
        selectedPortId="p1"
        onSelectPort={onSelectPort}
        cargo={[
          {
            id: 'c1',
            description: 'Machinery',
            value: 200,
            weightTons: 5,
            destinationPortId: 'p2',
            status: 'listed',
          },
        ]}
        cargoMeta={{ capacityTons: 10, loadedTons: 2 }}
        passengers={[
          {
            id: 'pc1',
            originPortId: 'p1',
            destinationPortId: 'p2',
            passengerType: 'vip',
            paxCount: 3,
            rewardCredits: 150,
            status: 'open',
          },
        ]}
        passengerMeta={{ capacity: 10, onboard: 1 }}
        portNameById={portNameById}
        actionNotice="Assigned"
        onAssignCargo={onAssignCargo}
        onAcceptPassengers={onAcceptPassengers}
      />,
    );

    fireEvent.click(screen.getByText('Port Beta'));
    expect(onSelectPort).toHaveBeenCalledWith('p2');

    fireEvent.click(screen.getByRole('button', { name: 'Load' }));
    expect(onAssignCargo).toHaveBeenCalledWith('c1');

    fireEvent.click(screen.getByRole('button', { name: 'Board' }));
    expect(onAcceptPassengers).toHaveBeenCalledWith('pc1');

    expect(screen.getByText('You are here')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
  });

  it('renders empty states', () => {
    render(
      <PortMarketSection
        dashboard={{ ...dashboard, currentPort: null }}
        selectedPortId="p2"
        onSelectPort={jest.fn()}
        cargo={[]}
        cargoMeta={{}}
        passengers={[]}
        passengerMeta={{}}
        portNameById={new Map()}
        actionNotice={null}
        onAssignCargo={jest.fn()}
        onAcceptPassengers={jest.fn()}
      />,
    );

    expect(
      screen.getByText('No cargo listed for this port.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No passenger requests available.'),
    ).toBeInTheDocument();
  });
});
