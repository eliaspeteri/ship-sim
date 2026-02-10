import React, { useEffect, useState, useRef } from 'react';
import { useLeverDrag } from '../hooks/useLeverDrag';

/**
 * Properties for the EnhancedPump component
 */
interface EnhancedPumpProps {
  /** X position (pixels) */
  x: number;
  /** Y position (pixels) */
  y: number;
  /** Whether the pump is running */
  isRunning: boolean;
  /** Function to call when pump state changes */
  onChange: (running: boolean) => void;
  /** Pump speed as fraction of max (0-1) */
  speed?: number;
  /** Function to call when speed changes */
  onSpeedChange?: (speed: number) => void;
  /** Pump health as fraction of max (0-1) */
  health?: number;
  /** Pump flow rate as fraction of max (0-1) */
  flowRate?: number;
  /** Pressure at pump inlet (bar) */
  inletPressure?: number;
  /** Pressure at pump outlet (bar) */
  outletPressure?: number;
  /** Temperature of pump (°C) */
  temperature?: number;
  /** Label for the pump */
  label?: string;
  /** Size of the pump display (pixels) */
  size?: number;
  /** Type of pump to display */
  pumpType?: 'centrifugal' | 'gear' | 'screw';
  /** Operational mode */
  mode?: 'manual' | 'auto';
  /** Function to call when mode changes */
  onModeChange?: (mode: 'manual' | 'auto') => void;
  /** Operating hours */
  hours?: number;
}

/**
 * An enhanced pump component that provides detailed visualization
 * and control of a marine pump system
 */
export const EnhancedPump: React.FC<EnhancedPumpProps> = ({
  x,
  y,
  isRunning,
  onChange,
  speed = 1.0,
  onSpeedChange,
  health = 1.0,
  flowRate = 0.8,
  inletPressure = 1.0,
  outletPressure = 4.5,
  temperature = 45,
  label,
  size = 180,
  pumpType = 'centrifugal',
  mode = 'manual',
  onModeChange,
  hours = 1250,
}) => {
  // Animation states
  const [rotation, setRotation] = useState(0);
  const [sparkle, setSparkle] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // References for animation
  const animationRef = useRef<number | null>(null);

  // Calculated differential pressure
  const pressureDifferential = outletPressure - inletPressure;

  // Calculate derived values
  const effectiveFlowRate = isRunning ? flowRate * speed : 0;
  const powerUsage = isRunning
    ? Math.round(speed * pressureDifferential * 5)
    : 0;
  const efficiency = isRunning
    ? Math.min(100, Math.round((effectiveFlowRate / (speed * 0.8)) * 100))
    : 0;

  // Determine if there are any warning conditions
  const hasCavitation = inletPressure < 0.5 && speed > 0.7 && isRunning;
  const isOverheating = temperature > 75;
  const hasHighVibration = health < 0.6 && isRunning && speed > 0.7;

  // Determine operational status
  const status = !isRunning
    ? 'stopped'
    : hasCavitation
      ? 'cavitating'
      : isOverheating
        ? 'overheating'
        : hasHighVibration
          ? 'vibrating'
          : 'normal';

  // Use drag hook for speed control
  const {
    value: speedValue,
    isDragging,
    handleMouseDown,
  } = useLeverDrag({
    initialValue: speed,
    min: 0,
    max: 1,
    onChange: onSpeedChange || (() => {}),
    dragAxis: 'vertical',
    dragSensitivity: 200,
  });

  // Animation loop for running
  useEffect(() => {
    if (!isRunning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const rotationSpeed = 2 + speed * 5;

    const animate = () => {
      setRotation(prev => (prev + rotationSpeed) % 360);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isRunning, speed]);

  // Sparkle animation when there's a problem
  useEffect(() => {
    if (status === 'normal' || !isRunning) {
      return;
    }

    const interval = setInterval(() => {
      setSparkle(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [status, isRunning]);

  // Calculate dimensions
  const pumpRadius = size * 0.2;
  const impellerRadius = pumpRadius * 0.7;
  const pipeWidth = size * 0.1;
  const detailsWidth = size * 1.2;
  const detailsHeight = size * 0.6;

  const getStatusColor = () => {
    switch (status) {
      case 'cavitating':
        return '#e53e3e'; // Red
      case 'overheating':
        return '#dd6b20'; // Orange
      case 'vibrating':
        return '#d69e2e'; // Yellow
      case 'normal':
        return '#38a169'; // Green
      default:
        return '#718096'; // Gray
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'cavitating':
        return 'CAVITATION';
      case 'overheating':
        return 'OVERHEAT';
      case 'vibrating':
        return 'VIBRATION';
      case 'normal':
        return 'NORMAL';
      default:
        return 'STOPPED';
    }
  };

  // Render the appropriate pump body based on type
  const renderPumpBody = () => {
    switch (pumpType) {
      case 'gear':
        return (
          <g>
            <rect
              x={-pumpRadius * 0.9}
              y={-pumpRadius * 0.9}
              width={pumpRadius * 1.8}
              height={pumpRadius * 1.8}
              rx={5}
              fill="#4A5568"
              stroke="#2D3748"
              strokeWidth={2}
            />

            {/* Gear wheels */}
            <circle
              cx={-pumpRadius * 0.4}
              cy={0}
              r={impellerRadius * 0.8}
              fill="#A0AEC0"
              stroke="#718096"
              strokeWidth={1}
              style={{
                transform: isRunning ? `rotate(${-rotation}deg)` : '',
                transformOrigin: `${-pumpRadius * 0.4}px 0px`,
              }}
            />
            <circle
              cx={pumpRadius * 0.4}
              cy={0}
              r={impellerRadius * 0.8}
              fill="#A0AEC0"
              stroke="#718096"
              strokeWidth={1}
              style={{
                transform: isRunning ? `rotate(${rotation}deg)` : '',
                transformOrigin: `${pumpRadius * 0.4}px 0px`,
              }}
            />

            {/* Gear teeth */}
            {Array.from({ length: 8 }).map((_, i) => (
              <g key={`gear-teeth-${i}`}>
                <rect
                  x={-pumpRadius * 0.4 - 3}
                  y={0}
                  width={6}
                  height={impellerRadius * 0.8}
                  fill="#718096"
                  transform={`rotate(${i * 45}, ${-pumpRadius * 0.4}, 0)`}
                  style={{
                    transform: isRunning
                      ? `rotate(${-rotation + i * 45}deg)`
                      : `rotate(${i * 45}deg)`,
                    transformOrigin: `${-pumpRadius * 0.4}px 0px`,
                  }}
                />
                <rect
                  x={pumpRadius * 0.4 - 3}
                  y={0}
                  width={6}
                  height={impellerRadius * 0.8}
                  fill="#718096"
                  transform={`rotate(${i * 45}, ${pumpRadius * 0.4}, 0)`}
                  style={{
                    transform: isRunning
                      ? `rotate(${rotation + i * 45}deg)`
                      : `rotate(${i * 45}deg)`,
                    transformOrigin: `${pumpRadius * 0.4}px 0px`,
                  }}
                />
              </g>
            ))}
          </g>
        );

      case 'screw':
        return (
          <g>
            <rect
              x={-pumpRadius}
              y={-pumpRadius * 0.6}
              width={pumpRadius * 2}
              height={pumpRadius * 1.2}
              rx={4}
              fill="#4A5568"
              stroke="#2D3748"
              strokeWidth={2}
            />

            {/* Screw impeller */}
            <rect
              x={-pumpRadius * 0.8}
              y={-impellerRadius * 0.4}
              width={pumpRadius * 1.6}
              height={impellerRadius * 0.8}
              fill="#A0AEC0"
              stroke="#718096"
              strokeWidth={1}
            />

            {/* Screw threads */}
            {Array.from({ length: 6 }).map((_, i) => (
              <path
                key={`screw-${i}`}
                d={`M ${-pumpRadius * 0.8 + (i * (pumpRadius * 1.6)) / 5} ${-impellerRadius * 0.4} 
                   A ${impellerRadius * 0.4} ${impellerRadius * 0.4} 0 1 ${i % 2 === 0 ? 1 : 0} 
                   ${-pumpRadius * 0.8 + (i * (pumpRadius * 1.6)) / 5} ${impellerRadius * 0.4}`}
                stroke="#718096"
                strokeWidth={2}
                fill="none"
                style={{
                  transform: isRunning
                    ? `translateX(${Math.sin(rotation / 10 + i) * 3}px)`
                    : '',
                }}
              />
            ))}
          </g>
        );

      case 'centrifugal':
      default:
        return (
          <g>
            {/* Pump casing */}
            <circle
              cx={0}
              cy={0}
              r={pumpRadius}
              fill="#4A5568"
              stroke="#2D3748"
              strokeWidth={2}
            />

            {/* Impeller */}
            <circle
              cx={0}
              cy={0}
              r={impellerRadius}
              fill="#A0AEC0"
              stroke="#718096"
              strokeWidth={1}
              style={{
                transform: `rotate(${rotation}deg)`,
              }}
            />

            {/* Impeller vanes */}
            {Array.from({ length: 6 }).map((_, i) => (
              <path
                key={`vane-${i}`}
                d={`M 0 0 L ${impellerRadius * Math.cos((i * Math.PI) / 3)} ${impellerRadius * Math.sin((i * Math.PI) / 3)}`}
                stroke="#718096"
                strokeWidth={2}
                style={{
                  transform: `rotate(${rotation}deg)`,
                }}
              />
            ))}

            {/* Central hub */}
            <circle
              cx={0}
              cy={0}
              r={impellerRadius * 0.3}
              fill="#718096"
              stroke="#4A5568"
              strokeWidth={1}
              style={{
                transform: `rotate(${rotation}deg)`,
              }}
            />
          </g>
        );
    }
  };

  // Render inlet and outlet pipes
  const renderPipes = () => {
    return (
      <g>
        {/* Inlet pipe */}
        <rect
          x={-size * 0.45}
          y={-pipeWidth / 2}
          width={size * 0.25}
          height={pipeWidth}
          fill="#2D3748"
          stroke="#1A202C"
        />

        {/* Outlet pipe */}
        <rect
          x={pumpRadius - pipeWidth / 2}
          y={-size * 0.25}
          width={pipeWidth}
          height={size * 0.25}
          fill="#2D3748"
          stroke="#1A202C"
        />

        {/* Flow visualization in pipes */}
        {isRunning && (
          <>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <defs>
                <linearGradient
                  id="inletGradient"
                  gradientUnits="userSpaceOnUse"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="rgba(49, 130, 206, 0)" />
                  <stop offset="50%" stopColor="rgba(49, 130, 206, 0.8)" />
                  <stop offset="100%" stopColor="rgba(49, 130, 206, 0)" />
                  <animate
                    attributeName="x1"
                    from="0%"
                    to="200%"
                    dur={`${1.5 / (speed || 0.1)}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="x2"
                    from="100%"
                    to="300%"
                    dur={`${1.5 / (speed || 0.1)}s`}
                    repeatCount="indefinite"
                  />
                </linearGradient>

                <linearGradient
                  id="outletGradient"
                  gradientUnits="userSpaceOnUse"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="rgba(49, 130, 206, 0)" />
                  <stop offset="50%" stopColor="rgba(49, 130, 206, 0.8)" />
                  <stop offset="100%" stopColor="rgba(49, 130, 206, 0)" />
                  <animate
                    attributeName="y1"
                    from="0%"
                    to="200%"
                    dur={`${1 / (speed || 0.1)}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="y2"
                    from="100%"
                    to="300%"
                    dur={`${1 / (speed || 0.1)}s`}
                    repeatCount="indefinite"
                  />
                </linearGradient>
              </defs>

              <rect
                x={size * 0.05}
                y={size * 0.5 - pipeWidth / 2}
                width={size * 0.25}
                height={pipeWidth}
                fill="url(#inletGradient)"
              />

              <rect
                x={size * 0.5 - pipeWidth / 2}
                y={size * 0.25}
                width={pipeWidth}
                height={size * 0.25}
                fill="url(#outletGradient)"
              />
            </svg>
          </>
        )}

        {/* Pressure indicators */}
        <g transform={`translate(${-size * 0.35}, ${-pipeWidth - 15})`}>
          <circle
            cx={0}
            cy={0}
            r={12}
            fill="#2D3748"
            stroke="#1A202C"
            strokeWidth={1}
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#E2E8F0"
            fontSize="10px"
            fontWeight="bold"
          >
            {inletPressure.toFixed(1)}
          </text>
          <text
            x={0}
            y={16}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#A0AEC0"
            fontSize="8px"
          >
            bar
          </text>
        </g>

        <g
          transform={`translate(${pumpRadius + pipeWidth + 15}, ${-size * 0.15})`}
        >
          <circle
            cx={0}
            cy={0}
            r={12}
            fill="#2D3748"
            stroke="#1A202C"
            strokeWidth={1}
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#E2E8F0"
            fontSize="10px"
            fontWeight="bold"
          >
            {outletPressure.toFixed(1)}
          </text>
          <text
            x={0}
            y={16}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#A0AEC0"
            fontSize="8px"
          >
            bar
          </text>
        </g>
      </g>
    );
  };

  // Render control panel
  const renderControlPanel = () => {
    return (
      <g transform={`translate(0, ${pumpRadius + 20})`}>
        <rect
          x={-size * 0.4}
          y={0}
          width={size * 0.8}
          height={size * 0.15}
          rx={4}
          fill="#1A202C"
          stroke="#2D3748"
          strokeWidth={1}
        />

        {/* Status indicator */}
        <circle
          cx={-size * 0.3}
          cy={size * 0.075}
          r={size * 0.04}
          fill={getStatusColor()}
          style={{
            filter:
              status !== 'normal' && status !== 'stopped' && sparkle
                ? 'drop-shadow(0 0 4px #FC8181)'
                : '',
          }}
        />

        {/* On/Off button */}
        <g
          transform={`translate(${-size * 0.15}, ${size * 0.075})`}
          onClick={e => {
            e.stopPropagation();
            onChange(!isRunning);
          }}
          style={{ cursor: 'pointer' }}
        >
          <rect
            x={-size * 0.06}
            y={-size * 0.03}
            width={size * 0.12}
            height={size * 0.06}
            rx={4}
            fill={isRunning ? '#38A169' : '#E53E3E'}
            stroke="#1A202C"
            strokeWidth={1}
          />
          <text
            x={0}
            y={size * 0.005}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FFFFFF"
            fontSize={`${size * 0.03}px`}
            fontWeight="bold"
          >
            {isRunning ? 'ON' : 'OFF'}
          </text>
        </g>

        {/* Auto/Manual toggle */}
        {onModeChange && (
          <g
            transform={`translate(${0}, ${size * 0.075})`}
            onClick={e => {
              e.stopPropagation();
              onModeChange(mode === 'auto' ? 'manual' : 'auto');
            }}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={-size * 0.06}
              y={-size * 0.03}
              width={size * 0.12}
              height={size * 0.06}
              rx={4}
              fill={mode === 'auto' ? '#3182CE' : '#718096'}
              stroke="#1A202C"
              strokeWidth={1}
            />
            <text
              x={0}
              y={size * 0.005}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#FFFFFF"
              fontSize={`${size * 0.025}px`}
              fontWeight="bold"
            >
              {mode === 'auto' ? 'AUTO' : 'MAN'}
            </text>
          </g>
        )}

        {/* Speed control */}
        {onSpeedChange && (
          <g transform={`translate(${size * 0.3}, ${size * 0.075})`}>
            <rect
              x={-size * 0.05}
              y={-size * 0.025}
              width={size * 0.1}
              height={size * 0.05}
              rx={2}
              fill="#2D3748"
              stroke="#4A5568"
              strokeWidth={1}
            />

            {/* Speed indicator */}
            <rect
              x={-size * 0.04}
              y={-size * 0.015}
              width={size * 0.08 * speedValue}
              height={size * 0.03}
              rx={1}
              fill="#3182CE"
            />

            {/* Drag handle */}
            <rect
              x={-size * 0.04 + size * 0.08 * speedValue - 2}
              y={-size * 0.025}
              width={4}
              height={size * 0.05}
              rx={1}
              fill="#A0AEC0"
              onMouseDown={e => {
                e.stopPropagation();
                handleMouseDown(e);
              }}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            />

            <text
              x={0}
              y={size * 0.035}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#A0AEC0"
              fontSize={`${size * 0.02}px`}
            >
              SPEED
            </text>
          </g>
        )}
      </g>
    );
  };

  // Render detailed stats panel
  const renderStatsPanel = () => {
    if (!showDetails) return null;

    return (
      <g transform={`translate(0, ${-size * 0.7})`}>
        <rect
          x={-detailsWidth / 2}
          y={0}
          width={detailsWidth}
          height={detailsHeight}
          rx={5}
          fill="rgba(26, 32, 44, 0.9)"
          stroke="#4A5568"
          strokeWidth={1}
        />

        <text
          x={0}
          y={20}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#E2E8F0"
          fontSize="14px"
          fontWeight="bold"
        >
          PUMP DIAGNOSTIC DATA
        </text>

        <line
          x1={-detailsWidth / 2 + 10}
          y1={30}
          x2={detailsWidth / 2 - 10}
          y2={30}
          stroke="#4A5568"
          strokeWidth={1}
        />

        <g transform="translate(0, 50)">
          <g transform={`translate(${-detailsWidth / 4}, 0)`}>
            <text
              x={0}
              y={0}
              textAnchor="middle"
              fill="#A0AEC0"
              fontSize="12px"
            >
              Flow Rate
            </text>
            <text
              x={0}
              y={20}
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="16px"
              fontWeight="bold"
            >
              {Math.round(effectiveFlowRate * 100)} m³/h
            </text>

            <text
              x={0}
              y={45}
              textAnchor="middle"
              fill="#A0AEC0"
              fontSize="12px"
            >
              Efficiency
            </text>
            <text
              x={0}
              y={65}
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="16px"
              fontWeight="bold"
            >
              {efficiency}%
            </text>
          </g>

          <g transform={`translate(${detailsWidth / 4}, 0)`}>
            <text
              x={0}
              y={0}
              textAnchor="middle"
              fill="#A0AEC0"
              fontSize="12px"
            >
              Power
            </text>
            <text
              x={0}
              y={20}
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="16px"
              fontWeight="bold"
            >
              {powerUsage} kW
            </text>

            <text
              x={0}
              y={45}
              textAnchor="middle"
              fill="#A0AEC0"
              fontSize="12px"
            >
              Temperature
            </text>
            <text
              x={0}
              y={65}
              textAnchor="middle"
              fontSize="16px"
              fontWeight="bold"
              fill={temperature > 70 ? '#FC8181' : '#E2E8F0'}
            >
              {temperature}°C
            </text>
          </g>
        </g>

        <text
          x={0}
          y={detailsHeight - 15}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#A0AEC0"
          fontSize="12px"
        >
          Operating Hours: {hours.toLocaleString()} h
        </text>
      </g>
    );
  };

  // Render warning indicators
  const renderWarnings = () => {
    if (status === 'normal' || status === 'stopped') return null;

    return (
      <g transform={`translate(${pumpRadius + 10}, ${-pumpRadius - 10})`}>
        <polygon
          points="0,0 15,0 7.5,15"
          fill="#F6AD55"
          stroke="#C05621"
          strokeWidth={1}
          style={{
            filter: sparkle ? 'drop-shadow(0 0 3px #FC8181)' : '',
          }}
        />
        <text
          x={7.5}
          y={7}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#1A202C"
          fontSize="12px"
          fontWeight="bold"
        >
          !
        </text>
      </g>
    );
  };

  return (
    <div
      className="absolute"
      style={{
        left: `${x - size / 2}px`,
        top: `${y - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
        onClick={() => setShowDetails(!showDetails)}
        style={{ cursor: 'pointer' }}
      >
        {/* Background elements */}
        {renderPipes()}

        {/* Main pump body */}
        {renderPumpBody()}

        {/* Control panel */}
        {renderControlPanel()}

        {/* Warning indicators */}
        {renderWarnings()}

        {/* Stats panel */}
        {renderStatsPanel()}

        {/* Status text */}
        <text
          x={0}
          y={-pumpRadius - 10}
          textAnchor="middle"
          fill={getStatusColor()}
          fontSize="10px"
          fontWeight="bold"
        >
          {getStatusText()}
        </text>

        {/* Main label */}
        {label && (
          <text
            x={0}
            y={size * 0.45}
            textAnchor="middle"
            fill="#E2E8F0"
            fontSize="12px"
            fontWeight="bold"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
};
