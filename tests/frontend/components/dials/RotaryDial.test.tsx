import React from 'react';
import { render, screen } from '@testing-library/react';
import { RotaryDial } from '../../../../src/components/dials/RotaryDial';
import { useLeverDrag } from '../../../../src/hooks/useLeverDrag';

jest.mock('../../../../src/hooks/useLeverDrag', () => ({
  useLeverDrag: jest.fn(),
}));

const useLeverDragMock = useLeverDrag as jest.Mock;

describe('RotaryDial', () => {
  it('renders label and value with unit', () => {
    useLeverDragMock.mockImplementation(() => ({
      value: 5,
      isDragging: false,
      handleMouseDown: jest.fn(),
      handleDoubleClick: jest.fn(),
    }));

    render(
      <RotaryDial
        value={2}
        min={0}
        max={10}
        label="Heading"
        unit="deg"
        precision={1}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Heading')).toBeInTheDocument();
    expect(screen.getAllByText('5.0').length).toBeGreaterThan(0);
    expect(screen.getByText('deg')).toBeInTheDocument();
  });

  it('hides value when showValue is false', () => {
    useLeverDragMock.mockImplementation(() => ({
      value: 3,
      isDragging: false,
      handleMouseDown: jest.fn(),
      handleDoubleClick: jest.fn(),
    }));

    render(
      <RotaryDial
        value={3}
        min={0}
        max={10}
        showValue={false}
        label="Trim"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Trim')).toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });
});
