import React from 'react';
import { render, screen } from '@testing-library/react';
import InsuranceSection from '../../../../../src/features/economy/sections/InsuranceSection';

describe('InsuranceSection', () => {
  it('renders empty state', () => {
    render(
      <InsuranceSection
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

    expect(screen.getByText('Insurance')).toBeInTheDocument();
    expect(screen.getByText('No active policies.')).toBeInTheDocument();
  });

  it('renders policies', () => {
    render(
      <InsuranceSection
        dashboard={{
          profile: { rank: 1, experience: 0, credits: 0, safetyScore: 10 },
          currentPort: null,
          ports: [],
          fleet: [],
          loans: [],
          insurance: [
            {
              id: 'p1',
              vesselId: 'v-1',
              type: 'hull',
              premiumRate: 12,
              status: 'active',
            },
          ],
          leases: [],
          sales: [],
          missions: [],
        }}
      />,
    );

    expect(screen.getByText('hull policy')).toBeInTheDocument();
    expect(screen.getByText('12 cr/hr · active')).toBeInTheDocument();
    expect(screen.getByText('Vessel v-1')).toBeInTheDocument();
  });
});
