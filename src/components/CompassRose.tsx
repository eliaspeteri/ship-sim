import React from 'react';

interface CompassRoseProps {
  /** The current heading in radians. */
  heading: number;
  /** The size of the compass rose in pixels. Defaults to 150. */
  size?: number;
}

/**
 * Renders a compass rose component that displays the ship's heading.
 * The compass card rotates while the ship indicator remains fixed at the top.
 * @param heading - The current heading in radians.
 * @param size - The diameter of the compass rose in pixels.
 */
export const CompassRose: React.FC<CompassRoseProps> = ({
  heading,
  size = 150,
}) => {
  // Convert heading from radians to degrees for rotation calculation.
  // Ensure heading stays within 0-359 degrees.
  // Negative heading rotates the card clockwise, positive counter-clockwise.
  const rotationDegrees = -((((heading * 180) / Math.PI) % 360) + 360) % 360;
  // Display heading needs to be positive 0-359
  const _displayHeadingDeg = (360 + rotationDegrees) % 360;
  const radius = size / 2;
  const innerRadius = radius * 0.85; // Radius for placing markings and text

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative rounded-full border-4 border-gray-500 bg-gray-800 overflow-hidden shadow-lg" // Adjusted border and background
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Rotating Compass Card */}
        <div
          className="absolute w-full h-full transition-transform duration-200 ease-linear" // Smooth transition
          style={{ transform: `rotate(${rotationDegrees}deg)` }} // Rotate the entire card
        >
          {/* Cardinal points */}
          {['N', 'E', 'S', 'W'].map((dir, i) => (
            <div
              key={dir}
              className="absolute text-white font-semibold" // Adjusted font weight
              style={{
                // Position points closer to the edge using innerRadius
                left: `${50 + (innerRadius / radius) * 50 * Math.sin((i * Math.PI) / 2)}%`,
                top: `${50 - (innerRadius / radius) * 50 * Math.cos((i * Math.PI) / 2)}%`,
                transform: `translate(-50%, -50%) rotate(${-rotationDegrees}deg)`, // Counter-rotate text to keep it upright
                fontSize: `${size * 0.1}px`, // Scale font size with component size
              }}
            >
              {dir}
            </div>
          ))}

          {/* Degree markings */}
          {Array.from({ length: 72 }).map((_, i) => {
            // Increased markings to every 5 degrees
            const angle = i * 5;
            const isMajor = angle % 30 === 0; // Major tick every 30 degrees
            const isCardinal = angle % 90 === 0; // Cardinal tick
            const length = isCardinal
              ? size * 0.08
              : isMajor
                ? size * 0.06
                : size * 0.04; // Scale length
            const thickness = isMajor ? 2 : 1; // Thicker major ticks

            return (
              <div
                key={angle}
                className="absolute bg-gray-300" // Lighter tick color
                style={{
                  top: '0px', // Start ticks from the outer edge
                  left: '50%',
                  height: `${length}px`,
                  width: `${thickness}px`,
                  transformOrigin: `center ${radius}px`, // Rotate around the center
                  transform: `translateX(-50%) rotate(${angle}deg)`,
                }}
              />
            );
          })}
          {/* Degree Numbers (every 30 degrees) */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30;
            if (angle % 90 === 0) return null; // Skip cardinal points where letters are

            return (
              <div
                key={`num-${angle}`}
                className="absolute text-gray-300 font-mono" // Use mono font for numbers
                style={{
                  // Position numbers similarly to cardinal points
                  left: `${50 + (innerRadius / radius) * 50 * Math.sin((angle * Math.PI) / 180)}%`,
                  top: `${50 - (innerRadius / radius) * 50 * Math.cos((angle * Math.PI) / 180)}%`,
                  transform: `translate(-50%, -50%) rotate(${-rotationDegrees}deg)`, // Counter-rotate text
                  fontSize: `${size * 0.07}px`, // Scale font size
                }}
              >
                {angle}
              </div>
            );
          })}
        </div>

        {/* Fixed Ship Indicator (Lubber Line - Red Triangle at Top) */}
        <div
          className="absolute w-0 h-0"
          style={{
            borderLeft: `${size * 0.05}px solid transparent`, // Scale size
            borderRight: `${size * 0.05}px solid transparent`, // Scale size
            borderBottom: `${size * 0.1}px solid #ef4444`, // Tailwind red-500
            left: '50%',
            top: `${radius - size * 0.1}px`, // Position near the top edge
            transform: 'translateX(-50%)', // Center horizontally
            // No rotation needed here, it's fixed
          }}
        />

        {/* Center Dot */}
        <div
          className="absolute bg-gray-300 rounded-full" // Lighter center dot
          style={{
            width: `${size * 0.04}px`, // Scale size
            height: `${size * 0.04}px`, // Scale size
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Heading display */}
        <div className="absolute inset-x-0 bottom-2 flex justify-center pointer-events-none">
          {' '}
          {/* Lowered display slightly */}
          <div className="bg-black bg-opacity-60 px-2 py-0.5 rounded">
            {' '}
            {/* Adjusted padding/opacity */}
            <span
              className="font-mono text-white font-bold"
              style={{ fontSize: `${size * 0.09}px` }}
            >
              {' '}
              {/* Scaled font size */}
              {/* Display the actual heading, not the rotation */}
              {Math.round(((((heading * 180) / Math.PI) % 360) + 360) % 360)
                .toString()
                .padStart(3, '0')}
              °
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
