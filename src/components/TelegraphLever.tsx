import React from 'react';
import { useLeverDrag } from '../hooks/useLeverDrag';

// Define the structure for scale markings specific to the telegraph
interface TelegraphMark {
  label: string;
  value: number;
  /** Optional flag for major markings (e.g., STOP) */
  major?: boolean;
}

interface TelegraphLeverProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  /** Array of scale markings for the telegraph */
  scale: TelegraphMark[];
}

// Helper to convert polar coordinates to Cartesian for SVG
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

/**
 * Generates the SVG path data string ('d' attribute) for an arc segment.
 * Used for drawing the background arc and potentially other curved elements.
 * @param cx Center X coordinate.
 * @param cy Center Y coordinate.
 * @param radius Radius of the arc.
 * @param startAngleDegrees Start angle in degrees (0 is up, clockwise).
 * @param endAngleDegrees End angle in degrees (0 is up, clockwise).
 * @returns SVG path 'd' attribute string for the arc.
 */
const describeArc = (
  cx: number,
  cy: number,
  radius: number,
  startAngleDegrees: number,
  endAngleDegrees: number,
): string => {
  // Ensure endAngle is slightly different if start/end are the same to draw correctly
  const clampedEndAngle =
    Math.abs(startAngleDegrees - endAngleDegrees) % 360 < 0.01
      ? endAngleDegrees - 0.01
      : endAngleDegrees;

  const adjustedEndAngle =
    clampedEndAngle <= startAngleDegrees
      ? clampedEndAngle + 360
      : clampedEndAngle;

  const start = polarToCartesian(cx, cy, radius, startAngleDegrees);
  const end = polarToCartesian(cx, cy, radius, adjustedEndAngle);

  const largeArcFlag = adjustedEndAngle - startAngleDegrees <= 180 ? '0' : '1';
  const sweepFlag = '1'; // Always clockwise for our setup

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

/**
 * Renders an Engine Order Telegraph (EOT) style lever control using SVG.
 * Features a background plate, correctly oriented labels, and drag interaction.
 */
export const TelegraphLever: React.FC<TelegraphLeverProps> = ({
  value: initialValue,
  min,
  max,
  onChange,
  label,
  scale,
}) => {
  // --- Geometry and Styling ---
  const bodyOuterRadius = 90; // Outer radius of the EOT body
  const bodyInnerRadius = 50; // Inner radius of the EOT body (creates the arc thickness)
  const tickRadius = (bodyOuterRadius + bodyInnerRadius) / 2; // Radius for tick marks center
  const tickLengthMajor = (bodyOuterRadius - bodyInnerRadius) * 0.4; // Length of major ticks
  const tickLengthMinor = tickLengthMajor * 0.6; // Length of minor ticks
  const labelRadius = tickRadius; // Place labels centered on the tick radius line
  const arcStartAngle = 270; // Start angle for the arc sweep (degrees, 0=up) - Adjusted for visual balance
  const arcEndAngle = 450; // End angle for the arc sweep - Adjusted
  const totalAngleSweep = arcEndAngle - arcStartAngle;
  const centerX = 100; // SVG center X
  const centerY = 100; // SVG center Y (lever pivot point)
  const handleLength = bodyOuterRadius * 0.85; // Length of the lever handle
  const handleWidth = 8;
  const knobRadius = 12;
  const pivotRadius = 6;
  const labelFontSize = 10;

  // Colors
  const bodyColor = '#2d3748'; // Dark gray-blue for the body
  const majorTickColor = '#FBBF24'; // Amber/Yellow
  const minorTickColor = '#6B7280'; // Medium Gray
  const labelColor = '#D1D5DB'; // Light Gray
  const handleColor = '#9CA3AF'; // Medium Gray
  const knobColor = '#E5E7EB'; // Light Gray
  const knobBorderColor = '#4B5563'; // Darker Gray
  const pivotColor = '#4B5563';

  // --- Drag Hook ---
  const { value, isDragging, handleMouseDown, handleDoubleClick } =
    useLeverDrag({
      initialValue,
      min,
      max,
      onChange,
      dragAxis: 'horizontal',
      dragSensitivity: 150,
      resetOnDoubleClick: true,
    });

  // --- Calculations ---
  const range = max - min;
  const normalizedValue = range === 0 ? 0 : (value - min) / range;
  const currentAngle = arcStartAngle + normalizedValue * totalAngleSweep;

  // --- EOT Body Path ---
  // Describes the arc shape for the background body
  const bodyPath = `
    ${describeArc(centerX, centerY, bodyOuterRadius, arcStartAngle, arcEndAngle)}
    L ${polarToCartesian(centerX, centerY, bodyInnerRadius, arcEndAngle).x} ${polarToCartesian(centerX, centerY, bodyInnerRadius, arcEndAngle).y}
    ${describeArc(centerX, centerY, bodyInnerRadius, arcEndAngle, arcStartAngle)}
    Z
  `;
  // The path starts by drawing the outer arc (M...A...), then draws a Line to the inner arc's end point (L...),
  // then draws the inner arc backwards (A...), and finally closes the path (Z). Note the reversed start/end angles for the inner arc draw.

  return (
    <div className="flex flex-col items-center p-2">
      <div className="text-white mb-2 text-sm font-semibold">{label}</div>
      <svg
        width="200"
        height="140" // Increased height slightly for labels
        viewBox="0 0 200 140"
        className="cursor-grab select-none" // Prevent text selection during drag
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* EOT Body Background */}
        <path d={bodyPath} fill={bodyColor} />

        {/* Scale Markings and Labels */}
        {scale.map(mark => {
          const markNorm = range === 0 ? 0 : (mark.value - min) / range;
          const angle = arcStartAngle + markNorm * totalAngleSweep;

          // Tick positions
          const tickInnerR =
            tickRadius - (mark.major ? tickLengthMajor : tickLengthMinor) / 2;
          const tickOuterR =
            tickRadius + (mark.major ? tickLengthMajor : tickLengthMinor) / 2;
          const tickStart = polarToCartesian(
            centerX,
            centerY,
            tickInnerR,
            angle,
          );
          const tickEnd = polarToCartesian(centerX, centerY, tickOuterR, angle);

          // Label position
          const labelPos = polarToCartesian(
            centerX,
            centerY,
            labelRadius,
            angle,
          );

          // Determine rotation for labels
          let labelTransform = '';
          const isStop = mark.label.toUpperCase() === 'STOP';
          const isAstern = mark.value < 0;

          if (isStop) {
            // Rotate STOP vertically - adjust angle (e.g., -90) as needed for desired orientation
            labelTransform = `rotate(-90, ${labelPos.x}, ${labelPos.y})`;
          } else {
            // Rotate other labels along the arc.
            // Add 180 degrees for 'Astern' labels to flip them upright.
            const rotationAngle = angle + (isAstern ? 90 : -90); // Adjust base rotation for readability
            labelTransform = `rotate(${rotationAngle}, ${labelPos.x}, ${labelPos.y})`;
          }

          return (
            <g key={mark.value}>
              {/* Tick mark line */}
              <line
                x1={tickStart.x}
                y1={tickStart.y}
                x2={tickEnd.x}
                y2={tickEnd.y}
                stroke={mark.major ? majorTickColor : minorTickColor}
                strokeWidth={mark.major ? 2 : 1.5}
              />
              {/* Label text */}
              <text
                x={labelPos.x}
                y={labelPos.y}
                fill={labelColor}
                fontSize={labelFontSize}
                fontWeight={mark.major ? 'bold' : 'normal'}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={labelTransform} // Apply calculated rotation
              >
                {mark.label}
              </text>
            </g>
          );
        })}

        {/* Lever Handle - Drawn last to be on top */}
        <g transform={`rotate(${currentAngle}, ${centerX}, ${centerY})`}>
          {/* Arm */}
          <rect
            x={centerX - handleWidth / 2}
            y={centerY - handleLength} // Start drawing from the end point inwards
            width={handleWidth}
            height={handleLength - pivotRadius} // Stop before the pivot
            fill={handleColor}
            rx={handleWidth / 4} // Slightly rounded arm edges
          />
          {/* Knob */}
          <circle
            cx={centerX}
            cy={centerY - handleLength}
            r={knobRadius}
            fill={knobColor}
            stroke={knobBorderColor}
            strokeWidth="1.5"
          />
        </g>

        {/* Pivot Point */}
        <circle cx={centerX} cy={centerY} r={pivotRadius} fill={pivotColor} />
      </svg>

      {/* Value Display */}
      <div className="mt-2 min-h-[1.5em]">
        <span className="text-white font-mono text-sm">
          {
            scale.reduce(
              (closest, current) =>
                Math.abs(current.value - value) <
                Math.abs(closest.value - value)
                  ? current
                  : closest,
              scale[0] || { label: '' },
            ).label
          }
        </span>
      </div>
    </div>
  );
};
