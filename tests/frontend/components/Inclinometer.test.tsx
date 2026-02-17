import { render, screen } from '@testing-library/react';
import React from 'react';

import Inclinometer from '../../../src/components/Inclinometer';

describe('Inclinometer', () => {
  it('clamps the needle rotation but displays the raw roll', () => {
    const { container } = render(<Inclinometer roll={60} maxAngle={40} />);

    expect(screen.getByText('60.0° Roll')).toBeInTheDocument();

    const needleGroup = container.querySelector('g[transform^="rotate"]');
    expect(needleGroup?.getAttribute('transform')).toContain('rotate(40');
  });

  it('renders tick labels for major angles', () => {
    render(<Inclinometer roll={0} maxAngle={20} />);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    expect(screen.getAllByText('20').length).toBeGreaterThan(0);
  });
});
