/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import Thermometer from '../../src/components/Thermometer';

afterEach(cleanup);

describe('Thermometer', () => {
  it('renders with default props', () => {
    render(<Thermometer value={50} />);
    expect(screen.getByText('50.0°')).toBeInTheDocument();
    expect(screen.getByText('Temp')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<Thermometer value={25} label="Custom" />);
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('25.0°')).toBeInTheDocument();
  });

  it('renders with default label when not provided', () => {
    render(<Thermometer value={75} />);
    expect(screen.getByText('Temp')).toBeInTheDocument();
    expect(screen.getByText('75.0°')).toBeInTheDocument();
  });

  it('renders value above max', () => {
    render(<Thermometer value={150} min={0} max={100} />);
    expect(screen.getByText('150.0°')).toBeInTheDocument();
  });

  it('handles negative values', () => {
    render(<Thermometer value={-10} min={-20} max={20} />);
    expect(screen.getByText('-10.0°')).toBeInTheDocument();
  });

  it('renders ticks', () => {
    render(<Thermometer value={50} min={0} max={100} numTicks={5} />);
    // Check that SVG is rendered
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders labeled scale when enabled', () => {
    render(<Thermometer value={50} min={0} max={100} labeledScale />);
    // Check for tick labels
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('does not render labeled scale when disabled', () => {
    render(<Thermometer value={50} min={0} max={100} labeledScale={false} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('applies custom dimensions', () => {
    render(<Thermometer value={50} width={50} height={200} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '70'); // width + 20
    expect(svg).toHaveAttribute('height', '200');
  });
});
