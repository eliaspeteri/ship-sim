import React, { JSX } from 'react';
import { RUDDER_STALL_ANGLE_DEG } from '../constants/vessel';

/**
 * Props for the RudderAngleIndicator component
 */
interface RudderAngleIndicatorProps {
  /**
   * Current rudder angle in degrees
   * Negative values represent port side, positive values represent starboard side
   */
  angle: number;

  /**
   * Maximum angle the rudder can turn in each direction
   * Defaults to 35 degrees if not specified
   */
  maxAngle?: number;

  /**
   * Size of the component in pixels
   */
  size?: number;
}

/**
 * RudderAngleIndicator component displays the current position of the ship's rudder
 * with port/starboard color coding and degree markings.
 */
const RudderAngleIndicator: React.FC<RudderAngleIndicatorProps> = ({
  angle,
  maxAngle = RUDDER_STALL_ANGLE_DEG,
  size = 200,
}) => {
  // Constants for drawing
  const radius = size / 2;
  const center = size / 2;
  const frameWidth = size * 0.05;
  const innerRadius = radius - frameWidth;
  const startAngle = -90; // Top
  const sweepAngle = 180; // Half circle

  // Constrain angle to maxAngle
  const clampedAngle = Math.max(-maxAngle, Math.min(maxAngle, angle));

  // Calculate the angle for the needle
  const needleAngle = startAngle + (clampedAngle / maxAngle) * (sweepAngle / 2);

  // Helper function to get point on circle
  const getPointOnCircle = (
    ...args: [cx: number, cy: number, r: number, angleDegrees: number]
  ): { x: number; y: number } => {
    const [cx, cy, r, angleDegrees] = args;
    const angleRadians = (angleDegrees * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRadians),
      y: cy + r * Math.sin(angleRadians),
    };
  };

  // Generate tick marks
  const tickMarks: JSX.Element[] = [];
  const tickStep = 5;
  const majorStep = 10;
  const maxTick = Math.floor(maxAngle / tickStep) * tickStep;
  const tickValues = new Set<number>();

  for (let value = -maxTick; value <= maxTick; value += tickStep) {
    tickValues.add(Number(value.toFixed(3)));
  }

  if (Math.abs(maxAngle - maxTick) > 0.01) {
    tickValues.add(Number((-maxAngle).toFixed(3)));
    tickValues.add(Number(maxAngle.toFixed(3)));
  }

  const formatLabel = (value: number) => {
    const abs = Math.abs(value);
    return Number.isInteger(abs) ? abs.toFixed(0) : abs.toFixed(1);
  };

  Array.from(tickValues)
    .sort((a, b) => a - b)
    .forEach(value => {
      const isHardOver = Math.abs(Math.abs(value) - maxAngle) < 0.01;
      const isMajor = Math.abs(value) % majorStep < 0.01;
      const tickLength = isHardOver ? 15 : isMajor ? 10 : 5;
      const tickWidth = isHardOver ? 2 : isMajor ? 1.5 : 1;

      const tickAngle = startAngle + (value / maxAngle) * (sweepAngle / 2);
      const outerPoint = getPointOnCircle(
        center,
        center,
        innerRadius,
        tickAngle,
      );
      const innerPoint = getPointOnCircle(
        center,
        center,
        innerRadius - tickLength,
        tickAngle,
      );
      const tickColor =
        value < 0 ? '#e53935' : value > 0 ? '#43a047' : '#ffffff';

      tickMarks.push(
        <line
          key={`tick-${value}`}
          x1={outerPoint.x}
          y1={outerPoint.y}
          x2={innerPoint.x}
          y2={innerPoint.y}
          stroke={tickColor}
          strokeWidth={tickWidth}
        />,
      );

      if (isMajor || isHardOver) {
        const labelPoint = getPointOnCircle(
          center,
          center,
          innerRadius - tickLength - 12,
          tickAngle,
        );

        tickMarks.push(
          <text
            key={`label-${value}`}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={isHardOver ? size * 0.05 : size * 0.04}
            fontWeight={isHardOver ? 'bold' : 'normal'}
            fill={tickColor}
          >
            {formatLabel(value)}°
          </text>,
        );
      }
    });

  // Calculate points for the needle
  const needlePoint = getPointOnCircle(
    center,
    center,
    innerRadius * 0.8,
    needleAngle,
  );

  // Generate the gradient arcs for port and starboard sides
  const arcRadius = innerRadius * 0.75;
  const portStartAngle = startAngle;
  const portEndAngle = startAngle - sweepAngle / 2;
  const stbdStartAngle = startAngle;
  const stbdEndAngle = startAngle + sweepAngle / 2;

  const portStartPoint = getPointOnCircle(
    center,
    center,
    arcRadius,
    portStartAngle,
  );
  const portEndPoint = getPointOnCircle(
    center,
    center,
    arcRadius,
    portEndAngle,
  );
  const stbdStartPoint = getPointOnCircle(
    center,
    center,
    arcRadius,
    stbdStartAngle,
  );
  const stbdEndPoint = getPointOnCircle(
    center,
    center,
    arcRadius,
    stbdEndAngle,
  );

  // Create SVG arc paths
  const createArc = (
    ...args: [
      startPoint: { x: number; y: number },
      endPoint: { x: number; y: number },
      radius: number,
      largeArc: 0 | 1,
      sweep: 0 | 1,
    ]
  ) => {
    const [startPoint, endPoint, radius, largeArc, sweep] = args;
    return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${endPoint.x} ${endPoint.y}`;
  };

  const portArcPath = createArc(portStartPoint, portEndPoint, arcRadius, 0, 0);
  const stbdArcPath = createArc(stbdStartPoint, stbdEndPoint, arcRadius, 0, 1);

  // Calculate label positions for PORT and STBD
  const portLabelPoint = getPointOnCircle(
    center,
    center,
    innerRadius - 40,
    startAngle - sweepAngle / 4,
  );

  const stbdLabelPoint = getPointOnCircle(
    center,
    center,
    innerRadius - 40,
    startAngle + sweepAngle / 4,
  );

  return (
    <div
      className="relative"
      style={{ width: size, height: size / 2 + frameWidth }}
    >
      <svg
        width={size}
        height={size / 2 + frameWidth}
        viewBox={`0 0 ${size} ${size / 2 + frameWidth}`}
      >
        {/* Outer frame (semi-circle) */}
        <path
          d={`
            M ${frameWidth} ${center} 
            A ${radius - frameWidth} ${radius - frameWidth} 0 1 1 ${size - frameWidth} ${center} 
            L ${size} ${center}
            A ${radius} ${radius} 0 1 0 0 ${center}
            Z
          `}
          fill="#2C3E50"
          stroke="#1B2631"
          strokeWidth="1"
        />

        {/* Inner background */}
        <path
          d={`
            M ${frameWidth * 2} ${center} 
            A ${innerRadius - frameWidth} ${innerRadius - frameWidth} 0 1 1 ${size - frameWidth * 2} ${center}
          `}
          fill="#0A1016"
          stroke="#2C3E50"
          strokeWidth="1"
        />

        {/* Color coded arcs for port and starboard */}
        <path
          d={portArcPath}
          stroke="#e53935"
          strokeWidth="8"
          fill="none"
          opacity="0.4"
        />

        <path
          d={stbdArcPath}
          stroke="#43a047"
          strokeWidth="8"
          fill="none"
          opacity="0.4"
        />

        {/* Tick marks */}
        <g id="tick-marks">{tickMarks}</g>

        {/* Port/Starboard labels */}
        <text
          x={portLabelPoint.x}
          y={portLabelPoint.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.06}
          fontWeight="bold"
          fill="#e53935"
        >
          PORT
        </text>

        <text
          x={stbdLabelPoint.x}
          y={stbdLabelPoint.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.06}
          fontWeight="bold"
          fill="#43a047"
        >
          STBD
        </text>

        {/* Digital readout */}
        <text
          x={center}
          y={center + frameWidth * 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.07}
          fontWeight="bold"
          fill="#ffffff"
        >
          {Math.abs(clampedAngle).toFixed(1)}°{' '}
          {clampedAngle < 0 ? 'PORT' : clampedAngle > 0 ? 'STBD' : ''}
        </text>

        {/* Center line */}
        <line
          x1={center}
          y1={center - innerRadius * 0.6}
          x2={center}
          y2={center}
          stroke="#ffffff"
          strokeWidth="1"
          strokeDasharray="4 2"
        />

        {/* Needle */}
        <line
          x1={center}
          y1={center}
          x2={needlePoint.x}
          y2={needlePoint.y}
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <circle cx={center} cy={center} r={size * 0.02} fill="#ffffff" />
      </svg>
    </div>
  );
};

export default RudderAngleIndicator;
