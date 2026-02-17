import { render, screen } from '@testing-library/react';
import React from 'react';

import { RotaryValve } from '../../../src/components/RotaryValve';
import { useLeverDrag } from '../../../src/hooks/useLeverDrag';

jest.mock('../../../src/hooks/useLeverDrag', () => ({
  useLeverDrag: jest.fn(),
}));

const useLeverDragMock = useLeverDrag as jest.Mock;

describe('RotaryValve', () => {
  it('passes openness changes through and renders label', () => {
    const onChange = jest.fn();
    useLeverDragMock.mockImplementation(options => {
      if (options.onChange) {
        options.onChange(0.4);
      }
      return {
        value: 0.4,
        isDragging: false,
        handleMouseDown: jest.fn(),
      };
    });

    render(
      <RotaryValve
        x={5}
        y={5}
        openness={0.1}
        onChange={onChange}
        label="Rotary"
      />,
    );

    expect(onChange).toHaveBeenCalledWith(0.4);
    expect(screen.getByText('Rotary')).toBeInTheDocument();
  });
});
