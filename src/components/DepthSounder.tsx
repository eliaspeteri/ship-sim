import React from 'react';

interface DepthSounderProps {
  depth: number;
  maxDepth?: number;
  units?: string;
  width?: number;
  height?: number;
}

const DepthSounder: React.FC<DepthSounderProps> = ({
  depth,
  maxDepth = 100, // Default max depth for the scale
  units = 'm', // Default units
  width = 60, // Base width for the bar + scale area
  height = 200,
}) => {
  const padding = 10;
  const scaleWidth = 10;
  const labelPadding = 20; // Add padding for labels
  const barWidth = width - scaleWidth - padding * 2;
  const scaleHeight = height - padding * 2;
  const svgWidth = width + labelPadding; // Increase total SVG width

  // Clamp depth to be within 0 and maxDepth for display
  const displayDepth = Math.max(0, Math.min(depth, maxDepth));
  const normalizedDepth = displayDepth / maxDepth;
  const fillHeight = scaleHeight * normalizedDepth;

  // Calculate tick positions (e.g., every 20 units)
  const numTicks = 5;
  const tickValues = Array.from(
    { length: numTicks + 1 },
    (_, i) => (maxDepth / numTicks) * i,
  );

  return (
    <div className="flex flex-col items-center">
      {/* Adjust SVG width and viewBox */}
      <svg width={svgWidth} height={height} viewBox={`0 0 ${svgWidth} ${height}`}>
        {/* Background Bar */}
        <rect
          x={padding}
          y={padding}
          width={barWidth}
          height={scaleHeight}
          fill="#e0e0e0" // Light gray background
          stroke="#a0a0a0"
          strokeWidth="1"
        />
        {/* Depth Fill - Starts from top */}
        <rect
          x={padding}
          y={padding} // Start fill from the top padding edge
          width={barWidth}
          height={fillHeight} // Height is calculated depth
          fill="#3498db" // Blue fill for water
        />

        {/* Scale Ticks and Labels - Inverted */}
        {tickValues.map((value, index) => {
          // Y position starts at top and increases downwards
          const yPos = padding + (scaleHeight * value) / maxDepth;
          return (
            <g key={index}>
              <line
                x1={padding + barWidth}
                y1={yPos}
                x2={padding + barWidth + scaleWidth}
                y2={yPos}
                stroke="black"
                strokeWidth="1"
              />
              <text
                // Position text relative to the end of the scale line
                x={padding + barWidth + scaleWidth + 3}
                y={yPos}
                fontSize="10"
                textAnchor="start"
                dominantBaseline="middle"
                fill="black"
              >
                {value}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Digital Readout */}
      <div className="mt-2 text-center">
        <span className="text-lg font-semibold">{depth.toFixed(1)}</span>
        <span className="text-sm ml-1">{units}</span>
      </div>
    </div>
  );
};

export default DepthSounder;
