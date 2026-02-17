import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { EnhancedPump } from '../../../src/components/EnhancedPump';
import { useLeverDrag } from '../../../src/hooks/useLeverDrag';

jest.mock('../../../src/hooks/useLeverDrag');

const useLeverDragMock = useLeverDrag as jest.MockedFunction<
  typeof useLeverDrag
>;

describe('EnhancedPump', () => {
  beforeEach(() => {
    useLeverDragMock.mockReturnValue({
      value: 0.6,
      isDragging: false,
      handleMouseDown: jest.fn(),
      handleDoubleClick: jest.fn(),
    });
  });

  it('renders stopped status and label', () => {
    render(
      <EnhancedPump
        x={100}
        y={100}
        isRunning={false}
        onChange={jest.fn()}
        label="Bilge Pump"
      />,
    );

    expect(screen.getByText('STOPPED')).toBeInTheDocument();
    expect(screen.getByText('Bilge Pump')).toBeInTheDocument();
  });

  it('toggles details panel on click', () => {
    const { container } = render(
      <EnhancedPump x={100} y={100} isRunning onChange={jest.fn()} />,
    );

    const svg = container.querySelector('svg') as SVGElement;
    fireEvent.click(svg);
    expect(screen.getByText('PUMP DIAGNOSTIC DATA')).toBeInTheDocument();
    fireEvent.click(svg);
    expect(screen.queryByText('PUMP DIAGNOSTIC DATA')).toBeNull();
  });

  it('fires onChange when toggling power', () => {
    const onChange = jest.fn();
    render(<EnhancedPump x={100} y={100} isRunning onChange={onChange} />);

    fireEvent.click(screen.getByText('ON'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('fires onModeChange when toggling auto/manual', () => {
    const onModeChange = jest.fn();
    render(
      <EnhancedPump
        x={100}
        y={100}
        isRunning
        onChange={jest.fn()}
        mode="auto"
        onModeChange={onModeChange}
      />,
    );

    fireEvent.click(screen.getByText('AUTO'));
    expect(onModeChange).toHaveBeenCalledWith('manual');
  });

  it('shows cavitation warning status', () => {
    render(
      <EnhancedPump
        x={100}
        y={100}
        isRunning
        onChange={jest.fn()}
        inletPressure={0.2}
        outletPressure={4.5}
        speed={0.8}
      />,
    );

    expect(screen.getByText('CAVITATION')).toBeInTheDocument();
    expect(screen.getByText('!')).toBeInTheDocument();
  });

  it('shows overheating status', () => {
    render(
      <EnhancedPump
        x={100}
        y={100}
        isRunning
        onChange={jest.fn()}
        inletPressure={1.2}
        outletPressure={4.5}
        temperature={90}
      />,
    );

    expect(screen.getByText('OVERHEAT')).toBeInTheDocument();
  });

  it('shows vibration status when health is low', () => {
    render(
      <EnhancedPump
        x={100}
        y={100}
        isRunning
        onChange={jest.fn()}
        inletPressure={1.2}
        outletPressure={4.5}
        speed={0.8}
        health={0.4}
      />,
    );

    expect(screen.getByText('VIBRATION')).toBeInTheDocument();
  });
});
