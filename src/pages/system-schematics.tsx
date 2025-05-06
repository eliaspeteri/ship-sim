import React, { useState, useEffect } from 'react';
import {
  SchematicDiagram,
  SchematicComponent,
  SchematicConnection,
} from '../components/schematic/SchematicDiagram';

// Sample cooling system schematic data
const initialComponents: SchematicComponent[] = [
  {
    id: 'sea-water-inlet',
    type: 'valve',
    x: 100,
    y: 100,
    label: 'Sea Water Inlet',
    isActive: true,
  },
  {
    id: 'sw-pump',
    type: 'pump',
    x: 200,
    y: 100,
    label: 'SW Pump',
    isActive: true,
    temperature: 45,
    health: 0.9,
    pressure: 2.5,
    flowRate: 0.8,
  },
  {
    id: 'cooler',
    type: 'exchanger',
    x: 300,
    y: 100,
    label: 'Cooler',
    isActive: true,
  },
  {
    id: 'fw-pump',
    type: 'pump',
    x: 200,
    y: 200,
    label: 'FW Pump',
    isActive: true,
    temperature: 62,
    health: 0.75,
    pressure: 1.8,
    flowRate: 0.7,
  },
  {
    id: 'engine',
    type: 'heater',
    x: 300,
    y: 200,
    label: 'Engine',
    temperature: 82,
    isActive: true,
  },
  {
    id: 'expansion',
    type: 'tank',
    x: 100,
    y: 200,
    label: 'Exp. Tank',
    data: { level: 0.65 },
  },
  {
    id: 'filter',
    type: 'filter',
    x: 400,
    y: 200,
    label: 'Filter',
    isActive: true,
  },
  {
    id: 'overboard',
    type: 'valve',
    x: 400,
    y: 100,
    label: 'Overboard',
    isActive: true,
  },
  {
    id: 'temp-sensor',
    type: 'sensor',
    x: 250,
    y: 200,
    label: 'Temp Sensor',
    isActive: true,
    temperature: 62,
  },
];

const initialConnections: SchematicConnection[] = [
  {
    id: 'conn-1',
    fromId: 'sea-water-inlet',
    toId: 'sw-pump',
    type: 'pipe',
    isActive: true,
    medium: 'water',
    flowRate: 0.8,
  },
  {
    id: 'conn-2',
    fromId: 'sw-pump',
    toId: 'cooler',
    type: 'pipe',
    isActive: true,
    medium: 'water',
    flowRate: 0.8,
  },
  {
    id: 'conn-3',
    fromId: 'cooler',
    toId: 'overboard',
    type: 'pipe',
    isActive: true,
    medium: 'water',
    flowRate: 0.8,
  },
  {
    id: 'conn-4',
    fromId: 'expansion',
    toId: 'fw-pump',
    type: 'pipe',
    isActive: true,
    medium: 'water',
    flowRate: 0.7,
  },
  {
    id: 'conn-5',
    fromId: 'fw-pump',
    toId: 'temp-sensor',
    type: 'pipe',
    isActive: true,
    medium: 'water',
    flowRate: 0.7,
  },
  {
    id: 'conn-6',
    fromId: 'temp-sensor',
    toId: 'engine',
    type: 'pipe',
    isActive: true,
    medium: 'water',
    flowRate: 0.7,
  },
  {
    id: 'conn-7',
    fromId: 'engine',
    toId: 'filter',
    type: 'pipe',
    isActive: true,
    medium: 'water',
    flowRate: 0.7,
  },
  {
    id: 'conn-8',
    fromId: 'filter',
    toId: 'cooler',
    type: 'pipe',
    isActive: true,
    medium: 'water',
    flowRate: 0.7,
    points: [
      { x: 450, y: 200 },
      { x: 450, y: 150 },
      { x: 300, y: 150 },
    ],
  },
  {
    id: 'conn-9',
    fromId: 'cooler',
    toId: 'expansion',
    type: 'pipe',
    isActive: true,
    medium: 'water',
    flowRate: 0.7,
    points: [
      { x: 300, y: 150 },
      { x: 100, y: 150 },
    ],
  },
];

// Main SystemSchematics component
const SystemSchematics: React.FC = () => {
  // State for components and connections
  const [components, setComponents] =
    useState<SchematicComponent[]>(initialComponents);
  const [connections, setConnections] =
    useState<SchematicConnection[]>(initialConnections);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null,
  );
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [simulationRunning, setSimulationRunning] = useState<boolean>(true);

  // Sample simulation effect to show dynamic behavior
  useEffect(() => {
    if (!simulationRunning) return;

    // Update component temperatures and flow rates periodically in simulation mode
    const interval = setInterval(() => {
      setComponents(prevComponents =>
        prevComponents.map(component => {
          // Skip components without temperature or special types
          if (component.type === 'valve' || component.type === 'tank')
            return component;

          // Add some randomness to temperature
          const tempChange = Math.random() * 2 - 1; // -1 to +1
          const tempBase =
            component.id === 'engine'
              ? 80
              : component.id === 'temp-sensor'
                ? 60
                : component.id === 'sw-pump'
                  ? 45
                  : 55;

          return {
            ...component,
            temperature: component.temperature
              ? Math.min(95, Math.max(30, component.temperature + tempChange))
              : tempBase + tempChange,
            flowRate: component.flowRate
              ? Math.min(
                  1,
                  Math.max(
                    0.4,
                    component.flowRate + (Math.random() * 0.1 - 0.05),
                  ),
                )
              : 0.7,
          };
        }),
      );

      setConnections(prevConnections =>
        prevConnections.map(connection => {
          // Add some randomness to flow rates
          if (!connection.flowRate) return connection;

          return {
            ...connection,
            flowRate: Math.min(
              1,
              Math.max(0.4, connection.flowRate + (Math.random() * 0.1 - 0.05)),
            ),
          };
        }),
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [simulationRunning]);

  // Handle component click
  const handleComponentClick = (componentId: string) => {
    setSelectedComponent(prev => (prev === componentId ? null : componentId));
  };

  // Handle component move in edit mode
  const handleComponentMove = (componentId: string, x: number, y: number) => {
    setComponents(prevComponents =>
      prevComponents.map(component =>
        component.id === componentId ? { ...component, x, y } : component,
      ),
    );
  };

  // Toggle a component's active state
  const toggleComponentActive = (componentId: string) => {
    setComponents(prevComponents =>
      prevComponents.map(component =>
        component.id === componentId
          ? { ...component, isActive: !component.isActive }
          : component,
      ),
    );

    // Update connections when related component activation changes
    setConnections(prevConnections =>
      prevConnections.map(connection => {
        if (
          connection.fromId === componentId ||
          connection.toId === componentId
        ) {
          const sourceComponent = components.find(
            c => c.id === connection.fromId,
          );
          const targetComponent = components.find(
            c => c.id === connection.toId,
          );

          // A connection is active only if both connected components are active
          const isActive = Boolean(
            sourceComponent?.isActive !== false &&
              targetComponent?.isActive !== false,
          );

          return { ...connection, isActive };
        }
        return connection;
      }),
    );
  };

  // Render component details panel
  const renderComponentDetails = () => {
    if (!selectedComponent) return null;

    const component = components.find(c => c.id === selectedComponent);
    if (!component) return null;

    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-4">
        <h3 className="text-lg font-semibold text-white">
          {component.label || component.id}
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="text-sm text-gray-300">Type:</div>
          <div className="text-sm text-white capitalize">{component.type}</div>

          <div className="text-sm text-gray-300">Status:</div>
          <div className="text-sm">
            <span
              className={`px-2 py-0.5 rounded text-xs ${component.isActive ? 'bg-green-900 text-green-100' : 'bg-gray-700 text-gray-300'}`}
            >
              {component.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {component.temperature !== undefined && (
            <>
              <div className="text-sm text-gray-300">Temperature:</div>
              <div
                className={`text-sm ${component.temperature > 80 ? 'text-orange-400' : component.temperature > 60 ? 'text-yellow-300' : 'text-white'}`}
              >
                {component.temperature.toFixed(1)}°C
              </div>
            </>
          )}

          {component.pressure !== undefined && (
            <>
              <div className="text-sm text-gray-300">Pressure:</div>
              <div className="text-sm text-white">
                {component.pressure.toFixed(1)} bar
              </div>
            </>
          )}

          {component.flowRate !== undefined && (
            <>
              <div className="text-sm text-gray-300">Flow Rate:</div>
              <div className="text-sm text-white">
                {Math.round(component.flowRate * 100)}%
              </div>
            </>
          )}

          {component.health !== undefined && (
            <>
              <div className="text-sm text-gray-300">Health:</div>
              <div
                className={`text-sm ${component.health < 0.3 ? 'text-red-400' : component.health < 0.7 ? 'text-yellow-300' : 'text-green-400'}`}
              >
                {Math.round(component.health * 100)}%
              </div>
            </>
          )}

          {component.type === 'tank' && component.data?.level !== undefined && (
            <>
              <div className="text-sm text-gray-300">Level:</div>
              <div className="text-sm text-white">
                {Math.round(component.data.level * 100)}%
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            className={`px-3 py-1 rounded text-sm ${component.isActive ? 'bg-red-700 text-white hover:bg-red-600' : 'bg-green-700 text-white hover:bg-green-600'}`}
            onClick={() => toggleComponentActive(component.id)}
          >
            {component.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Schematics</h1>
        <div className="space-x-4">
          <button
            className={`px-4 py-2 rounded ${isEditMode ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-200'}`}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
          </button>
          <button
            className={`px-4 py-2 rounded ${simulationRunning ? 'bg-red-700 text-white' : 'bg-green-700 text-white'}`}
            onClick={() => setSimulationRunning(!simulationRunning)}
          >
            {simulationRunning ? 'Pause Simulation' : 'Start Simulation'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-gray-900 rounded-lg p-4">
            <SchematicDiagram
              components={components}
              connections={connections}
              width={800}
              height={500}
              isEditable={isEditMode}
              onComponentClick={handleComponentClick}
              onComponentMove={handleComponentMove}
            />
          </div>
        </div>

        <div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">System Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-300">
                  Cooling System Status
                </h3>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">Overall Status:</div>
                  <div className="text-green-400">Operational</div>

                  <div className="text-gray-400">Sea Water Flow:</div>
                  <div className="text-white">
                    {Math.round(
                      (connections.find(c => c.id === 'conn-1')?.flowRate ||
                        0) * 100,
                    )}
                    %
                  </div>

                  <div className="text-gray-400">Fresh Water Flow:</div>
                  <div className="text-white">
                    {Math.round(
                      (connections.find(c => c.id === 'conn-5')?.flowRate ||
                        0) * 100,
                    )}
                    %
                  </div>

                  <div className="text-gray-400">Engine Temperature:</div>
                  <div
                    className={`${(components.find(c => c.id === 'engine')?.temperature || 0) > 80 ? 'text-orange-400' : 'text-white'}`}
                  >
                    {(
                      components.find(c => c.id === 'engine')?.temperature || 0
                    ).toFixed(1)}
                    °C
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-300">Controls</h3>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <button
                    className="w-full px-3 py-1.5 bg-blue-700 text-white rounded hover:bg-blue-600 text-sm"
                    onClick={() => {
                      // Toggle the sea water inlet valve
                      toggleComponentActive('sea-water-inlet');
                    }}
                  >
                    Toggle Sea Water Inlet
                  </button>

                  <button
                    className="w-full px-3 py-1.5 bg-blue-700 text-white rounded hover:bg-blue-600 text-sm"
                    onClick={() => {
                      // Toggle the sea water pump
                      toggleComponentActive('sw-pump');
                    }}
                  >
                    Toggle SW Pump
                  </button>

                  <button
                    className="w-full px-3 py-1.5 bg-blue-700 text-white rounded hover:bg-blue-600 text-sm"
                    onClick={() => {
                      // Toggle the fresh water pump
                      toggleComponentActive('fw-pump');
                    }}
                  >
                    Toggle FW Pump
                  </button>
                </div>
              </div>
            </div>
          </div>

          {renderComponentDetails()}
        </div>
      </div>

      <div className="mt-8 bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">How to Use</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
          <li>Click on any component to view its details</li>
          <li>Toggle Edit Mode to move components by dragging them</li>
          <li>Use mouse wheel to zoom in/out</li>
          <li>Middle-click or right-click and drag to pan the view</li>
          <li>
            Toggle the simulation to see dynamic temperature and flow changes
          </li>
          <li>
            Use the control buttons to activate/deactivate specific components
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SystemSchematics;
