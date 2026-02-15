import React, { useCallback, useMemo } from 'react';
import { useLeverDrag } from '../../hooks/useLeverDrag';

/**
 * Interface representing a position in the changeover switch
 */
interface SwitchPosition {
  /** Value associated with this switch position */
  value: string | number;
  /** Label to display for this position */
  label?: string;
  /** Whether this position is disabled */
  disabled?: boolean;
}

/**
 * Props for the ChangeoverSwitch component
 */
interface ChangeoverSwitchProps {
  /** The current position value of the switch */
  position: string | number;
  /** Function called when the switch position changes */
  onPositionChange: (position: string | number) => void;
  /** Array of positions for the switch (2 or more) */
  positions: SwitchPosition[];
  /** Size of the switch in pixels */
  size?: number;
  /** Switch base color */
  baseColor?: string;
  /** Switch handle color */
  handleColor?: string;
  /** Switch label text color */
  textColor?: string;
  /** Main title/label for the switch */
  label?: string;
  /** Position of the main label */
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** Whether the entire switch is disabled */
  disabled?: boolean;
  /** Sensitivity for drag operations */
  dragSensitivity?: number;
}

const FALLBACK_POSITIONS: SwitchPosition[] = [
  { value: '__fallback_0' },
  { value: '__fallback_1' },
];

/**
 * A changeover switch component that supports 2-way, 3-way or multi-position configurations
 * Visual style resembles a rotary selector switch commonly found in industrial and marine equipment
 * The knob can be rotated by dragging, and it will snap to the closest position
 */
export function ChangeoverSwitch(
  props: ChangeoverSwitchProps,
): React.ReactElement | null {
  const {
    position,
    onPositionChange,
    positions,
    size = 100,
    baseColor = '#1F2937',
    handleColor = '#D1D5DB',
    textColor = '#E5E7EB',
    label,
    labelPosition = 'bottom',
    disabled = false,
    dragSensitivity = 200,
  } = props;

  const hasValidPositions = positions.length >= 2;
  if (!hasValidPositions) {
    console.warn(
      'ChangeoverSwitch requires at least two positions; received',
      positions.length,
    );
  }
  const effectivePositions = useMemo(
    () => (hasValidPositions ? positions : FALLBACK_POSITIONS),
    [hasValidPositions, positions],
  );

  // Calculate dimensions
  const radius = size / 2;
  const handleSize = size * 0.4;
  const indicatorSize = size * 0.08;
  const switchBaseSize = size * 0.9;
  const positionRadius = (switchBaseSize / 2) * 0.7;

  // Map position values to numeric indices for drag calculations
  const positionIndex = Math.max(
    0,
    effectivePositions.findIndex(p => p.value === position),
  );
  const positionCount = effectivePositions.length;

  const indexToNormalized = (index: number): number => {
    return positionCount <= 1 ? 0 : index / (positionCount - 1);
  };

  // --- Drag state for smooth handle rotation and snapping ---
  // Track the last snapped index to avoid repeated onPositionChange calls
  const lastSnappedIndexRef = React.useRef(positionIndex);

  // Use lever drag to handle rotation via dragging
  const {
    value: normalizedValue,
    isDragging,
    handleMouseDown,
  } = useLeverDrag({
    initialValue: indexToNormalized(Math.max(0, positionIndex)),
    min: 0,
    max: 1,
    onChange: value => {
      // Snap to the next position only when passing the midpoint between positions
      const floatIndex = value * (positionCount - 1);
      const snappedIndex = Math.round(floatIndex);
      const targetPosition = effectivePositions[snappedIndex];
      if (
        snappedIndex !== lastSnappedIndexRef.current &&
        targetPosition &&
        !targetPosition.disabled
      ) {
        lastSnappedIndexRef.current = snappedIndex;
        onPositionChange(targetPosition.value);
      }
    },
    dragAxis: 'horizontal',
    dragSensitivity: dragSensitivity,
  });

  // Calculate position angle based on number of positions
  const getPositionAngle = useCallback(
    (index: number): number => {
      const positionCount = effectivePositions.length;
      // Calculate the maximum angle range we want to use (less than 360 for better UX)
      const maxAngleRange = positionCount > 2 ? 270 : 180;
      // Calculate the angle between positions
      const angleStep = maxAngleRange / (positionCount - 1);
      // Calculate the starting angle to center the positions (start from top, 0 deg)
      const startAngle = -maxAngleRange / 2;
      // Return the angle for this position
      return startAngle + index * angleStep;
    },
    [effectivePositions.length],
  );

  // Calculate position coordinates
  const getPositionCoordinates = useCallback(
    (angle: number): { x: number; y: number } => {
      // Convert angle to radians
      const radians = (angle * Math.PI) / 180;
      // Calculate coordinates on the circle
      const x = radius + positionRadius * Math.cos(radians - Math.PI / 2);
      const y = radius + positionRadius * Math.sin(radians - Math.PI / 2);
      return { x, y };
    },
    [positionRadius, radius],
  );

  // Calculate the handle rotation angle - smoothly follows drag, snaps on release
  const getCurrentAngle = (): number => {
    // Use the continuous drag value for smooth rotation
    const floatIndex = normalizedValue * (positionCount - 1);
    return getPositionAngle(floatIndex);
  };

  // Calculate label styles based on position
  const getLabelStyles = () => {
    const baseStyles = {
      fontSize: `${size * 0.18}px`,
      color: textColor,
      userSelect: 'none' as const,
    };

    switch (labelPosition) {
      case 'top':
        return { ...baseStyles, marginBottom: '8px' };
      case 'right':
        return { ...baseStyles, marginLeft: '12px' };
      case 'left':
        return { ...baseStyles, marginRight: '12px', order: -1 };
      case 'bottom':
      default:
        return { ...baseStyles, marginTop: '8px' };
    }
  };

  // Pre-compute position indicators and their coordinates
  const positionIndicators = useMemo(() => {
    return effectivePositions.map((pos, index) => {
      const angle = getPositionAngle(index);
      const { x, y } = getPositionCoordinates(angle);
      const isActive = pos.value === position;
      const posDisabled = disabled || pos.disabled;

      return (
        <g
          key={`pos-${index}`}
          onClick={() => {
            if (!posDisabled && !disabled) {
              onPositionChange(pos.value);
            }
          }}
          style={{ cursor: posDisabled ? 'not-allowed' : 'pointer' }}
        >
          {/* Position indicator */}
          <circle
            cx={x}
            cy={y}
            r={indicatorSize}
            fill={isActive ? '#10B981' : '#4B5563'} // Green when active, gray when inactive
            style={{
              filter: isActive ? 'drop-shadow(0 0 2px #10B981)' : 'none',
              opacity: posDisabled ? 0.5 : 1,
            }}
          />

          {/* Position label */}
          {pos.label && (
            <text
              x={x}
              y={y + size * 0.18}
              textAnchor="middle"
              fill={textColor}
              fontSize={size * 0.1}
              style={{
                userSelect: 'none',
                pointerEvents: 'none',
                opacity: posDisabled ? 0.5 : 1,
              }}
            >
              {pos.label}
            </text>
          )}
        </g>
      );
    });
  }, [
    position,
    effectivePositions,
    indicatorSize,
    size,
    textColor,
    disabled,
    onPositionChange,
    getPositionAngle,
    getPositionCoordinates,
  ]);

  // Render the switch
  const renderSwitch = () => {
    if (!hasValidPositions) return null;
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
        }}
      >
        {/* Base circle */}
        <circle
          cx={radius}
          cy={radius}
          r={switchBaseSize / 2}
          fill={baseColor}
          stroke="#6B7280"
          strokeWidth="2"
        />

        {/* Position indicators and labels */}
        {positionIndicators}

        {/* Center handle - draggable */}
        <g
          transform={`rotate(${getCurrentAngle()}, ${radius}, ${radius})`}
          onMouseDown={!disabled ? e => handleMouseDown(e) : undefined}
          style={{
            cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
          }}
        >
          {/* Handle base */}
          <circle
            cx={radius}
            cy={radius}
            r={handleSize / 2}
            fill={handleColor}
            stroke="#9CA3AF"
            strokeWidth="1"
          />

          {/* Handle pointer arrow */}
          <path
            d={`M ${radius} ${radius - handleSize * 0.4}
                L ${radius - handleSize * 0.2} ${radius - handleSize * 0.1}
                L ${radius + handleSize * 0.2} ${radius - handleSize * 0.1}
                Z`}
            fill="#374151"
          />

          {/* Handle grip pattern */}
          <circle cx={radius} cy={radius} r={handleSize * 0.1} fill="#374151" />

          {/* Handle highlights - adds 3D effect */}
          <path
            d={`M ${radius - handleSize * 0.35} ${radius - handleSize * 0.2} 
                A ${handleSize * 0.35} ${handleSize * 0.35} 0 0 1 
                ${radius + handleSize * 0.35} ${radius - handleSize * 0.2}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1"
          />
        </g>

        {/* Optional: Base highlights for 3D effect */}
        <circle
          cx={radius}
          cy={radius}
          r={switchBaseSize / 2 - 2}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="2"
          strokeDasharray="2 4"
        />
      </svg>
    );
  };

  // Calculate container styles based on label position
  const containerStyles = {
    display: 'flex',
    alignItems: 'center',
    opacity: disabled ? 0.7 : 1,
    flexDirection:
      labelPosition === 'top' || labelPosition === 'bottom'
        ? ('column' as const)
        : ('row' as const),
  };

  if (!hasValidPositions) {
    return null;
  }

  return (
    <div style={containerStyles}>
      {label && <div style={getLabelStyles()}>{label}</div>}
      {renderSwitch()}
    </div>
  );
}
