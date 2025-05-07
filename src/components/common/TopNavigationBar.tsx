import React from 'react';

/**
 * TopNavigationBar provides a consistent navigation bar for bridge system views.
 * Tabs and branding are passed as props for flexibility.
 */
export interface TopNavigationBarProps {
  tabs: string[];
  activeTab: string;
  onTabSelect?: (tab: string) => void;
  brand?: string;
}

export const TopNavigationBar: React.FC<TopNavigationBarProps> = ({
  tabs,
  activeTab,
  onTabSelect,
  brand = 'BRIDGE',
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      background: '#23272e',
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      height: 44,
      padding: '0 24px',
      borderBottom: '1px solid #2d3748',
    }}
  >
    <span
      style={{
        fontWeight: 700,
        fontSize: 20,
        letterSpacing: 2,
        color: '#60a5fa',
        marginRight: 32,
      }}
    >
      {brand}
    </span>
    {tabs.map(tab => (
      <span
        key={tab}
        style={{
          marginRight: 28,
          fontSize: 16,
          fontWeight: 600,
          color: tab === activeTab ? '#fbbf24' : '#e0f2f1',
          cursor: 'pointer',
          borderBottom: tab === activeTab ? '3px solid #fbbf24' : 'none',
          paddingBottom: 4,
        }}
        onClick={() => onTabSelect && onTabSelect(tab)}
      >
        {tab}
      </span>
    ))}
  </div>
);
