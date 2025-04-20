import React from 'react';

// Compass Rose component for showing heading
export const CompassRose: React.FC<{ heading: number; size?: number }> = ({
  heading,
  size = 150,
}) => {
  // Convert heading from radians to degrees for display
  // Ensure heading stays within 0-359 degrees
  const headingDeg = ((((heading * 180) / Math.PI) % 360) + 360) % 360;
  const radius = size / 2;

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative rounded-full border-2 border-blue-400 bg-gray-900 overflow-hidden"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Cardinal points */}
        {['N', 'E', 'S', 'W'].map((dir, i) => (
          <div
            key={dir}
            className="absolute text-white font-bold text-lg"
            style={{
              left: `${50 + 42.5 * Math.sin((i * Math.PI) / 2)}%`,
              top: `${50 - 42.5 * Math.cos((i * Math.PI) / 2)}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {dir}
          </div>
        ))}

        {/* Degree markings */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = i * 10;
          const isCardinal = angle % 90 === 0;
          const length = isCardinal ? 12 : angle % 30 === 0 ? 10 : 6;

          return (
            <div
              key={angle}
              className="absolute bg-white"
              style={{
                top: '0px',
                left: '50%',
                height: `${length}px`,
                width: '2px',
                transformOrigin: `center ${radius}px`,
                transform: `translateX(-50%) rotate(${angle}deg)`,
              }}
            />
          );
        })}

        {/* Ship indicator (Red Triangle) */}
        <div
          className="absolute w-0 h-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '20px solid #f56565',
            left: '50%',
            top: '50%',
            transformOrigin: 'bottom center',
            transform: `translate(-50%, -100%) rotate(${headingDeg}deg)`,
            transition: 'transform 0.2s ease-out',
          }}
        />

        {/* Center Dot */}
        <div
          className="absolute w-2 h-2 bg-white rounded-full"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Heading display */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <div className="bg-black bg-opacity-70 px-2 py-1 rounded">
            <span className="font-mono text-white font-bold">
              {Math.round(headingDeg).toString().padStart(3, '0')}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
