import React, { useEffect, useState } from 'react';

// Alarm indicator component
export const AlarmIndicator: React.FC<{
  active: boolean;
  label: string;
  severity?: 'warning' | 'critical';
}> = ({ active, label, severity = 'warning' }) => {
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(
      () => {
        setFlash(prev => !prev);
      },
      severity === 'critical' ? 500 : 1000,
    );

    return () => clearInterval(interval);
  }, [active, severity]);

  const bgColor = severity === 'critical' ? 'bg-red-600' : 'bg-yellow-600';

  return (
    <div
      className={`px-3 py-1 rounded ${active ? `${flash ? bgColor : 'bg-gray-800'} transition-colors duration-200` : 'bg-gray-800'} border border-gray-700`}
    >
      <span className="text-white text-sm">{label}</span>
    </div>
  );
};
