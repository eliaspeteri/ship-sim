import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { ChangeoverSwitch } from '../../../../src/components/switches/ChangeoverSwitch';
import { useLeverDrag } from '../../../../src/hooks/useLeverDrag';

jest.mock('../../../../src/hooks/useLeverDrag', () => ({
  useLeverDrag: jest.fn(),
}));

const useLeverDragMock = useLeverDrag as jest.Mock;

describe('ChangeoverSwitch', () => {
  beforeEach(() => {
    useLeverDragMock.mockImplementation(options => ({
      value: options.initialValue ?? 0,
      isDragging: false,
      handleMouseDown: () => {
        if (options.onChange) {
          options.onChange(1);
        }
      },
    }));
  });

  it('warns and renders nothing when fewer than two positions provided', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <ChangeoverSwitch
        position="a"
        onPositionChange={jest.fn()}
        positions={[{ value: 'a' }]}
      />,
    );

    expect(warn).toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
    warn.mockRestore();
  });

  it('calls onPositionChange when clicking an enabled position', () => {
    const onPositionChange = jest.fn();
    const { container } = render(
      <ChangeoverSwitch
        position="off"
        onPositionChange={onPositionChange}
        positions={[
          { value: 'off', label: 'OFF' },
          { value: 'on', label: 'ON' },
        ]}
      />,
    );

    const indicator = container.querySelector('g circle') as SVGCircleElement;
    fireEvent.click(indicator);

    expect(onPositionChange).toHaveBeenCalled();
  });

  it('invokes onPositionChange from drag handler', () => {
    const onPositionChange = jest.fn();
    const { container } = render(
      <ChangeoverSwitch
        position="low"
        onPositionChange={onPositionChange}
        positions={[
          { value: 'low', label: 'LOW' },
          { value: 'med', label: 'MED' },
          { value: 'high', label: 'HIGH' },
        ]}
      />,
    );

    const groups = container.querySelectorAll('g');
    const handleGroup = groups[groups.length - 1];
    fireEvent.mouseDown(handleGroup);

    expect(onPositionChange).toHaveBeenCalled();
  });
});
