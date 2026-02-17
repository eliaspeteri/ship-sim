import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { RudderLever } from '../../../src/components/RudderLever';

describe('RudderLever', () => {
  it('renders label, scale, and current value', () => {
    const onChange = jest.fn();
    render(
      <RudderLever
        value={10}
        min={-35}
        max={35}
        onChange={onChange}
        label="Rudder"
        scale={[
          { label: '-35', value: -35, major: true },
          { label: '0', value: 0, major: true },
          { label: '35', value: 35, major: true },
        ]}
      />,
    );

    expect(screen.getByText('Rudder')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('10.0°')).toBeInTheDocument();
  });

  it('resets to center on double click', () => {
    const onChange = jest.fn();
    const { container } = render(
      <RudderLever
        value={20}
        min={-40}
        max={40}
        onChange={onChange}
        label="Rudder"
        scale={[{ label: '0', value: 0, major: true }]}
      />,
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    fireEvent.doubleClick(svg!);
    const [[value]] = onChange.mock.calls;
    expect(value).toBeCloseTo(0);
  });
});
