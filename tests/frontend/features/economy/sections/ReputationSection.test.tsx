import { render, screen } from '@testing-library/react';
import React from 'react';

import ReputationSection from '../../../../../src/features/economy/sections/ReputationSection';

describe('ReputationSection', () => {
  it('renders empty state', () => {
    render(<ReputationSection reputation={[]} />);

    expect(screen.getByText('Reputation')).toBeInTheDocument();
    expect(screen.getByText('No reputation data yet.')).toBeInTheDocument();
  });

  it('renders reputation entries', () => {
    render(
      <ReputationSection
        reputation={[
          { id: 'r1', scopeType: 'port', scopeId: 'alpha', value: 3.2 },
        ]}
      />,
    );

    expect(screen.getByText('port · alpha')).toBeInTheDocument();
    expect(screen.getByText('Standing 3.2')).toBeInTheDocument();
  });
});
