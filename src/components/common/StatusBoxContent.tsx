import React from 'react';
import { BoxDefinition, ValueLine } from './StatusPanelTypes';

interface StatusBoxContentProps {
  box: BoxDefinition;
  data: Record<string, string | number | undefined>; // Updated type for data
}

const resolveValue = (
  text: string,
  data: Record<string, string | number | undefined>,
): string => {
  if (text.startsWith('data:')) {
    const key = text.substring(5);
    // Basic key access, can be expanded for nested paths if needed
    return data[key] !== undefined ? String(data[key]) : `{{${key}}}`;
  }
  return text;
};

const renderValueLine = (
  line: ValueLine,
  data: Record<string, string | number | undefined>,
  defaultClassName: string = '',
) => {
  if (!line || !line.text) return null;
  return (
    <div className={line.className || defaultClassName}>
      {resolveValue(line.text, data)}
    </div>
  );
};

export const StatusBoxContent: React.FC<StatusBoxContentProps> = ({
  box,
  data,
}) => {
  return (
    <div className={`flex flex-col h-full ${box.boxClassName || ''}`}>
      {(box.label || box.statusValue) && (
        <div className="flex justify-between items-start w-full">
          {box.label && (
            <div
              className={`text-xs text-gray-400 ${box.labelClassName || ''}`}
            >
              {box.label}
            </div>
          )}
          {/* Render statusValue next to label if mainValue is not present, or if it's meant to be in the header */}
          {box.statusValue &&
            !box.mainValue &&
            !box.additionalLines &&
            renderValueLine(
              box.statusValue,
              data,
              'text-xs text-gray-400 self-end',
            )}
          {/* Specifically for POSN filter case where it's aligned with label but there are additionalLines */}
          {box.statusValue &&
            box.id === 'posn' &&
            renderValueLine(box.statusValue, data, 'text-xs text-gray-400')}
        </div>
      )}

      <div className="flex-grow flex flex-col justify-center">
        {box.mainValue && (
          <div className="flex justify-between items-baseline w-full">
            {renderValueLine(box.mainValue, data, 'text-white')}
            {/* Render statusValue next to mainValue if mainValue IS present and it's not the POSN case */}
            {box.statusValue &&
              box.mainValue &&
              box.id !== 'posn' &&
              renderValueLine(
                box.statusValue,
                data,
                'text-xs text-gray-400 self-end pb-0.5',
              )}
          </div>
        )}

        {box.additionalLines && box.additionalLines.length > 0 && (
          <div className={`mt-0 ${box.mainValue ? 'pt-0' : 'pt-1'}`}>
            {box.additionalLines.map((line, index) => (
              <React.Fragment key={index}>
                {renderValueLine(line, data, 'text-sm text-white')}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
