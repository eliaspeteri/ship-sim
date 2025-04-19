import React from 'react';

// Define the props interface for type safety and clarity
interface CircularGaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  size?: number; // Optional size prop
  warningThreshold?: number;
  criticalThreshold?: number;
}

/**
 * Renders a circular gauge to display a value within a range.
 * It visually indicates the value with a colored arc and provides textual feedback.
 * Thresholds can be set to change the arc color for warnings or critical levels.
 */
export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  min,
  max,
  label,
  unit,
  size = 120, // Default size if not provided
  warningThreshold,
  criticalThreshold,
}) => {
  // Clamp the value within the min/max range before calculating the angle
  const clampedValue = Math.min(max, Math.max(min, value || 0));
  // Calculate the angle of the gauge arc (0 to 270 degrees)
  const angle = ((clampedValue - min) / (max - min)) * 270;

  // Determine the color of the gauge arc based on thresholds
  const getColor = (): string => {
    // Use critical color if value meets or exceeds the critical threshold
    if (
      criticalThreshold !== undefined &&
      clampedValue >= criticalThreshold &&
      warningThreshold !== undefined &&
      criticalThreshold > warningThreshold // Ensure critical is higher prio if both met
    )
      return '#f56565'; // Red for critical
    // Use warning color if value meets or exceeds the warning threshold
    if (warningThreshold !== undefined && clampedValue >= warningThreshold)
      return '#ed8936'; // Orange for warning
    // Default color if no thresholds are met or defined
    return '#48bb78'; // Green for normal
  };

  const color = getColor(); // Cache the color determination

  // Define SVG path for the gauge arc background (full 270 degrees)
  const backgroundArcPath = describeArc(
    size / 2,
    size / 2,
    size / 2 - 10,
    -135,
    135,
  );
  // Define SVG path for the gauge value arc based on the calculated angle
  const valueArcPath = describeArc(
    size / 2,
    size / 2,
    size / 2 - 10,
    -135,
    angle - 135,
  );

  return (
    // Use flex column, center items, allow full width up to max size
    <div className={`flex flex-col items-center w-full max-w-[${size}px]`}>
      <div className="text-white font-bold mb-1 text-center text-sm truncate w-full px-1">
        {label}
      </div>
      {/* Use SVG for smoother rendering and easier arc drawing */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative"
      >
        {/* Background Arc */}
        <path
          d={backgroundArcPath}
          fill="none"
          stroke="#374151" // Use a gray color from Tailwind palette (gray-700)
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Value Arc */}
        <path
          d={valueArcPath}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.3s ease, stroke 0.3s ease' }} // Smooth transition for value changes
        />

        {/* Center Text */}
        <text
          x="50%"
          y="50%"
          dy=".3em" // Vertically center text
          textAnchor="middle" // Horizontally center text
          className="fill-current text-white font-bold"
          fontSize={size * 0.2} // Scale font size with gauge size
        >
          {Math.round(value || 0)}
        </text>
        <text
          x="50%"
          y="50%"
          dy="1.8em" // Position unit below the value
          textAnchor="middle"
          className="fill-current text-gray-400"
          fontSize={size * 0.1} // Smaller font size for unit
        >
          {unit}
        </text>

        {/* Optional: Add Ticks (can be complex with SVG arcs) */}
        {/* Example for min/max text labels instead of ticks */}
        <text
          x="15%"
          y="95%"
          textAnchor="middle"
          className="fill-current text-gray-400 text-xs"
        >
          {min}
        </text>
        <text
          x="85%"
          y="95%"
          textAnchor="middle"
          className="fill-current text-gray-400 text-xs"
        >
          {max}
        </text>
      </svg>
    </div>
  );
};

// Helper function to describe an SVG arc path
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  // Ensure endAngle doesn't slightly exceed startAngle for full circles if needed
  if (endAngle - startAngle >= 360) {
    endAngle = startAngle + 359.99;
  } else if (endAngle < startAngle) {
    // Handle cases where the value maps to an angle less than the start
    // For this gauge, angles range from -135 to +135. If angle is less than -135, draw nothing.
    endAngle = startAngle; // Effectively draws a zero-length arc
  }

  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  const d = [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');

  return d;
}
