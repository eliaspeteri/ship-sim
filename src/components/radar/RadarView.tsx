import React from 'react';

type RadarViewProps = {
  size: number;
  nightMode: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  radarSweepRef: React.RefObject<HTMLDivElement | null>;
};

const RING_PADDING = 10;
const LABEL_PADDING = 12;
const MAJOR_TICK_LENGTH = 10;
const MINOR_TICK_LENGTH = 5;
const LABEL_FONT_SIZE = 9;

export function RadarView({
  size,
  nightMode,
  canvasRef,
  radarSweepRef,
}: RadarViewProps) {
  const outerOffset = RING_PADDING + LABEL_PADDING;
  const outerSize = size + outerOffset * 2;
  const tickColor = nightMode ? '#55FF55' : '#55FF55';
  const tickOuter = size / 2 + RING_PADDING - 2;
  const labelRadius = tickOuter + 8;
  const outerCenter = outerSize / 2;

  const polarToPoint = (angle: number, radius: number) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return {
      x: outerCenter + Math.cos(radians) * radius,
      y: outerCenter + Math.sin(radians) * radius,
    };
  };

  return (
    <div
      className="relative mx-auto"
      style={{ width: outerSize, height: outerSize }}
    >
      <div
        className="absolute"
        style={{
          left: outerOffset,
          top: outerOffset,
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: nightMode ? '#000B14' : '#001A14',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="absolute top-0 left-0"
        />
        <div
          ref={radarSweepRef}
          className="absolute left-1/2 top-1/2 h-0.5 w-1/2 bg-green-400 opacity-70"
          style={{ transformOrigin: '0% 50%' }}
        />
      </div>
      <svg
        className="absolute inset-0 pointer-events-none"
        width={outerSize}
        height={outerSize}
        viewBox={`0 0 ${outerSize} ${outerSize}`}
      >
        {Array.from({ length: 180 }).map((_, index) => {
          const angle = index * 2;
          const isMajor = angle % 10 === 0;
          const length = isMajor ? MAJOR_TICK_LENGTH : MINOR_TICK_LENGTH;
          const start = polarToPoint(angle, tickOuter);
          const end = polarToPoint(angle, tickOuter - length);

          return (
            <line
              key={`tick-${angle}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={tickColor}
              strokeWidth={isMajor ? 1.2 : 0.8}
              opacity={isMajor ? 0.95 : 0.7}
            />
          );
        })}
        {Array.from({ length: 36 }).map((_, index) => {
          const angle = index * 10;
          const labelPos = polarToPoint(angle, labelRadius);
          return (
            <text
              key={`label-${angle}`}
              x={labelPos.x}
              y={labelPos.y}
              fill={tickColor}
              fontSize={LABEL_FONT_SIZE}
              textAnchor="middle"
              dominantBaseline="middle"
              opacity={0.95}
            >
              {angle}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
