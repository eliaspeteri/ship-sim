import React from 'react';

/**
 * Data for a single propeller.
 */
export interface PropellerData {
  azimuth: number;
  pitch: number;
  rpm: number;
  side: 'port' | 'starboard';
}

/**
 * Data for the conning display.
 */
export interface ConningDisplayData {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  heading: number;
  windDirection: number;
  windSpeed: number;
  pitch: number;
  roll: number;
  dopplerLog: number;
  rateOfTurn: number;
  propellers: PropellerData[];
  dials: number[];
}

/**
 * Props for the ConningDisplay component.
 */
export interface ConningDisplayProps {
  data: ConningDisplayData;
}

/**
 * ConningDisplay renders a bridge conning display with a grid layout and instrument boxes.
 * @param props - The props for the conning display.
 */
export const ConningDisplay: React.FC<ConningDisplayProps> = ({ data }) => {
  return (
    <div
      style={{
        minHeight: 600,
        minWidth: 800,
        width: '100%',
        background: '#181c20',
        color: '#f3f4f6',
        borderRadius: 12,
        padding: 16,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr 1fr',
        gap: 8,
      }}
    >
      {/* Propeller Azimuth */}
      <div
        style={{
          gridColumn: '1/2',
          gridRow: '1/2',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#23272e',
          borderRadius: 8,
          border: '1px solid #374151',
        }}
      >
        <div style={{ fontSize: 12, marginBottom: 4 }}>Azim-th</div>
        <div
          style={{
            width: 96,
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '2px solid #fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 32, color: '#fbbf24' }}>
              {data.propellers[0]?.azimuth ?? 0}°
            </span>
          </div>
        </div>
      </div>
      {/* Date/Time/Position */}
      <div
        style={{
          gridColumn: '2/4',
          gridRow: '1/2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#23272e',
          borderRadius: 8,
          border: '1px solid #374151',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            marginBottom: 4,
          }}
        >
          <span>Date and Time/UTC</span>
          <span style={{ color: '#34d399', fontFamily: 'monospace' }}>
            {data.date}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            marginBottom: 4,
          }}
        >
          <span>Time</span>
          <span style={{ color: '#34d399', fontFamily: 'monospace' }}>
            {data.time}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            marginBottom: 4,
          }}
        >
          <span>Position</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            marginBottom: 4,
          }}
        >
          <span>Latitude</span>
          <span style={{ color: '#fde68a', fontFamily: 'monospace' }}>
            {data.latitude.toFixed(5)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
          }}
        >
          <span>Longitude</span>
          <span style={{ color: '#fde68a', fontFamily: 'monospace' }}>
            {data.longitude.toFixed(5)}
          </span>
        </div>
      </div>
      {/* Wind Direction */}
      <div
        style={{
          gridColumn: '4/5',
          gridRow: '1/2',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#23272e',
          borderRadius: 8,
          border: '1px solid #374151',
        }}
      >
        <div style={{ fontSize: 12, marginBottom: 4 }}>Wind Direction</div>
        <div
          style={{
            width: 96,
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '2px solid #fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 24, color: '#fbbf24' }}>
              {data.windDirection}°
            </span>
          </div>
        </div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          Speed: {data.windSpeed} kn
        </div>
      </div>
      {/* Pitch and Roll */}
      <div
        style={{
          gridColumn: '1/2',
          gridRow: '2/3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#23272e',
          borderRadius: 8,
          border: '1px solid #374151',
        }}
      >
        <div style={{ fontSize: 12, marginBottom: 4 }}>Pitch And Roll</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 12 }}>PITCH</span>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '2px solid #60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 18 }}>{data.pitch}°</span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 12 }}>ROLL</span>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '2px solid #34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 18 }}>{data.roll}°</span>
            </div>
          </div>
        </div>
      </div>
      {/* Heading (Compass) */}
      <div
        style={{
          gridColumn: '2/4',
          gridRow: '2/3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#23272e',
          borderRadius: 8,
          border: '1px solid #374151',
        }}
      >
        <div style={{ fontSize: 12, marginBottom: 4 }}>Heading</div>
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 256,
              height: 64,
              background: '#111827',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 24, color: '#fbbf24' }}>
              🧭 {data.heading}°
            </span>
          </div>
        </div>
      </div>
      {/* Doppler Log (center ship) */}
      <div
        style={{
          gridColumn: '1/2',
          gridRow: '3/5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#23272e',
          borderRadius: 8,
          border: '1px solid #374151',
        }}
      >
        <div style={{ fontSize: 12, marginBottom: 4 }}>Doppler Log</div>
        <div
          style={{
            width: 128,
            height: 128,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: '50%',
              border: '2px solid #fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 40, color: '#fbbf24' }}>
              {data.dopplerLog} kn
            </span>
          </div>
        </div>
      </div>
      {/* Dual Dials */}
      <div
        style={{
          gridColumn: '2/3',
          gridRow: '3/4',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#23272e',
          borderRadius: 8,
          border: '1px solid #374151',
        }}
      >
        <div style={{ fontSize: 12, marginBottom: 4 }}>DualDialMeter</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '2px solid #f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 16 }}>{data.dials[0]}</span>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '2px solid #34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 16 }}>{data.dials[1]}</span>
          </div>
        </div>
      </div>
      {/* Propeller Pitch */}
      <div
        style={{
          gridColumn: '3/4',
          gridRow: '3/5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#23272e',
          borderRadius: 8,
          border: '1px solid #374151',
        }}
      >
        <div style={{ fontSize: 12, marginBottom: 4 }}>Propeller Pitch</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 12 }}>Port</span>
            <div
              style={{
                width: 24,
                height: 96,
                background: '#111827',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 24,
                  background: '#fbbf24',
                  height: `${data.propellers[0]?.pitch ?? 0}%`,
                }}
              />
            </div>
            <span style={{ fontSize: 12 }}>
              {data.propellers[0]?.pitch ?? 0}%
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 12 }}>Starboard</span>
            <div
              style={{
                width: 24,
                height: 96,
                background: '#111827',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 24,
                  background: '#fbbf24',
                  height: `${data.propellers[1]?.pitch ?? 0}%`,
                }}
              />
            </div>
            <span style={{ fontSize: 12 }}>
              {data.propellers[1]?.pitch ?? 0}%
            </span>
          </div>
        </div>
      </div>
      {/* Rate of Turn */}
      <div
        style={{
          gridColumn: '2/4',
          gridRow: '4/5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#23272e',
          borderRadius: 8,
          border: '1px solid #374151',
        }}
      >
        <div style={{ fontSize: 12, marginBottom: 4 }}>Rate of Turn</div>
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 256,
              height: 24,
              background: '#111827',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                height: 24,
                background: '#34d399',
                borderTopLeftRadius: 8,
                borderBottomLeftRadius: 8,
                width: `${Math.abs(data.rateOfTurn)}%`,
              }}
            />
            <div
              style={{
                height: 24,
                background: '#fbbf24',
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
                width: '10%',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
