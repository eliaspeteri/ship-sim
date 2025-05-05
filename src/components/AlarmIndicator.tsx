import React, { useEffect, useState } from 'react';

// Alarm indicator component
export const AlarmIndicator: React.FC<{
  active: boolean;
  label: string;
  severity?: 'warning' | 'critical';
  size?: number; // Add size prop
}> = ({ active, label, severity = 'warning', size = 20 }) => {
  // Default size
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    if (!active) {
      setFlash(true); // Reset flash state when inactive
      return;
    }

    const interval = setInterval(
      () => {
        setFlash(prev => !prev);
      },
      severity === 'critical' ? 300 : 600, // Faster flashing for critical
    );

    return () => clearInterval(interval);
  }, [active, severity]);

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`rounded-full border-2 border-gray-700 transition-colors duration-150`}
        style={{
          width: size,
          height: size,
          backgroundColor: active
            ? flash
              ? severity === 'critical'
                ? '#FF0000'
                : '#FFA500'
              : '#374151'
            : '#4B5563', // Use hex for direct style
          boxShadow:
            active && flash
              ? `0 0 ${size / 2}px ${severity === 'critical' ? '#FF0000' : '#FFA500'}`
              : 'none', // Add glow effect
        }}
      />
      <span className="text-white text-sm">{label}</span>
    </div>
  );
};
