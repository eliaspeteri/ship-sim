import { render, screen } from '@testing-library/react';
import React from 'react';

import LoansSection from '../../../../../src/features/economy/sections/LoansSection';

describe('LoansSection', () => {
  it('renders empty state', () => {
    render(
      <LoansSection
        dashboard={{
          profile: { rank: 1, experience: 0, credits: 0, safetyScore: 10 },
          currentPort: null,
          ports: [],
          fleet: [],
          loans: [],
          insurance: [],
          leases: [],
          sales: [],
          missions: [],
        }}
      />,
    );

    expect(screen.getByText('Loans')).toBeInTheDocument();
    expect(screen.getByText('No active loans.')).toBeInTheDocument();
  });

  it('renders loans', () => {
    render(
      <LoansSection
        dashboard={{
          profile: { rank: 1, experience: 0, credits: 0, safetyScore: 10 },
          currentPort: null,
          ports: [],
          fleet: [],
          loans: [
            {
              id: 'loan-1',
              balance: 1200,
              status: 'active',
              dueAt: '2026-05-01T00:00:00Z',
            },
          ],
          insurance: [],
          leases: [],
          sales: [],
          missions: [],
        }}
      />,
    );

    expect(screen.getByText('Balance 1200 cr')).toBeInTheDocument();
    expect(screen.getByText('Status: active')).toBeInTheDocument();
    expect(screen.getByText(/Due/)).toBeInTheDocument();
  });
});
