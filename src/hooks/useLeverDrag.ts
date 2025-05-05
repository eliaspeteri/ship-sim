/// <reference lib="dom" />
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseLeverDragProps {
  initialValue: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Factor to adjust drag sensitivity. Higher means less sensitive. */
  dragSensitivity?: number;
  /** 'vertical' or 'horizontal' axis for drag calculation. */
  dragAxis?: 'vertical' | 'horizontal';
  /** If true, double-clicking the component resets the value to the middle. */
  resetOnDoubleClick?: boolean;
}

interface UseLeverDragReturn {
  value: number;
  isDragging: boolean;
  /**
   * Mouse down event handler to initiate dragging.
   * Attach this to the draggable element (e.g., lever handle or SVG area).
   */
  handleMouseDown: (e: MouseEvent) => void; // Use Element for broader compatibility
  /**
   * Double click event handler to reset the value to the middle.
   * Attach this to the main component element (e.g., SVG).
   */
  handleDoubleClick: (e: MouseEvent) => void; // Use Element for broader compatibility
}

/**
 * Custom hook to manage the state and logic for dragging a lever control.
 * Encapsulates mouse event handling, value calculation, and state updates.
 * Optionally allows resetting the value to the middle on double-click.
 * @param props - Configuration for the lever drag behavior.
 * @returns Object containing the current value, dragging state, and event handlers.
 */
export const useLeverDrag = ({
  initialValue,
  min,
  max,
  onChange,
  dragSensitivity,
  dragAxis,
  resetOnDoubleClick = false, // Default to false
}: UseLeverDragProps): UseLeverDragReturn => {
  const [value, setValue] = useState<number>(initialValue);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  // Refs store drag start details, preventing stale closures in event listeners.
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startValueRef = useRef<number>(initialValue);
  const range = max - min;
  const effectiveDragSensitivity = dragSensitivity ?? 100;
  const effectiveDragAxis = dragAxis ?? 'horizontal';

  // Effect to synchronize the internal state if the initialValue prop changes from outside.
  useEffect(() => {
    // Only update if not currently dragging to avoid overriding user interaction.
    if (!isDragging) {
      setValue(initialValue);
    }
  }, [initialValue, isDragging]);

  // Callback to initiate the drag sequence on mouse down.
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      setIsDragging(true);
      startPosRef.current = { x: e.clientX, y: e.clientY };
      // Store the value at the moment dragging starts.
      startValueRef.current = value;
      // Prevent default browser actions like text selection or native drag-and-drop.
      e.preventDefault();
    },
    [value],
  );

  // Callback for handling mouse movement during a drag.
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const deltaPos =
        effectiveDragAxis === 'vertical'
          ? startPosRef.current.y - e.clientY
          : e.clientX - startPosRef.current.x;

      const sensitivity =
        effectiveDragSensitivity === 0 ? 1 : effectiveDragSensitivity;
      const deltaValue = range * (deltaPos / sensitivity);

      const newValue = Math.max(
        min,
        Math.min(max, startValueRef.current + deltaValue),
      );

      setValue(newValue);
      onChange(newValue);
    },
    [min, max, range, onChange, effectiveDragSensitivity, effectiveDragAxis],
  );

  // Callback for handling mouse up event to end the drag sequence.
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Callback for handling double click to reset value.
  const handleDoubleClick = useCallback(
    (e: MouseEvent) => {
      if (resetOnDoubleClick) {
        const middleValue = min + (max - min) / 2;
        setValue(middleValue);
        onChange(middleValue);
        // Optional: Prevent triggering other click/drag actions if needed
        e.stopPropagation();
      }
    },
    [min, max, onChange, resetOnDoubleClick],
  );

  // Effect to manage global event listeners and cursor style during dragging.
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor =
        effectiveDragAxis === 'vertical' ? 'ns-resize' : 'ew-resize';
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, effectiveDragAxis]);

  return { value, isDragging, handleMouseDown, handleDoubleClick };
};
