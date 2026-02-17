import { render, screen } from '@testing-library/react';
import React from 'react';

import { BallValve } from '../../../src/components/BallValve';
import { useLeverDrag } from '../../../src/hooks/useLeverDrag';

jest.mock('../../../src/hooks/useLeverDrag', () => ({
  useLeverDrag: jest.fn(),
}));

const useLeverDragMock = useLeverDrag as jest.Mock;

describe('BallValve', () => {
  it('maps lever position to openness and renders label', () => {
    const onChange = jest.fn();
    useLeverDragMock.mockImplementation(options => {
      if (options.onChange) {
        options.onChange(0.2);
      }
      return {
        value: 0.2,
        isDragging: false,
        handleMouseDown: jest.fn(),
      };
    });

    render(
      <BallValve
        x={10}
        y={20}
        openness={0.5}
        onChange={onChange}
        label="Valve"
      />,
    );

    expect(onChange).toHaveBeenCalledWith(0.8);
    expect(screen.getByText('Valve')).toBeInTheDocument();
  });
});
