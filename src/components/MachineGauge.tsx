import React from 'react';

// Gauge component for showing pressure, temperature, etc.
export const MachineGauge: React.FC<{
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  redThreshold?: number;
  yellowThreshold?: number;
  size?: number;
}> = ({
  value,
  min,
  max,
  label,
  unit,
  redThreshold,
  yellowThreshold,
  size = 80,
}) => {
  // Calculate angle for gauge needle
  const angle = -135 + (((value || 0) - min) / (max - min)) * 270;

  // Determine color based on thresholds
  const getColor = () => {
    const safeValue = value || 0;
    if (redThreshold && safeValue >= redThreshold) return '#f56565';
    if (yellowThreshold && safeValue >= yellowThreshold) return '#ecc94b';
    return '#48bb78';
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center" style={{ width: `${size}px` }}>
      <div className="text-xs text-center text-white mb-1 font-bold">
        {label}
      </div>
      <div
        className="relative bg-gray-800 rounded-full border border-gray-600"
        style={{
          width: `${size}px`,
          height: `${size / 2}px`,
          overflow: 'hidden',
        }}
      >
        {/* Gauge background */}
        <div
          className="absolute"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            top: 0,
            backgroundImage: `conic-gradient(
              #111 0deg,
              ${color} ${angle}deg,
              #444 ${angle + 0.5}deg,
              #444 270deg,
              #111 270deg
            )`,
            clipPath: `polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%)`,
          }}
        ></div>

        {/* Gauge markings */}
        <div className="absolute inset-0">
          {[0, 45, 90, 135, 180, 225, 270].map(deg => (
            <div
              key={deg}
              className="absolute bg-white"
              style={{
                height: deg % 90 === 0 ? '8px' : '4px',
                width: '1px',
                bottom: '0px',
                left: `${size / 2}px`,
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) rotate(${135 - deg}deg)`,
              }}
            ></div>
          ))}
        </div>

        {/* Gauge needle */}
        <div
          className="absolute"
          style={{
            width: '2px',
            height: `${size * 0.45}px`,
            background: 'white',
            bottom: '0px',
            left: `${size / 2}px`,
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${-angle}deg)`,
            zIndex: 10,
            boxShadow: '0 0 5px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="absolute bg-white rounded-full"
            style={{
              width: '6px',
              height: '6px',
              bottom: '-3px',
              left: '-2px',
            }}
          ></div>
        </div>
      </div>

      {/* Value display */}
      <div className="text-white text-center mt-1" style={{ color }}>
        <span className="font-mono text-sm">
          {(value || 0).toFixed(1)}
          {unit}
        </span>
      </div>
    </div>
  );
};
