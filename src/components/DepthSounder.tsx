import React, { useState, useEffect, useRef, useCallback } from 'react';

interface DepthSounderProps {
  depth: number;
  maxDepth?: number;
  units?: string;
  width?: number;
  height?: number;
  historyLength?: number; // Number of historical points to store/display
}

const AVAILABLE_RANGES = [50, 100, 200, 500]; // Example ranges
const initialRange = 100; // Default range

const DepthSounder: React.FC<DepthSounderProps> = ({
  depth,
  units = 'm',
  width = 250, // Increased default width for timeline
  height = 200,
  historyLength = 50, // Default number of history points
}) => {
  const [depthHistory, setDepthHistory] = useState<number[]>([]);
  const prevDepthRef = useRef<number>(0);

  // Internal state for controls
  const [rangeIndex, setRangeIndex] = useState(() =>
    Math.max(0, AVAILABLE_RANGES.indexOf(initialRange)),
  );
  const [shift, setShift] = useState(0);
  const [gain, setGain] = useState(5);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomCenterDepth, setZoomCenterDepth] = useState(0);
  const zoomFactor = 2; // How much to zoom in (e.g., 2x)

  const currentRange = AVAILABLE_RANGES[rangeIndex];

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

  const handleRangeClick = useCallback(() => {
    setRangeIndex(prevIndex => (prevIndex + 1) % AVAILABLE_RANGES.length);
    setShift(0); // Reset shift when range changes
    setIsZoomed(false); // Turn off zoom when range changes
  }, []);

  const handleShiftUpClick = useCallback(() => {
    if (isZoomed) return; // Disable shift when zoomed
    const shiftStep = currentRange * 0.1; // Shift by 10% of range
    setShift(prev => Math.max(0, prev - shiftStep)); // Don't go below 0
  }, [currentRange, isZoomed]);

  const handleShiftDownClick = useCallback(() => {
    if (isZoomed) return; // Disable shift when zoomed
    const shiftStep = currentRange * 0.1;
    setShift(prev => prev + shiftStep);
  }, [currentRange, isZoomed]);

  const handleGainUpClick = useCallback(() => {
    setGain(prev => Math.min(10, prev + 1));
  }, []);

  const handleGainDownClick = useCallback(() => {
    setGain(prev => Math.max(0, prev - 1));
  }, []);

  const handleZoomClick = useCallback(() => {
    setIsZoomed(prev => {
      const nextZoomState = !prev;
      if (nextZoomState) {
        const currentViewCenter = shift + currentRange / 2;
        const depthInView = depth >= shift && depth <= shift + currentRange;
        setZoomCenterDepth(depthInView ? depth : currentViewCenter);
      }
      return nextZoomState;
    });
  }, [depth, shift, currentRange]);

  const padding = 10;
  const scaleWidth = 10;
  const labelPadding = 25; // Ensure space for labels
  const chartWidth = width - scaleWidth - padding - labelPadding;
  const chartHeight = height - padding * 2 - 30; // Space for digital readout below
  const svgWidth = width;

  let displayMinDepth: number;
  let displayMaxDepth: number;

  if (isZoomed) {
    const zoomedRange = currentRange / zoomFactor;
    displayMinDepth = Math.max(0, zoomCenterDepth - zoomedRange / 2);
    displayMaxDepth = displayMinDepth + zoomedRange;
  } else {
    displayMinDepth = shift;
    displayMaxDepth = shift + currentRange;
  }
  const displayRange = displayMaxDepth - displayMinDepth;

  const displayDepthValue = Math.max(
    displayMinDepth,
    Math.min(depth, displayMaxDepth),
  );

  const points = depthHistory
    .map((histDepth, index) => {
      const clampedHistDepth = Math.max(
        displayMinDepth,
        Math.min(histDepth, displayMaxDepth),
      );
      const x = padding + (index / (historyLength - 1)) * chartWidth;
      const y =
        padding +
        ((clampedHistDepth - displayMinDepth) / displayRange) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  let filledPathData = `M ${padding},${padding + chartHeight}`;
  if (depthHistory.length > 0) {
    const firstX = padding;
    const firstY =
      padding +
      ((Math.max(displayMinDepth, Math.min(depthHistory[0], displayMaxDepth)) -
        displayMinDepth) /
        displayRange) *
        chartHeight;
    filledPathData += ` L ${firstX},${firstY}`;
    filledPathData += ` L ${points}`;

    const lastX =
      padding + ((depthHistory.length - 1) / (historyLength - 1)) * chartWidth;
    filledPathData += ` L ${lastX},${padding + chartHeight}`;
  }
  filledPathData += ` Z`;

  const numTicks = 5;
  const tickValues = Array.from(
    { length: numTicks + 1 },
    (_, i) => displayMinDepth + (displayRange / numTicks) * i,
  );

  return (
    <div className="flex flex-col items-center p-2 bg-gray-200 border border-gray-400 rounded">
      <svg
        width={svgWidth}
        height={chartHeight + padding * 2}
        viewBox={`0 0 ${svgWidth} ${chartHeight + padding * 2}`}
      >
        <rect
          x={padding}
          y={padding}
          width={chartWidth}
          height={chartHeight}
          fill="#001f3f"
        />
        <path d={filledPathData} fill="#003366" opacity="0.7" />
        {points && (
          <polyline points={points} fill="none" stroke="red" strokeWidth="2" />
        )}
        {tickValues.map((value, index) => {
          const yPos =
            padding + ((value - displayMinDepth) / displayRange) * chartHeight;
          return (
            <g key={index}>
              <line
                x1={padding}
                y1={yPos}
                x2={padding + chartWidth}
                y2={yPos}
                stroke="#FFFFFF"
                strokeWidth="0.5"
                opacity="0.3"
              />
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
                {value.toFixed(0)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 text-center bg-gray-100 px-2 py-1 rounded w-full">
        <span className="text-xl font-bold">
          {displayDepthValue.toFixed(1)}
        </span>
        <span className="text-sm ml-1">{units}</span>
        <span className="text-xs ml-4">
          R:{currentRange}
          {units}
        </span>
        {shift > 0 && (
          <span className="text-xs ml-2">
            S:{shift.toFixed(0)}
            {units}
          </span>
        )}
        <span className="text-xs ml-2">G:{gain}</span>
        {isZoomed && (
          <span className="text-xs ml-2 font-bold text-red-600">ZOOM</span>
        )}
      </div>
      <div className="flex justify-around items-center w-full mt-1">
        <button
          onClick={handleRangeClick}
          className="px-2 py-1 bg-gray-300 rounded text-xs"
        >
          RANGE
        </button>
        <div className="flex flex-col">
          <button
            onClick={handleShiftUpClick}
            className={`px-1 py-0 bg-gray-300 rounded text-xs mb-0.5 ${isZoomed ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isZoomed}
          >
            SHIFT ▲
          </button>
          <button
            onClick={handleShiftDownClick}
            className={`px-1 py-0 bg-gray-300 rounded text-xs ${isZoomed ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isZoomed}
          >
            SHIFT ▼
          </button>
        </div>
        <div className="flex flex-col">
          <button
            onClick={handleGainUpClick}
            className="px-1 py-0 bg-gray-300 rounded text-xs mb-0.5"
          >
            GAIN ▲
          </button>
          <button
            onClick={handleGainDownClick}
            className="px-1 py-0 bg-gray-300 rounded text-xs"
          >
            GAIN ▼
          </button>
        </div>
        <button
          onClick={handleZoomClick}
          className={`px-2 py-1 rounded text-xs ${isZoomed ? 'bg-red-400' : 'bg-gray-300'}`}
        >
          ZOOM
        </button>
      </div>
    </div>
  );
};

export default DepthSounder;
