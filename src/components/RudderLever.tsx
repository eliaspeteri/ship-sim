import React from 'react';
import { useLeverDrag } from '../hooks/useLeverDrag';

// Helper functions (reused from TelegraphLever/HelmControl)
const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
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
  const clampedEndAngle =
    Math.abs(startAngleDegrees - endAngleDegrees) % 360 < 0.01
      ? endAngleDegrees - 0.01
      : endAngleDegrees;

  const adjustedEndAngle =
    sweepFlag === '1' && clampedEndAngle <= startAngleDegrees
      ? clampedEndAngle + 360
      : sweepFlag === '0' && clampedEndAngle >= startAngleDegrees
        ? clampedEndAngle - 360
        : clampedEndAngle;

  const start = polarToCartesian(cx, cy, radius, startAngleDegrees);
  const end = polarToCartesian(cx, cy, radius, adjustedEndAngle);

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

interface RudderLeverProps {
  /** Current rudder angle in degrees */
  value: number;
  /** Callback when the angle changes */
  onChange: (value: number) => void;
  /** Minimum angle (e.g., -35) */
  minAngle?: number;
  /** Maximum angle (e.g., 35) */
  maxAngle?: number;
  /** Total number of tick marks (including ends and zero) */
  numTicks?: number;
  /** Size of the component (width) */
  size?: number;
  /** Optional label */
  label?: string;
}

/**
 * Renders a lever-style rudder control.
 * Features a horseshoe-shaped arc indicator with red/green fill and tick marks.
 * Interaction is via dragging the lever vertically.
 */
export const RudderLever: React.FC<RudderLeverProps> = ({
  value: initialValue,
  onChange,
  minAngle = -35,
  maxAngle = 35,
  numTicks = 8, // e.g., -35, -25, -15, -5, 5, 15, 25, 35 (0 is implied center)
  size = 150, // Width of the component
  label = 'Rudder Lever',
}) => {
  // --- Geometry & Styling ---
  const width = size;
  const height = size * 0.8; // Adjust height relative to width
  const centerX = width / 2;
  const centerY = height * 0.8; // Pivot point lower down
  const arcRadius = width * 0.4;
  const arcThickness = width * 0.08;
  const tickRadius = arcRadius;
  const tickLength = arcThickness * 0.6;
  const labelRadius = arcRadius + tickLength * 1.5;
  const labelFontSize = width * 0.07;
  const leverLength = arcRadius * 1.1;
  const leverWidth = width * 0.05;
  const knobRadius = leverWidth * 1.5;

  // Angles for the horseshoe display (degrees, 0 is up)
  // Adjust angles for a wider, flatter arc compared to HelmControl
  const displayStartAngle = 225; // ~7:30 o'clock
  const displayEndAngle = -45; // ~-1:30 o'clock (equivalent to 315 degrees)
  const displayMidAngle =
    (displayStartAngle +
      (displayEndAngle < displayStartAngle
        ? displayEndAngle + 360
        : displayEndAngle)) /
      2 -
    180; // Center angle (0 degrees rudder)
  const totalDisplaySweep =
    (displayEndAngle < displayStartAngle
      ? displayEndAngle + 360
      : displayEndAngle) - displayStartAngle;

  // Colors
  const leverColor = '#111827'; // Very Dark Gray / Metallic Black
  const knobColor = '#4B5563';
  const redColor = '#EF4444';
  const greenColor = '#10B981';
  const tickColor = '#9CA3AF';
  const labelColor = '#E5E7EB';

  // --- Drag Logic ---
  const angleRange = maxAngle - minAngle;
  const valueToNormalized = (angle: number) =>
    angleRange === 0 ? 0.5 : (angle - minAngle) / angleRange;
  const normalizedToValue = (norm: number) => minAngle + norm * angleRange;

  // Use useLeverDrag with vertical axis
  const {
    value: normalizedValue,
    isDragging,
    handleMouseDown,
  } = useLeverDrag({
    initialValue: valueToNormalized(initialValue),
    min: 0,
    max: 1,
    onChange: norm => onChange(normalizedToValue(norm)),
    dragAxis: 'vertical', // Drag up/down
    dragSensitivity: 150, // Adjust sensitivity
  });

  const currentValue = normalizedToValue(normalizedValue);

  // Calculate lever rotation based on the current value
  const currentDisplayAngle =
    displayStartAngle + normalizedValue * totalDisplaySweep;

  // --- SVG Paths ---
  // Background (optional, could just rely on parent container)
  // const backgroundPath = `...`;

  // Create filled segments using inner and outer arcs
  const createFilledArc = (startAng: number, endAng: number, color: string) => {
    const outerStart = polarToCartesian(
      centerX,
      centerY,
      arcRadius + arcThickness / 2,
      startAng,
    );
    const innerEnd = polarToCartesian(
      centerX,
      centerY,
      arcRadius - arcThickness / 2,
      endAng,
    );

    return (
      <path
        d={`
          M ${outerStart.x} ${outerStart.y}
          ${describeArc(centerX, centerY, arcRadius + arcThickness / 2, startAng, endAng)}
          L ${innerEnd.x} ${innerEnd.y}
          ${describeArc(centerX, centerY, arcRadius - arcThickness / 2, endAng, startAng, '0')} 
          Z
        `}
        fill={color}
      />
    );
  };

  return (
    <div className="flex flex-col items-center p-2">
      <div className="text-white mb-2 text-sm font-semibold">{label}</div>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="cursor-grab select-none bg-gray-700 rounded" // Added background and rounding
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Background Color Fill (Alternative to path) */}
        {/* <rect width={width} height={height} fill={bgColor} /> */}

        {/* Filled Indicator Arcs */}
        {createFilledArc(displayStartAngle, displayMidAngle, redColor)}
        {createFilledArc(displayMidAngle, displayEndAngle, greenColor)}

        {/* Tick Marks and Labels */}
        {Array.from({ length: numTicks + 1 }).map((_, i) => {
          // +1 to include 0 if not explicitly in ticks
          const tickValueNorm = i / numTicks;
          let tickAngleDegrees = minAngle + tickValueNorm * angleRange;
          // Ensure 0 is always shown if within range
          if (i !== 0 && i !== numTicks && Math.abs(tickAngleDegrees) < 0.01)
            return null; // Skip if generating 0 again
          if (i === 0) tickAngleDegrees = minAngle;
          if (i === numTicks) tickAngleDegrees = maxAngle;

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

          // Basic label rotation
          const labelRotation = displayAngle + 90;

          return (
            <g key={tickAngleDegrees}>
              {' '}
              {/* Use angle as key */}
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
                transform={`rotate(${labelRotation}, ${labelPos.x}, ${labelPos.y})`}
              >
                {tickAngleDegrees.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Lever Handle */}
        <g transform={`rotate(${currentDisplayAngle}, ${centerX}, ${centerY})`}>
          {/* Arm */}
          <rect
            x={centerX - leverWidth / 2}
            y={centerY - leverLength} // Start drawing from the end point inwards
            width={leverWidth}
            height={leverLength} // Extend to pivot
            fill={leverColor}
            rx={leverWidth / 3}
          />
          {/* Knob */}
          <circle
            cx={centerX}
            cy={centerY - leverLength}
            r={knobRadius}
            fill={knobColor}
            stroke={leverColor}
            strokeWidth="1"
          />
        </g>

        {/* Pivot Point (optional visual) */}
        <circle cx={centerX} cy={centerY} r={leverWidth} fill={leverColor} />
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
