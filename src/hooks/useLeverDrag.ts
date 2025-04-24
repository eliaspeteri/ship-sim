/// <reference lib="dom" />
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface UseLeverDragProps {
  initialValue: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Factor to adjust drag sensitivity. Higher means less sensitive. */
  dragSensitivity?: number;
  /** 'vertical' or 'horizontal' axis for drag calculation. */
  dragAxis?: 'vertical' | 'horizontal';
}

interface UseLeverDragReturn {
  value: number;
  isDragging: boolean;
  /**
   * Mouse down event handler to initiate dragging.
   * Attach this to the draggable element (e.g., lever handle or SVG area).
   */
  handleMouseDown: React.MouseEventHandler<HTMLDivElement>;
}

/**
 * Custom hook to manage the state and logic for dragging a lever control.
 * Encapsulates mouse event handling, value calculation, and state updates.
 * @param props - Configuration for the lever drag behavior.
 * @returns Object containing the current value, dragging state, and mouse down handler.
 */
export const useLeverDrag = ({
  initialValue,
  min,
  max,
  onChange,
  dragSensitivity,
  dragAxis,
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
    (e: React.MouseEvent<HTMLDivElement>) => {
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
      console.info('Cleaning up event listeners in useLeverDrag');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, effectiveDragAxis]);

  return { value, isDragging, handleMouseDown };
};
