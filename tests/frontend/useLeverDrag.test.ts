import { renderHook, act } from '@testing-library/react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useLeverDrag } from '../../src/hooks/useLeverDrag';

const asReactMouseEvent = (event: MouseEvent) =>
  event as unknown as ReactMouseEvent<Element>;

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
      result.current.handleMouseDown(asReactMouseEvent(event));
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
      result.current.handleMouseDown(asReactMouseEvent(event));
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
      result.current.handleMouseDown(asReactMouseEvent(event));
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
      result.current.handleMouseDown(asReactMouseEvent(event));
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
      result.current.handleDoubleClick({
        stopPropagation: jest.fn(),
      } as unknown as ReactMouseEvent<Element, MouseEvent>);
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
      result.current.handleDoubleClick({
        stopPropagation: jest.fn(),
      } as unknown as ReactMouseEvent<Element, MouseEvent>);
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
      result.current.handleMouseDown(asReactMouseEvent(event));
    });

    expect(result.current.isDragging).toBe(true);

    act(() => {
      const mouseUpEvent = new MouseEvent('mouseup');
      window.dispatchEvent(mouseUpEvent);
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('uses default drag axis and updates cursor while dragging', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useLeverDrag({
        initialValue: 10,
        min: 0,
        max: 100,
        onChange,
      }),
    );

    expect(document.body.style.cursor).toBe('');

    act(() => {
      const event = new MouseEvent('mousedown', { clientX: 10, clientY: 10 });
      jest.spyOn(event, 'preventDefault').mockImplementation(() => {});
      result.current.handleMouseDown(asReactMouseEvent(event));
    });

    expect(document.body.style.cursor).toBe('ew-resize');

    act(() => {
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 20,
        clientY: 10,
      });
      window.dispatchEvent(mouseMoveEvent);
    });

    expect(onChange).toHaveBeenCalled();

    act(() => {
      const mouseUpEvent = new MouseEvent('mouseup');
      window.dispatchEvent(mouseUpEvent);
    });

    expect(document.body.style.cursor).toBe('');
  });

  it('falls back to sensitivity 1 when dragSensitivity is 0', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useLeverDrag({
        initialValue: 0,
        min: 0,
        max: 100,
        onChange,
        dragSensitivity: 0,
      }),
    );

    act(() => {
      const event = new MouseEvent('mousedown', { clientX: 0, clientY: 0 });
      jest.spyOn(event, 'preventDefault').mockImplementation(() => {});
      result.current.handleMouseDown(asReactMouseEvent(event));
    });

    act(() => {
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 1,
        clientY: 0,
      });
      window.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current.value).toBe(100);
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it('cleans up global listeners and cursor on unmount', () => {
    const { result, unmount } = renderHook(() =>
      useLeverDrag({
        initialValue: 25,
        min: 0,
        max: 100,
        onChange: jest.fn(),
        dragAxis: 'vertical',
      }),
    );

    act(() => {
      const event = new MouseEvent('mousedown', { clientX: 5, clientY: 5 });
      jest.spyOn(event, 'preventDefault').mockImplementation(() => {});
      result.current.handleMouseDown(asReactMouseEvent(event));
    });

    expect(document.body.style.cursor).toBe('ns-resize');

    unmount();

    expect(document.body.style.cursor).toBe('');
  });
});
