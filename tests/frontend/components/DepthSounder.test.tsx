import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import DepthSounder from '../../../src/components/DepthSounder';

describe('DepthSounder', () => {
  it('renders depth readout and responds to controls', () => {
    render(<DepthSounder depth={12} units="m" />);

    expect(screen.getByText('12.0')).toBeInTheDocument();
    expect(screen.getByText(/R:100m/)).toBeInTheDocument();
    expect(screen.getByText(/G:5/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'RANGE' }));
    expect(screen.getByText(/R:200m/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'SHIFT ▼' }));
    expect(screen.getByText(/S:20m/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'GAIN ▲' }));
    expect(screen.getByText(/G:6/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ZOOM' }));
    expect(screen.getByText('ZOOM', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SHIFT ▲' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'SHIFT ▼' })).toBeDisabled();
  });
});
