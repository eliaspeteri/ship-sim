'use client';

import React from 'react';

export default function CameraHeadingIndicator({
  enabled = true,
  headingDeg = 0,
  hudOffset = 0,
}: {
  enabled?: boolean;
  headingDeg?: number;
  hudOffset?: number;
}) {
  if (!enabled) return null;

  const bottomValue =
    hudOffset > 0
      ? `calc(${hudOffset}px + 16px + env(safe-area-inset-bottom))`
      : '18px';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: bottomValue,
        right: 18,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        pointerEvents: 'none',
        color: '#f2f6fb',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: 11,
        letterSpacing: '0.08em',
        zIndex: 45,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '999px',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          background: 'rgba(5, 12, 18, 0.7)',
          boxShadow: '0 8px 18px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 6,
            fontWeight: 600,
            color: '#f8e05d',
          }}
        >
          N
        </div>
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '14px solid #f8e05d',
            transform: `rotate(${headingDeg}deg)`,
            transformOrigin: '50% 70%',
          }}
        />
      </div>
      <div style={{ fontWeight: 600 }}>{Math.round(headingDeg)}°</div>
    </div>
  );
}
