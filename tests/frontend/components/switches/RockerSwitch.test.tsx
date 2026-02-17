import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { RockerSwitch } from '../../../../src/components/switches/RockerSwitch';

describe('RockerSwitch', () => {
  it('renders label and toggles on click', () => {
    const onToggle = jest.fn();
    const { container } = render(
      <RockerSwitch isActive={false} onToggle={onToggle} label="Nav">
        N
      </RockerSwitch>,
    );

    expect(screen.getByText('Nav')).toBeInTheDocument();
    expect(screen.getByText('N')).toBeInTheDocument();

    const svg = container.querySelector('svg') as SVGElement;
    fireEvent.click(svg);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('renders bar indicator when enabled', () => {
    const { container } = render(
      <RockerSwitch
        isActive
        onToggle={jest.fn()}
        useBarIndicator
        activeColor="#ff0000"
      />,
    );

    const rects = container.querySelectorAll('rect');
    const hasActive = Array.from(rects).some(
      rect => rect.getAttribute('fill') === '#ff0000',
    );
    expect(hasActive).toBe(true);
  });
});
