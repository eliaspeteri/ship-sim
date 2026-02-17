import { render, screen } from '@testing-library/react';
import React from 'react';

import InsuranceHistorySection from '../../../../../src/features/economy/sections/InsuranceHistorySection';

describe('InsuranceHistorySection', () => {
  it('renders empty history message', () => {
    render(<InsuranceHistorySection />);

    expect(screen.getByText('Insurance History')).toBeInTheDocument();
    expect(
      screen.getByText('No insurance history recorded yet.'),
    ).toBeInTheDocument();
  });
});
