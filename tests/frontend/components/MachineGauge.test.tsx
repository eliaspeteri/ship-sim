import { render, screen } from '@testing-library/react';
import React from 'react';

import { MachineGauge } from '../../../src/components/MachineGauge';

describe('MachineGauge', () => {
  it('renders label, value, unit, and meter attributes', () => {
    render(
      <MachineGauge
        value={42.2}
        min={0}
        max={100}
        label="Oil Pressure"
        unit="psi"
      />,
    );

    const meter = screen.getByRole('meter', {
      name: 'Oil Pressure: 42.2psi',
    });
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-valuenow', '42.2');

    expect(screen.getByText('Oil Pressure')).toBeInTheDocument();
    expect(screen.getByText('42.2psi')).toBeInTheDocument();
  });

  it('uses zones to color the value display and draws zone arcs', () => {
    const { container } = render(
      <MachineGauge
        value={75}
        min={0}
        max={100}
        label="Temp"
        unit="°C"
        zones={[
          { color: '#00ff00', min: 0, max: 60 },
          { color: '#ff0000', min: 60, max: 100 },
        ]}
      />,
    );

    const valueDisplay = screen.getByText('75.0°C');
    expect(valueDisplay).toHaveStyle({ color: 'rgb(255, 0, 0)' });

    const zonePaths = container.querySelectorAll('path');
    expect(zonePaths.length).toBe(2);
    expect(zonePaths[0]).toHaveAttribute('stroke', '#00ff00');
    expect(zonePaths[1]).toHaveAttribute('stroke', '#ff0000');
  });

  it('clamps aria-valuenow while preserving the displayed value', () => {
    render(
      <MachineGauge value={150} min={0} max={100} label="RPM" unit="rpm" />,
    );

    const meter = screen.getByRole('meter', { name: 'RPM: 150.0rpm' });
    expect(meter).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('150.0rpm')).toBeInTheDocument();
  });
});
