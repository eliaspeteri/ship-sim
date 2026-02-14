import React, { useRef } from 'react';
import { useLeverDrag } from '../../hooks/useLeverDrag';

/**
 * Props for the RotaryDial component
 */
interface RotaryDialProps {
  /** Current value of the dial (between min and max) */
  value: number;
  /** Function called when the dial value changes */
  onChange: (value: number) => void;
  /** Minimum value of the dial */
  min: number;
  /** Maximum value of the dial */
  max: number;
  /** Size of the dial in pixels */
  size?: number;
  /** Color of the dial when active/focused */
  activeColor?: string;
  /** Base color of the dial */
  baseColor?: string;
  /** Knob color */
  knobColor?: string;
  /** Label for the dial */
  label?: string;
  /** Unit to display with the value */
  unit?: string;
  /** Number of tick marks to display */
  numTicks?: number;
  /** Whether to show the value */
  showValue?: boolean;
  /** Number of decimal places to show in the value */
  precision?: number;
  /** Minimum rotation angle in degrees */
  minAngle?: number;
  /** Maximum rotation angle in degrees */
  maxAngle?: number;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Sensitivity for drag interaction */
  dragSensitivity?: number;
}

/**
 * RotaryDial component for precise control adjustments
 */
export function RotaryDial(props: RotaryDialProps): React.ReactElement {
  const {
    value,
    onChange,
    min,
    max,
    size = 120,
    activeColor = '#3B82F6', // Default blue color
    baseColor = '#374151', // Default dark gray
    knobColor = '#D1D5DB', // Default light gray/silver
    label,
    unit = '',
    numTicks = 11,
    showValue = true,
    precision = 0,
    minAngle = -150,
    maxAngle = 150,
    disabled = false,
    dragSensitivity = 200,
  } = props;

  const dialRef = useRef<SVGSVGElement>(null);

  // Use the lever drag hook for horizontal dragging
  const {
    value: hookValue,
    isDragging,
    handleMouseDown,
    handleDoubleClick,
  } = useLeverDrag({
    initialValue: value,
    min,
    max,
    onChange,
    dragAxis: 'horizontal',
    dragSensitivity,
    resetOnDoubleClick: true,
  });

  // Calculate the rotation angle based on the current value
  const valueToAngle = (val: number): number => {
    const valueRange = max - min;
    const angleRange = maxAngle - minAngle;
    return minAngle + (angleRange * (val - min)) / valueRange;
  };

  const currentAngle = valueToAngle(hookValue);

  // Calculate center coordinates
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.45; // Dial radius
  const knobRadius = size * 0.35; // Inner knob radius
  const tickLength = size * 0.08; // Length of tick marks
  const pointerLength = knobRadius * 0.8; // Length of the pointer

  // Generate tick marks
  const ticks = [];
  if (numTicks > 0) {
    const angleStep = (maxAngle - minAngle) / (numTicks - 1);
    for (let i = 0; i < numTicks; i++) {
      const tickAngle = minAngle + i * angleStep;
      const radians = (tickAngle * Math.PI) / 180;

      const isMajor =
        i === 0 || i === numTicks - 1 || i === Math.floor(numTicks / 2);
      const tickWidth = isMajor ? 2 : 1;
      const actualTickLength = isMajor ? tickLength * 1.2 : tickLength;

      const innerX = centerX + (radius - actualTickLength) * Math.cos(radians);
      const innerY = centerY + (radius - actualTickLength) * Math.sin(radians);
      const outerX = centerX + radius * Math.cos(radians);
      const outerY = centerY + radius * Math.sin(radians);

      ticks.push(
        <line
          key={`tick-${i}`}
          x1={innerX}
          y1={innerY}
          x2={outerX}
          y2={outerY}
          strokeWidth={tickWidth}
          stroke={isMajor ? '#9CA3AF' : '#6B7280'}
        />,
      );

      // Add label for major ticks
      if (isMajor) {
        const labelRadius = radius + 10;
        const labelX = centerX + labelRadius * Math.cos(radians);
        const labelY = centerY + labelRadius * Math.sin(radians);

        const labelValue =
          i === 0 ? min : i === numTicks - 1 ? max : min + (max - min) / 2;

        ticks.push(
          <text
            key={`label-${i}`}
            x={labelX}
            y={labelY}
            fontSize={size * 0.09}
            fill="#9CA3AF"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {labelValue.toFixed(precision)}
          </text>,
        );
      }
    }
  }

  // Calculate the position of the indicator mark
  const radians = (currentAngle * Math.PI) / 180;
  const indicatorX = centerX + pointerLength * Math.cos(radians);
  const indicatorY = centerY + pointerLength * Math.sin(radians);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <svg
        ref={dialRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onMouseDown={disabled ? undefined : handleMouseDown}
        onDoubleClick={disabled ? undefined : handleDoubleClick}
        style={{
          cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
          touchAction: 'none', // Prevent scrolling when touching the dial
          filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.3))',
        }}
      >
        {/* Outer rim */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill={baseColor}
          stroke="#6B7280"
          strokeWidth="1"
        />

        {/* Tick marks */}
        <g>{ticks}</g>

        {/* Inner knob */}
        <circle
          cx={centerX}
          cy={centerY}
          r={knobRadius}
          fill={knobColor}
          stroke="#9CA3AF"
          strokeWidth="1"
        />

        {/* Knob highlights */}
        <circle
          cx={centerX - knobRadius * 0.2}
          cy={centerY - knobRadius * 0.2}
          r={knobRadius * 0.5}
          fill="rgba(255, 255, 255, 0.15)"
        />

        {/* Indicator line */}
        <line
          x1={centerX}
          y1={centerY}
          x2={indicatorX}
          y2={indicatorY}
          stroke={activeColor}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Central dot */}
        <circle cx={centerX} cy={centerY} r={size * 0.03} fill={activeColor} />
      </svg>

      {/* Label and value display */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '4px',
        }}
      >
        {label && (
          <span
            style={{
              fontSize: `${size * 0.14}px`,
              color: '#E5E7EB',
              fontWeight: 500,
              marginBottom: '2px',
            }}
          >
            {label}
          </span>
        )}

        {showValue && (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '2px',
            }}
          >
            <span
              style={{
                fontSize: `${size * 0.16}px`,
                color: isDragging ? activeColor : '#E5E7EB',
                fontWeight: 400,
              }}
            >
              {hookValue.toFixed(precision)}
            </span>
            {unit && (
              <span
                style={{
                  fontSize: `${size * 0.12}px`,
                  color: '#9CA3AF',
                }}
              >
                {unit}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
