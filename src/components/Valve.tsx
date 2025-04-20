import React from 'react';

// Valve component that can be opened/closed
export const Valve: React.FC<{
  x: number;
  y: number;
  isOpen: boolean;
  onChange: (open: boolean) => void;
  label?: string;
  size?: number;
}> = ({ x, y, isOpen, onChange, label, size = 30 }) => {
  return (
    <div
      className="absolute flex flex-col items-center cursor-pointer"
      style={{ left: `${x - size / 2}px`, top: `${y - size / 2}px` }}
      onClick={() => onChange(!isOpen)}
    >
      <div
        className={`rounded-full border-2 ${isOpen ? 'bg-green-600 border-green-400' : 'bg-red-600 border-red-400'} transition-colors`}
        style={{ width: `${size}px`, height: `${size}px`, padding: '3px' }}
      >
        <div
          className="h-full w-full flex items-center justify-center"
          style={{
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s',
          }}
        >
          <div className="w-2/3 h-1/3 bg-white rounded-sm"></div>
        </div>
      </div>
      {label && (
        <div className="text-white text-xs mt-1 whitespace-nowrap">{label}</div>
      )}
    </div>
  );
};
