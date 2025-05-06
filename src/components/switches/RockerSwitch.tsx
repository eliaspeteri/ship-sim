import React from 'react';

/**
 * Props for the RockerSwitch component
 */
interface RockerSwitchProps {
  /** Whether the switch is active */
  isActive: boolean;
  /** Function called when switch is toggled */
  onToggle: (isActive: boolean) => void;
  /** Color of the switch when active */
  activeColor?: string;
  /** Width of the switch */
  width?: number;
  /** Height of the switch */
  height?: number;
  /** Whether to use a bar indicator instead of round */
  useBarIndicator?: boolean;
  /** Inner content that can be text or a component */
  children?: React.ReactNode;
  /** Optional title/label for the switch */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * A rocker switch component with customizable appearance and indicator style
 */
export function RockerSwitch(props: RockerSwitchProps): React.ReactElement {
  const {
    isActive,
    onToggle,
    activeColor = '#3B82F6', // Default blue color
    width = 60,
    height = 30,
    useBarIndicator = false,
    children,
    label,
    disabled = false,
  } = props;

  // Calculate dimensions
  const borderRadius = height * 0.15;
  const indicatorSize = height * 0.35;
  const indicatorY = height * 0.3;

  // Define colors
  const baseColor = '#111827'; // Dark background
  const borderColor = '#4B5563'; // Border color

  // Handle click
  const handleClick = () => {
    if (!disabled) {
      onToggle(!isActive);
    }
  };

  // Render the indicator based on type (bar or round)
  const renderIndicator = () => {
    if (useBarIndicator) {
      // Bar indicator
      return (
        <rect
          x={width * 0.1}
          y={height * 0.7}
          width={width * 0.8}
          height={height * 0.15}
          rx={height * 0.05}
          fill={isActive ? activeColor : '#4B5563'}
          style={{
            filter: isActive ? `drop-shadow(0 0 3px ${activeColor})` : 'none',
          }}
        />
      );
    } else {
      // Round indicator
      return (
        <circle
          cx={width / 2}
          cy={indicatorY}
          r={indicatorSize}
          fill={isActive ? activeColor : '#4B5563'}
          style={{
            filter: isActive ? `drop-shadow(0 0 4px ${activeColor})` : 'none',
          }}
        />
      );
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onClick={handleClick}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
        }}
      >
        {/* Background */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx={borderRadius}
          fill={baseColor}
          stroke={borderColor}
          strokeWidth="1"
        />

        {/* Indicator (light) */}
        {renderIndicator()}

        {/* Content area */}
        <foreignObject
          x={width * 0.1}
          y={height * 0.4}
          width={width * 0.8}
          height={height * 0.5}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? activeColor : '#9CA3AF',
              fontSize: `${height * 0.3}px`,
              userSelect: 'none',
              textAlign: 'center',
            }}
          >
            {children}
          </div>
        </foreignObject>

        {/* 3D effect - top highlight */}
        <rect
          x="1"
          y="1"
          width={width - 2}
          height={height * 0.1}
          rx={borderRadius / 2}
          fill="rgba(255, 255, 255, 0.1)"
        />
      </svg>

      {label && (
        <div
          style={{
            marginTop: '4px',
            fontSize: `${height * 0.4}px`,
            color: '#E5E7EB',
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
