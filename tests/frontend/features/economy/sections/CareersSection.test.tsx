import { render, screen } from '@testing-library/react';
import React from 'react';

import CareersSection from '../../../../../src/features/economy/sections/CareersSection';

describe('CareersSection', () => {
  it('renders empty state', () => {
    render(<CareersSection careers={[]} />);

    expect(screen.getByText('Careers')).toBeInTheDocument();
    expect(screen.getByText('No careers registered yet.')).toBeInTheDocument();
  });

  it('renders career entries with active badge', () => {
    render(
      <CareersSection
        careers={[
          {
            id: 'c1',
            careerId: 'pilot',
            level: 3,
            experience: 420,
            active: true,
            career: { id: 'pilot', name: 'Pilot' },
          },
        ]}
      />,
    );

    expect(screen.getByText('Pilot')).toBeInTheDocument();
    expect(screen.getByText('Level 3 · 420 XP')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
