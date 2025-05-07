import React, { useState } from 'react';

/**
 * Defines the properties for a Variable Range Marker (VRM).
 */
export interface VRMState {
  id: 'VRM1' | 'VRM2';
  isActive: boolean;
  radius: number; // Nautical miles
  origin: 'ship' | 'center'; // Origin of the VRM
}

/**
 * Props for the VRMControl component.
 */
export interface VRMControlProps {
  vrmState: VRMState;
  setVrmState: (newState: VRMState) => void;
}

/**
 * VRMControl component provides a UI tab and settings panel for a VRM.
 * Users can activate/deactivate the VRM and set its radius.
 */
export const VRMControl: React.FC<VRMControlProps> = ({
  vrmState,
  setVrmState,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleRadiusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseFloat(event.target.value);
    if (!isNaN(newRadius) && newRadius >= 0) {
      setVrmState({ ...vrmState, radius: newRadius });
    }
  };

  const toggleIsActive = () => {
    setVrmState({ ...vrmState, isActive: !vrmState.isActive });
  };

  return (
    <div
      style={{
        position: 'relative',
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#e0f2f1',
      }}
    >
      <button
        onClick={() => setShowSettings(!showSettings)}
        style={{
          background: vrmState.isActive ? '#374151' : '#4b5563',
          border: '1px solid #6b7280',
          color: '#e0f2f1',
          padding: '3px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          minWidth: '100px',
          textAlign: 'left',
        }}
      >
        {vrmState.id}:{' '}
        {vrmState.isActive ? `${vrmState.radius.toFixed(3)} NM` : 'Off'}
      </button>
      {showSettings && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0, // Align to the right for VRM controls
            background: '#23272e',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            padding: '8px',
            marginBottom: '4px',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxShadow: '0 2px 8px #000a',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={vrmState.isActive}
              onChange={toggleIsActive}
            />
            Active
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Radius:
            <input
              type="number"
              value={vrmState.radius.toFixed(3)}
              onChange={handleRadiusChange}
              step="0.001"
              min="0"
              disabled={!vrmState.isActive}
              style={{
                width: '70px',
                background: '#374151',
                color: '#e0f2f1',
                border: '1px solid #6b7280',
                borderRadius: '3px',
                padding: '2px 4px',
              }}
            />
            NM
          </label>
          {/* Origin selection can be added later if needed */}
        </div>
      )}
    </div>
  );
};
