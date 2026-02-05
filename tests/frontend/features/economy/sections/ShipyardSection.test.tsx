import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ShipyardSection from '../../../../../src/features/economy/sections/ShipyardSection';

describe('ShipyardSection', () => {
  it('renders empty state', () => {
    render(
      <ShipyardSection
        catalog={[]}
        selectedPortName="Port Alpha"
        shopNotice={null}
        onShipyardAction={jest.fn()}
      />,
    );

    expect(screen.getByText('Shipyard')).toBeInTheDocument();
    expect(screen.getByText('Port Alpha')).toBeInTheDocument();
    expect(
      screen.getByText('No vessel listings available.'),
    ).toBeInTheDocument();
  });

  it('renders listings and triggers actions', () => {
    const onShipyardAction = jest.fn();
    render(
      <ShipyardSection
        catalog={[
          {
            id: 't1',
            name: 'Workboat',
            description: 'Compact',
            shipType: 'work',
            properties: {
              mass: 10,
              length: 12,
              beam: 4,
              draft: 1.5,
              blockCoefficient: 0.6,
              maxSpeed: 18,
            },
            capacities: { cargoTons: 2, passengers: 4 },
            commerce: {
              purchasePrice: 1000,
              charterRatePerHour: 15,
              leaseRatePerHour: 12,
            },
            tags: ['utility'],
          },
        ]}
        selectedPortName="Port Alpha"
        shopNotice="Inventory updated."
        onShipyardAction={onShipyardAction}
      />,
    );

    expect(screen.getByText('Workboat')).toBeInTheDocument();
    expect(screen.getByText('Inventory updated.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Buy/ }));
    expect(onShipyardAction).toHaveBeenCalledWith('t1', 'purchase');
    fireEvent.click(screen.getByRole('button', { name: /Charter/ }));
    expect(onShipyardAction).toHaveBeenCalledWith('t1', 'charter');
    fireEvent.click(screen.getByRole('button', { name: /Lease/ }));
    expect(onShipyardAction).toHaveBeenCalledWith('t1', 'lease');
  });
});
