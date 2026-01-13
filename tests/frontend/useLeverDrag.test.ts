import { renderHook, act } from '@testing-library/react';
import { useLeverDrag } from '../../src/hooks/useLeverDrag';

describe('useLeverDrag', () => {
  it('initializes with initialValue', () => {
    const { result } = renderHook(() =>
      useLeverDrag({
        initialValue: 50,
        min: 0,
        max: 100,
        onChange: jest.fn(),
      }),
    );
    expect(result.current.value).toBe(50);
    expect(result.current.isDragging).toBe(false);
  });

  it('updates value when initialValue changes', () => {
    const { result, rerender } = renderHook(
      ({ initialValue }) =>
        useLeverDrag({
          initialValue,
          min: 0,
          max: 100,
          onChange: jest.fn(),
        }),
      { initialProps: { initialValue: 50 } },
    );

    rerender({ initialValue: 75 });
    expect(result.current.value).toBe(75);
  });

  it('does not update value during dragging', () => {
    const { result, rerender } = renderHook(
      ({ initialValue }) =>
        useLeverDrag({
          initialValue,
          min: 0,
          max: 100,
          onChange: jest.fn(),
        }),
      { initialProps: { initialValue: 50 } },
    );

    act(() => {
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      jest.spyOn(event, 'preventDefault').mockImplementation(() => {});
      result.current.handleMouseDown(event);
    });

    rerender({ initialValue: 75 });
    expect(result.current.value).toBe(50);
  });

  it('handles mouse drag horizontally', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useLeverDrag({
        initialValue: 50,
        min: 0,
        max: 100,
        onChange,
        dragSensitivity: 100,
        dragAxis: 'horizontal',
      }),
    );

    act(() => {
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      jest.spyOn(event, 'preventDefault').mockImplementation(() => {});
      result.current.handleMouseDown(event);
    });

    act(() => {
      // Simulate mouse move 50px to the right
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 100,
      });
      window.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current.value).toBe(100); // 50 + 50/100 * 100 = 100
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it('handles mouse drag vertically', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useLeverDrag({
        initialValue: 50,
        min: 0,
        max: 100,
        onChange,
        dragSensitivity: 100,
        dragAxis: 'vertical',
      }),
    );

    act(() => {
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      jest.spyOn(event, 'preventDefault').mockImplementation(() => {});
      result.current.handleMouseDown(event);
    });

    act(() => {
      // Simulate mouse move 50px up
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 50,
      });
      window.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current.value).toBe(100); // 50 + 50/100 * 100 = 100
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it('clamps value to min and max', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useLeverDrag({
        initialValue: 50,
        min: 0,
        max: 100,
        onChange,
        dragSensitivity: 10,
      }),
    );

    act(() => {
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      jest.spyOn(event, 'preventDefault').mockImplementation(() => {});
      result.current.handleMouseDown(event);
    });

    act(() => {
      // Large move that would exceed max
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 1000,
        clientY: 100,
      });
      window.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current.value).toBe(100);
  });

  it('resets on double click when enabled', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useLeverDrag({
        initialValue: 50,
        min: 0,
        max: 100,
        onChange,
        resetOnDoubleClick: true,
      }),
    );

    act(() => {
      result.current.handleDoubleClick({ stopPropagation: jest.fn() } as any);
    });

    expect(result.current.value).toBe(50); // (0 + 100) / 2 = 50
    expect(onChange).toHaveBeenCalledWith(50);
  });

  it('does not reset on double click when disabled', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useLeverDrag({
        initialValue: 50,
        min: 0,
        max: 100,
        onChange,
        resetOnDoubleClick: false,
      }),
    );

    act(() => {
      result.current.handleDoubleClick({ stopPropagation: jest.fn() } as any);
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('ends dragging on mouse up', () => {
    const { result } = renderHook(() =>
      useLeverDrag({
        initialValue: 50,
        min: 0,
        max: 100,
        onChange: jest.fn(),
      }),
    );

    act(() => {
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      jest.spyOn(event, 'preventDefault').mockImplementation(() => {});
      result.current.handleMouseDown(event);
    });

    expect(result.current.isDragging).toBe(true);

    act(() => {
      const mouseUpEvent = new MouseEvent('mouseup');
      window.dispatchEvent(mouseUpEvent);
    });

    expect(result.current.isDragging).toBe(false);
  });
});
