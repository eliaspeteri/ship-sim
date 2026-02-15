import React from 'react';
import type { StatusPanelSchema } from './StatusPanelTypes';
import { StatusBoxContent } from './StatusBoxContent';

interface RightStatusPanelProps {
  children?: React.ReactNode;
  schema: StatusPanelSchema;
  data: Record<string, string | number | undefined>; // Updated type for data
}

export const RightStatusPanel: React.FC<RightStatusPanelProps> = ({
  children,
  schema,
  data,
}) => {
  return (
    <div className="bg-gray-800 text-white w-64 p-1 space-y-1 flex flex-col h-full overflow-y-auto">
      {/* Boxed Data Section */}
      <div className="flex-shrink-0">
        {schema.map((row, rowIndex) => (
          <div key={rowIndex} className="flex space-x-px mb-px">
            {row.map(box => (
              <div
                key={box.id}
                className={`bg-gray-700 p-1 border border-gray-600 ${box.boxClassName || 'flex-1'}`}
                style={{ minHeight: '40px' }} // Ensure boxes have a minimum height
              >
                <StatusBoxContent box={box} data={data} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Existing children, e.g., RouteInfoPanel */}
      <div className="flex-grow overflow-y-auto">{children}</div>
    </div>
  );
};
