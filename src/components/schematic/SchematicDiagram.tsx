import React, { useState, useRef, JSX } from 'react';

/**
 * Interface for a schematic component
 */
export interface SchematicComponent {
  /** Unique identifier for the component */
  id: string;
  /** Type of the component */
  type:
    | 'pump'
    | 'valve'
    | 'tank'
    | 'pipe'
    | 'exchanger'
    | 'filter'
    | 'heater'
    | 'cooler'
    | 'sensor';
  /** X position of the component */
  x: number;
  /** Y position of the component */
  y: number;
  /** Label for the component */
  label?: string;
  /** Whether the component is running/open */
  isActive?: boolean;
  /** Health of the component (0-1) */
  health?: number;
  /** Temperature of the component (°C) */
  temperature?: number;
  /** Pressure at the component (bar) */
  pressure?: number;
  /** Flow rate through the component (relative unit 0-1) */
  flowRate?: number;
  /** Any additional data specific to this component type */
  data?: Record<string, any>;
}

/**
 * Interface for a connection between components
 */
export interface SchematicConnection {
  /** Unique identifier for the connection */
  id: string;
  /** ID of the source component */
  fromId: string;
  /** ID of the target component */
  toId: string;
  /** Connection type */
  type: 'pipe' | 'wire' | 'signal';
  /** Whether flow is active in this connection */
  isActive?: boolean;
  /** Flow rate (0-1) */
  flowRate?: number;
  /** Flow medium */
  medium?:
    | 'water'
    | 'oil'
    | 'fuel'
    | 'air'
    | 'steam'
    | 'exhaust'
    | 'electricity'
    | 'data';
  /** Connection points */
  points?: { x: number; y: number }[];
  /** Any additional data */
  data?: Record<string, any>;
}

/**
 * Props for the SchematicDiagram component
 */
interface SchematicDiagramProps {
  /** List of components in the schematic */
  components: SchematicComponent[];
  /** List of connections between components */
  connections: SchematicConnection[];
  /** Width of the diagram */
  width?: number;
  /** Height of the diagram */
  height?: number;
  /** Whether components can be moved */
  isEditable?: boolean;
  /** Grid size for snap-to-grid in edit mode */
  gridSize?: number;
  /** Function called when a component is clicked */
  onComponentClick?: (componentId: string) => void;
  /** Function called when a connection is clicked */
  onConnectionClick?: (connectionId: string) => void;
  /** Function called when a component is moved */
  onComponentMove?: (componentId: string, x: number, y: number) => void;
  /** Scale factor for the diagram */
  scale?: number;
  /** Background color for the diagram */
  backgroundColor?: string;
  /** Whether to show the grid */
  showGrid?: boolean;
}

/**
 * A component for displaying and interacting with system schematics
 */
export const SchematicDiagram: React.FC<SchematicDiagramProps> = ({
  components,
  connections,
  width = 800,
  height = 600,
  isEditable = false,
  gridSize = 10,
  onComponentClick,
  onConnectionClick,
  onComponentMove,
  scale = 1,
  backgroundColor = '#0f172a', // Slate-900
  showGrid = true,
}) => {
  // Refs
  const svgRef = useRef<SVGSVGElement>(null);

  // State
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [hoveredElement, setHoveredElement] = useState<{
    id: string;
    type: 'component' | 'connection';
  } | null>(null);
  const [viewBox, setViewBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({
    x: 0,
    y: 0,
    width,
    height,
  });
  const [isDraggingSvg, setIsDraggingSvg] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  /**
   * Handle starting drag of a component
   */
  const handleDragStart = (componentId: string, event: React.MouseEvent) => {
    if (!isEditable) return;

    event.stopPropagation();
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    // Calculate offset from cursor position to component position
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const offsetX = (event.clientX - svgRect.left) / scale - component.x;
    const offsetY = (event.clientY - svgRect.top) / scale - component.y;

    setDraggedComponent(componentId);
    setDragOffset({ x: offsetX, y: offsetY });
  };

  /**
   * Handle mouse move during drag operations
   */
  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDraggingSvg) {
      // Pan the viewBox
      const dx = (event.clientX - dragStart.x) / scale;
      const dy = (event.clientY - dragStart.y) / scale;

      setViewBox(prev => ({
        ...prev,
        x: prev.x - dx,
        y: prev.y - dy,
      }));

      setDragStart({ x: event.clientX, y: event.clientY });
      return;
    }

    if (!draggedComponent) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    // Calculate new position
    let x = (event.clientX - svgRect.left) / scale - dragOffset.x;
    let y = (event.clientY - svgRect.top) / scale - dragOffset.y;

    // Apply grid snapping if enabled
    if (gridSize > 0) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }

    // Call callback if provided
    if (onComponentMove) {
      onComponentMove(draggedComponent, x, y);
    }
  };

  /**
   * Handle ending drag operation
   */
  const handleMouseUp = () => {
    if (isDraggingSvg) {
      setIsDraggingSvg(false);
    }

    if (draggedComponent) {
      setDraggedComponent(null);
    }
  };

  /**
   * Handle starting panning of the SVG
   */
  const handleSvgMouseDown = (event: React.MouseEvent) => {
    // Only apply to middle-click or right-click
    if (event.button !== 1 && event.button !== 2) return;

    event.preventDefault();
    setIsDraggingSvg(true);
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  /**
   * Handle zoom using mouse wheel
   */
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    // Calculate mouse position relative to the SVG
    const mouseX = (event.clientX - svgRect.left) / scale;
    const mouseY = (event.clientY - svgRect.top) / scale;

    setViewBox(prev => {
      const newWidth = prev.width * zoomFactor;
      const newHeight = prev.height * zoomFactor;

      // Adjust the viewBox position to keep the mouse position stable
      const newX = mouseX - (mouseX - prev.x) * zoomFactor;
      const newY = mouseY - (mouseY - prev.y) * zoomFactor;

      return {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };
    });
  };

  /**
   * Get color for a component based on its state
   */
  const getComponentColor = (component: SchematicComponent) => {
    if (component.health !== undefined && component.health < 0.3) {
      return '#ef4444'; // Red-500
    }
    if (component.temperature !== undefined && component.temperature > 80) {
      return '#f97316'; // Orange-500
    }
    if (component.isActive) {
      return '#10b981'; // Emerald-500
    }
    return '#6b7280'; // Gray-500
  };

  /**
   * Get color for a connection based on its state
   */
  const getConnectionColor = (connection: SchematicConnection) => {
    if (!connection.isActive) {
      return '#6b7280'; // Gray-500
    }

    switch (connection.medium) {
      case 'water':
        return '#0ea5e9'; // Sky-500
      case 'oil':
        return '#854d0e'; // Yellow-900
      case 'fuel':
        return '#ca8a04'; // Yellow-700
      case 'air':
        return '#a1a1aa'; // Zinc-400
      case 'steam':
        return '#d4d4d8'; // Zinc-300
      case 'exhaust':
        return '#78716c'; // Stone-500
      case 'electricity':
        return '#fb923c'; // Orange-400
      case 'data':
        return '#22d3ee'; // Cyan-400
      default:
        return '#94a3b8'; // Slate-400
    }
  };

  /**
   * Render a component icon based on its type
   */
  const renderComponentIcon = (component: SchematicComponent) => {
    const size = 24;
    const color = getComponentColor(component);
    const strokeWidth = 1.5;

    switch (component.type) {
      case 'pump':
        return (
          <g>
            <circle
              cx={0}
              cy={0}
              r={size / 2}
              fill="#334155"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            <path
              d="M-8,-8 L8,8 M-8,8 L8,-8"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            <circle
              cx={0}
              cy={0}
              r={size / 4}
              fill={component.isActive ? color : 'none'}
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </g>
        );

      case 'valve':
        return (
          <g>
            <rect
              x={-size / 2}
              y={-size / 2}
              width={size}
              height={size}
              rx={2}
              fill="#334155"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            {component.isActive ? (
              <path d="M-8,0 L8,0" stroke={color} strokeWidth={strokeWidth} />
            ) : (
              <path d="M0,-8 L0,8" stroke={color} strokeWidth={strokeWidth} />
            )}
          </g>
        );

      case 'tank':
        return (
          <g>
            <rect
              x={-size / 2}
              y={-size / 2}
              width={size}
              height={size}
              rx={1}
              fill="#334155"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            <rect
              x={-size / 2 + 2}
              y={
                -size / 2 + 2 + (size - 4) * (1 - (component.data?.level || 0))
              }
              width={size - 4}
              height={(size - 4) * (component.data?.level || 0)}
              fill={color}
              opacity={0.7}
            />
          </g>
        );

      case 'exchanger':
        return (
          <g>
            <rect
              x={-size / 2}
              y={-size / 2}
              width={size}
              height={size}
              rx={2}
              fill="#334155"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            <path
              d="M-8,-8 L8,8 M-8,8 L8,-8 M-8,0 L8,0 M0,-8 L0,8"
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </g>
        );

      case 'filter':
        return (
          <g>
            <polygon
              points={`0,${-size / 2} ${size / 2},${size / 2} ${-size / 2},${size / 2}`}
              fill="#334155"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            <line
              x1={-size / 3}
              y1={0}
              x2={size / 3}
              y2={0}
              stroke={color}
              strokeWidth={strokeWidth}
            />
            <line
              x1={-size / 4}
              y1={size / 4}
              x2={size / 4}
              y2={size / 4}
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </g>
        );

      case 'heater':
        return (
          <g>
            <rect
              x={-size / 2}
              y={-size / 2}
              width={size}
              height={size}
              rx={2}
              fill="#334155"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            <path
              d="M-6,-6 L-6,6 L6,-6 L6,6"
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </g>
        );

      case 'cooler':
        return (
          <g>
            <rect
              x={-size / 2}
              y={-size / 2}
              width={size}
              height={size}
              rx={2}
              fill="#334155"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            <path
              d="M-8,0 L8,0 M-4,-8 L-4,8 M4,-8 L4,8"
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </g>
        );

      case 'sensor':
        return (
          <g>
            <circle
              cx={0}
              cy={0}
              r={size / 3}
              fill="#334155"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            <path
              d="M0,-12 L0,12 M-12,0 L12,0"
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </g>
        );

      default:
        return (
          <g>
            <rect
              x={-size / 2}
              y={-size / 2}
              width={size}
              height={size}
              rx={2}
              fill="#334155"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            <text
              x={0}
              y={0}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={color}
              fontSize="10px"
            >
              ?
            </text>
          </g>
        );
    }
  };

  /**
   * Calculate path for a connection between components
   */
  const calculateConnectionPath = (connection: SchematicConnection) => {
    const fromComponent = components.find(c => c.id === connection.fromId);
    const toComponent = components.find(c => c.id === connection.toId);

    if (!fromComponent || !toComponent) return '';

    // If custom points are provided, use those
    if (connection.points && connection.points.length > 0) {
      return `M ${fromComponent.x},${fromComponent.y} ${connection.points.map(p => `L ${p.x},${p.y}`).join(' ')} L ${toComponent.x},${toComponent.y}`;
    }

    // Simple straight line
    return `M ${fromComponent.x},${fromComponent.y} L ${toComponent.x},${toComponent.y}`;
  };

  /**
   * Render the grid
   */
  const renderGrid = () => {
    if (!showGrid) return null;

    const gridLines: JSX.Element[] = [];
    const minorGridSize = gridSize / 5;

    // Minor grid lines (lighter)
    for (let x = 0; x <= width; x += minorGridSize) {
      gridLines.push(
        <line
          key={`minor-vertical-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#334155"
          strokeWidth={0.5}
          opacity={0.3}
        />,
      );
    }

    for (let y = 0; y <= height; y += minorGridSize) {
      gridLines.push(
        <line
          key={`minor-horizontal-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#334155"
          strokeWidth={0.5}
          opacity={0.3}
        />,
      );
    }

    // Major grid lines (darker)
    for (let x = 0; x <= width; x += gridSize) {
      gridLines.push(
        <line
          key={`major-vertical-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#334155"
          strokeWidth={1}
          opacity={0.5}
        />,
      );
    }

    for (let y = 0; y <= height; y += gridSize) {
      gridLines.push(
        <line
          key={`major-horizontal-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#334155"
          strokeWidth={1}
          opacity={0.5}
        />,
      );
    }

    return <g className="grid">{gridLines}</g>;
  };

  /**
   * Render flow animation on active connections
   */
  const renderFlowAnimation = (connection: SchematicConnection) => {
    if (!connection.isActive) return null;

    const path = calculateConnectionPath(connection);
    const color = getConnectionColor(connection);
    const id = `flow-${connection.id}`;

    return (
      <g key={`flow-${connection.id}`}>
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="50%" stopColor={color} stopOpacity={0.8} />
            <stop offset="100%" stopColor={color} stopOpacity={0.2} />
            <animate
              attributeName="x1"
              from="0%"
              to="100%"
              dur={`${2 / (connection.flowRate || 0.5)}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="x2"
              from="100%"
              to="200%"
              dur={`${2 / (connection.flowRate || 0.5)}s`}
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>
        <path
          d={path}
          stroke={`url(#${id})`}
          strokeWidth={connection.type === 'pipe' ? 4 : 2}
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  };

  /**
   * Render connection hint when hovering over a connection
   */
  const renderConnectionHint = (connection: SchematicConnection) => {
    if (
      hoveredElement?.id !== connection.id ||
      hoveredElement?.type !== 'connection'
    ) {
      return null;
    }

    // Find midpoint of the connection
    const fromComponent = components.find(c => c.id === connection.fromId);
    const toComponent = components.find(c => c.id === connection.toId);

    if (!fromComponent || !toComponent) return null;

    const midX = (fromComponent.x + toComponent.x) / 2;
    const midY = (fromComponent.y + toComponent.y) / 2;

    // Calculate flow text
    let flowText = '';
    if (connection.flowRate !== undefined) {
      const flowPercent = Math.round(connection.flowRate * 100);
      flowText = `Flow: ${flowPercent}%`;
    }

    return (
      <g transform={`translate(${midX}, ${midY})`}>
        <rect
          x={-70}
          y={-30}
          width={140}
          height={60}
          rx={5}
          fill="#1e293b"
          stroke="#475569"
          strokeWidth={1}
        />
        <text x={0} y={-10} textAnchor="middle" fill="#f8fafc" fontSize="12px">
          {connection.fromId} → {connection.toId}
        </text>
        <text x={0} y={10} textAnchor="middle" fill="#94a3b8" fontSize="10px">
          {connection.medium || 'Unknown medium'}
        </text>
        {flowText && (
          <text x={0} y={25} textAnchor="middle" fill="#94a3b8" fontSize="10px">
            {flowText}
          </text>
        )}
      </g>
    );
  };

  /**
   * Render component hint when hovering over a component
   */
  const renderComponentHint = (component: SchematicComponent) => {
    if (
      hoveredElement?.id !== component.id ||
      hoveredElement?.type !== 'component'
    ) {
      return null;
    }

    // Prepare component data for display
    const dataItems: string[] = [];

    if (component.health !== undefined) {
      const healthPercent = Math.round(component.health * 100);
      dataItems.push(`Health: ${healthPercent}%`);
    }

    if (component.temperature !== undefined) {
      dataItems.push(`Temp: ${component.temperature}°C`);
    }

    if (component.pressure !== undefined) {
      dataItems.push(`Press: ${component.pressure.toFixed(1)} bar`);
    }

    if (component.flowRate !== undefined) {
      const flowPercent = Math.round(component.flowRate * 100);
      dataItems.push(`Flow: ${flowPercent}%`);
    }

    return (
      <g transform={`translate(${component.x}, ${component.y - 30})`}>
        <rect
          x={-70}
          y={-20}
          width={140}
          height={dataItems.length ? 45 + dataItems.length * 15 : 30}
          rx={5}
          fill="#1e293b"
          stroke="#475569"
          strokeWidth={1}
        />
        <text x={0} y={-5} textAnchor="middle" fill="#f8fafc" fontSize="12px">
          {component.label || component.id}
        </text>
        <text x={0} y={10} textAnchor="middle" fill="#94a3b8" fontSize="10px">
          {component.type} {component.isActive ? '(Active)' : '(Inactive)'}
        </text>
        {dataItems.map((item, index) => (
          <text
            key={index}
            x={0}
            y={25 + index * 15}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="10px"
          >
            {item}
          </text>
        ))}
      </g>
    );
  };

  return (
    <div
      className="schematic-diagram-container relative"
      style={{ width, height }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="schematic-diagram"
        style={{ backgroundColor }}
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()} // Prevent context menu on right-click
      >
        {/* Grid */}
        {renderGrid()}

        {/* Connections */}
        {connections.map(connection => (
          <g key={connection.id}>
            <path
              d={calculateConnectionPath(connection)}
              stroke={getConnectionColor(connection)}
              strokeWidth={connection.type === 'pipe' ? 4 : 2}
              fill="none"
              strokeLinecap="round"
              onMouseEnter={() =>
                setHoveredElement({ id: connection.id, type: 'connection' })
              }
              onMouseLeave={() => setHoveredElement(null)}
              onClick={() =>
                onConnectionClick && onConnectionClick(connection.id)
              }
              style={{ cursor: onConnectionClick ? 'pointer' : 'default' }}
              opacity={connection.isActive ? 1 : 0.5}
            />
            {connection.isActive && renderFlowAnimation(connection)}
            {renderConnectionHint(connection)}
          </g>
        ))}

        {/* Components */}
        {components.map(component => (
          <g
            key={component.id}
            transform={`translate(${component.x}, ${component.y})`}
            onMouseDown={event => handleDragStart(component.id, event)}
            onMouseEnter={() =>
              setHoveredElement({ id: component.id, type: 'component' })
            }
            onMouseLeave={() => setHoveredElement(null)}
            onClick={event => {
              event.stopPropagation();
              if (onComponentClick) {
                onComponentClick(component.id);
              }
            }}
            style={{
              cursor: isEditable
                ? 'move'
                : onComponentClick
                  ? 'pointer'
                  : 'default',
            }}
          >
            {renderComponentIcon(component)}
            <text
              x={0}
              y={20}
              textAnchor="middle"
              fontSize="10px"
              fill="#e2e8f0"
            >
              {component.label || component.id}
            </text>
            {renderComponentHint(component)}
          </g>
        ))}
      </svg>
    </div>
  );
};
