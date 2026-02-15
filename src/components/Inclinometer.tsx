import type { JSX } from 'react';
import React from 'react';

interface InclinometerProps {
  roll: number; // Roll angle in degrees (-ve for Port, +ve for Starboard)
  maxAngle?: number; // Maximum angle displayed on the scale (e.g., 40)
  size?: number; // Overall size of the component
}

const Inclinometer: React.FC<InclinometerProps> = ({
  roll,
  maxAngle = 40,
  size = 150,
}) => {
  const width = size;
  const baseHeight = size * 0.6;
  const frameWidth = 5; // Slightly thicker frame
  const padding = 20; // Space for labels below arc
  const height = baseHeight + padding + frameWidth * 2;

  const center = width / 2;
  const topY = frameWidth;
  const pivotY = topY + 5;
  const scaleRadius = baseHeight * 0.8;
  const tickLengthMajor = 10;
  const tickLengthMinor = 5;
  const labelOffset = 5; // Offset from end of major tick

  // Clamp the roll angle
  const displayRoll = Math.max(-maxAngle, Math.min(maxAngle, roll));

  // Function to calculate point on circle (center is now top-center for calculation)
  const getPointOnCircle = (angleDegrees: number, r: number) => {
    const angleRad = (angleDegrees * Math.PI) / 180;
    return {
      x: center + r * Math.sin(angleRad),
      y: pivotY + r * Math.cos(angleRad),
    };
  };

  // Generate ticks for the bottom arc
  const ticks: JSX.Element[] = [];
  for (let angle = -maxAngle; angle <= maxAngle; angle += 5) {
    const isMajor = angle % 10 === 0;
    const tickLength = isMajor ? tickLengthMajor : tickLengthMinor;
    const startPoint = getPointOnCircle(angle, scaleRadius);
    const endPoint = getPointOnCircle(angle, scaleRadius + tickLength);
    const labelPoint = getPointOnCircle(
      angle,
      scaleRadius + tickLength + labelOffset,
    );

    ticks.push(
      <g key={`tick-${angle}`}>
        <line
          x1={startPoint.x}
          y1={startPoint.y}
          x2={endPoint.x}
          y2={endPoint.y}
          stroke="black"
          strokeWidth={isMajor ? 1.5 : 1}
        />
        {isMajor && (
          <text
            x={labelPoint.x}
            y={labelPoint.y}
            fontSize="10"
            textAnchor="middle"
            dominantBaseline="hanging" // Align text bottom edge with point
            fill="black"
          >
            {Math.abs(angle)}
          </text>
        )}
      </g>,
    );
  }

  // Calculate arc path points
  const startAngleDegrees = -maxAngle;
  const endAngleDegrees = maxAngle;
  const startPointArc = getPointOnCircle(startAngleDegrees, scaleRadius);
  const endPointArc = getPointOnCircle(endAngleDegrees, scaleRadius);
  const largeArcFlag = endAngleDegrees - startAngleDegrees <= 180 ? '0' : '1';

  // Arc path for the scale line
  const scaleArcPath = [
    `M ${startPointArc.x} ${startPointArc.y}`,
    `A ${scaleRadius} ${scaleRadius} 0 ${largeArcFlag} 0 ${endPointArc.x} ${endPointArc.y}`,
  ].join(' ');

  // Define the background path (straight sides, rounded bottom)
  const backgroundRadius = scaleRadius + tickLengthMajor + labelOffset + 10; // Radius for the background curve
  const startPointBg = getPointOnCircle(startAngleDegrees, backgroundRadius);
  const endPointBg = getPointOnCircle(endAngleDegrees, backgroundRadius);

  const backgroundPath = [
    `M ${center} ${topY}`, // Top point
    `L ${startPointBg.x} ${startPointBg.y}`, // Line to start of arc
    `A ${backgroundRadius} ${backgroundRadius} 0 ${largeArcFlag} 0 ${endPointBg.x} ${endPointBg.y}`, // Arc bottom
    `Z`, // Close path back to top point
  ].join(' ');

  // Define the frame path - more robust calculation for full border
  const frameRadius = backgroundRadius + frameWidth;
  const startPointFrame = getPointOnCircle(startAngleDegrees, frameRadius);
  const endPointFrame = getPointOnCircle(endAngleDegrees, frameRadius);

  const framePath = [
    `M ${center} ${topY - frameWidth}`, // Top point slightly higher
    `L ${startPointFrame.x} ${startPointFrame.y}`, // Line to start of arc
    `A ${frameRadius} ${frameRadius} 0 ${largeArcFlag} 0 ${endPointFrame.x} ${endPointFrame.y}`, // Arc bottom
    `Z`, // Close path back to top point
  ].join(' ');

  // Calculate needle end point for the weight
  const needleLength = scaleRadius * 0.9;
  const needleEndX = center;
  const needleEndY = pivotY + needleLength;
  const needleWeightRadius = 4;

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          {/* Shiny gold gradient for the golden background */}
          <linearGradient
            id="goldenBezelGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#fff8dc" />
            <stop offset="30%" stopColor="#ffe066" />
            <stop offset="50%" stopColor="#daa520" />
            <stop offset="70%" stopColor="#fff8dc" />
            <stop offset="100%" stopColor="#b8860b" />
          </linearGradient>
          {/* Drop shadow for depth */}
          <filter
            id="goldDropShadow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="1" dy="1" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Wooden Frame */}
        <path d={framePath} fill="#8b4513" stroke="#5a2d0c" strokeWidth="1" />

        {/* Golden Background with metallic shine */}
        <path
          d={backgroundPath}
          fill="url(#goldenBezelGradient)"
          filter="url(#goldDropShadow)"
          stroke="#b8860b"
          strokeWidth="1"
        />

        {/* Scale Arc (Bottom, inverted) */}
        <path d={scaleArcPath} stroke="black" strokeWidth="2" fill="none" />

        {/* Ticks and Labels */}
        {ticks}

        {/* Center Pivot (Top) */}
        <circle cx={center} cy={pivotY} r="4" fill="black" />

        {/* Pointer Group (Needle + Weight) - Rotate the group */}
        <g transform={`rotate(${displayRoll}, ${center}, ${pivotY})`}>
          {/* Needle Line - Thicker */}
          <line
            x1={center}
            y1={pivotY}
            x2={needleEndX}
            y2={needleEndY}
            stroke="#b8860b" // Darker golden color
            strokeWidth={4} // Increased thickness
            strokeLinecap="round" // Rounded ends
          />
          {/* Needle Weight */}
          <circle
            cx={needleEndX}
            cy={needleEndY}
            r={needleWeightRadius}
            fill="#b8860b" // Same color as needle
          />
        </g>

        {/* Zero Degree Mark (Bottom Center) */}
        {(() => {
          const zeroPoint = getPointOnCircle(0, scaleRadius);
          const zeroEndPoint = getPointOnCircle(
            0,
            scaleRadius + tickLengthMajor,
          );
          return (
            <g>
              <line
                x1={zeroPoint.x}
                y1={zeroPoint.y}
                x2={zeroEndPoint.x}
                y2={zeroEndPoint.y}
                stroke="black"
                strokeWidth="1.5"
              />
            </g>
          );
        })()}
      </svg>
      <span className="text-sm mt-1">{roll.toFixed(1)}° Roll</span>
    </div>
  );
};

export default Inclinometer;
