import React from 'react';
import { useLeverDrag } from '../hooks/useLeverDrag'; // Import the hook

interface BallValveProps {
  /** X coordinate for absolute positioning */
  x: number;
  /** Y coordinate for absolute positioning */
  y: number;
  /** Size of the valve body (diameter) */
  size?: number;
  /** Openness state of the valve (0 = closed, 1 = open) */
  openness: number;
  /** Callback function triggered when the valve state changes via drag */
  onChange: (openness: number) => void;
  /** Optional text label displayed below the valve */
  label?: string;
  /** Sensitivity for drag interaction */
  dragSensitivity?: number;
}

/**
 * Renders a simple ball valve using SVG.
 * Represents a quarter-turn valve, visually showing open/closed state
 * by rotating a lever 90 degrees based on the openness value.
 * Interaction is via horizontal dragging. Drag left to open, right to close.
 */
export const BallValve: React.FC<BallValveProps> = ({
  x,
  y,
  size = 40,
  openness: initialOpenness, // Renamed prop
  onChange,
  label,
  dragSensitivity = 150, // Adjusted sensitivity for potentially finer control
}) => {
  const bodyRadius = size / 2;
  const leverLength = size * 0.7;
  const leverWidth = size * 0.15;
  const pivotRadius = size * 0.1;

  // Colors
  const bodyColor = '#6B7280';
  const leverColor = '#D1D5DB';

  // --- Revised Approach ---
  // Keep BallValve props as openness (0=closed, 1=open) for consistency with RotaryValve.
  // Internally, map this to the drag hook's value representing "lever position" (0=open, 1=closed).
  const handleDragChange = (leverPosition: number): void => {
    // Convert lever position (0=open, 1=closed) back to openness (0=closed, 1=open)
    onChange(1 - leverPosition);
  };

  const {
    value: leverPosition,
    isDragging: isLeverDragging,
    handleMouseDown: handleLeverMouseDown,
  } = useLeverDrag({
    initialValue: 1 - initialOpenness, // Map initial openness to lever position
    min: 0, // Lever position for Open state
    max: 1, // Lever position for Closed state
    onChange: handleDragChange,
    dragAxis: 'horizontal',
    dragSensitivity: dragSensitivity,
  });

  // Calculate angle based on the internal leverPosition (0=open -> 0deg, 1=closed -> 90deg)
  const leverAngle = leverPosition * 90;
  // Determine stroke color based on the actual openness value derived from leverPosition
  const currentOpenness = 1 - leverPosition;
  const currentStrokeColor = currentOpenness > 0.05 ? '#10B981' : '#EF4444'; // Green if mostly open, Red if mostly closed

  return (
    <div
      className="absolute flex flex-col items-center cursor-grab select-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size + (label ? 15 : 0)}px`,
        cursor: isLeverDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleLeverMouseDown} // Attach mouse down handler here
      title={`Valve Openness: ${(currentOpenness * 100).toFixed(0)}% (Drag Left/Right)`} // Use currentOpenness for title display
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Valve Body */}
        <circle
          cx={bodyRadius}
          cy={bodyRadius}
          r={bodyRadius * 0.8}
          fill={bodyColor}
          stroke={currentStrokeColor} // Use dynamically calculated stroke color
          strokeWidth="2"
        />

        {/* Lever Group - Rotates around the center */}
        <g
          transform={`rotate(${leverAngle}, ${bodyRadius}, ${bodyRadius})`}
          style={{
            transition: isLeverDragging ? 'none' : 'transform 0.3s ease',
          }} // Only transition when not actively dragging
        >
          {/* Lever Arm */}
          <rect
            x={bodyRadius - leverWidth / 2}
            y={bodyRadius - leverLength}
            width={leverWidth}
            height={leverLength}
            fill={leverColor}
            rx={leverWidth / 3}
          />
        </g>

        {/* Pivot Point */}
        <circle
          cx={bodyRadius}
          cy={bodyRadius}
          r={pivotRadius}
          fill={leverColor}
        />
      </svg>
      {label && (
        <div className="text-white text-xs mt-1 whitespace-nowrap">{label}</div>
      )}
    </div>
  );
};
