import { act, render } from '@testing-library/react';
import React from 'react';

import { Pipe } from '../../../src/components/Pipe';

describe('Pipe', () => {
  it('renders a single line when not animated', () => {
    const { container } = render(
      <Pipe x1={0} y1={0} x2={10} y2={0} animated={false} />,
    );

    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(1);
  });

  it('renders animated flow line and updates dash offset', () => {
    jest.useFakeTimers();

    const { container } = render(
      <Pipe x1={0} y1={0} x2={10} y2={0} animated flow={1} />,
    );

    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(2);

    const flowLine = lines[1];
    const initialOffset = flowLine.getAttribute('stroke-dashoffset');

    act(() => {
      jest.advanceTimersByTime(50);
    });

    const nextOffset = flowLine.getAttribute('stroke-dashoffset');
    expect(nextOffset).not.toBe(initialOffset);

    jest.useRealTimers();
  });
});
