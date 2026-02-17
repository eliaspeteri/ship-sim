import { render, screen } from '@testing-library/react';
import React from 'react';

import { HelmControl } from '../../../src/components/HelmControl';

describe('HelmControl', () => {
  it('renders label, value, and indicator arcs', () => {
    const onChange = jest.fn();
    const { container } = render(
      <HelmControl value={10} onChange={onChange} size={180} />,
    );

    expect(screen.getByText('Rudder Angle')).toBeInTheDocument();
    expect(screen.getByText('10.0°')).toBeInTheDocument();

    const arcs = container.querySelectorAll('path');
    expect(arcs.length).toBe(2);
    expect(arcs[0]).toHaveAttribute('stroke', '#EF4444');
    expect(arcs[1]).toHaveAttribute('stroke', '#10B981');
  });
});
