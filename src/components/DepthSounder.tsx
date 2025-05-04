import React, { useState, useEffect, useRef } from 'react';

interface DepthSounderProps {
  depth: number;
  maxDepth?: number;
  units?: string;
  width?: number;
  height?: number;
  historyLength?: number; // Number of historical points to store/display
}

const DepthSounder: React.FC<DepthSounderProps> = ({
  depth,
  maxDepth = 100,
  units = 'm',
  width = 250, // Increased default width for timeline
  height = 200,
  historyLength = 50, // Default number of history points
}) => {
  const [depthHistory, setDepthHistory] = useState<number[]>([]);
  const prevDepthRef = useRef<number>(0);

  // Update history when depth prop changes
  useEffect(() => {
    // Only update if depth actually changed to avoid rapid updates
    if (depth !== prevDepthRef.current) {
      setDepthHistory(prevHistory => {
        const newHistory = [...prevHistory, depth];
        // Limit history length
        if (newHistory.length > historyLength) {
          return newHistory.slice(newHistory.length - historyLength);
        }
        return newHistory;
      });
      prevDepthRef.current = depth;
    }
  }, [depth, historyLength]);

  const padding = 10;
  const scaleWidth = 10;
  const labelPadding = 25; // Ensure space for labels
  const chartWidth = width - scaleWidth - padding - labelPadding;
  const chartHeight = height - padding * 2 - 30; // Space for digital readout below
  const svgWidth = width;

  // Clamp current depth for digital display
  const displayDepth = Math.max(0, Math.min(depth, maxDepth));

  // Generate points for the seabed path
  const points = depthHistory
    .map((histDepth, index) => {
      const clampedHistDepth = Math.max(0, Math.min(histDepth, maxDepth));
      const x = padding + (index / (historyLength - 1)) * chartWidth;
      const y = padding + (clampedHistDepth / maxDepth) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  // Generate path data for the filled area below the line
  let filledPathData = `M ${padding},${padding + chartHeight}`; // Start bottom-left
  if (depthHistory.length > 0) {
    const firstX = padding;
    const firstY =
      padding +
      (Math.max(0, Math.min(depthHistory[0], maxDepth)) / maxDepth) *
        chartHeight;
    filledPathData += ` L ${firstX},${firstY}`; // Line up to first point
    filledPathData += ` L ${points}`; // Line along the history points

    const lastX =
      padding + ((depthHistory.length - 1) / (historyLength - 1)) * chartWidth;
    filledPathData += ` L ${lastX},${padding + chartHeight}`; // Line down to bottom-right
  }
  filledPathData += ` Z`; // Close path

  // Calculate tick positions
  const numTicks = 5;
  const tickValues = Array.from(
    { length: numTicks + 1 },
    (_, i) => (maxDepth / numTicks) * i,
  );

  return (
    <div className="flex flex-col items-center p-2 bg-gray-200 border border-gray-400 rounded">
      <svg
        width={svgWidth}
        height={chartHeight + padding * 2}
        viewBox={`0 0 ${svgWidth} ${chartHeight + padding * 2}`}
      >
        {/* Chart Background */}
        <rect
          x={padding}
          y={padding}
          width={chartWidth}
          height={chartHeight}
          fill="#001f3f" // Dark blue background
        />
        {/* Seabed Fill Path - Lighter Dark Blue */}
        <path d={filledPathData} fill="#003366" opacity="0.7" />{' '}
        {/* Changed fill color */}
        {/* Seabed Contour Line - Red */}
        {points && (
          <polyline
            points={points}
            fill="none"
            stroke="red" // Changed stroke color to red
            strokeWidth="2"
          />
        )}
        {/* Scale Ticks and Labels */}
        {tickValues.map((value, index) => {
          const yPos = padding + (value / maxDepth) * chartHeight;
          return (
            <g key={index}>
              {/* Tick line across chart area */}
              <line
                x1={padding}
                y1={yPos}
                x2={padding + chartWidth}
                y2={yPos}
                stroke="#FFFFFF" // White ticks
                strokeWidth="0.5"
                opacity="0.3"
              />
              {/* Tick mark on the right */}
              <line
                x1={padding + chartWidth}
                y1={yPos}
                x2={padding + chartWidth + scaleWidth}
                y2={yPos}
                stroke="black"
                strokeWidth="1"
              />
              <text
                x={padding + chartWidth + scaleWidth + 3}
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
      <div className="mt-1 text-center bg-gray-100 px-2 py-1 rounded w-full">
        <span className="text-xl font-bold">{displayDepth.toFixed(1)}</span>
        <span className="text-sm ml-1">{units}</span>
      </div>
    </div>
  );
};

export default DepthSounder;
