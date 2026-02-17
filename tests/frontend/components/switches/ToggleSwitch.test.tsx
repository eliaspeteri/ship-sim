import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { ToggleSwitch } from '../../../../src/components/switches/ToggleSwitch';

describe('ToggleSwitch', () => {
  it('renders label and toggles on click', () => {
    const onToggle = jest.fn();
    const { container } = render(
      <ToggleSwitch isOn={false} onToggle={onToggle} label="Engine" />,
    );

    expect(screen.getByText('Engine')).toBeInTheDocument();
    const svg = container.querySelector('svg') as SVGElement;
    fireEvent.click(svg);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('does not toggle when disabled', () => {
    const onToggle = jest.fn();
    const { container } = render(
      <ToggleSwitch isOn={false} onToggle={onToggle} disabled label="Engine" />,
    );

    const svg = container.querySelector('svg') as SVGElement;
    fireEvent.click(svg);
    expect(onToggle).not.toHaveBeenCalled();
  });
});
