import { render, screen } from '@testing-library/react';
import React from 'react';

import { TelegraphLever } from '../../../src/components/TelegraphLever';
import { useLeverDrag } from '../../../src/hooks/useLeverDrag';

jest.mock('../../../src/hooks/useLeverDrag', () => ({
  useLeverDrag: jest.fn(),
}));

const useLeverDragMock = useLeverDrag as jest.Mock;

describe('TelegraphLever', () => {
  it('renders label and nearest scale label', () => {
    useLeverDragMock.mockImplementation(() => ({
      value: 0.1,
      isDragging: false,
      handleMouseDown: jest.fn(),
      handleDoubleClick: jest.fn(),
    }));

    render(
      <TelegraphLever
        value={0}
        min={-1}
        max={1}
        onChange={jest.fn()}
        label="Engine Telegraph"
        scale={[
          { label: 'ASTERN', value: -1 },
          { label: 'STOP', value: 0, major: true },
          { label: 'AHEAD', value: 1 },
        ]}
      />,
    );

    expect(screen.getByText('Engine Telegraph')).toBeInTheDocument();
    expect(screen.getAllByText('STOP').length).toBeGreaterThan(0);
  });

  it('does not call onChange when disabled', () => {
    const onChange = jest.fn();
    useLeverDragMock.mockImplementation(options => {
      if (options.onChange) {
        options.onChange(0.5);
      }
      return {
        value: 0.5,
        isDragging: false,
        handleMouseDown: jest.fn(),
        handleDoubleClick: jest.fn(),
      };
    });

    render(
      <TelegraphLever
        value={0}
        min={-1}
        max={1}
        onChange={onChange}
        label="Engine Telegraph"
        disabled
        scale={[
          { label: 'ASTERN', value: -1 },
          { label: 'STOP', value: 0, major: true },
          { label: 'AHEAD', value: 1 },
        ]}
      />,
    );

    expect(onChange).not.toHaveBeenCalled();
  });
});
