import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import EconomySidebar from '../../../../../src/features/economy/components/EconomySidebar';

describe('EconomySidebar', () => {
  it('renders contexts and marks active entry', () => {
    const onSelect = jest.fn();
    render(
      <EconomySidebar
        contexts={[
          {
            id: 'fleet',
            label: 'Fleet',
            description: 'Ships and leases',
          },
          { id: 'finance', label: 'Finance' },
        ]}
        activeId="fleet"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('Operations')).toBeInTheDocument();
    expect(screen.getByText('Ships and leases')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Fleet Ships and leases' }),
    ).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('button', { name: 'Finance' }));
    expect(onSelect).toHaveBeenCalledWith('finance');
  });
});
