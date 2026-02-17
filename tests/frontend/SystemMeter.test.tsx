/// <reference types="@testing-library/jest-dom" />
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';

import { SystemMeter } from '../../src/components/SystemMeter';

afterEach(cleanup);

describe('SystemMeter', () => {
  it('renders label and value', () => {
    render(<SystemMeter label="Engine RPM" value="1200" />);
    expect(screen.getByText('Engine RPM')).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
  });

  it('renders detail when provided', () => {
    render(<SystemMeter label="Fuel" value="75%" detail="Remaining" />);
    expect(screen.getByText('Remaining')).toBeInTheDocument();
  });

  it('does not render detail when not provided', () => {
    render(<SystemMeter label="Fuel" value="75%" />);
    expect(screen.queryByText('Remaining')).not.toBeInTheDocument();
  });

  it('renders progress bar when percent is provided', () => {
    render(<SystemMeter label="Fuel" value="75%" percent={0.75} />);
    const meterFill = document.querySelector('[style*="width: 75%"]');
    expect(meterFill).toBeInTheDocument();
  });

  it('does not render progress bar when percent is not provided', () => {
    render(<SystemMeter label="Fuel" value="75%" />);
    const meterFill = document.querySelector('[style*="width"]');
    expect(meterFill).toBeNull();
  });

  it('clamps percent to 0-1 range', () => {
    render(<SystemMeter label="Test" value="100%" percent={1.5} />);
    const meterFill = document.querySelector('[style*="width: 100%"]');
    expect(meterFill).toBeInTheDocument();
  });

  it('applies danger class for low values', () => {
    render(<SystemMeter label="Test" value="10%" percent={0.1} />);
    const meterFill = document.querySelector('.meterFill');
    expect(meterFill).toHaveClass('meterFillDanger');
  });

  it('applies warn class for medium values', () => {
    render(<SystemMeter label="Test" value="25%" percent={0.25} />);
    const meterFill = document.querySelector('.meterFill');
    expect(meterFill).toHaveClass('meterFillWarn');
  });

  it('applies ok class for high values', () => {
    render(<SystemMeter label="Test" value="50%" percent={0.5} />);
    const meterFill = document.querySelector('.meterFill');
    expect(meterFill).toHaveClass('meterFillOk');
  });
});
