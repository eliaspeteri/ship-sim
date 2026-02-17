/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';

import { ControlLever } from '../../src/components/ControlLever';

afterEach(cleanup);

describe('ControlLever', () => {
  it('renders with horizontal orientation by default', () => {
    render(
      <ControlLever
        value={50}
        min={0}
        max={100}
        onChange={() => {}}
        label="Test Lever"
      />,
    );
    expect(screen.getByText('Test Lever')).toBeInTheDocument();
    expect(screen.getByText('50.00')).toBeInTheDocument();
  });

  it('renders with vertical orientation', () => {
    render(
      <ControlLever
        value={25}
        min={0}
        max={100}
        onChange={() => {}}
        vertical={true}
        label="Vertical Lever"
      />,
    );
    expect(screen.getByText('Vertical Lever')).toBeInTheDocument();
    expect(screen.getByText('25.00')).toBeInTheDocument();
  });

  it('renders with scale markings', () => {
    const scale = [
      { label: '0', value: 0 },
      { label: '50', value: 50 },
      { label: '100', value: 100 },
    ];
    render(
      <ControlLever
        value={50}
        min={0}
        max={100}
        onChange={() => {}}
        label="Scaled Lever"
        scale={scale}
      />,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('calls onChange when dragged', () => {
    const mockOnChange = jest.fn();
    render(
      <ControlLever
        value={50}
        min={0}
        max={100}
        onChange={mockOnChange}
        label="Draggable Lever"
      />,
    );

    const lever = screen
      .getByText('50.00')
      .parentElement?.previousElementSibling?.querySelector('.w-8.h-8');
    expect(lever).toBeInTheDocument();

    if (lever) {
      fireEvent.mouseDown(lever, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(document, { clientX: 120, clientY: 100 });
      fireEvent.mouseUp(document);

      expect(mockOnChange).toHaveBeenCalled();
    }
  });

  it('displays value correctly', () => {
    render(
      <ControlLever
        value={75.5}
        min={0}
        max={100}
        onChange={() => {}}
        label="Value Test"
      />,
    );
    expect(screen.getByText('75.50')).toBeInTheDocument();
  });
});
