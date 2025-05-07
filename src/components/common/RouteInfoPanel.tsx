import React from 'react';

/**
 * RouteInfoPanel displays compact route and waypoint information for ECDIS and navigation panels.
 * All values are passed as props for flexibility and testability.
 */
export interface RouteInfoPanelProps {
  routeInfo: Array<{ label: string; value: string }>;
}

export const RouteInfoPanel: React.FC<RouteInfoPanelProps> = ({
  routeInfo,
}) => (
  <div
    style={{ marginTop: 12, borderTop: '1px solid #374151', paddingTop: 10 }}
  >
    <div
      style={{
        fontWeight: 700,
        fontSize: 14,
        color: '#60a5fa',
        marginBottom: 4,
      }}
    >
      ROUTE INFO
    </div>
    <div
      style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      {routeInfo.map(item => (
        <div
          key={item.label}
          style={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <span style={{ color: '#a0aec0', minWidth: 80 }}>{item.label}</span>
          <span style={{ color: '#e0f2f1', fontWeight: 500 }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  </div>
);
