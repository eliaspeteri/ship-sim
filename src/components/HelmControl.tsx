import React from 'react';
import { useLeverDrag } from '../hooks/useLeverDrag'; // Reusing for rotational drag logic

// Helper functions (similar to TelegraphLever)
const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } => {
  // 0 degrees is up, positive is clockwise
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (
  cx: number,
  cy: number,
  radius: number,
  startAngleDegrees: number,
  endAngleDegrees: number,
  sweepFlag: '0' | '1' = '1',
): string => {
  // Handle potential floating point issues if start and end are identical after modulo
  const clampedEndAngle =
    Math.abs(startAngleDegrees - endAngleDegrees) % 360 < 0.01
      ? endAngleDegrees - 0.01
      : endAngleDegrees;

  // Adjust end angle for sweep calculation if it wraps around 360
  const adjustedEndAngle =
    sweepFlag === '1' && clampedEndAngle <= startAngleDegrees
      ? clampedEndAngle + 360
      : sweepFlag === '0' && clampedEndAngle >= startAngleDegrees
        ? clampedEndAngle - 360
        : clampedEndAngle;

  const start = polarToCartesian(cx, cy, radius, startAngleDegrees);
  const end = polarToCartesian(cx, cy, radius, adjustedEndAngle);

  // Determine large arc flag based on the angular difference
  const largeArcFlag =
    Math.abs(adjustedEndAngle - startAngleDegrees) <= 180 ? '0' : '1';

  const d = [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    sweepFlag,
    end.x,
    end.y,
  ].join(' ');

  return d;
};

interface HelmControlProps {
  /** Current rudder angle in degrees */
  value: number;
  /** Callback when the angle changes */
  onChange: (value: number) => void;
  /** Minimum angle (e.g., -40) */
  minAngle?: number;
  /** Maximum angle (e.g., 40) */
  maxAngle?: number;
  /** Total number of tick marks (including ends and zero) */
  numTicks?: number;
  /** Size of the component (width and height) */
  size?: number;
  /** Optional label */
  label?: string;
}

/**
 * Renders a circular helm control for rudder angle, inspired by ship helms.
 * Features a square background, a top-oriented semi-circular display
 * with red/green indication and tick marks.
 * Interaction is via dragging the helm wheel horizontally.
 */
export const HelmControl: React.FC<HelmControlProps> = ({
  value: initialValue,
  onChange,
  minAngle = -40,
  maxAngle = 40,
  numTicks = 9, // e.g., -40, -30, -20, -10, 0, 10, 20, 30, 40
  size = 200,
  label = 'Rudder Angle',
}) => {
  // --- Geometry & Styling ---
  const centerX = size / 2;
  const centerY = size / 2; // Center the pivot vertically as well
  const helmRadius = size * 0.35; // Adjusted helm size relative to square
  const spokeWidth = helmRadius * 0.15;
  const rimThickness = helmRadius * 0.1;
  const indicatorArcRadius = size * 0.2; // Arc radius relative to square
  const indicatorArcThickness = size * 0.05;
  const tickRadius = indicatorArcRadius;
  const tickLength = indicatorArcThickness * 1.5;
  const labelRadius = indicatorArcRadius + tickLength * 1.1; // Move labels slightly further out
  const labelFontSize = size * 0.05;

  // Angles for the horseshoe display (degrees, 0 is up) - ROTATED 90deg RIGHT
  const displayStartAngle = 135; // Left side (-40 deg rudder)
  const displayEndAngle = 405; // Right side (+40 deg rudder) - Use 360 for arc calculation continuity
  const displayMidAngle = 270; // Top (0 deg rudder)
  const totalDisplaySweep = displayEndAngle - displayStartAngle; // Should be 180

  // Colors
  const bgColor = '#1F2937'; // Dark Gray-Blue
  const helmColor = '#D1D5DB'; // Silver/Light Gray
  const redColor = '#EF4444';
  const greenColor = '#10B981';
  const tickColor = '#9CA3AF';
  const labelColor = '#E5E7EB';

  // --- Drag Logic ---
  const angleRange = maxAngle - minAngle;
  const valueToNormalized = (angle: number): number =>
    angleRange === 0 ? 0.5 : (angle - minAngle) / angleRange;
  const normalizedToValue = (norm: number): number =>
    minAngle + norm * angleRange;

  // Use useLeverDrag, interpreting horizontal drag as rotation
  const {
    value: normalizedValue,
    isDragging,
    handleMouseDown,
  } = useLeverDrag({
    initialValue: valueToNormalized(initialValue),
    min: 0, // Corresponds to minAngle (-40)
    max: 1, // Corresponds to maxAngle (+40)
    onChange: norm => onChange(normalizedToValue(norm)),
    dragAxis: 'horizontal', // Horizontal drag controls the normalized value 0-1
    dragSensitivity: 100, // Adjust sensitivity for desired rotation feel
  });

  const currentValue = normalizedToValue(normalizedValue);

  // Calculate helm rotation based on the current value
  // Map the full angle range (-40 to 40) to a visual rotation range (e.g., -90 to 90 degrees)
  // A normalized value of 0.5 (0 rudder) corresponds to 0 helm rotation.
  const visualRotationRange = 180; // Total visual rotation span
  const helmRotation = (normalizedValue - 0.5) * visualRotationRange;

  // --- SVG Paths ---
  // Red arc from -40 to 0
  const redArcPath = describeArc(
    centerX,
    centerY,
    indicatorArcRadius,
    displayStartAngle,
    displayMidAngle,
  );
  // Green arc from 0 to +40
  const greenArcPath = describeArc(
    centerX,
    centerY,
    indicatorArcRadius,
    displayMidAngle,
    displayEndAngle,
  );

  return (
    <div className="flex flex-col items-center p-2">
      <div className="text-white mb-2 text-sm font-semibold">{label}</div>
      <svg
        width={size}
        height={size} // Square aspect ratio
        viewBox={`0 0 ${size} ${size}`} // Square viewBox
        className="cursor-grab select-none overflow-hidden rounded" // Added rounding
        onMouseDown={handleMouseDown}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundColor: bgColor,
        }} // Use SVG background
      >
        {/* Background Rect (alternative to style) */}
        {/* <rect width={size} height={size} fill={bgColor} rx={5} /> */}

        {/* Indicator Arcs */}
        <path
          d={redArcPath}
          fill="none"
          stroke={redColor}
          strokeWidth={indicatorArcThickness}
        />
        <path
          d={greenArcPath}
          fill="none"
          stroke={greenColor}
          strokeWidth={indicatorArcThickness}
        />

        {/* Tick Marks and Labels */}
        {Array.from({ length: numTicks }).map((_, i) => {
          const tickValueNorm = i / (numTicks - 1);
          const tickAngleDegrees = minAngle + tickValueNorm * angleRange;
          const displayAngle =
            displayStartAngle + tickValueNorm * totalDisplaySweep;

          const tickStart = polarToCartesian(
            centerX,
            centerY,
            tickRadius - tickLength / 2,
            displayAngle,
          );
          const tickEnd = polarToCartesian(
            centerX,
            centerY,
            tickRadius + tickLength / 2,
            displayAngle,
          );
          const labelPos = polarToCartesian(
            centerX,
            centerY,
            labelRadius,
            displayAngle,
          );

          // Adjust label rotation: 0 degrees (horizontal) for top label, slightly angled otherwise
          let labelRotation = 0;
          if (Math.abs(displayAngle - 270) > 5) {
            // Don't rotate the top '0' label
            labelRotation =
              displayAngle > 270 ? displayAngle - 270 : displayAngle + 90;
          }

          return (
            <g key={i}>
              <line
                x1={tickStart.x}
                y1={tickStart.y}
                x2={tickEnd.x}
                y2={tickEnd.y}
                stroke={tickColor}
                strokeWidth={1.5}
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                fill={labelColor}
                fontSize={labelFontSize}
                textAnchor="middle"
                dominantBaseline="middle"
                // Apply rotation relative to the label's position
                transform={`rotate(${labelRotation}, ${labelPos.x}, ${labelPos.y})`}
              >
                {tickAngleDegrees.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Helm Wheel - Rotates */}
        <g transform={`rotate(${helmRotation - 180}, ${centerX}, ${centerY})`}>
          {/* Rim */}
          <circle
            cx={centerX}
            cy={centerY}
            r={helmRadius}
            fill="none"
            stroke={helmColor}
            strokeWidth={rimThickness}
          />
          {/* Spokes (3 spokes) */}
          {[0, 120, 240].map(angle => (
            <rect
              key={angle}
              x={centerX - spokeWidth / 2}
              // Start spoke from the inner edge of the rim
              y={centerY - helmRadius + rimThickness / 2}
              width={spokeWidth}
              // Extend spoke towards the center, stopping before the hub overlaps too much
              height={helmRadius - rimThickness / 2 - spokeWidth * 0.4}
              fill={helmColor}
              transform={`rotate(${angle}, ${centerX}, ${centerY})`}
              rx={spokeWidth * 0.2} // Rounded spoke ends
            />
          ))}
          {/* Center Hub */}
          <circle
            cx={centerX}
            cy={centerY}
            r={spokeWidth * 0.8}
            fill={helmColor}
          />
        </g>
      </svg>
      {/* Value Display */}
      <div className="mt-2 min-h-[1.5em]">
        <span className="text-white font-mono text-sm">
          {currentValue.toFixed(1)}°
        </span>
      </div>
    </div>
  );
};
