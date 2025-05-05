import React from 'react';

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
  maxAngle = 35,
  size = 200
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
    cx: number,
    cy: number,
    r: number,
    angleDegrees: number
  ): { x: number; y: number } => {
    const angleRadians = (angleDegrees * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRadians),
      y: cy + r * Math.sin(angleRadians)
    };
  };
  
  // Generate tick marks
  const tickMarks = [];
  const tickStep = 5; // 5 degree increments
  
  for (let i = -maxAngle; i <= maxAngle; i += tickStep) {
    const isMajor = i % 10 === 0; // Major tick every 10 degrees
    const isHardOver = Math.abs(i) === maxAngle; // Hard over position
    const tickLength = isHardOver ? 15 : isMajor ? 10 : 5;
    const tickWidth = isHardOver ? 2 : isMajor ? 1.5 : 1;
    
    // Calculate angle along the arc
    const tickAngle = startAngle + (i / maxAngle) * (sweepAngle / 2);
    
    const outerPoint = getPointOnCircle(center, center, innerRadius, tickAngle);
    const innerPoint = getPointOnCircle(center, center, innerRadius - tickLength, tickAngle);
    
    // Determine color based on side (port = red, starboard = green)
    const tickColor = i < 0 ? '#e53935' : i > 0 ? '#43a047' : '#ffffff';
    
    tickMarks.push(
      <line
        key={`tick-${i}`}
        x1={outerPoint.x}
        y1={outerPoint.y}
        x2={innerPoint.x}
        y2={innerPoint.y}
        stroke={tickColor}
        strokeWidth={tickWidth}
      />
    );
    
    // Add labels for major ticks
    if (isMajor || isHardOver) {
      const labelPoint = getPointOnCircle(
        center, 
        center, 
        innerRadius - tickLength - 12, 
        tickAngle
      );
      
      tickMarks.push(
        <text
          key={`label-${i}`}
          x={labelPoint.x}
          y={labelPoint.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={isHardOver ? size * 0.05 : size * 0.04}
          fontWeight={isHardOver ? 'bold' : 'normal'}
          fill={tickColor}
        >
          {Math.abs(i)}°
        </text>
      );
    }
  }
  
  // Calculate points for the needle
  const needlePoint = getPointOnCircle(center, center, innerRadius * 0.8, needleAngle);
  
  // Generate the gradient arcs for port and starboard sides
  const arcRadius = innerRadius * 0.75;
  const portStartAngle = startAngle;
  const portEndAngle = startAngle - (sweepAngle / 2);
  const stbdStartAngle = startAngle;
  const stbdEndAngle = startAngle + (sweepAngle / 2);
  
  const portStartPoint = getPointOnCircle(center, center, arcRadius, portStartAngle);
  const portEndPoint = getPointOnCircle(center, center, arcRadius, portEndAngle);
  const stbdStartPoint = getPointOnCircle(center, center, arcRadius, stbdStartAngle);
  const stbdEndPoint = getPointOnCircle(center, center, arcRadius, stbdEndAngle);
  
  // Create SVG arc paths
  const createArc = (startPoint: {x: number, y: number}, endPoint: {x: number, y: number}, radius: number, largeArc: 0 | 1, sweep: 0 | 1) => {
    return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${endPoint.x} ${endPoint.y}`;
  };
  
  const portArcPath = createArc(portStartPoint, portEndPoint, arcRadius, 0, 0);
  const stbdArcPath = createArc(stbdStartPoint, stbdEndPoint, arcRadius, 0, 1);
  
  // Calculate label positions for PORT and STBD
  const portLabelPoint = getPointOnCircle(
    center, 
    center, 
    innerRadius - 40, 
    startAngle - (sweepAngle / 4)
  );
  
  const stbdLabelPoint = getPointOnCircle(
    center, 
    center, 
    innerRadius - 40, 
    startAngle + (sweepAngle / 4)
  );
  
  return (
    <div className="relative" style={{ width: size, height: size / 2 + frameWidth }}>
      <svg width={size} height={size / 2 + frameWidth} viewBox={`0 0 ${size} ${size / 2 + frameWidth}`}>
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
        <g id="tick-marks">
          {tickMarks}
        </g>
        
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
          {Math.abs(clampedAngle).toFixed(1)}° {clampedAngle < 0 ? 'PORT' : clampedAngle > 0 ? 'STBD' : ''}
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
        
        <circle 
          cx={center} 
          cy={center} 
          r={size * 0.02} 
          fill="#ffffff" 
        />
      </svg>
    </div>
  );
};

export default RudderAngleIndicator;