import React from 'react';
import { render, screen } from '@testing-library/react';
import EconomySectionCard from '../../../../../src/features/economy/components/EconomySectionCard';

describe('EconomySectionCard', () => {
  it('renders title, actions, and children', () => {
    render(
      <EconomySectionCard
        title="Fleet"
        actions={<button type="button">Action</button>}
      >
        <div>Body</div>
      </EconomySectionCard>,
    );

    expect(screen.getByText('Fleet')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('renders children without header when no title/actions', () => {
    render(
      <EconomySectionCard>
        <div>Only body</div>
      </EconomySectionCard>,
    );

    expect(screen.getByText('Only body')).toBeInTheDocument();
  });
});
