import React from 'react';

/**
 * Props for the ToggleSwitch component
 */
interface ToggleSwitchProps {
  /** Whether the switch is toggled on */
  isOn: boolean;
  /** Function called when switch is toggled */
  onToggle: (isOn: boolean) => void;
  /** Color of the switch base */
  baseColor?: string;
  /** Color of the lever handle */
  leverColor?: string;
  /** Width of the switch */
  width?: number;
  /** Height of the switch */
  height?: number;
  /** Optional title/label for the switch */
  label?: string;
  /** Position of the label relative to switch */
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** Disabled state */
  disabled?: boolean;
}

/**
 * A classic style toggle switch with a pivoting cylinder
 */
export function ToggleSwitch(props: ToggleSwitchProps): React.ReactElement {
  const {
    isOn,
    onToggle,
    baseColor = '#374151', // Dark gray
    leverColor = '#D1D5DB', // Silver
    width = 60,
    height = 30,
    label,
    labelPosition = 'bottom',
    disabled = false,
  } = props;

  // Calculate base dimensions
  const baseWidth = width;
  const baseHeight = height * 0.4;
  const baseY = height - baseHeight;
  const baseRadius = baseHeight / 2;

  // Calculate lever dimensions
  const leverWidth = width * 0.25;
  const leverHeight = height * 0.85;
  const pivotY = height - baseHeight / 2;
  const leverX = width * 0.15;

  // Calculate rotation angle based on state
  const offAngle = -30;
  const onAngle = 30;
  const rotation = isOn ? onAngle : offAngle;

  // Define colors
  const baseBorderColor = '#6B7280'; // Medium gray
  const leverBorderColor = '#9CA3AF'; // Light gray

  // Handle click
  const handleClick = () => {
    if (!disabled) {
      onToggle(!isOn);
    }
  };

  const renderSwitch = () => (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onClick={handleClick}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
      }}
    >
      {/* Base track */}
      <rect
        x="0"
        y={baseY}
        width={baseWidth}
        height={baseHeight}
        rx={baseRadius}
        fill={baseColor}
        stroke={baseBorderColor}
        strokeWidth="1"
      />

      {/* Base highlights */}
      <rect
        x="2"
        y={baseY + 1}
        width={baseWidth - 4}
        height={baseHeight * 0.3}
        rx={baseRadius / 2}
        fill="rgba(255, 255, 255, 0.1)"
      />

      {/* Toggle lever */}
      <g transform={`rotate(${rotation}, ${leverX}, ${pivotY})`}>
        {/* Lever base (cylinder) */}
        <rect
          x={leverX - leverWidth / 2}
          y={pivotY - leverHeight}
          width={leverWidth}
          height={leverHeight}
          rx={leverWidth / 2}
          fill={leverColor}
          stroke={leverBorderColor}
          strokeWidth="1"
        />

        {/* Lever grip lines */}
        <line
          x1={leverX - leverWidth * 0.3}
          y1={pivotY - leverHeight * 0.2}
          x2={leverX + leverWidth * 0.3}
          y2={pivotY - leverHeight * 0.2}
          stroke={leverBorderColor}
          strokeWidth="1"
        />
        <line
          x1={leverX - leverWidth * 0.3}
          y1={pivotY - leverHeight * 0.4}
          x2={leverX + leverWidth * 0.3}
          y2={pivotY - leverHeight * 0.4}
          stroke={leverBorderColor}
          strokeWidth="1"
        />
        <line
          x1={leverX - leverWidth * 0.3}
          y1={pivotY - leverHeight * 0.6}
          x2={leverX + leverWidth * 0.3}
          y2={pivotY - leverHeight * 0.6}
          stroke={leverBorderColor}
          strokeWidth="1"
        />

        {/* Lever highlight */}
        <rect
          x={leverX - leverWidth * 0.35}
          y={pivotY - leverHeight}
          width={leverWidth * 0.2}
          height={leverHeight * 0.98}
          rx={leverWidth / 4}
          fill="rgba(255, 255, 255, 0.3)"
        />
      </g>

      {/* State indicators */}
      <circle
        cx={width * 0.8}
        cy={height - baseHeight / 2}
        r={baseHeight * 0.3}
        fill={isOn ? '#10B981' : '#6B7280'}
        style={{
          filter: isOn ? 'drop-shadow(0 0 3px #10B981)' : 'none',
        }}
      />
      <circle
        cx={width * 0.2}
        cy={height - baseHeight / 2}
        r={baseHeight * 0.3}
        fill={!isOn ? '#EF4444' : '#6B7280'}
        style={{
          filter: !isOn ? 'drop-shadow(0 0 3px #EF4444)' : 'none',
        }}
      />
    </svg>
  );

  // Calculate container styles based on label position
  const containerStyles = {
    display: 'flex',
    alignItems: 'center',
    opacity: disabled ? 0.6 : 1,
    flexDirection:
      labelPosition === 'top' || labelPosition === 'bottom'
        ? ('column' as const)
        : ('row' as const),
  };

  // Calculate label styles based on position
  const getLabelStyles = () => {
    const baseStyles = {
      fontSize: `${height * 0.35}px`,
      color: '#E5E7EB',
      userSelect: 'none' as const,
    };

    switch (labelPosition) {
      case 'top':
        return { ...baseStyles, marginBottom: '4px' };
      case 'right':
        return { ...baseStyles, marginLeft: '8px' };
      case 'left':
        return { ...baseStyles, marginRight: '8px', order: -1 };
      case 'bottom':
      default:
        return { ...baseStyles, marginTop: '4px' };
    }
  };

  return (
    <div style={containerStyles}>
      {label && <div style={getLabelStyles()}>{label}</div>}
      {renderSwitch()}
    </div>
  );
}
