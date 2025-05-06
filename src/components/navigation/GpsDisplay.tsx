import React, { useEffect, useState } from 'react';

// Helper to format lat/lon in degrees, minutes, decimal minutes
function formatLatLon(value: number, isLat: boolean): string {
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = (abs - deg) * 60;
  const dir = isLat ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  return `${deg}° ${min.toFixed(4)}' ${dir}`;
}

// Mock generator for GPS data
function useMockGpsData() {
  const [data, setData] = useState({
    latitude: 60.1708 + Math.random() * 0.01,
    longitude: 24.9375 + Math.random() * 0.01,
    utc: new Date(),
    sog: 14.2, // knots
    cog: 87.5, // degrees
    fix: true,
    satellites: 9,
    signal: 4, // 0-5 bars
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        // Simulate small changes
        const lat = prev.latitude + (Math.random() - 0.5) * 0.0001;
        const lon = prev.longitude + (Math.random() - 0.5) * 0.0001;
        const sog = 14.0 + Math.random() * 0.5;
        const cog = (prev.cog + (Math.random() - 0.5) * 0.5) % 360;
        const fix = Math.random() > 0.02; // 98% chance of fix
        const satellites = fix ? 7 + Math.floor(Math.random() * 6) : 0;
        const signal = fix ? 3 + Math.floor(Math.random() * 3) : 0;
        return {
          latitude: lat,
          longitude: lon,
          utc: new Date(),
          sog,
          cog,
          fix,
          satellites,
          signal,
        };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return data;
}

export const GpsDisplay: React.FC = () => {
  const data = useMockGpsData();

  return (
    <div
      style={{
        background: '#181c20',
        color: '#e0f2f1',
        fontFamily: 'monospace',
        borderRadius: 12,
        boxShadow: '0 2px 12px #0008',
        padding: 24,
        width: 380,
        maxWidth: '100%',
        border: '2px solid #2d3748',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 2,
          marginBottom: 8,
        }}
      >
        GPS/GNSS POSITION
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 18,
        }}
      >
        <span>LAT:</span>
        <span>{formatLatLon(data.latitude, true)}</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 18,
        }}
      >
        <span>LON:</span>
        <span>{formatLatLon(data.longitude, false)}</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 16,
        }}
      >
        <span>UTC:</span>
        <span>{data.utc.toISOString().slice(11, 19)}</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 16,
        }}
      >
        <span>SOG:</span>
        <span>{data.sog.toFixed(2)} kn</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 16,
        }}
      >
        <span>COG:</span>
        <span>{data.cog.toFixed(1)}°</span>
      </div>
      <div
        style={{
          marginTop: 10,
          padding: 10,
          background: '#23272e',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 15,
          }}
        >
          <span>Status:</span>
          <span
            style={{ color: data.fix ? '#34d399' : '#f87171', fontWeight: 600 }}
          >
            {data.fix ? '3D FIX' : 'NO FIX'}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 15,
          }}
        >
          <span>Satellites:</span>
          <span>{data.satellites}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 15 }}>
          <span style={{ marginRight: 8 }}>Signal:</span>
          <span style={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 16,
                  marginRight: 1,
                  background: i <= data.signal ? '#34d399' : '#374151',
                  borderRadius: 2,
                  opacity: i <= data.signal ? 1 : 0.4,
                }}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
};
