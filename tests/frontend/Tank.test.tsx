/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { Tank } from '../../src/components/Tank';

afterEach(cleanup);

describe('Tank', () => {
  it('renders an SVG element', () => {
    render(<Tank x={0} y={0} level={0.5} />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Tank x={0} y={0} level={0.5} label="Fuel Tank" />);
    expect(screen.getByText('Fuel Tank')).toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    render(<Tank x={0} y={0} level={0.5} />);
    expect(screen.queryByText('Fuel Tank')).not.toBeInTheDocument();
  });

  it('applies custom size', () => {
    render(<Tank x={0} y={0} level={0.5} size={80} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '80');
    expect(svg).toHaveAttribute('height', '80');
  });

  it('renders needle with correct rotation for level', () => {
    render(<Tank x={0} y={0} level={0.5} />);
    // Level 0.5 should be 225 + 0.5 * 270 = 225 + 135 = 360 degrees
    const needle = document.querySelector('line[stroke="red"]');
    expect(needle).toBeInTheDocument();
    expect(needle).toHaveAttribute(
      'transform',
      expect.stringContaining('rotate(360'),
    );
  });

  it('handles level 0', () => {
    render(<Tank x={0} y={0} level={0} />);
    const needle = document.querySelector('line[stroke="red"]');
    expect(needle).toHaveAttribute(
      'transform',
      expect.stringContaining('rotate(225'),
    );
  });

  it('handles level 1', () => {
    render(<Tank x={0} y={0} level={1} />);
    const needle = document.querySelector('line[stroke="red"]');
    expect(needle).toHaveAttribute(
      'transform',
      expect.stringContaining('rotate(495'),
    );
  });

  it('applies custom color', () => {
    render(<Tank x={0} y={0} level={0.5} color="#00ff00" />);
    const needle = document.querySelector('line[stroke="#00ff00"]');
    expect(needle).toBeInTheDocument();
  });
});
