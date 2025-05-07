import React, { useState } from 'react';

/**
 * Defines the properties for an Electronic Bearing Line (EBL).
 */
export interface EBLState {
  id: 'EBL1' | 'EBL2';
  isActive: boolean;
  bearing: number; // Degrees from North
  origin: 'ship' | 'center'; // Origin of the EBL
}

/**
 * Props for the EBLControl component.
 */
export interface EBLControlProps {
  eblState: EBLState;
  setEblState: (newState: EBLState) => void;
}

/**
 * EBLControl component provides a UI tab and settings panel for an EBL.
 * Users can activate/deactivate the EBL and set its bearing.
 */
export const EBLControl: React.FC<EBLControlProps> = ({
  eblState,
  setEblState,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleBearingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newBearing = parseFloat(event.target.value);
    if (!isNaN(newBearing)) {
      setEblState({ ...eblState, bearing: ((newBearing % 360) + 360) % 360 }); // Normalize to 0-359.9
    }
  };

  const toggleIsActive = () => {
    setEblState({ ...eblState, isActive: !eblState.isActive });
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
          background: eblState.isActive ? '#374151' : '#4b5563',
          border: '1px solid #6b7280',
          color: '#e0f2f1',
          padding: '3px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          minWidth: '100px',
          textAlign: 'left',
        }}
      >
        {eblState.id}:{' '}
        {eblState.isActive ? `${eblState.bearing.toFixed(1)}°` : 'Off'}
      </button>
      {showSettings && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
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
              checked={eblState.isActive}
              onChange={toggleIsActive}
            />
            Active
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Bearing:
            <input
              type="number"
              value={eblState.bearing.toFixed(1)}
              onChange={handleBearingChange}
              step="0.1"
              min="0"
              max="359.9"
              disabled={!eblState.isActive}
              style={{
                width: '60px',
                background: '#374151',
                color: '#e0f2f1',
                border: '1px solid #6b7280',
                borderRadius: '3px',
                padding: '2px 4px',
              }}
            />
            °
          </label>
          {/* Origin selection can be added later if needed */}
        </div>
      )}
    </div>
  );
};
