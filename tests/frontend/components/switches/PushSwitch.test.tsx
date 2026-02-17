import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { PushSwitch } from '../../../../src/components/switches/PushSwitch';

describe('PushSwitch', () => {
  it('renders label and toggles on click', () => {
    const onToggle = jest.fn();
    const { container } = render(
      <PushSwitch isActive={false} onToggle={onToggle} label="Alarm">
        A
      </PushSwitch>,
    );

    expect(screen.getByText('Alarm')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();

    const svg = container.querySelector('svg') as SVGElement;
    fireEvent.click(svg);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('does not toggle when disabled', () => {
    const onToggle = jest.fn();
    const { container } = render(
      <PushSwitch
        isActive={false}
        onToggle={onToggle}
        disabled
        label="Alarm"
      />,
    );

    const svg = container.querySelector('svg') as SVGElement;
    fireEvent.click(svg);
    expect(onToggle).not.toHaveBeenCalled();
  });
});
