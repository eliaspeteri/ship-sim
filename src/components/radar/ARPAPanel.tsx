import React from 'react';
import {
  ARPASettings,
  ARPATarget,
  ARPATargetStatus,
  getTargetStatus,
} from './arpa';
import { PushButton } from '../PushButton';

interface ARPAPanelProps {
  arpaTargets: ARPATarget[];
  selectedTargetId: string | null;
  onSelectTarget: (targetId: string) => void;
  arpaSettings: ARPASettings;
  onSettingChange: (setting: keyof ARPASettings, value: any) => void;
  onAcquireTarget: () => void;
  onCancelTarget: (targetId: string) => void;
  className?: string;
}

const ARPAPanel: React.FC<ARPAPanelProps> = ({
  arpaTargets,
  selectedTargetId,
  onSelectTarget,
  arpaSettings,
  onSettingChange,
  onAcquireTarget,
  onCancelTarget,
  className = '',
}) => {
  // Sort targets by distance
  const sortedTargets = [...arpaTargets].sort(
    (a, b) => a.distance - b.distance,
  );

  // Get selected target details
  const selectedTarget = selectedTargetId
    ? arpaTargets.find(t => t.id === selectedTargetId)
    : null;

  const targetStatus = selectedTarget
    ? getTargetStatus(selectedTarget, arpaSettings)
    : null;

  return (
    <div className={`bg-gray-900 p-3 rounded-lg text-gray-100 ${className}`}>
      <h3 className="font-semibold text-center mb-2 border-b border-gray-700 pb-1">
        ARPA
      </h3>

      <div className="flex flex-col">
        {/* ARPA Controls */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Auto Acquire:</span>
            <div className="inline-flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={arpaSettings.autoAcquisitionEnabled}
                  onChange={e =>
                    onSettingChange('autoAcquisitionEnabled', e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-blue-600"></div>
                <div className="absolute top-[2px] left-[2px] bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-4"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Vector Mode:</span>
            <div className="inline-flex items-center">
              <button
                className={`px-2 py-0.5 text-xs mr-1 rounded ${arpaSettings.relativeVectors ? 'bg-blue-600' : 'bg-gray-600'}`}
                onClick={() => onSettingChange('relativeVectors', true)}
              >
                Relative
              </button>
              <button
                className={`px-2 py-0.5 text-xs rounded ${!arpaSettings.relativeVectors ? 'bg-blue-600' : 'bg-gray-600'}`}
                onClick={() => onSettingChange('relativeVectors', false)}
              >
                True
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Vector Time:</span>
            <div className="flex items-center">
              <input
                type="range"
                min={3}
                max={30}
                step={3}
                value={arpaSettings.vectorTimeMinutes}
                onChange={e =>
                  onSettingChange('vectorTimeMinutes', Number(e.target.value))
                }
                className="w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs ml-2 w-10">
                {arpaSettings.vectorTimeMinutes} min
              </span>
            </div>
          </div>
        </div>

        {/* Target Selection */}
        <div className="mb-3">
          <h4 className="text-xs text-gray-400 mb-1">
            TRACKED TARGETS ({sortedTargets.length})
          </h4>

          <div className="h-28 overflow-y-auto bg-gray-800 rounded mb-2">
            {sortedTargets.length === 0 ? (
              <div className="p-2 text-center text-xs text-gray-400">
                No targets tracked
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-1">ID</th>
                    <th className="p-1">BRG</th>
                    <th className="p-1">RNG</th>
                    <th className="p-1">CPA</th>
                    <th className="p-1">TCPA</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTargets.map(target => {
                    const status = getTargetStatus(target, arpaSettings);

                    let statusColor = '';
                    switch (status) {
                      case ARPATargetStatus.DANGEROUS:
                        statusColor = 'bg-red-900 text-white';
                        break;
                      case ARPATargetStatus.ACQUIRING:
                        statusColor = 'bg-yellow-700';
                        break;
                      case ARPATargetStatus.LOST:
                        statusColor = 'bg-gray-600 text-gray-300';
                        break;
                      default:
                        statusColor = '';
                    }

                    return (
                      <tr
                        key={target.id}
                        className={`border-b border-gray-700 hover:bg-gray-700 cursor-pointer ${selectedTargetId === target.id ? 'bg-blue-800' : statusColor}`}
                        onClick={() => onSelectTarget(target.id)}
                      >
                        <td className="p-1">
                          {target.trackId.replace('ARPA-', '')}
                        </td>
                        <td className="p-1">{target.bearing.toFixed(0)}°</td>
                        <td className="p-1">{target.distance.toFixed(1)}</td>
                        <td className="p-1">
                          {target.cpa ? target.cpa.toFixed(1) : '--'}
                        </td>
                        <td className="p-1">
                          {target.tcpa && target.tcpa !== Infinity
                            ? `${target.tcpa.toFixed(0)}m`
                            : '--'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-between">
            <PushButton
              label="Acquire"
              onClick={onAcquireTarget}
              color="primary"
              size="small"
            />
            <PushButton
              label="Cancel"
              onClick={() =>
                selectedTargetId && onCancelTarget(selectedTargetId)
              }
              color="danger"
              size="small"
              disabled={!selectedTargetId}
            />
          </div>
        </div>

        {/* Selected Target Details */}
        {selectedTarget && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <h4 className="text-xs text-gray-400 mb-1">TARGET DETAILS</h4>

            <div className="grid grid-cols-2 gap-1 mb-2">
              <div className="text-xs">
                <div>
                  Track:{' '}
                  <span className="font-mono">
                    {selectedTarget.trackId.replace('ARPA-', '')}
                  </span>
                </div>
                <div>
                  Range:{' '}
                  <span className="font-mono">
                    {selectedTarget.distance.toFixed(2)} NM
                  </span>
                </div>
                <div>
                  Bearing:{' '}
                  <span className="font-mono">
                    {selectedTarget.bearing.toFixed(1)}°
                  </span>
                </div>
              </div>

              <div className="text-xs">
                <div>
                  Course:{' '}
                  <span className="font-mono">
                    {selectedTarget.calculatedCourse.toFixed(0)}°
                  </span>
                </div>
                <div>
                  Speed:{' '}
                  <span className="font-mono">
                    {selectedTarget.calculatedSpeed.toFixed(1)} kts
                  </span>
                </div>
                <div>
                  Status:{' '}
                  <span
                    className={`font-mono ${
                      targetStatus === ARPATargetStatus.DANGEROUS
                        ? 'text-red-400'
                        : targetStatus === ARPATargetStatus.LOST
                          ? 'text-gray-400'
                          : targetStatus === ARPATargetStatus.ACQUIRING
                            ? 'text-yellow-400'
                            : ''
                    }`}
                  >
                    {targetStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* CPA Information */}
            <div
              className={`text-xs p-2 rounded ${
                targetStatus === ARPATargetStatus.DANGEROUS
                  ? 'bg-red-900'
                  : 'bg-gray-700'
              }`}
            >
              <div>
                CPA:{' '}
                <span className="font-mono">
                  {selectedTarget.cpa?.toFixed(2) || '--'} NM
                </span>
              </div>
              <div>
                TCPA:{' '}
                <span className="font-mono">
                  {selectedTarget.tcpa && selectedTarget.tcpa !== Infinity
                    ? `${selectedTarget.tcpa.toFixed(1)} min`
                    : '--'}
                </span>
              </div>
              <div>
                BCPA:{' '}
                <span className="font-mono">
                  {selectedTarget.bcpa?.toFixed(1) || '--'}°
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ARPAPanel;
