import { render, screen } from '@testing-library/react';
import React from 'react';

import WindIndicator from '../../../src/components/WindIndicator';

describe('WindIndicator', () => {
  it('renders wind speed, direction, and Beaufort force', () => {
    render(<WindIndicator direction={90} speedKnots={12} size={240} />);

    expect(screen.getByText('WIND')).toBeInTheDocument();
    expect(screen.getByText('12.0 kt')).toBeInTheDocument();
    expect(screen.getByText(/90°\s*E/)).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('normalizes negative directions to cardinal labels', () => {
    render(<WindIndicator direction={-45} speedKnots={4} size={200} />);

    expect(screen.getByText(/315°\s*NW/)).toBeInTheDocument();
  });
});
