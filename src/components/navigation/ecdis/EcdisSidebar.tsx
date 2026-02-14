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

const labelClass =
  'whitespace-nowrap font-bold tracking-[0.2px] text-[#6cc9ff]';
const valueClass =
  'h-5 min-w-[84px] border border-[#2a4ac5] bg-black px-1.5 text-right leading-[18px] text-[#f3d648]';
const menuClass =
  'mb-1 border border-[#2a4ac5] bg-[#0c2ca8] px-2 py-[2px] font-bold leading-4 text-[#b9dbff]';
const footerButtonClass =
  'border-r border-[#2047dc] bg-[#0c2ca8] px-2 py-1 text-xs font-bold text-[#b9dbff] last:border-r-0';

const RowSingle = ({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) => (
  <div
    className={`mb-[3px] grid items-center gap-1.5 ${unit ? 'grid-cols-[1fr_auto_auto]' : 'grid-cols-[1fr_auto]'}`}
  >
    <div className={labelClass}>{label}</div>
    <div className={valueClass}>{value}</div>
    {unit ? (
      <div className={`${valueClass} min-w-[52px] text-center`}>{unit}</div>
    ) : null}
  </div>
);

const RowDual = ({
  label,
  left,
  right,
  leftWide = false,
}: {
  label: string;
  left: string;
  right: string;
  leftWide?: boolean;
}) => (
  <div className="mb-[3px] grid grid-cols-[1fr_auto_auto] items-center gap-1.5">
    <div className={labelClass}>{label}</div>
    <div
      className={`${valueClass} ${leftWide ? 'min-w-[66px]' : 'min-w-[44px]'} text-center`}
    >
      {left}
    </div>
    <div className={`${valueClass} min-w-[96px]`}>{right}</div>
  </div>
);

export const EcdisSidebar: React.FC<EcdisSidebarProps> = ({ ship }) => {
  return (
    <aside className="flex w-[290px] flex-col bg-[#00156a]">
      <div className="border-b-2 border-[#1739c9] px-2 py-[5px] text-sm font-extrabold">
        KELVIN HUGHES ECDIS
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className={menuClass}>Main Menu</div>

        <RowDual
          label="Heading"
          left="T"
          right={`${ship.heading.toFixed(1)}°`}
          leftWide
        />
        <RowDual label="Speed" left="W" right="22.0 kts" leftWide />
        <RowDual
          label="COG"
          left="DR"
          right={`${ship.heading.toFixed(1)}°`}
          leftWide
        />
        <RowDual label="SOG" left="" right="22.0 kts" leftWide />
        <RowDual label="Time" left="+01H" right="17:11:29" leftWide />
        <RowDual label="Depth" left="Sim1" right="22.3 m" leftWide />

        <div className="mb-0.5 mt-1 text-[#6cc9ff]">Sensor</div>
        <div className="mb-[3px]">
          <div className={`${valueClass} min-w-0 text-left`}>
            {formatLatLon(ship.latitude, 'N', 'S')}{' '}
            {formatLatLon(ship.longitude, 'E', 'W')}
          </div>
        </div>
        <RowSingle label="Datum" value="WGS84" />

        <div className={`${menuClass} mt-1.5`}>Charts</div>
        <div className={`${menuClass} mb-1.5`}>Routes</div>

        <div className={`${valueClass} mb-[3px] min-w-0 text-center`}>
          TRACK CONTROL
        </div>
        <div className={`${valueClass} mb-[3px] min-w-0 text-center`}>
          Saltmere to Bonville
        </div>
        <RowSingle label="Alt." value="(No Route Selected)" />

        <div className="mb-[3px] min-w-0 border border-[#2a4ac5] bg-black px-1.5 text-center leading-[18px] text-[#90ffe1]">
          | . . . . A . / . . . |
        </div>

        <div className="mb-[3px] grid grid-cols-[auto_auto_auto_auto] items-center gap-1.5">
          <div className={labelClass}>XTE</div>
          <div className={`${valueClass} min-w-[62px] text-center`}>55 m</div>
          <div className={labelClass}>CTS</div>
          <div className={`${valueClass} text-center`}>064.0°</div>
        </div>

        <div className="mb-[3px]">
          <div className={`${valueClass} min-w-0 text-left`}>
            WP7 : Cartwheel Point
          </div>
        </div>
        <RowSingle label="Dist to WOP" value="1.64 nm" />
        <RowSingle label="Time to WOP" value="00:04:29" />
        <RowDual label="ETA at final WP" left="17:24" right="03/01" leftWide />

        <div className={`${menuClass} mt-1.5`}>Tools</div>
        <div className="mb-1.5 grid grid-cols-[56px_1fr] gap-1.5">
          <div className="h-14 border border-[#2a4ac5] bg-[#113d7a]" />
          <div>
            <div className={`${valueClass} mb-[3px] min-w-0 text-left`}>
              {formatLatLon(ship.latitude, 'N', 'S')}
            </div>
            <div className={`${valueClass} min-w-0 text-left`}>
              {formatLatLon(ship.longitude, 'E', 'W')}
            </div>
          </div>
        </div>
        <RowDual label="" left="Rng" right="1.49 nm" />
        <RowDual label="" left="Brg" right="271.6°" />

        <div className="my-1.5 min-h-[52px] border border-[#8c0000] bg-[#d00000] px-1.5 py-1 font-bold text-[#ffe7e7]">
          Track Control Stopped
        </div>
      </div>

      <div className="grid grid-cols-3 border-t-2 border-[#1739c9]">
        <button className={footerButtonClass} type="button">
          Select Query Feature
        </button>
        <button className={footerButtonClass} type="button">
          Action 2
        </button>
        <button className={footerButtonClass} type="button">
          Context Menu
        </button>
      </div>
    </aside>
  );
};
