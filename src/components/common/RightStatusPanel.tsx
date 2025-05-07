import React from 'react';

/**
 * RightStatusPanel provides a consistent side panel for navigation data, alarms, and system status.
 * Data is passed as props for flexibility.
 */
export interface RightStatusPanelProps {
  navData: Array<{ label: string; value: string; color?: string }>;
  alarms?: string[];
  status?: string;
  children?: React.ReactNode;
}

export const RightStatusPanel: React.FC<RightStatusPanelProps> = ({
  navData,
  alarms = [],
  status,
  children,
}) => (
  <div
    style={{
      width: 200,
      background: '#23272e',
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
      padding: '18px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      minHeight: 532,
      boxShadow: '-2px 0 8px #0004',
    }}
  >
    <div
      style={{
        fontWeight: 700,
        fontSize: 16,
        color: '#60a5fa',
        marginBottom: 8,
      }}
    >
      NAV DATA
    </div>
    {navData.map((item, i) => (
      <div
        key={i}
        style={{
          fontSize: 15,
          marginBottom: 6,
          color: item.color || '#e0f2f1',
        }}
      >
        {item.label}: {item.value}
      </div>
    ))}
    {status && <div style={{ fontSize: 15, marginBottom: 6 }}>{status}</div>}
    {alarms.length > 0 ? (
      <div style={{ fontSize: 15, marginBottom: 6, color: '#f87171' }}>
        Alarms: {alarms.join(', ')}
      </div>
    ) : (
      <div style={{ fontSize: 15, marginBottom: 6, color: '#fbbf24' }}>
        No Alarms
      </div>
    )}
    {children}
  </div>
);
