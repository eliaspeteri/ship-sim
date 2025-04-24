import React from 'react';

interface CompassRoseProps {
  /** The current heading in radians. */
  heading: number;
  /** The size of the compass rose in pixels. Defaults to 200. */
  size?: number;
}

// Helper to convert polar coordinates to Cartesian for SVG
const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0; // Adjust angle: 0 degrees is up
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

export const CompassRose: React.FC<CompassRoseProps> = ({
  heading,
  size = 200,
}) => {
  const rotationDegrees = -((((heading * 180) / Math.PI) % 360) + 360) % 360;
  const radius = size / 2;
  const viewBoxSize = size + 10; // Add padding for border/stroke
  const center = viewBoxSize / 2;

  // Radii for elements relative to center
  const borderOuterRadius = radius;
  const tickOuterRadius = borderOuterRadius * 0.95;
  const tickInnerRadiusMajor = borderOuterRadius * 0.85;
  const tickInnerRadiusMinor = borderOuterRadius * 0.9;
  const numberRadius = borderOuterRadius * 0.7;

  // Style constants
  const backgroundColor = '#000000'; // Black
  const borderColor = '#4a5568'; // gray-600
  const majorTickColor = '#FFFFFF'; // white
  const tenDegreeTickColor = '#D1D5DB'; // gray-300
  const minorTickColor = '#6B7280'; // gray-500
  const numberColor = '#FFFFFF'; // white
  const lubberLineColor = '#EF4444'; // red-500
  const centerDotColor = '#9CA3AF'; // gray-400
  const numberFontSize = size * 0.08;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      className="select-none"
    >
      {/* Background and Border */}
      <circle
        cx={center}
        cy={center}
        r={borderOuterRadius}
        fill={backgroundColor}
        stroke={borderColor}
        strokeWidth="4" // Matches border-4
      />
      {/* Rotating Card Group */}
      <g
        transform={`rotate(${rotationDegrees} ${center} ${center})`}
        style={{ transition: 'transform 0.2s linear' }} // Smooth rotation
      >
        {/* Ticks and Numbers */}
        {Array.from({ length: 360 }).map((_, angle) => {
          const isTenDegreeMark = angle % 10 === 0;
          const isThirtyDegreeMark = angle % 30 === 0;
          const isNinetyDegreeMark = angle % 90 === 0;

          // Tick properties
          const tickStartRadius = isTenDegreeMark
            ? tickInnerRadiusMajor
            : tickInnerRadiusMinor;
          const tickStrokeWidth = isNinetyDegreeMark
            ? 2
            : isTenDegreeMark
              ? 1.5
              : 1;
          const tickColor = isNinetyDegreeMark
            ? majorTickColor
            : isTenDegreeMark
              ? tenDegreeTickColor
              : minorTickColor;

          // Calculate tick positions
          const tickStart = polarToCartesian(
            center,
            center,
            tickStartRadius,
            angle,
          );
          const tickEnd = polarToCartesian(
            center,
            center,
            tickOuterRadius,
            angle,
          );

          // Calculate number position
          const numPos = polarToCartesian(center, center, numberRadius, angle);

          return (
            <React.Fragment key={`mark-${angle}`}>
              {/* Tick Line */}
              <line
                x1={tickStart.x}
                y1={tickStart.y}
                x2={tickEnd.x}
                y2={tickEnd.y}
                stroke={tickColor}
                strokeWidth={tickStrokeWidth}
              />

              {/* Degree Number (every 30 degrees) */}
              {isThirtyDegreeMark && (
                <text
                  x={numPos.x}
                  y={numPos.y}
                  fill={numberColor}
                  fontSize={numberFontSize}
                  fontFamily="sans-serif"
                  fontWeight="semibold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  // Apply rotation matching the angle around the number's position
                  transform={`rotate(${angle} ${numPos.x} ${numPos.y})`}
                >
                  {(angle === 0 ? 360 : angle).toString().padStart(3, '0')}
                </text>
              )}
            </React.Fragment>
          );
        })}
      </g>{' '}
      {/* End Rotating Card Group */}
      {/* Fixed Lubber Line */}
      <line
        x1={center}
        y1={center - borderOuterRadius} // Start slightly inside the border
        x2={center}
        y2={center - borderOuterRadius * 0.85} // Length of the line
        stroke={lubberLineColor}
        strokeWidth="2.5"
        strokeLinecap="round" // Nicer ends
      />
      {/* Center Dot */}
      <circle
        cx={center}
        cy={center}
        r={size * 0.02} // Small radius for the dot
        fill={centerDotColor}
      />
    </svg>
  );
};
