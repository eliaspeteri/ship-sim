/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { CompassRose } from '../../src/components/CompassRose';

afterEach(cleanup);

describe('CompassRose', () => {
  it('renders an SVG element', () => {
    render(<CompassRose heading={0} />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies default size of 200', () => {
    render(<CompassRose heading={0} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '200');
    expect(svg).toHaveAttribute('height', '200');
  });

  it('applies custom size', () => {
    render(<CompassRose heading={0} size={300} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '300');
    expect(svg).toHaveAttribute('height', '300');
  });

  it('renders degree markings', () => {
    render(<CompassRose heading={0} />);
    expect(screen.getAllByText('360').length).toBeGreaterThan(0);
    expect(screen.getAllByText('90').length).toBeGreaterThan(0);
    expect(screen.getAllByText('180').length).toBeGreaterThan(0);
    expect(screen.getAllByText('270').length).toBeGreaterThan(0);
  });

  it('handles different heading values', () => {
    const { rerender } = render(<CompassRose heading={Math.PI / 2} />); // 90 degrees
    expect(document.querySelector('svg')).toBeInTheDocument();

    rerender(<CompassRose heading={Math.PI} />); // 180 degrees
    expect(document.querySelector('svg')).toBeInTheDocument();

    rerender(<CompassRose heading={0} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
