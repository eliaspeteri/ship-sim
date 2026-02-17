import React from 'react';

import { useLeverDrag } from '../hooks/useLeverDrag';

interface RotaryValveProps {
  /** X coordinate for absolute positioning */
  x: number;
  /** Y coordinate for absolute positioning */
  y: number;
  /** Size of the valve (diameter of the handwheel) */
  size?: number;
  /** Current openness state (0 = closed, 1 = fully open) */
  openness: number;
  /** Callback function triggered when the openness changes */
  onChange: (openness: number) => void;
  /** Number of full handwheel turns from closed to fully open */
  maxTurns?: number;
  /** Optional text label displayed below the valve */
  label?: string;
  /** Sensitivity for drag interaction */
  dragSensitivity?: number;
}

/**
 * Renders a rotary valve (like a gate or globe valve) using SVG.
 * Features a rotating handwheel controlled by horizontal mouse dragging.
 */
export const RotaryValve: React.FC<RotaryValveProps> = ({
  x,
  y,
  size = 50, // Default size
  openness: initialOpenness,
  onChange,
  maxTurns = 5, // Default max turns
  label,
  dragSensitivity = 150, // Default drag sensitivity
}) => {
  const handwheelRadius = size / 2;
  const bodyRadius = size * 0.3; // Smaller body relative to handwheel
  const gripRadius = size * 0.08;
  const numGrips = 5;

  // Colors
  const bodyColor = '#4B5563'; // Darker Gray
  const handwheelColor = '#9CA3AF'; // Medium Gray
  const gripColor = '#6B7280'; // Gray

  // Use the drag hook for horizontal dragging
  const {
    value: openness,
    isDragging,
    handleMouseDown,
  } = useLeverDrag({
    initialValue: initialOpenness,
    min: 0,
    max: 1,
    onChange: onChange, // Pass the callback directly
    dragAxis: 'horizontal',
    dragSensitivity: dragSensitivity,
  });

  // Calculate the rotation angle based on openness and maxTurns
  const rotationAngle = openness * maxTurns * 360;

  return (
    <div
      className="absolute flex flex-col items-center cursor-grab select-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size + (label ? 15 : 0)}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      title={`Valve Openness: ${(openness * 100).toFixed(0)}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Valve Body (simple circle below handwheel) */}
        <circle
          cx={handwheelRadius}
          cy={handwheelRadius}
          r={bodyRadius}
          fill={bodyColor}
        />

        {/* Handwheel Group - Rotates */}
        <g
          transform={`rotate(${rotationAngle}, ${handwheelRadius}, ${handwheelRadius})`}
          style={{
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }} // Smooth transition only when not dragging
        >
          {/* Handwheel Rim */}
          <circle
            cx={handwheelRadius}
            cy={handwheelRadius}
            r={handwheelRadius * 0.9} // Slightly smaller than full size
            fill="none"
            stroke={handwheelColor}
            strokeWidth={size * 0.1}
          />

          {/* Handwheel Spokes/Grips */}
          {Array.from({ length: numGrips }).map((_, i) => {
            const angle = (i / numGrips) * 360;
            const gripX =
              handwheelRadius +
              handwheelRadius * 0.75 * Math.cos((angle * Math.PI) / 180);
            const gripY =
              handwheelRadius +
              handwheelRadius * 0.75 * Math.sin((angle * Math.PI) / 180);
            return (
              <circle
                key={i}
                cx={gripX}
                cy={gripY}
                r={gripRadius}
                fill={gripColor}
              />
            );
          })}

          {/* Optional: Add a visual indicator for rotation reference */}
          <circle
            cx={handwheelRadius}
            cy={handwheelRadius * 0.25} // Position near the top edge
            r={gripRadius * 0.6}
            fill="#FBBF24" // Yellow indicator dot
          />
        </g>

        {/* Center Pivot */}
        <circle
          cx={handwheelRadius}
          cy={handwheelRadius}
          r={bodyRadius * 0.5}
          fill={handwheelColor}
        />
      </svg>
      {label && (
        <div className="text-white text-xs mt-1 whitespace-nowrap">{label}</div>
      )}
    </div>
  );
};
