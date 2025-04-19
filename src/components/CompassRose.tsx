import React from 'react';

// Compass Rose component for showing heading
export const CompassRose: React.FC<{ heading: number; size?: number }> = ({
  heading,
  size = 150,
}) => {
  // Convert heading from radians to degrees for display
  const headingDeg = ((heading * 180) / Math.PI) % 360;

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative rounded-full border-2 border-blue-400 bg-gray-900"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Cardinal points */}
        {['N', 'E', 'S', 'W'].map((dir, i) => (
          <div
            key={dir}
            className="absolute text-white font-bold"
            style={{
              left: `${50 + 45 * Math.sin((i * Math.PI) / 2)}%`,
              top: `${50 - 45 * Math.cos((i * Math.PI) / 2)}%`,
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
          const length = isCardinal ? 10 : angle % 30 === 0 ? 8 : 5;

          return (
            <div
              key={angle}
              className="absolute bg-white"
              style={{
                height: `${length}px`,
                width: '2px',
                bottom: '50%',
                left: '50%',
                transformOrigin: 'bottom center',
                transform: `rotate(${angle}deg)`,
              }}
            />
          );
        })}

        {/* Ship indicator */}
        <div
          className="absolute w-0 h-0"
          style={{
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: '25px solid #f56565',
            bottom: '50%',
            left: '50%',
            transform: `translateX(-50%) rotate(${headingDeg}deg)`,
            transformOrigin: 'bottom center',
            transition: 'transform 0.2s ease-out',
          }}
        />

        {/* Heading display */}
        <div className="absolute inset-x-0 bottom-8 flex justify-center">
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
