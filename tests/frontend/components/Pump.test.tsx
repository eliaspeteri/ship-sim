import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Pump } from '../../../src/components/Pump';

describe('Pump', () => {
  it('renders label and status', () => {
    render(
      <Pump
        x={10}
        y={10}
        isRunning={false}
        onChange={jest.fn()}
        label="Pump A"
      />,
    );

    expect(screen.getByText('Pump A')).toBeInTheDocument();
    expect(screen.getByText('OFF')).toBeInTheDocument();
  });

  it('invokes onChange when clicked', () => {
    const onChange = jest.fn();
    const { container } = render(
      <Pump x={10} y={10} isRunning={false} onChange={onChange} />,
    );

    fireEvent.click(container.firstChild as HTMLElement);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('animates rotation when running', () => {
    jest.useFakeTimers();

    const { container } = render(
      <Pump x={10} y={10} isRunning={true} onChange={jest.fn()} />,
    );

    const rotating = container.querySelector(
      'div[style*="rotate"]',
    ) as HTMLElement;
    const initialTransform = rotating.style.transform;

    act(() => {
      jest.advanceTimersByTime(50);
    });

    const nextTransform = rotating.style.transform;
    expect(nextTransform).not.toBe(initialTransform);

    jest.useRealTimers();
  });
});
