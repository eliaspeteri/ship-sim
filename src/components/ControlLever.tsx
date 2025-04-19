import React, { useState, useEffect } from 'react';

// Control lever component for throttle/rudder
export const ControlLever: React.FC<{
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  vertical?: boolean;
  label: string;
  scale?: Array<{ label: string; value: number }>;
}> = ({ value, min, max, onChange, vertical = false, label, scale }) => {
  // Calculate normalized position 0-1
  const normalized = (value - min) / (max - min);
  const position = vertical ? 1 - normalized : normalized;

  // Handle drag
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startValue, setStartValue] = useState(value);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartValue(value);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    // Calculate delta
    const delta = vertical
      ? (startPos.y - e.clientY) / 100
      : (e.clientX - startPos.x) / 100;

    // Calculate new value based on range
    const range = max - min;
    const newValue = Math.max(min, Math.min(max, startValue + delta * range));

    onChange(newValue);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startPos, startValue]);

  return (
    <div className="flex flex-col items-center p-2">
      <div className="text-white mb-1">{label}</div>
      <div
        className={`relative ${vertical ? 'h-40 w-10' : 'w-40 h-10'} bg-gray-800 rounded-full border border-gray-600`}
      >
        {/* Scale markings */}
        {scale &&
          scale.map(mark => {
            const markPos = (mark.value - min) / (max - min);
            const posStyle = vertical
              ? { bottom: `${markPos * 100}%`, left: '100%' }
              : { left: `${markPos * 100}%`, top: '100%' };

            return (
              <div key={mark.value} className="absolute" style={posStyle}>
                <div
                  className="h-2 w-1 bg-white"
                  style={{
                    transform: vertical
                      ? 'translateY(50%)'
                      : 'translateX(-50%)',
                    marginLeft: vertical ? '5px' : '0',
                    marginTop: vertical ? '0' : '5px',
                  }}
                />
                <div
                  className="text-white text-xs"
                  style={{
                    transform: vertical
                      ? 'translateY(50%)'
                      : 'translateX(-50%)',
                    marginLeft: vertical ? '8px' : '0',
                    marginTop: vertical ? '0' : '8px',
                  }}
                >
                  {mark.label}
                </div>
              </div>
            );
          })}

        {/* Track active section */}
        <div
          className={`absolute ${vertical ? 'w-full' : 'h-full'} bg-blue-500 rounded-full`}
          style={
            vertical
              ? { bottom: 0, height: `${normalized * 100}%` }
              : { left: 0, width: `${normalized * 100}%` }
          }
        />

        {/* Lever handle */}
        <div
          className={`absolute cursor-grab ${isDragging ? 'cursor-grabbing' : ''} w-8 h-8 rounded-full bg-gray-300 border-2 border-gray-500`}
          style={
            vertical
              ? { bottom: `calc(${position * 100}% - 16px)`, left: '1px' }
              : { left: `calc(${position * 100}% - 16px)`, top: '1px' }
          }
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Value display */}
      <div className="mt-1">
        <span className="text-white font-mono">
          {typeof value === 'number' && value.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
