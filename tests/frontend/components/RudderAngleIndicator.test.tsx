import { render, screen } from '@testing-library/react';
import React from 'react';

import RudderAngleIndicator from '../../../src/components/RudderAngleIndicator';

describe('RudderAngleIndicator', () => {
  it('renders port and starboard labels with clamped readout', () => {
    render(<RudderAngleIndicator angle={50} maxAngle={35} size={240} />);

    expect(screen.getByText('PORT')).toBeInTheDocument();
    expect(screen.getAllByText('STBD').length).toBeGreaterThan(0);
    expect(screen.getByText(/35\.0°\s*STBD/)).toBeInTheDocument();
  });

  it('shows port readout for negative angles', () => {
    render(<RudderAngleIndicator angle={-12} maxAngle={35} />);

    expect(screen.getByText(/12\.0°\s*PORT/)).toBeInTheDocument();
  });
});
