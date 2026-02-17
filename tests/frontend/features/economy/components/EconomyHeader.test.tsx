import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import EconomyHeader from '../../../../../src/features/economy/components/EconomyHeader';

describe('EconomyHeader', () => {
  it('renders header copy and handles space changes', () => {
    const onSpaceChange = jest.fn();
    render(
      <EconomyHeader
        spaceId="space-1"
        spaceOptions={[
          { id: 'space-1', label: 'Harbor' },
          { id: 'space-2', label: 'Offshore' },
        ]}
        onSpaceChange={onSpaceChange}
        actions={<button type="button">Refresh</button>}
      />,
    );

    expect(screen.getByText('Company Operations')).toBeInTheDocument();
    expect(screen.getByText('Economy & Logistics')).toBeInTheDocument();
    expect(screen.getByText('Active Space')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'space-2' },
    });
    expect(onSpaceChange).toHaveBeenCalledWith('space-2');
  });
});
