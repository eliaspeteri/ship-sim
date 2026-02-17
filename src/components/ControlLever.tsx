import React from 'react';

import { useLeverDrag } from '../hooks/useLeverDrag'; // Import the hook

interface ControlLeverProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  vertical?: boolean;
  label: string;
  scale?: Array<{ label: string; value: number }>;
}

/**
 * Renders a linear slider control, suitable for rudder or similar inputs.
 * Uses the useLeverDrag hook for handling drag interactions.
 */
export const ControlLever: React.FC<ControlLeverProps> = ({
  value: initialValue, // Rename prop to avoid conflict with hook's return value
  min,
  max,
  onChange,
  vertical = false,
  label,
  scale,
}) => {
  // Use the custom hook to manage drag state and logic
  const { value, isDragging, handleMouseDown } = useLeverDrag({
    initialValue,
    min,
    max,
    onChange,
    dragAxis: vertical ? 'vertical' : 'horizontal',
  });

  // Calculate normalized position (0-1) based on the current value from the hook
  const range = max - min;
  const normalized = range === 0 ? 0 : (value - min) / range;
  // Invert position for vertical levers so 0 is at the bottom
  const position = vertical ? 1 - normalized : normalized;

  return (
    <div className="flex flex-col items-center p-2">
      <div className="text-white mb-1 text-sm font-semibold">{label}</div>
      <div
        className={`relative ${vertical ? 'h-40 w-10' : 'w-40 h-10'} bg-gray-800 rounded-full border border-gray-600`}
      >
        {/* Scale markings */}
        {scale &&
          scale.map(mark => {
            // Calculate position based on the mark's value
            const markRange = max - min;
            const markNorm =
              markRange === 0 ? 0 : (mark.value - min) / markRange;
            const markPos = vertical ? 1 - markNorm : markNorm; // Invert for vertical
            const posStyle = vertical
              ? { top: `${markPos * 100}%`, left: '100%' } // Use top for vertical
              : { left: `${markPos * 100}%`, top: '100%' };

            return (
              <div
                key={mark.value}
                className="absolute"
                style={{
                  ...posStyle,
                  // Adjust transform origin based on orientation
                  transform: vertical ? 'translateY(-50%)' : 'translateX(-50%)',
                }}
              >
                {/* Tick mark */}
                <div
                  className={`${vertical ? 'h-1 w-2' : 'h-2 w-1'} bg-gray-400`}
                  style={{
                    marginLeft: vertical ? '4px' : '0',
                    marginTop: vertical ? '0' : '4px',
                  }}
                />
                {/* Label text */}
                <div
                  className="text-gray-400 text-xs absolute whitespace-nowrap"
                  style={
                    vertical
                      ? { transform: 'translateY(-50%)', left: '10px' } // Position right for vertical
                      : { transform: 'translateX(-50%)', top: '10px' } // Position below for horizontal
                  }
                >
                  {mark.label}
                </div>
              </div>
            );
          })}

        {/* Track active section (visual feedback) */}
        <div
          className={`absolute ${vertical ? 'w-full bottom-0' : 'h-full left-0'} bg-blue-600 rounded-full`}
          style={
            vertical
              ? { height: `${normalized * 100}%` } // Height from bottom
              : { width: `${normalized * 100}%` } // Width from left
          }
        />

        {/* Lever handle - Attach mouse down handler here */}
        <div
          className={`absolute ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} w-8 h-8 rounded-full bg-gray-300 hover:bg-gray-200 border-2 border-gray-500 shadow-md`}
          style={
            vertical
              ? { top: `calc(${position * 100}% - 16px)`, left: '4px' } // Use top, adjust horizontal position
              : { left: `calc(${position * 100}% - 16px)`, top: '4px' } // Adjust vertical position
          }
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Value display */}
      <div className="mt-2 min-h-[1.5em]">
        {' '}
        {/* Reserve space */}
        <span className="text-white font-mono text-sm">
          {typeof value === 'number' ? value.toFixed(2) : ''}
        </span>
      </div>
    </div>
  );
};
