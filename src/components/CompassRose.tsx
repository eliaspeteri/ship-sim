import React, { useState, useEffect, useRef } from 'react';

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
  // State for continuous rotation
  const initialRotationDegrees =
    -((((heading * 180) / Math.PI) % 360) + 360) % 360;
  const [visualRotation, setVisualRotation] = useState<number>(
    initialRotationDegrees,
  );
  const previousHeadingRef = useRef<number>(heading);

  // Constants
  const outerPadding = 5;
  const outerRingWidth = size * 0.15;
  const innerSize = size - 2 * outerRingWidth;
  const innerRadius = innerSize / 2;
  const viewBoxSize = size + 2 * outerPadding;
  const center = viewBoxSize / 2;

  // Radii relative to center
  const goldenRingOuterRadius = size / 2;
  const goldenRingInnerRadius = goldenRingOuterRadius - outerRingWidth;
  const fixedTickOuterRadius = goldenRingOuterRadius * 0.85; // Ticks slightly inside the edge
  const fixedTickInnerRadius = goldenRingInnerRadius * 1.02; // Ticks slightly inside the inner edge
  const fixedNumberRadius =
    (goldenRingOuterRadius + goldenRingInnerRadius) / 1.9; // Numbers centered on the ring

  // Radii for the rotating inner card (relative to center)
  const cardRadius = goldenRingInnerRadius * 0.98; // Small gap between card and ring
  const cardTickOuterRadius = cardRadius * 0.95;
  const cardTickInnerRadiusMajor = cardRadius * 0.85;
  const cardTickInnerRadiusMinor = cardRadius * 0.9;
  const cardNumberRadius = cardRadius * 0.7;
  const centerHubRadius = size * 0.05; // Larger center hub

  // Style constants
  const backgroundColor = '#000000'; // Black for the rotating card
  const goldenRingColor = '#DAA520'; // Gold color
  const fixedTickColor = '#D1D5DB'; // Light gray (gray-300)
  const fixedNumberColor = '#D1D5DB'; // Light gray (gray-300)
  const cardMajorTickColor = '#FFFFFF'; // white
  const cardTenDegreeTickColor = '#D1D5DB'; // gray-300
  const cardMinorTickColor = '#6B7280'; // gray-500
  const cardNumberColor = '#FFFFFF'; // white
  const lubberLineColor = '#EF4444'; // red-500
  const centerHubColor = '#C0C0C0'; // Silver

  const fixedNumberFontSize = outerRingWidth * 0.35; // Scale font size to ring width
  const cardNumberFontSize = innerRadius * 0.16; // Scale font size to inner card radius

  // Effect for continuous rotation
  useEffect(() => {
    const currentHeadingDeg = ((((heading * 180) / Math.PI) % 360) + 360) % 360;
    const previousHeadingDeg =
      ((((previousHeadingRef.current * 180) / Math.PI) % 360) + 360) % 360;

    // Calculate the shortest difference between angles (handles wrap-around)
    let deltaHeadingDeg = currentHeadingDeg - previousHeadingDeg;
    if (deltaHeadingDeg > 180) {
      deltaHeadingDeg -= 360;
    } else if (deltaHeadingDeg < -180) {
      deltaHeadingDeg += 360;
    }

    // The rotation delta is the negative of the heading delta
    const deltaRotation = -deltaHeadingDeg;

    // Update the visual rotation by adding the delta
    setVisualRotation(prevRotation => prevRotation + deltaRotation);

    // Store the current heading for the next calculation
    previousHeadingRef.current = heading;
  }, [heading]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      className="select-none"
    >
      {/* Fixed Golden Outer Ring */}
      <circle
        cx={center}
        cy={center}
        r={goldenRingOuterRadius}
        fill={goldenRingColor}
        stroke="#B8860B" // Optional darker border for the gold ring
        strokeWidth="1"
      />
      {/* Cutout for the inner card - ensures gold ring is just a ring */}
      <circle
        cx={center}
        cy={center}
        r={goldenRingInnerRadius}
        fill={backgroundColor} // Fill with card background color initially
      />
      {/* Fixed Ticks and Numbers on Golden Ring */}
      <g>
        {Array.from({ length: 36 }).map((_, i) => {
          // Every 10 degrees
          const angle = i * 10;
          const isMajorFixedTick = angle % 30 === 0; // Major ticks every 30 deg

          // Fixed Tick properties
          const fixedTickStrokeWidth = isMajorFixedTick ? 1.5 : 1;

          // Calculate fixed tick positions
          const fixedTickStart = polarToCartesian(
            center,
            center,
            fixedTickInnerRadius,
            angle,
          );
          const fixedTickEnd = polarToCartesian(
            center,
            center,
            fixedTickOuterRadius,
            angle,
          );

          // Calculate fixed number position
          const fixedNumPos = polarToCartesian(
            center,
            center,
            fixedNumberRadius,
            angle,
          );

          return (
            <React.Fragment key={`fixed-mark-${angle}`}>
              {/* Fixed Tick Line */}
              <line
                x1={fixedTickStart.x}
                y1={fixedTickStart.y}
                x2={fixedTickEnd.x}
                y2={fixedTickEnd.y}
                stroke={fixedTickColor}
                strokeWidth={fixedTickStrokeWidth}
              />

              {/* Fixed Degree Number (every 30 degrees) */}
              {isMajorFixedTick && (
                <text
                  x={fixedNumPos.x}
                  y={fixedNumPos.y}
                  fill={fixedNumberColor}
                  fontSize={fixedNumberFontSize}
                  fontFamily="sans-serif"
                  fontWeight="normal" // Lighter weight for fixed numbers
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${angle} ${fixedNumPos.x} ${fixedNumPos.y})`}
                >
                  {(angle === 0 ? 360 : angle).toString()}
                </text>
              )}
            </React.Fragment>
          );
        })}
      </g>
      {/* Rotating Inner Card Background (drawn over the cutout) */}
      <circle
        cx={center}
        cy={center}
        r={cardRadius} // Use the calculated card radius
        fill={backgroundColor}
      />
      {/* Rotating Card Group - Use visualRotation */}
      <g transform={`rotate(${visualRotation} ${center} ${center})`}>
        {/* Ticks and Numbers for the INNER card */}
        {Array.from({ length: 360 }).map((_, angle) => {
          const isTenDegreeMark = angle % 10 === 0;
          const isThirtyDegreeMark = angle % 30 === 0;
          const isNinetyDegreeMark = angle % 90 === 0;

          // Inner Tick properties
          const cardTickStartRadius = isTenDegreeMark
            ? cardTickInnerRadiusMajor
            : cardTickInnerRadiusMinor;
          const cardTickStrokeWidth = isNinetyDegreeMark
            ? 2
            : isTenDegreeMark
              ? 1.5
              : 1;
          const cardTickColor = isNinetyDegreeMark
            ? cardMajorTickColor
            : isTenDegreeMark
              ? cardTenDegreeTickColor
              : cardMinorTickColor;

          // Calculate inner tick positions
          const cardTickStart = polarToCartesian(
            center,
            center,
            cardTickStartRadius,
            angle,
          );
          const cardTickEnd = polarToCartesian(
            center,
            center,
            cardTickOuterRadius,
            angle,
          );

          // Calculate inner number position
          const cardNumPos = polarToCartesian(
            center,
            center,
            cardNumberRadius,
            angle,
          );

          return (
            <React.Fragment key={`card-mark-${angle}`}>
              {/* Inner Tick Line */}
              <line
                x1={cardTickStart.x}
                y1={cardTickStart.y}
                x2={cardTickEnd.x}
                y2={cardTickEnd.y}
                stroke={cardTickColor}
                strokeWidth={cardTickStrokeWidth}
              />

              {/* Inner Degree Number (every 30 degrees) */}
              {isThirtyDegreeMark && (
                <text
                  x={cardNumPos.x}
                  y={cardNumPos.y}
                  fill={cardNumberColor}
                  fontSize={cardNumberFontSize}
                  fontFamily="sans-serif"
                  fontWeight="semibold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${angle} ${cardNumPos.x} ${cardNumPos.y})`}
                >
                  {(angle === 0 ? 360 : angle).toString().padStart(3, '0')}
                </text>
              )}
            </React.Fragment>
          );
        })}
      </g>
      {/* Fixed Lubber Line (drawn over everything else) */}
      <line
        x1={center}
        y1={center - cardRadius * 1.02} // Start just above the inner card
        x2={center}
        y2={center - cardRadius * 0.85} // Length of the line
        stroke={lubberLineColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Center Hub (drawn over rotating card elements) */}
      <circle
        cx={center}
        cy={center}
        r={centerHubRadius} // Use the larger hub radius
        fill={centerHubColor} // Silver color
        stroke="#808080" // Optional darker border for hub
        strokeWidth="1"
      />
    </svg>
  );
};
