import React from 'react';
import { render, screen } from '@testing-library/react';
import FinancesSection from '../../../../../src/features/economy/sections/FinancesSection';

describe('FinancesSection', () => {
  it('renders dashboard metrics', () => {
    render(
      <FinancesSection
        dashboard={{
          profile: {
            rank: 4,
            experience: 200,
            credits: 1500,
            safetyScore: 9.5,
          },
          currentPort: { id: 'p1', name: 'Harbor' },
          ports: [],
          fleet: [{ id: 'v-1', lastUpdate: new Date().toISOString() }],
          loans: [],
          insurance: [],
          leases: [],
          sales: [],
          missions: [],
        }}
      />,
    );

    expect(screen.getByText('Company Finances')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('9.50')).toBeInTheDocument();
    expect(screen.getByText('Harbor')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
