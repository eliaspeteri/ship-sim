import React from 'react';

// Circular gauge component
export const CircularGauge: React.FC<{
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  size?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
}> = ({
  value,
  min,
  max,
  label,
  unit,
  size = 120,
  warningThreshold,
  criticalThreshold,
}) => {
  // Calculate angle for gauge
  const angle = Math.min(
    270,
    Math.max(0, (((value || 0) - min) / (max - min)) * 270),
  );

  // Get color based on thresholds
  const getColor = () => {
    if (criticalThreshold && value >= criticalThreshold) return '#f56565';
    if (warningThreshold && value >= warningThreshold) return '#ed8936';
    return '#48bb78';
  };

  return (
    <div className="flex flex-col items-center" style={{ width: `${size}px` }}>
      <div className="text-white font-bold mb-1 text-center">{label}</div>
      <div
        className="relative rounded-full bg-gray-800 border border-gray-600"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Gauge background track */}
        <div
          className="absolute"
          style={{
            width: `${size - 20}px`,
            height: `${size - 20}px`,
            borderRadius: '50%',
            top: '10px',
            left: '10px',
            background: 'conic-gradient(#334 0deg, transparent 0deg)',
          }}
        />

        {/* Gauge value fill */}
        <div
          className="absolute"
          style={{
            width: `${size - 20}px`,
            height: `${size - 20}px`,
            borderRadius: '50%',
            top: '10px',
            left: '10px',
            background: `conic-gradient(${getColor()} 0deg, ${getColor()} ${angle}deg, transparent ${angle}deg)`,
            transition: 'background 0.3s ease',
          }}
        />

        {/* Inner circle to create a donut */}
        <div
          className="absolute bg-gray-900 rounded-full"
          style={{
            width: `${size - 40}px`,
            height: `${size - 40}px`,
            top: '20px',
            left: '20px',
          }}
        />

        {/* Value */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-white font-bold text-xl">
            {Math.round(value || 0)}
          </span>
          <span className="text-gray-400 text-xs">{unit}</span>
        </div>

        {/* Ticks */}
        {Array.from({ length: 10 }).map((_, i) => {
          const tickAngle = i * 30;
          const isMajor = i % 3 === 0;

          return (
            <div
              key={i}
              className={`absolute bg-white ${isMajor ? 'h-3 w-1' : 'h-2 w-0.5'}`}
              style={{
                top: `${size / 2}px`,
                left: `${size / 2}px`,
                transformOrigin: '50% 0',
                transform: `rotate(${tickAngle - 135}deg) translateY(${size / 2 - 10}px)`,
              }}
            />
          );
        })}
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between w-full mt-1">
        <span className="text-gray-400 text-xs">
          {min}
          {unit}
        </span>
        <span className="text-gray-400 text-xs">
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
};
