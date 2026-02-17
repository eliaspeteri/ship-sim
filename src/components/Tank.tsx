import React from 'react';

import type { JSX } from 'react';

/**
 * Tank component that renders a fuel gauge dial with a needle indicating the current level
 */
export const Tank: React.FC<{
  x: number;
  y: number;
  level: number; // 0-1
  label?: string;
  size?: number;
  color?: string;
}> = ({ x, y, level, label, size = 60, color = '#ff0000' }) => {
  // Convert level (0-1) to angle (180deg to 0deg in a semicircle)
  const needleAngle = 225 + (level || 0) * 270;

  // Generate tick marks (small, medium, and large)
  const tickMarks: JSX.Element[] = [];
  const tickCount = 13; // Total number of ticks in the semi-circle

  for (let i = 0; i < tickCount; i++) {
    const angle = 135 + (i / (tickCount - 1)) * 225; // Distribute evenly across 180 degrees
    const radian = (angle * Math.PI) / 180;

    // Determine tick length (every 3rd tick is longer)
    const tickLength = i % 3 === 0 ? 10 : 5;
    const outerRadius = size / 2 - 5;
    const innerRadius = outerRadius - tickLength;

    // Calculate coordinates
    const x1 = Math.cos(radian) * innerRadius;
    const y1 = Math.sin(radian) * innerRadius;
    const x2 = Math.cos(radian) * outerRadius;
    const y2 = Math.sin(radian) * outerRadius;

    tickMarks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#AAAAAA"
        strokeWidth={i % 3 === 0 ? 2 : 1}
        transform={`translate(${size / 2}, ${size / 2})`}
      />,
    );
  }

  return (
    <div
      className="absolute"
      style={{ left: `${x - size / 2}px`, top: `${y - size / 2}px` }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Metallic bezel gradient */}
          <linearGradient
            id="bezelGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#E0E0E0" />
            <stop offset="40%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#C0C0C0" />
            <stop offset="100%" stopColor="#A0A0A0" />
          </linearGradient>

          {/* Shadow for depth */}
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
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

        {/* Outer bezel */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2}
          fill="url(#bezelGradient)"
          filter="url(#dropShadow)"
        />

        {/* Inner dark background */}
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill="#111111" />

        {/* Tick marks */}
        {tickMarks}

        {/* E and F labels */}
        <text
          x={size * 0.2}
          y={size * 0.8}
          fill="#DDDDDD"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize={size * 0.12}
        >
          E
        </text>

        <text
          x={size * 0.8}
          y={size * 0.8}
          fill="#DDDDDD"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize={size * 0.12}
          textAnchor="end"
        >
          F
        </text>

        {/* FUEL label */}
        <text
          x={size / 2}
          y={size * 0.55}
          fill="#DDDDDD"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize={size * 0.12}
          textAnchor="middle"
        >
          FUEL
        </text>

        {/* Fuel pump icon */}
        <path
          d={`M${size * 0.8},${size * 0.65} h3 v-5 h-2 v-2 h4 v7 h-2`}
          fill="none"
          stroke="#DDDDDD"
          strokeWidth="1"
        />

        {/* Needle */}
        <g
          data-testid="tank-needle"
          transform={`translate(${size / 2}, ${size / 2}) rotate(${needleAngle})`}
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2={-size * 0.4}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="0"
            cy="0"
            r={size * 0.08}
            fill="#333333"
            stroke="#666666"
            strokeWidth="1"
          />
        </g>
      </svg>

      {label && (
        <div className="text-white text-sm mt-1 font-bold text-center">
          {label}
        </div>
      )}
    </div>
  );
};
