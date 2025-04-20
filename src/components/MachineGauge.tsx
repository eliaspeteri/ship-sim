import React from 'react';

/**
 * Defines a colored zone on the gauge.
 * If min/max are omitted, the zone extends to the start/end of the scale.
 */
interface GaugeZone {
  color: string;
  min?: number;
  max?: number;
}

interface MachineGaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  /** Array of zones defining colored segments on the gauge arc. */
  zones?: GaugeZone[];
  /** Outer diameter of the gauge in pixels. */
  size?: number;
  /** Number of numerical labels to display along the scale. */
  numLabels?: number;
}

/**
 * Converts polar coordinates (angle in degrees, radius) to Cartesian coordinates (x, y).
 * Assumes 0 degrees is pointing upwards (like a clock face) and positive angles go clockwise.
 * The SVG coordinate system has Y increasing downwards, hence the angle adjustment.
 * @param angleDegrees Angle in degrees (0=up, clockwise).
 * @param radius Distance from the origin (center of the gauge).
 * @returns Cartesian coordinates { x: number, y: number } relative to the center (0,0).
 */
const polarToCartesian = (
  angleDegrees: number,
  radius: number,
): { x: number; y: number } => {
  // Convert degrees to radians. Subtract 90 because in standard trig, 0 degrees is right,
  // but we want 0 degrees to be up.
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180.0;
  return {
    // Standard formulas for polar to Cartesian conversion.
    x: radius * Math.cos(angleRadians),
    y: radius * Math.sin(angleRadians),
  };
};

/**
 * Generates the SVG path data string ('d' attribute) for an arc segment.
 * This is crucial for drawing the colored zones and potentially other arc-based elements.
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
  // Avoid issues with arcs of zero length or full circles described incorrectly.
  // A tiny epsilon difference ensures the arc command works as expected.
  const clampedEndAngle =
    Math.abs(startAngleDegrees - endAngleDegrees) % 360 < 0.01
      ? endAngleDegrees - 0.01 // Slightly less if start/end are same
      : endAngleDegrees;

  // Ensure endAngle is treated as being 'after' startAngle, even if it wraps past 360.
  // This is important for the large-arc-flag calculation.
  const adjustedEndAngle =
    clampedEndAngle <= startAngleDegrees
      ? clampedEndAngle + 360
      : clampedEndAngle;

  const start = polarToCartesian(startAngleDegrees, radius);
  const end = polarToCartesian(adjustedEndAngle, radius);

  // Determine if the arc spans more than 180 degrees.
  const largeArcFlag = adjustedEndAngle - startAngleDegrees <= 180 ? '0' : '1';
  // '1' for clockwise sweep, which matches our angle convention.
  const sweepFlag = '1';

  // Construct the SVG path data string:
  // M(ove) to the start point.
  // A(rc) command: rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, end.x, end.y
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
 * Displays a value within a min/max range, with configurable color zones and labels.
 */
export const MachineGauge: React.FC<MachineGaugeProps> = ({
  value,
  min,
  max,
  label,
  unit,
  zones,
  size: outerSize = 120, // Increased default size for labels
  numLabels = 6, // Default number of labels
}) => {
  // --- Input Validation & Clamping ---
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : min; // Default to min if invalid
  const clampedValue = Math.max(min, Math.min(max, safeValue));
  const range = max - min;
  // Handle division by zero if min === max.
  const percentage = range === 0 ? 0 : (clampedValue - min) / range;

  // --- Angle Calculations (Degrees, 0 is up, clockwise sweep) ---
  const totalAngleSweep = 270;
  // Start angle at ~7:30 position (225 degrees from top).
  const startAngle = 225;
  // End angle at ~4:30 position.
  const endAngle = startAngle + totalAngleSweep; // 225 + 270 = 495
  const valueAngle = startAngle + percentage * totalAngleSweep;

  // --- Color & Zone Definitions ---
  const defaultColor = '#48bb78'; // Default green if no zones match
  // Provide a default green zone if none are specified by the user.
  const safeZones =
    zones && zones.length > 0
      ? zones
      : [{ color: defaultColor, min: min, max: max }];

  /**
   * Converts a value to its corresponding angle on the gauge scale.
   * @param val The value to convert.
   * @returns The angle in degrees (0=up, clockwise).
   */
  const valueToAngle = (val: number): number => {
    const valPercentage = range === 0 ? 0 : (val - min) / range;
    // Clamp percentage to handle values outside min/max for zone boundaries.
    const clampedPercentage = Math.max(0, Math.min(1, valPercentage));
    return startAngle + clampedPercentage * totalAngleSweep;
  };

  // Determine the color for the digital value display based on zones.
  // --- Styling Constants ---
  const markColor = '#2d3748'; // Color for ticks, needle, default text

  const valueTextColor = (() => {
    // Find the first zone that contains the current value.
    const currentZone = safeZones.find(
      zone =>
        (zone.min === undefined || safeValue >= zone.min) &&
        (zone.max === undefined || safeValue <= zone.max),
    );
    // Use the zone's color, or the default mark color if no zone matches (shouldn't happen with default zone).
    return currentZone?.color || markColor;
  })();
  const faceColor = '#f7fafc';
  const bezelColor = '#1a202c';
  const hubColor = '#2d3748';

  const bezelWidth = Math.max(1, Math.round(outerSize * 0.06));
  const faceSize = Math.max(0, outerSize - 2 * bezelWidth);
  const faceRadius = faceSize / 2;
  // Increased padding slightly to give labels more room from the edge.
  const facePadding = Math.max(1, Math.round(faceSize * 0.08));
  const arcWidth = Math.max(2, Math.round(faceSize * 0.1));
  const arcCenterRadius = Math.max(0, faceRadius - facePadding - arcWidth / 2);
  const needleLength = arcCenterRadius * 0.95; // Keep needle inside arc radius
  const needleWidth = Math.max(1, Math.round(outerSize * 0.025));
  const centerHubRadius = Math.max(2, needleWidth * 1.25);
  const tickWidth = Math.max(1, needleWidth * 0.75);
  const majorTickHeight = arcWidth * 0.8;
  const minorTickHeight = majorTickHeight * 0.6;
  const tickInnerRadius = Math.max(0, arcCenterRadius - majorTickHeight / 2);
  const tickOuterRadius = arcCenterRadius + majorTickHeight / 2;
  const minorTickInnerRadius = Math.max(
    0,
    arcCenterRadius - minorTickHeight / 2,
  );
  const minorTickOuterRadius = arcCenterRadius + minorTickHeight / 2;
  // Radius for placing the numerical labels, slightly outside the ticks.
  const labelRadius = tickOuterRadius * 1.1; // Adjust multiplier as needed
  // Dynamic font size based on face radius.
  const labelFontSize = Math.max(6, Math.round(faceRadius * 0.15)); // Min size 6px

  // --- SVG ViewBox ---
  // Center the coordinate system at (0,0) within the SVG.
  const viewBoxMin = -faceRadius;
  const viewBox = `${viewBoxMin} ${viewBoxMin} ${faceSize} ${faceSize}`;

  // --- Markings & Labels ---
  const numTicks = (numLabels - 1) * 2 || 10; // Keep 10 intervals for visual ticks
  const tickAngles = Array.from(
    { length: numTicks + 1 },
    (_, i) => startAngle + (i / numTicks) * totalAngleSweep,
  );

  // Calculate labels based on numLabels prop.
  const labels = Array.from({ length: numLabels }, (_, i) => {
    // Calculate the value for this label step.
    const labelValue = min + (i / (numLabels - 1)) * range;
    // Calculate the angle corresponding to this value.
    const angle = valueToAngle(labelValue);
    // Calculate the position for the label text.
    const position = polarToCartesian(angle, labelRadius);
    // Determine precision based on the range step. Avoid excessive decimals.
    const step = range / (numLabels - 1);
    const precision = step < 1 ? (step < 0.1 ? 2 : 1) : 0;
    return {
      value: labelValue.toFixed(precision),
      angle: angle,
      x: position.x,
      y: position.y,
    };
  });

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
        {/* SVG Container */}
        <div
          className="relative w-full h-full"
          style={{ background: faceColor, borderRadius: '50%' }}
        >
          <svg
            viewBox={viewBox}
            width="100%"
            height="100%"
            style={{ display: 'block' }} // Prevents extra space below SVG
          >
            {/* Draw Color Zones */}
            {safeZones.map((zone, index) => {
              // Determine the start and end angles for this zone's arc.
              // Use gauge min/max if zone min/max are undefined.
              const zoneStartValue = zone.min ?? min;
              const zoneEndValue = zone.max ?? max;
              // Convert values to angles, ensuring they stay within the gauge sweep.
              const zoneStartAngle = Math.max(
                startAngle,
                valueToAngle(zoneStartValue),
              );
              const zoneEndAngle = Math.min(
                endAngle,
                valueToAngle(zoneEndValue),
              );

              // Don't draw if the angles are invalid or reversed.
              if (zoneEndAngle <= zoneStartAngle) {
                return null;
              }

              return (
                <path
                  key={`zone-${index}`}
                  d={describeArc(arcCenterRadius, zoneStartAngle, zoneEndAngle)}
                  fill="none"
                  stroke={zone.color}
                  strokeWidth={arcWidth}
                />
              );
            })}

            {/* Draw Ticks */}
            {tickAngles.map((angle, index) => {
              // Major ticks often align with label intervals, but not always.
              // Here, we just make the start, middle, and end ticks major.
              const isMajorTick =
                index === 0 || index === numTicks / 2 || index === numTicks;
              const innerR = isMajorTick
                ? tickInnerRadius
                : minorTickInnerRadius;
              const outerR = isMajorTick
                ? tickOuterRadius
                : minorTickOuterRadius;
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

            {/* Draw Labels */}
            {labels.map(lbl => (
              <text
                key={`label-${lbl.value}`}
                x={lbl.x}
                y={lbl.y}
                fill={markColor}
                fontSize={labelFontSize}
                // Centers the text horizontally at the calculated point.
                textAnchor="middle"
                // Attempts to center the text vertically. Support varies. 'central' might work better in some SVGs.
                dominantBaseline="middle"
              >
                {lbl.value}
              </text>
            ))}

            {/* Draw Needle */}
            {(() => {
              const needleEnd = polarToCartesian(valueAngle, needleLength);
              return (
                <line
                  x1={0}
                  y1={0}
                  x2={needleEnd.x}
                  y2={needleEnd.y}
                  stroke={markColor}
                  strokeWidth={needleWidth}
                  strokeLinecap="round"
                />
              );
            })()}

            {/* Draw Center Hub */}
            <circle
              cx={0}
              cy={0}
              r={centerHubRadius}
              fill={hubColor}
              stroke={markColor}
              strokeWidth={1}
            />
          </svg>
        </div>
      </div>

      {/* Value Display */}
      <div
        className="text-center mt-1 font-mono text-sm"
        style={{ color: valueTextColor }}
      >
        {safeValue.toFixed(1)}
        {unit}
      </div>
    </div>
  );
};
