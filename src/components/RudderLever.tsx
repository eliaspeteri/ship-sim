import React, { useRef } from 'react';
import { useLeverDrag } from '../hooks/useLeverDrag';

// Define the structure for scale markings
interface RudderMark {
  label: string;
  value: number;
  major?: boolean; // Optional flag for major markings
}

interface RudderLeverProps {
  value: number; // Current rudder angle value (e.g., -35 to 35)
  min: number; // Min value (e.g., -35)
  max: number; // Max value (e.g., 35)
  onChange: (value: number) => void; // Callback when value changes
  label: string; // Label for the control
  scale: RudderMark[]; // Scale markings definition
}

/**
 * Converts polar coordinates (angle in degrees, radius) to Cartesian coordinates (x, y).
 * Assumes 0 degrees is Up, 90 is Right, 180 is Down, 270 is Left.
 * @param centerX The x-coordinate of the center point.
 * @param centerY The y-coordinate of the center point.
 * @param radius The radius.
 * @param angleInDegrees The angle in degrees.
 * @returns The Cartesian coordinates { x, y }.
 */
const polarToCartesian = (
  ...args: [
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number,
  ]
): { x: number; y: number } => {
  const [centerX, centerY, radius, angleInDegrees] = args;
  // Adjust angle so that 0 degrees is pointing upwards (mathematical standard is 0 degrees right)
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

/**
 * Describes the SVG path data ('d' attribute) for a filled arc segment.
 * @param cx Center X coordinate.
 * @param cy Center Y coordinate.
 * @param outerRadius Outer radius of the arc segment.
 * @param innerRadius Inner radius of the arc segment.
 * @param startAngleDegrees Start angle in degrees (0=Up, clockwise).
 * @param endAngleDegrees End angle in degrees (0=Up, clockwise).
 * @returns SVG path 'd' attribute string for the arc segment.
 */
const describeArcSegment = (
  ...args: [
    cx: number,
    cy: number,
    outerRadius: number,
    innerRadius: number,
    startAngleDegrees: number,
    endAngleDegrees: number,
  ]
): string => {
  const [cx, cy, outerRadius, innerRadius, startAngleDegrees, endAngleDegrees] =
    args;
  // Avoid issues with arcs of zero or 360 degrees by slightly adjusting the end angle
  const clampedEndAngle =
    Math.abs(startAngleDegrees - endAngleDegrees) % 360 < 0.001
      ? endAngleDegrees - 0.01 // If start and end are effectively the same, nudge end slightly
      : endAngleDegrees;

  const startOuter = polarToCartesian(cx, cy, outerRadius, startAngleDegrees);
  const endOuter = polarToCartesian(cx, cy, outerRadius, clampedEndAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, startAngleDegrees);
  const endInner = polarToCartesian(cx, cy, innerRadius, clampedEndAngle);

  const angleDiff = clampedEndAngle - startAngleDegrees;
  // large-arc-flag is 1 if the arc spans more than 180 degrees
  const largeArcFlag = Math.abs(angleDiff) <= 180 ? '0' : '1';
  // sweep-flag is 1 for clockwise, 0 for counter-clockwise
  const sweepFlag = angleDiff >= 0 ? '1' : '0';
  // sweep-flag for the inner arc return path (drawn in reverse direction)
  const sweepFlagReverse = angleDiff >= 0 ? '0' : '1';

  const d = [
    'M',
    startOuter.x,
    startOuter.y, // Move to start point on outer radius
    'A',
    outerRadius,
    outerRadius,
    0,
    largeArcFlag,
    sweepFlag,
    endOuter.x,
    endOuter.y, // Draw outer arc
    'L',
    endInner.x,
    endInner.y, // Line to end point on inner radius
    'A',
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    sweepFlagReverse,
    startInner.x,
    startInner.y, // Draw inner arc backwards
    'Z', // Close path (line back to start point on outer radius)
  ].join(' ');

  return d;
};

/**
 * Renders a Rudder Angle Indicator style lever control using SVG.
 * Displays rudder angle on a 120-degree arc centered at the bottom.
 * Features red (port) and green (starboard) sections and radial drag interaction.
 */
export const RudderLever: React.FC<RudderLeverProps> = ({
  value: currentValue,
  min,
  max,
  onChange,
  label,
  scale,
}) => {
  // --- Component Constants ---
  const centerX = 100; // SVG center X
  const centerY = 0; // SVG center Y (Pivot point)
  const outerRadius = 120; // Outer edge of the colored arcs
  const innerRadius = 90; // Inner edge of the colored arcs
  const tickRadius = (outerRadius + innerRadius) / 2; // Radius for tick marks
  const tickLengthMajor = 10; // Length of major scale ticks
  const tickLengthMinor = 6; // Length of minor scale ticks
  const labelRadius = outerRadius + 15; // Radius for placing scale labels
  const pivotRadius = 32; // Radius of the central pivot circle
  const handleLength = outerRadius + 32; // Length of the lever arm
  const handleWidth = 8; // Width of the lever arm
  const knobRadius = handleWidth; // Radius of the knob at the lever's end

  // --- Angle Configuration ---
  const totalAngleSweep = 120; // Total arc span in degrees
  const centerAngle = 180; // Angle for the center (bottom) of the arc (0 degrees is Up)
  const arcStartAngle = centerAngle - totalAngleSweep / 2; // Starting angle (e.g., 210 deg)
  const arcEndAngle = centerAngle + totalAngleSweep / 2; // Ending angle (e.g., 330 deg)

  // --- Colors ---
  const bgColor = '#1F2937'; // Gray-800 for the background
  const portColor = '#EF4444'; // Red-500 for negative values (Port)
  const starboardColor = '#22C55E'; // Green-500 for positive values (Starboard)
  const tickColor = '#9CA3AF'; // Gray-400 for scale ticks
  const labelColor = '#D1D5DB'; // Gray-300 for scale labels
  const handleColor = '#D1D5DB'; // Gray-100 for the lever handle
  const pivotColor = '#6B7280'; // Gray-500 for the central pivot

  const svgRef = useRef<SVGSVGElement>(null);

  // Invert min and max values to fix the drag direction
  const invertedMin = -max;
  const invertedMax = -min;
  const invertedValue = -currentValue;

  // Adapter function to convert from inverted value back to normal value
  const handleInvertedChange = (invertedValue: number): void => {
    onChange(-invertedValue); // Convert back from inverted space
  };

  // Use the lever drag hook with inverted parameters
  const {
    value: invertedCurrentValue,
    isDragging,
    handleMouseDown,
    handleDoubleClick,
  } = useLeverDrag({
    initialValue: invertedValue,
    min: invertedMin,
    max: invertedMax,
    onChange: handleInvertedChange,
    dragSensitivity: 300,
    dragAxis: 'horizontal',
    resetOnDoubleClick: true,
  });

  // Convert back from inverted space for display
  const value = -invertedCurrentValue;

  // --- Value to Angle Calculation ---
  const range = max - min;
  // Use the non-inverted value for angle calculation
  const normalizedValue = range === 0 ? 0.5 : (value - min) / range;
  const currentAngle = arcStartAngle + normalizedValue * totalAngleSweep;

  // Calculate the angle corresponding to the zero value (used to split red/green arcs)
  const zeroValueNormalized = range === 0 ? 0.5 : (0 - min) / range;
  const zeroAngle = arcStartAngle + zeroValueNormalized * totalAngleSweep; // Should be 270 degrees

  // --- SVG Path Data ---
  // Generate path data for the red (Port) and green (Starboard) arc segments
  const portArcPath = describeArcSegment(
    centerX,
    centerY,
    outerRadius,
    innerRadius,
    arcStartAngle,
    zeroAngle,
  );
  const starboardArcPath = describeArcSegment(
    centerX,
    centerY,
    outerRadius,
    innerRadius,
    zeroAngle,
    arcEndAngle,
  );

  return (
    <div className="flex flex-col items-center p-2">
      {/* Label Text */}
      <div className="text-white mb-1 text-sm font-semibold">{label}</div>
      {/* SVG Container */}
      <svg
        ref={svgRef}
        width="100" // Width of the SVG canvas
        height="150" // Height adjusted to accommodate labels below the arc
        viewBox="0 0 200 150" // ViewBox defines the coordinate system
        className="select-none" // Prevent text selection within SVG
        onMouseDown={handleMouseDown} // Use the hook's mouseDown handler
        onDoubleClick={handleDoubleClick} // Use the hook's doubleClick handler for resetting to center
        style={{
          cursor: isDragging ? 'grabbing' : 'grab', // Use isDragging from the hook
          backgroundColor: bgColor,
        }}
      >
        {/* Port Arc Segment (Red) */}
        <path d={portArcPath} fill={portColor} />

        {/* Starboard Arc Segment (Green) */}
        <path d={starboardArcPath} fill={starboardColor} />

        {/* Scale Markings and Labels */}
        {scale.map(mark => {
          // Calculate position and angle for each scale mark
          const markNorm = range === 0 ? 0.5 : (mark.value - min) / range;
          const angle = arcStartAngle + markNorm * totalAngleSweep;

          // Calculate start and end points for the tick line
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

          // Calculate position for the label text
          const labelPos = polarToCartesian(
            centerX,
            centerY,
            labelRadius,
            angle,
          );

          // Calculate rotation for the label to keep it upright relative to the arc
          const rotation = angle - centerAngle; // Angle relative to the bottom center (270 deg)
          const labelTransform = `rotate(${rotation}, ${labelPos.x}, ${labelPos.y})`;

          return (
            <g key={mark.value}>
              {/* Tick Mark Line */}
              <line
                x1={tickStart.x}
                y1={tickStart.y}
                x2={tickEnd.x}
                y2={tickEnd.y}
                stroke={tickColor}
                strokeWidth={mark.major ? 1.5 : 1} // Thicker ticks for major marks
              />
              {/* Label Text */}
              <text
                x={labelPos.x}
                y={labelPos.y}
                fill={labelColor}
                fontSize="10" // Font size for labels
                fontWeight={mark.major ? 'bold' : 'normal'} // Bold font for major labels
                textAnchor="middle" // Center text horizontally
                dominantBaseline="middle" // Center text vertically
                transform={labelTransform} // Apply rotation
              >
                {mark.label}
              </text>
            </g>
          );
        })}

        {/* Lever Handle Group - Rotated based on currentAngle */}
        {/* The handle itself is drawn pointing downwards (270 deg) in its local coordinate system */}
        <g
          transform={`rotate(${currentAngle - centerAngle}, ${centerX}, ${centerY})`}
        >
          {/* Lever Arm (Rectangle) */}
          <rect
            x={centerX - handleWidth / 2} // Center the rectangle horizontally
            y={centerY + pivotRadius} // Start drawing below the pivot
            width={handleWidth}
            height={handleLength} // Length of the arm
            fill={handleColor}
            rx={handleWidth / 4} // Slightly rounded corners
          />
          {/* Knob (Circle at the end) */}
          <circle
            cx={centerX}
            cy={centerY + pivotRadius + handleLength} // Position at the end of the arm
            r={knobRadius}
            fill={handleColor}
            stroke={pivotColor} // Border color for the knob
            strokeWidth="1"
          />
        </g>

        {/* Central Pivot Point (Circle) */}
        <circle cx={centerX} cy={centerY} r={pivotRadius} fill={pivotColor} />
      </svg>

      {/* Value Display Below SVG */}
      <div className="mt-1 min-h-[1.5em]">
        {/* Reserve space for text */}
        <span className="text-white font-mono text-sm">
          {/* Display value from the hook with one decimal place and degree symbol */}
          {value.toFixed(1)}°
        </span>
      </div>
    </div>
  );
};
