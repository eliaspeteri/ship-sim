import { render, screen } from '@testing-library/react';
import React from 'react';

import { CircularGauge } from '../../../src/components/CircularGauge';

describe('CircularGauge', () => {
  it('renders label, value, unit, and min/max', () => {
    const { container } = render(
      <CircularGauge value={42} min={0} max={100} label="Speed" unit="kts" />,
    );

    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('kts')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(1);
  });

  it('uses warning and critical colors based on thresholds', () => {
    const { container, rerender } = render(
      <CircularGauge
        value={65}
        min={0}
        max={100}
        label="Temp"
        unit="C"
        warningThreshold={60}
        criticalThreshold={80}
      />,
    );

    const warningPath = container.querySelectorAll('path')[1];
    expect(warningPath).toHaveAttribute('stroke', '#ed8936');

    rerender(
      <CircularGauge
        value={90}
        min={0}
        max={100}
        label="Temp"
        unit="C"
        warningThreshold={60}
        criticalThreshold={80}
      />,
    );

    const criticalPath = container.querySelectorAll('path')[1];
    expect(criticalPath).toHaveAttribute('stroke', '#f56565');
  });
});
