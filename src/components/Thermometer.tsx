import React from 'react';

interface ThermometerProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  height?: number;
  width?: number;
  numTicks?: number; // Add numTicks prop
  labeledScale?: boolean; // Add labeledScale prop
}

const Thermometer: React.FC<ThermometerProps> = ({
  value,
  min = 0,
  max = 100,
  label = 'Temp',
  height = 150,
  width = 30,
  numTicks = 5, // Destructure numTicks with a default value
  labeledScale = false,
}) => {
  const range = max - min;
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / range));

  const bulbRadius = width / 2;
  const stemWidth = width * 0.6;
  const stemHeight = height - bulbRadius * 2;
  const stemX = (width - stemWidth) / 2;
  const scaleStartY = 0;
  const scaleEndY = stemHeight;

  // Calculate liquid height based on the actual stem height
  const liquidHeight = stemHeight * normalizedValue;

  // Calculate tick positions (using stemHeight as the scale range)
  const tickValues = Array.from(
    { length: numTicks + 1 },
    (_, i) => min + (range / numTicks) * i,
  );

  const ticks = tickValues.map(tickValue => {
    const normalizedTick = (tickValue - min) / range;
    // Calculate tick Y position based on stemHeight
    const yPos = scaleEndY - stemHeight * normalizedTick;
    return {
      value: tickValue,
      y: yPos,
    };
  });

  return (
    <div className="flex flex-col items-center">
      {label && <span className="text-xs mb-1">{label}</span>}
      <svg
        width={width + 20}
        height={height}
        viewBox={`0 0 ${width + 20} ${height}`}
      >
        {/* Glass Stem */}
        <rect
          x={stemX}
          y={scaleStartY}
          width={stemWidth}
          height={stemHeight}
          rx={stemWidth / 2}
          ry={stemWidth / 2}
          fill="none"
          stroke="gray"
          strokeWidth="1"
        />
        {/* Glass Bulb */}
        <circle
          cx={width / 2}
          cy={height - bulbRadius}
          r={bulbRadius}
          fill="none"
          stroke="gray"
          strokeWidth="1"
        />

        {/* Liquid */}
        <rect
          x={stemX + 1} // Slightly inset
          y={stemHeight - liquidHeight} // Position remains the same relative to stem bottom
          width={stemWidth - 2} // Slightly inset
          height={liquidHeight} // Use the correctly calculated liquidHeight
          fill="red"
          rx={(stemWidth - 2) / 2}
          ry={(stemWidth - 2) / 2}
        />
        {/* Liquid in Bulb */}
        <circle
          cx={width / 2}
          cy={height - bulbRadius}
          r={bulbRadius - 2} // Slightly smaller than glass bulb
          fill="red"
        />

        {/* Scale Ticks */}
        {ticks.map((tick, index) => (
          <g key={index}>
            <line
              x1={stemX + stemWidth} // Start tick at the edge of the stem
              y1={tick.y} // Use the correctly calculated tick Y position
              x2={stemX + stemWidth + 5} // Tick length
              y2={tick.y} // Use the correctly calculated tick Y position
              stroke="gray"
              strokeWidth="1"
            />
            {/* Optional: Add tick labels */}
            {labeledScale && (
              <text
                x={stemX + stemWidth + 7}
                y={tick.y + 3}
                fontSize="8"
                fill="gray"
              >
                {tick.value.toFixed(0)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <span className="text-xs mt-1">{value.toFixed(1)}°</span>
    </div>
  );
};

export default Thermometer;
