import React from 'react';

interface MachineGaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  redThreshold?: number;
  yellowThreshold?: number;
  size?: number; // Size now refers to the outer diameter
}

/**
 * Converts polar coordinates (angle in degrees, radius) to Cartesian coordinates (x, y).
 * Necessary for calculating SVG path points from angles.
 * Assumes 0 degrees is pointing upwards (like a clock face) and positive angles go clockwise.
 * @param angleDegrees Angle in degrees.
 * @param radius Distance from the origin (center of the gauge).
 * @returns Cartesian coordinates { x: number, y: number } relative to the center.
 */
const polarToCartesian = (
  angleDegrees: number,
  radius: number,
): { x: number; y: number } => {
  // Convert degrees to radians and adjust so 0 degrees is up (-90 degrees in standard Cartesian)
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180.0;
  return {
    x: radius * Math.cos(angleRadians),
    y: radius * Math.sin(angleRadians),
  };
};

/**
 * Generates the SVG path data string ('d' attribute) for an arc segment.
 * This function encapsulates the logic for the SVG 'A' (arc) command.
 * @param radius Radius of the arc.
 * @param startAngleDegrees Start angle in degrees (0 is up, clockwise).
 * @param endAngleDegrees End angle in degrees (0 is up, clockwise).
 * @returns SVG path 'd' attribute string for the arc.
 */
const describeArc = (
  radius: number,
  startAngleDegrees: number,
  endAngleDegrees: number,
): string => {
  // Prevent rendering issues if start and end are effectively the same
  if (Math.abs(startAngleDegrees - endAngleDegrees) < 0.01) return '';
  // Ensure endAngle is greater for arc calculation logic if it wraps around
  const adjustedEndAngle =
    endAngleDegrees <= startAngleDegrees
      ? endAngleDegrees + 360
      : endAngleDegrees;

  const start = polarToCartesian(startAngleDegrees, radius);
  const end = polarToCartesian(adjustedEndAngle, radius);

  // large-arc-flag is 1 if the arc spans more than 180 degrees
  const largeArcFlag = adjustedEndAngle - startAngleDegrees <= 180 ? '0' : '1';
  // sweep-flag is 1 for clockwise, 0 for counter-clockwise
  const sweepFlag = '1';

  // Construct the SVG path data string: M(ove) to start, A(rc) to end
  const d = [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0, // x-axis-rotation (0 for circular arcs)
    largeArcFlag,
    sweepFlag,
    end.x,
    end.y,
  ].join(' ');

  return d;
};

/**
 * Renders an analog gauge similar to those found in engine rooms using SVG.
 * Displays a value within a min/max range, with optional color zones.
 * This approach uses SVG for reliable rendering of arcs and lines.
 */
export const MachineGauge: React.FC<MachineGaugeProps> = ({
  value,
  min,
  max,
  label,
  unit,
  redThreshold,
  yellowThreshold,
  // Apply default size directly in the destructuring
  size: outerSize = 80,
}) => {
  // --- Input Validation & Clamping ---
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const clampedValue = Math.max(min, Math.min(max, safeValue));
  const range = max - min;
  const percentage = range === 0 ? 0 : (clampedValue - min) / range;

  // --- Angle Calculations (Degrees, 0 is up, clockwise sweep) ---
  // Define the gauge's visual sweep range
  const totalAngleSweep = 270;
  // Start angle visually corresponds to ~7:30 position
  const startAngle = 225;
  // End angle visually corresponds to ~4:30 position
  const endAngle = startAngle + totalAngleSweep; // 135 + 270 = 405
  // Calculate the needle's angle based on the value percentage
  const valueAngle = startAngle + percentage * totalAngleSweep;

  // --- Color Zone Calculations ---
  const greenColor = '#48bb78';
  const yellowColor = '#ecc94b';
  const redColor = '#f56565';
  const faceColor = '#f7fafc';
  const markColor = '#2d3748';
  const bezelColor = '#1a202c';
  const hubColor = '#2d3748';

  /**
   * Calculates the angular stop point for a threshold within the gauge's sweep.
   * @param threshold The threshold value (e.g., yellowThreshold).
   * @returns The angle (degrees, 0=up, clockwise) where the color zone ends.
   */
  const calculateStopAngle = (threshold: number | undefined): number => {
    // If no threshold or range is invalid, the zone extends to the end angle.
    if (threshold === undefined || range === 0) {
      return endAngle;
    }
    // Calculate the threshold's percentage within the range, clamped between 0 and 1.
    const thresholdPercentage = Math.max(
      0,
      Math.min(1, (threshold - min) / range),
    );
    // Convert percentage to the corresponding angle within the sweep.
    return startAngle + thresholdPercentage * totalAngleSweep;
  };

  const yellowStopAngle = calculateStopAngle(yellowThreshold);
  const redStopAngle = calculateStopAngle(redThreshold);

  // Determine the color for the digital value display based on thresholds.
  const valueTextColor = (() => {
    if (redThreshold !== undefined && safeValue >= redThreshold)
      return redColor;
    if (yellowThreshold !== undefined && safeValue >= yellowThreshold)
      return yellowColor;
    return markColor; // Use dark color for normal range for contrast
  })();

  // --- Styling Constants ---
  // Calculations are relative to outerSize for scalability.
  const bezelWidth = Math.max(1, Math.round(outerSize * 0.06));
  // faceSize is the diameter of the area inside the bezel.
  const faceSize = Math.max(0, outerSize - 2 * bezelWidth);
  const faceRadius = faceSize / 2;
  // facePadding is the space between the face edge and the start of the arc/ticks.
  const facePadding = Math.max(1, Math.round(faceSize * 0.06));
  // arcWidth is the thickness of the colored arc.
  const arcWidth = Math.max(2, Math.round(faceSize * 0.1));
  // arcCenterRadius is the radius to the midline of the arc path.
  const arcCenterRadius = Math.max(0, faceRadius - facePadding - arcWidth / 2);
  // needleLength extends slightly past the arc's center radius for visibility.
  const needleLength = arcCenterRadius * 1.05;
  const needleWidth = Math.max(1, Math.round(outerSize * 0.025));
  // centerHubRadius is the size of the central circle.
  const centerHubRadius = Math.max(2, needleWidth * 1.25);
  const tickWidth = Math.max(1, needleWidth * 0.75);
  // Ticks are positioned relative to the arc center radius.
  const majorTickHeight = arcWidth * 0.8;
  const minorTickHeight = majorTickHeight * 0.6;
  // Calculate inner/outer radii for drawing tick lines.
  const tickInnerRadius = Math.max(0, arcCenterRadius - majorTickHeight / 2);
  const tickOuterRadius = arcCenterRadius + majorTickHeight / 2;
  const minorTickInnerRadius = Math.max(
    0,
    arcCenterRadius - minorTickHeight / 2,
  );
  const minorTickOuterRadius = arcCenterRadius + minorTickHeight / 2;

  // --- SVG ViewBox ---
  // Center the viewBox at (0,0). Size is based on faceRadius.
  // Use faceSize directly for width/height to match the drawing area.
  const viewBoxMin = -faceRadius;
  const viewBox = `${viewBoxMin} ${viewBoxMin} ${faceSize} ${faceSize}`;

  // --- Markings ---
  const numTicks = 10; // Number of intervals marked on the gauge
  const tickAngles = Array.from(
    { length: numTicks + 1 },
    (_, i) => startAngle + (i / numTicks) * totalAngleSweep,
  );

  return (
    <div
      className="flex flex-col items-center"
      style={{ width: `${outerSize}px` }}
      aria-label={`${label}: ${safeValue.toFixed(1)}${unit}`}
      role="meter"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={clampedValue}
    >
      {/* Label */}
      <div className="text-xs text-center text-white mb-1 font-bold truncate w-full px-1">
        {label}
      </div>

      {/* Gauge Body (Bezel) */}
      <div
        className="relative shadow-lg"
        style={{
          width: `${outerSize}px`,
          height: `${outerSize}px`,
          padding: `${bezelWidth}px`,
          background: bezelColor,
          border: `1px solid ${markColor}`,
          boxSizing: 'border-box',
          borderRadius: '50%',
        }}
      >
        {/* SVG Container for the gauge face graphics */}
        <div
          className="relative w-full h-full" // Occupies the space inside the bezel padding
          style={{ background: faceColor, borderRadius: '50%' }}
        >
          <svg
            viewBox={viewBox}
            width="100%"
            height="100%"
            // Prevent potential extra space below the inline SVG element
            style={{ display: 'block' }}
          >
            {/* Color Arcs: Drawn as separate paths for simplicity */}
            {/* Green Arc: From start to yellow threshold (or end if no yellow) */}
            <path
              d={describeArc(arcCenterRadius, startAngle, yellowStopAngle)}
              fill="none"
              stroke={greenColor}
              strokeWidth={arcWidth}
            />
            {/* Yellow Arc: From yellow threshold to red threshold (or end if no red) */}
            {/* Only drawn if yellowThreshold is defined */}
            {yellowThreshold !== undefined && (
              <path
                d={describeArc(arcCenterRadius, yellowStopAngle, redStopAngle)}
                fill="none"
                stroke={yellowColor}
                strokeWidth={arcWidth}
              />
            )}
            {/* Red Arc: From red threshold to the end angle */}
            {/* Only drawn if redThreshold is defined */}
            {redThreshold !== undefined && (
              <path
                d={describeArc(arcCenterRadius, redStopAngle, endAngle)}
                fill="none"
                stroke={redColor}
                strokeWidth={arcWidth}
              />
            )}

            {/* Ticks: Drawn as lines radiating from the center */}
            {tickAngles.map((angle, index) => {
              const isMajorTick = index % (numTicks / 2) === 0;
              // Determine inner/outer radius based on whether it's a major/minor tick
              const innerR = isMajorTick
                ? tickInnerRadius
                : minorTickInnerRadius;
              const outerR = isMajorTick
                ? tickOuterRadius
                : minorTickOuterRadius;
              // Calculate start and end points using polar conversion
              const startPt = polarToCartesian(angle, innerR);
              const endPt = polarToCartesian(angle, outerR);
              return (
                <line
                  key={`tick-${angle}`}
                  x1={startPt.x}
                  y1={startPt.y}
                  x2={endPt.x}
                  y2={endPt.y}
                  stroke={markColor}
                  strokeWidth={tickWidth}
                />
              );
            })}

            {/* Needle: Drawn as a line rotated to the value angle */}
            {(() => {
              // Calculate the needle's end point based on its angle and length
              const needleEnd = polarToCartesian(valueAngle, needleLength);
              return (
                <line
                  x1={0} // Starts at the center (0,0 in viewBox)
                  y1={0}
                  x2={needleEnd.x}
                  y2={needleEnd.y}
                  stroke={markColor}
                  strokeWidth={needleWidth}
                  // Use round line caps for a smoother needle appearance
                  strokeLinecap="round"
                />
              );
            })()}

            {/* Center Hub: A circle drawn at the center */}
            <circle
              cx={0}
              cy={0}
              r={centerHubRadius}
              fill={hubColor}
              stroke={markColor}
              strokeWidth={1} // Thin border for the hub
            />
          </svg>
        </div>
      </div>

      {/* Value Display */}
      <div
        className="text-center mt-1 font-mono text-sm"
        style={{ color: valueTextColor }}
      >
        {/* Display value with one decimal place */}
        {safeValue.toFixed(1)}
        {unit}
      </div>
    </div>
  );
};
