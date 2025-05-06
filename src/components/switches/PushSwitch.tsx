import React from 'react';

/**
 * Props for the PushSwitch component
 */
interface PushSwitchProps {
  /** Whether the switch is active/pressed */
  isActive: boolean;
  /** Function called when switch is toggled */
  onToggle: (isActive: boolean) => void;
  /** Color of the switch light when active */
  activeColor?: string;
  /** Inner content that can be text or a component */
  children?: React.ReactNode;
  /** Size of the switch in pixels */
  size?: number;
  /** Optional title/label for the switch */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * A round push switch component with a silver bezel and customizable light color
 */
export function PushSwitch(props: PushSwitchProps): React.ReactElement {
  const {
    isActive,
    onToggle,
    activeColor = '#3B82F6', // Default blue color
    size = 60,
    children,
    label,
    disabled = false,
  } = props;

  // Calculate dimensions based on size
  const radius = size / 2;
  const bezelWidth = size * 0.1;
  const ringWidth = size * 0.06;
  const ringRadius = radius - bezelWidth - ringWidth / 2;

  // Styles for different states
  const bezelColor = '#D1D5DB'; // Silver
  const inactiveRingColor = '#4B5563'; // Dark gray
  const ringColor = isActive ? activeColor : inactiveRingColor;
  const innerRadius = ringRadius - ringWidth;

  // Handle click
  const handleClick = () => {
    if (!disabled) {
      onToggle(!isActive);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onClick={handleClick}
        style={{ filter: `drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3))` }}
      >
        {/* Outer bezel (silver ring) */}
        <circle
          cx={radius}
          cy={radius}
          r={radius}
          fill={bezelColor}
          stroke="#9CA3AF"
          strokeWidth="1"
        />

        {/* Inner background */}
        <circle
          cx={radius}
          cy={radius}
          r={radius - bezelWidth}
          fill="#111827"
        />

        {/* Light ring */}
        <circle
          cx={radius}
          cy={radius}
          r={ringRadius}
          fill="none"
          stroke={ringColor}
          strokeWidth={ringWidth}
          style={{
            filter: isActive ? `drop-shadow(0 0 5px ${activeColor})` : 'none',
          }}
        />

        {/* Center for content */}
        <foreignObject
          x={radius - innerRadius}
          y={radius - innerRadius}
          width={innerRadius * 2}
          height={innerRadius * 2}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? activeColor : '#9CA3AF',
              fontSize: `${size * 0.25}px`,
              userSelect: 'none',
            }}
          >
            {children}
          </div>
        </foreignObject>
      </svg>

      {label && (
        <div
          style={{
            marginTop: '4px',
            fontSize: `${size * 0.18}px`,
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
