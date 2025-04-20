import React from 'react';

// Tank component
export const Tank: React.FC<{
  x: number;
  y: number;
  level: number; // 0-1
  label?: string;
  width?: number;
  height?: number;
  color?: string;
}> = ({ x, y, level, label, width = 60, height = 100, color = '#3182ce' }) => {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${x - width / 2}px`, top: `${y - height / 2}px` }}
    >
      <div
        className="relative rounded-lg border-2 border-gray-600 overflow-hidden bg-gray-800"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Level indicator */}
        <div
          className="absolute bottom-0 w-full transition-all duration-1000"
          style={{
            height: `${Math.max(0, Math.min(100, (level || 0) * 100))}%`,
            backgroundColor: color,
            backgroundImage:
              'linear-gradient(0deg, rgba(0,0,0,0.2) 0%, rgba(255,255,255,0.1) 100%)',
          }}
        ></div>

        {/* Level markings */}
        {[0.25, 0.5, 0.75].map(mark => (
          <div
            key={mark}
            className="absolute w-full border-t border-gray-500 flex items-center"
            style={{ bottom: `${mark * 100}%` }}
          >
            <span className="text-xs text-gray-400 ml-1">
              {Math.round(mark * 100)}%
            </span>
          </div>
        ))}

        {/* Current level */}
        <div
          className="absolute right-1 bottom-1 text-white text-xs font-mono"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
        >
          {Math.round((level || 0) * 100)}%
        </div>
      </div>

      {label && (
        <div className="text-white text-sm mt-1 font-bold">{label}</div>
      )}
    </div>
  );
};
