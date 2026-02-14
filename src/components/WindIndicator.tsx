import React, { JSX } from 'react';

interface WindIndicatorProps {
  /**
   * Wind direction in degrees (0-359), where 0 is North, 90 is East, etc.
   */
  direction: number;

  /**
   * Wind speed in knots
   */
  speedKnots: number;

  /**
   * Component size in pixels
   */
  size?: number;
}

/**
 * Beaufort wind force scale with speed ranges in knots
 */
const BEAUFORT_SCALE = [
  { force: 0, name: 'Calm', minKnots: 0, maxKnots: 1 },
  { force: 1, name: 'Light Air', minKnots: 1, maxKnots: 3 },
  { force: 2, name: 'Light Breeze', minKnots: 4, maxKnots: 6 },
  { force: 3, name: 'Gentle Breeze', minKnots: 7, maxKnots: 10 },
  { force: 4, name: 'Moderate Breeze', minKnots: 11, maxKnots: 16 },
  { force: 5, name: 'Fresh Breeze', minKnots: 17, maxKnots: 21 },
  { force: 6, name: 'Strong Breeze', minKnots: 22, maxKnots: 27 },
  { force: 7, name: 'Near Gale', minKnots: 28, maxKnots: 33 },
  { force: 8, name: 'Gale', minKnots: 34, maxKnots: 40 },
  { force: 9, name: 'Strong Gale', minKnots: 41, maxKnots: 47 },
  { force: 10, name: 'Storm', minKnots: 48, maxKnots: 55 },
  { force: 11, name: 'Violent Storm', minKnots: 56, maxKnots: 63 },
  { force: 12, name: 'Hurricane', minKnots: 64, maxKnots: 999 },
];

/**
 * Cardinal and intercardinal direction labels
 */
const DIRECTION_LABELS = [
  { angle: 0, label: 'N' },
  { angle: 45, label: 'NE' },
  { angle: 90, label: 'E' },
  { angle: 135, label: 'SE' },
  { angle: 180, label: 'S' },
  { angle: 225, label: 'SW' },
  { angle: 270, label: 'W' },
  { angle: 315, label: 'NW' },
];

/**
 * Helper function to get point coordinates on a circle
 */
const getPointOnCircle = (
  ...args: [cx: number, cy: number, radius: number, angleDegrees: number]
): { x: number; y: number } => {
  const [cx, cy, radius, angleDegrees] = args;
  // Convert degrees to radians and adjust for SVG coordinate system
  // where 0 degrees is at the top (North)
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleRadians),
    y: cy + radius * Math.sin(angleRadians),
  };
};

/**
 * Helper function to get text for wind direction
 */
const getDirectionText = (direction: number): string => {
  // Normalize direction to 0-359
  const normalizedDir = ((direction % 360) + 360) % 360;

  // Find closest cardinal/intercardinal direction
  let closestDirection = DIRECTION_LABELS[0];
  let minAngleDiff = 360;

  for (const dir of DIRECTION_LABELS) {
    const angleDiff = Math.min(
      Math.abs(normalizedDir - dir.angle),
      Math.abs(normalizedDir - dir.angle - 360),
    );

    if (angleDiff < minAngleDiff) {
      closestDirection = dir;
      minAngleDiff = angleDiff;
    }
  }

  return closestDirection.label;
};

/**
 * Get Beaufort scale force from wind speed in knots
 */
const getBeaufortForce = (speedKnots: number): number => {
  for (const scale of BEAUFORT_SCALE) {
    if (speedKnots >= scale.minKnots && speedKnots <= scale.maxKnots) {
      return scale.force;
    }
  }
  return 12; // Maximum force for extremely high winds
};

/**
 * Get color for wind speed based on Beaufort scale
 */
const getWindSpeedColor = (speedKnots: number): string => {
  const force = getBeaufortForce(speedKnots);

  // Color scale from green (calm) to red (storm)
  if (force <= 3) return '#4CAF50'; // Green for light winds
  if (force <= 6) return '#FFC107'; // Amber for moderate winds
  if (force <= 9) return '#FF9800'; // Orange for strong winds
  return '#F44336'; // Red for storm conditions
};

/**
 * WindIndicator component displays wind direction and speed
 */
const WindIndicator: React.FC<WindIndicatorProps> = ({
  direction,
  speedKnots,
  size = 200,
}) => {
  const radius = size / 2;
  const center = size / 2;
  const frameWidth = size * 0.05;
  const innerRadius = radius - frameWidth;

  // Normalize direction to 0-359 degrees
  const normalizedDirection = ((direction % 360) + 360) % 360;

  // Calculate dimensions
  const compassRadius = innerRadius * 0.85;
  const vaneLength = innerRadius * 0.7;
  const speedIndicatorRadius = innerRadius * 0.35;

  // Get the beaufort force and corresponding color
  const beaufortForce = getBeaufortForce(speedKnots);
  const speedColor = getWindSpeedColor(speedKnots);

  // Generate compass ticks for the 360° circle
  const compassTicks: JSX.Element[] = [];
  for (let i = 0; i < 360; i += 10) {
    const isMajor = i % 30 === 0;
    const tickLength = isMajor ? 10 : 5;
    const point = getPointOnCircle(center, center, compassRadius, i);
    const innerPoint = getPointOnCircle(
      center,
      center,
      compassRadius - tickLength,
      i,
    );

    compassTicks.push(
      <line
        key={`tick-${i}`}
        x1={point.x}
        y1={point.y}
        x2={innerPoint.x}
        y2={innerPoint.y}
        stroke={isMajor ? 'black' : '#666'}
        strokeWidth={isMajor ? 2 : 1}
      />,
    );

    // Add cardinal/intercardinal labels
    const isCardinal = i % 45 === 0;
    if (isCardinal) {
      const labelPoint = getPointOnCircle(
        center,
        center,
        compassRadius - 20,
        i,
      );

      const dirLabel = DIRECTION_LABELS.find(d => d.angle === i)?.label || '';

      compassTicks.push(
        <text
          key={`label-${i}`}
          x={labelPoint.x}
          y={labelPoint.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.05}
          fontWeight="bold"
          fill="black"
        >
          {dirLabel}
        </text>,
      );
    }
  }

  // Generate vane points (arrow pointing into the wind)
  const vaneHeadPoint = getPointOnCircle(
    center,
    center,
    vaneLength,
    normalizedDirection,
  );

  // Vane tail (opposite to the arrow head)
  const vaneTailPoint = getPointOnCircle(
    center,
    center,
    vaneLength * 0.7,
    (normalizedDirection + 180) % 360,
  );

  // Vane fins (perpendicular to the main direction)
  const finLength = vaneLength * 0.15;
  const finAngle1 = (normalizedDirection + 90) % 360;
  const finAngle2 = (normalizedDirection + 270) % 360;

  const finPoint1 = getPointOnCircle(
    vaneTailPoint.x,
    vaneTailPoint.y,
    finLength,
    finAngle1,
  );

  const finPoint2 = getPointOnCircle(
    vaneTailPoint.x,
    vaneTailPoint.y,
    finLength,
    finAngle2,
  );

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer frame */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="#395C6B" // Navy blue outer frame
          stroke="#2C3E50"
          strokeWidth="2"
        />

        {/* Inner background */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="#F5F5F5"
          stroke="#AAA"
          strokeWidth="1"
        />

        {/* Compass rose */}
        <circle
          cx={center}
          cy={center}
          r={compassRadius}
          fill="none"
          stroke="#333"
          strokeWidth="1"
          strokeDasharray="4 2"
        />

        {/* Compass ticks and labels */}
        <g id="compass-ticks">{compassTicks}</g>

        {/* Wind direction vane (arrow pointing into the wind) */}
        <g id="wind-vane">
          {/* Main shaft */}
          <line
            x1={vaneTailPoint.x}
            y1={vaneTailPoint.y}
            x2={vaneHeadPoint.x}
            y2={vaneHeadPoint.y}
            stroke="#333"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Arrow head */}
          <polygon
            points={`
              ${vaneHeadPoint.x},${vaneHeadPoint.y}
              ${getPointOnCircle(vaneHeadPoint.x, vaneHeadPoint.y, 10, normalizedDirection + 150).x},
              ${getPointOnCircle(vaneHeadPoint.x, vaneHeadPoint.y, 10, normalizedDirection + 150).y}
              ${getPointOnCircle(vaneHeadPoint.x, vaneHeadPoint.y, 10, normalizedDirection + 210).x},
              ${getPointOnCircle(vaneHeadPoint.x, vaneHeadPoint.y, 10, normalizedDirection + 210).y}
            `}
            fill="#333"
          />

          {/* Vane fins */}
          <polygon
            points={`
              ${vaneTailPoint.x},${vaneTailPoint.y}
              ${finPoint1.x},${finPoint1.y}
              ${finPoint2.x},${finPoint2.y}
            `}
            fill="#555"
          />
        </g>

        {/* Speed indicator (center circle) */}
        <g id="speed-indicator">
          <circle
            cx={center}
            cy={center}
            r={speedIndicatorRadius}
            fill={speedColor}
            stroke="#333"
            strokeWidth="1"
          />

          {/* Beaufort force number */}
          <text
            x={center}
            y={center - 10}
            textAnchor="middle"
            fontSize={size * 0.08}
            fontWeight="bold"
            fill="white"
          >
            {beaufortForce}
          </text>

          {/* Wind speed text */}
          <text
            x={center}
            y={center + 15}
            textAnchor="middle"
            fontSize={size * 0.05}
            fill="white"
          >
            {speedKnots.toFixed(1)} kt
          </text>
        </g>

        {/* Digital readouts */}
        <g
          id="digital-readout"
          transform={`translate(${center}, ${size - frameWidth - 10})`}
        >
          <text
            textAnchor="middle"
            fontSize={size * 0.06}
            fontWeight="bold"
            fill="#333"
          >
            {normalizedDirection.toFixed(0)}°{' '}
            {getDirectionText(normalizedDirection)}
          </text>
        </g>

        {/* Title */}
        <text
          x={center}
          y={frameWidth + 15}
          textAnchor="middle"
          fontSize={size * 0.06}
          fontWeight="bold"
          fill="#333"
        >
          WIND
        </text>
      </svg>
    </div>
  );
};

export default WindIndicator;
