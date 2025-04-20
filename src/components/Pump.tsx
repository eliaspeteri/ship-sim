import React, { useEffect, useState } from 'react';

// Pump component
export const Pump: React.FC<{
  x: number;
  y: number;
  isRunning: boolean;
  onChange: (running: boolean) => void;
  health?: number; // 0-1 health status
  label?: string;
  size?: number;
}> = ({ x, y, isRunning, onChange, health = 1.0, label, size = 40 }) => {
  // Animate rotation for running pumps
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRotation(prev => (prev + 6) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Get color based on health
  const getHealthColor = () => {
    if (health < 0.3) return '#f56565';
    if (health < 0.7) return '#ecc94b';
    return '#48bb78';
  };

  return (
    <div
      className="absolute flex flex-col items-center cursor-pointer"
      style={{ left: `${x - size / 2}px`, top: `${y - size / 2}px` }}
      onClick={() => onChange(!isRunning)}
    >
      <div
        className={`rounded-lg border-2 ${isRunning ? 'bg-blue-900' : 'bg-gray-800'} border-gray-600 transition-colors`}
        style={{ width: `${size}px`, height: `${size}px`, padding: '3px' }}
      >
        <div
          className="h-full w-full flex items-center justify-center"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isRunning ? 'none' : 'transform 0.3s',
          }}
        >
          <div className="relative w-2/3 h-2/3">
            <div
              className="absolute inset-0 bg-gray-300 rounded-full"
              style={{
                borderWidth: '3px',
                borderStyle: 'dashed',
                borderColor: getHealthColor(),
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1/3 h-1/3 bg-gray-600 rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>
      {label && (
        <div className="text-white text-xs mt-1 whitespace-nowrap">{label}</div>
      )}

      {/* Status indicator */}
      <div className="flex items-center mt-1">
        <div
          className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'} mr-1`}
        ></div>
        <span className="text-white text-xs">{isRunning ? 'ON' : 'OFF'}</span>
      </div>
    </div>
  );
};
