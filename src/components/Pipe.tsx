import React, { useEffect, useState } from 'react';

// Pipe Component that renders SVG pipes connecting systems
export const Pipe: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width?: number;
  color?: string;
  flow?: number; // Flow rate 0-1
  animated?: boolean;
}> = ({
  x1,
  y1,
  x2,
  y2,
  width = 6,
  color = '#888',
  flow = 0,
  animated = false,
}) => {
  // Calculate flow path dasharray/dashoffset for animation
  const _length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const dashLength = Math.max(5, width * 2);
  const gapLength = dashLength;
  const dashArray = animated ? `${dashLength} ${gapLength}` : '';

  // Logic for animating flow
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!animated || flow <= 0) return;

    const interval = setInterval(() => {
      setOffset(prev => (prev + flow * 0.5) % (dashLength + gapLength));
    }, 50);

    return () => clearInterval(interval);
  }, [animated, flow, dashLength, gapLength]);

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
      {animated && flow > 0 && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="rgba(255,255,255,0.7)"
          strokeWidth={width - 2}
          strokeDasharray={dashArray}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};
