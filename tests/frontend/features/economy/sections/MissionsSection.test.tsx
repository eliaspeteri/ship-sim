import React from 'react';
import { render, screen } from '@testing-library/react';
import MissionsSection from '../../../../../src/features/economy/sections/MissionsSection';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('MissionsSection', () => {
  it('renders empty state', () => {
    render(
      <MissionsSection
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

    expect(screen.getByText('Missions & Contracts')).toBeInTheDocument();
    expect(
      screen.getByText('No missions available for this space.'),
    ).toBeInTheDocument();
  });

  it('renders mission entries', () => {
    render(
      <MissionsSection
        dashboard={{
          profile: { rank: 1, experience: 0, credits: 0, safetyScore: 10 },
          currentPort: null,
          ports: [],
          fleet: [],
          loans: [],
          insurance: [],
          leases: [],
          sales: [],
          missions: [
            {
              id: 'm1',
              name: 'Deliver Supplies',
              rewardCredits: 500,
              requiredRank: 2,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Deliver Supplies')).toBeInTheDocument();
    expect(screen.getByText(/Reward 500 cr/)).toBeInTheDocument();
    expect(screen.getByText('View in Sim')).toBeInTheDocument();
  });
});
