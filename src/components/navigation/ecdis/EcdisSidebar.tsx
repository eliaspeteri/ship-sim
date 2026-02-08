import React from 'react';
import { formatLatLon } from './math';

type ShipDisplayState = {
  latitude: number;
  longitude: number;
  heading: number;
};

interface EcdisSidebarProps {
  ship: ShipDisplayState;
}

export const EcdisSidebar: React.FC<EcdisSidebarProps> = ({ ship }) => {
  const buttonStyle: React.CSSProperties = {
    background: '#0c2ca8',
    border: '1px solid #2047dc',
    color: '#b9dbff',
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 8px',
    cursor: 'pointer',
  };

  const valueBoxStyle: React.CSSProperties = {
    color: '#f3d648',
    background: '#000',
    border: '1px solid #2a4ac5',
    minWidth: 84,
    textAlign: 'right',
    padding: '0 6px',
    lineHeight: '18px',
    height: 20,
  };

  const rowLabelStyle: React.CSSProperties = {
    color: '#6cc9ff',
    fontWeight: 700,
    letterSpacing: 0.2,
    whiteSpace: 'nowrap',
  };

  const menuRowStyle: React.CSSProperties = {
    border: '1px solid #2a4ac5',
    background: '#0c2ca8',
    color: '#b9dbff',
    padding: '2px 8px',
    fontWeight: 700,
    marginBottom: 4,
    lineHeight: '16px',
  };

  const rowSingle = (label: string, value: string, unit?: string) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: unit ? '1fr auto auto' : '1fr auto',
        gap: 6,
        marginBottom: 3,
        alignItems: 'center',
      }}
    >
      <div style={rowLabelStyle}>{label}</div>
      <div style={valueBoxStyle}>{value}</div>
      {unit ? (
        <div style={{ ...valueBoxStyle, minWidth: 52, textAlign: 'center' }}>
          {unit}
        </div>
      ) : null}
    </div>
  );

  const rowDual = (
    label: string,
    left: string,
    right: string,
    leftMinWidth = 66,
    rightMinWidth = 84,
  ) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: 6,
        marginBottom: 3,
        alignItems: 'center',
      }}
    >
      <div style={rowLabelStyle}>{label}</div>
      <div
        style={{
          ...valueBoxStyle,
          minWidth: leftMinWidth,
          textAlign: 'center',
        }}
      >
        {left}
      </div>
      <div style={{ ...valueBoxStyle, minWidth: rightMinWidth }}>{right}</div>
    </div>
  );

  const rowTwoHeaders = (
    leftLabel: string,
    leftValue: string,
    rightLabel: string,
    rightValue: string,
  ) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto auto auto',
        gap: 6,
        marginBottom: 3,
        alignItems: 'center',
      }}
    >
      <div style={rowLabelStyle}>{leftLabel}</div>
      <div style={{ ...valueBoxStyle, minWidth: 62, textAlign: 'center' }}>
        {leftValue}
      </div>
      <div style={rowLabelStyle}>{rightLabel}</div>
      <div style={{ ...valueBoxStyle, minWidth: 84, textAlign: 'center' }}>
        {rightValue}
      </div>
    </div>
  );

  const rowValueOnly = (value: string) => (
    <div style={{ marginBottom: 3 }}>
      <div style={{ ...valueBoxStyle, minWidth: 0, textAlign: 'left' }}>
        {value}
      </div>
    </div>
  );

  return (
    <aside
      style={{
        width: 290,
        background: '#00156a',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          borderBottom: '2px solid #1739c9',
          padding: '5px 8px',
          fontWeight: 800,
        }}
      >
        KELVIN HUGHES ECDIS
      </div>
      <div style={{ padding: 8, overflowY: 'auto', flex: 1 }}>
        <div style={menuRowStyle}>Main Menu</div>

        {rowDual('Heading', 'T', `${ship.heading.toFixed(1)}\u00b0`)}
        {rowDual('Speed', 'W', '22.0 kts')}
        {rowDual('COG', 'DR', `${ship.heading.toFixed(1)}\u00b0`)}
        {rowDual('SOG', '', '22.0 kts')}
        {rowDual('Time', '+01H', '17:11:29')}
        {rowDual('Depth', 'Sim1', '22.3 m')}

        <div style={{ ...rowLabelStyle, marginTop: 4, marginBottom: 2 }}>
          Sensor
        </div>
        {rowValueOnly(
          `${formatLatLon(ship.latitude, 'N', 'S')} ${formatLatLon(ship.longitude, 'E', 'W')}`,
        )}
        {rowSingle('Datum', 'WGS84')}

        <div style={{ ...menuRowStyle, marginTop: 6 }}>Charts</div>
        <div style={{ ...menuRowStyle, marginBottom: 6 }}>Routes</div>

        <div
          style={{
            ...valueBoxStyle,
            textAlign: 'center',
            minWidth: 0,
            marginBottom: 3,
          }}
        >
          TRACK CONTROL
        </div>
        <div
          style={{
            ...valueBoxStyle,
            textAlign: 'center',
            minWidth: 0,
            marginBottom: 3,
          }}
        >
          Saltmere to Bonville
        </div>
        {rowSingle('Alt.', '(No Route Selected)')}

        <div
          style={{
            ...valueBoxStyle,
            minWidth: 0,
            marginBottom: 3,
            textAlign: 'center',
            color: '#90ffe1',
          }}
        >
          | . . . . A . /\ . . . |
        </div>

        {rowTwoHeaders('XTE', '55 m', 'CTS', '064.0\u00b0')}
        {rowValueOnly('WP7 : Cartwheel Point')}
        {rowSingle('Dist to WOP', '1.64 nm')}
        {rowSingle('Time to WOP', '00:04:29')}
        {rowDual('ETA at final WP', '17:24', '03/01')}

        <div style={{ ...menuRowStyle, marginTop: 6 }}>Tools</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '56px 1fr',
            gap: 6,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              border: '1px solid #2a4ac5',
              background: '#113d7a',
              height: 56,
            }}
          />
          <div>
            <div
              style={{
                ...valueBoxStyle,
                textAlign: 'left',
                minWidth: 0,
                marginBottom: 3,
              }}
            >
              {formatLatLon(ship.latitude, 'N', 'S')}
            </div>
            <div style={{ ...valueBoxStyle, textAlign: 'left', minWidth: 0 }}>
              {formatLatLon(ship.longitude, 'E', 'W')}
            </div>
          </div>
        </div>
        {rowDual('', 'Rng', '1.49 nm', 44, 96)}
        {rowDual('', 'Brg', '271.6\u00b0', 44, 96)}

        <div
          style={{
            marginTop: 6,
            marginBottom: 6,
            minHeight: 52,
            border: '1px solid #8c0000',
            background: '#d00000',
            color: '#ffe7e7',
            padding: '4px 6px',
            fontWeight: 700,
          }}
        >
          Track Control Stopped
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          borderTop: '2px solid #1739c9',
        }}
      >
        <button style={{ ...buttonStyle, borderWidth: 0, borderRightWidth: 1 }}>
          Select Query Feature
        </button>
        <button style={{ ...buttonStyle, borderWidth: 0, borderRightWidth: 1 }}>
          Action 2
        </button>
        <button style={{ ...buttonStyle, borderWidth: 0 }}>Context Menu</button>
      </div>
    </aside>
  );
};
