import React from 'react';

export interface PropellerData {
  azimuth: number;
  pitch: number;
  rpm: number;
  side: 'port' | 'starboard';
}

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

export interface ConningDisplayProps {
  data: ConningDisplayData;
}

const panelClass =
  'flex items-center justify-center rounded-lg border border-[#1f3b5b] bg-[#13263d]';
const circularGaugeClass =
  'flex h-20 w-20 items-center justify-center rounded-full border-2';
const valueMonoClass = 'font-mono';

export const ConningDisplay: React.FC<ConningDisplayProps> = ({ data }) => {
  const portPitch = data.propellers[0]?.pitch ?? 0;
  const starboardPitch = data.propellers[1]?.pitch ?? 0;

  return (
    <div className="grid min-h-[600px] min-w-[800px] w-full grid-cols-4 grid-rows-4 gap-2 rounded-xl bg-[linear-gradient(135deg,#0b1627_0%,#0d2238_55%,#0b1f36_100%)] p-4 text-[#e7edf6]">
      <div className={`${panelClass} col-[1/2] row-[1/2] flex-col`}>
        <div className="mb-1 text-xs">Azim-th</div>
        <div className="flex h-24 w-24 items-center justify-center">
          <div className={`${circularGaugeClass} border-[#c3a76b]`}>
            <span className="text-[32px] text-[#c3a76b]">
              {data.propellers[0]?.azimuth ?? 0}°
            </span>
          </div>
        </div>
      </div>

      <div className={`${panelClass} col-[2/4] row-[1/2] flex-col px-6`}>
        <div className="mb-1 flex w-full justify-between text-xs">
          <span>Date and Time/UTC</span>
          <span className={`${valueMonoClass} text-[#1b9aaa]`}>
            {data.date}
          </span>
        </div>
        <div className="mb-1 flex w-full justify-between text-xs">
          <span>Time</span>
          <span className={`${valueMonoClass} text-[#1b9aaa]`}>
            {data.time}
          </span>
        </div>
        <div className="mb-1 flex w-full justify-between text-xs">
          <span>Position</span>
        </div>
        <div className="mb-1 flex w-full justify-between text-xs">
          <span>Latitude</span>
          <span className={`${valueMonoClass} text-[#c3a76b]`}>
            {data.latitude.toFixed(5)}
          </span>
        </div>
        <div className="flex w-full justify-between text-xs">
          <span>Longitude</span>
          <span className={`${valueMonoClass} text-[#c3a76b]`}>
            {data.longitude.toFixed(5)}
          </span>
        </div>
      </div>

      <div className={`${panelClass} col-[4/5] row-[1/2] flex-col`}>
        <div className="mb-1 text-xs">Wind Direction</div>
        <div className="flex h-24 w-24 items-center justify-center">
          <div className={`${circularGaugeClass} border-[#c3a76b]`}>
            <span className="text-2xl text-[#c3a76b]">
              {data.windDirection}°
            </span>
          </div>
        </div>
        <div className="mt-1 text-xs">Speed: {data.windSpeed} kn</div>
      </div>

      <div className={`${panelClass} col-[1/2] row-[2/3] flex-col`}>
        <div className="mb-1 text-xs">Pitch And Roll</div>
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="text-xs">PITCH</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#7fc5d8]">
              <span className="text-lg">{data.pitch}°</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs">ROLL</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#2fbf71]">
              <span className="text-lg">{data.roll}°</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`${panelClass} col-[2/4] row-[2/3] flex-col`}>
        <div className="mb-1 text-xs">Heading</div>
        <div className="flex w-full items-center justify-center">
          <div className="flex h-16 w-64 items-center justify-center rounded-lg bg-[#0b1627]">
            <span className="text-2xl text-[#c3a76b]">🧭 {data.heading}°</span>
          </div>
        </div>
      </div>

      <div className={`${panelClass} col-[1/2] row-[3/5] flex-col`}>
        <div className="mb-1 text-xs">Doppler Log</div>
        <div className="flex h-32 w-32 items-center justify-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#c3a76b]">
            <div className="flex flex-col items-center leading-none text-[#c3a76b]">
              <span className="text-[30px] tabular-nums">
                {data.dopplerLog.toFixed(1)}
              </span>
              <span className="text-xs tracking-[1px]">KN</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`${panelClass} col-[2/3] row-[3/4] flex-col`}>
        <div className="mb-1 text-xs">DualDialMeter</div>
        <div className="flex gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#e05d5d]">
            <span className="text-base">{data.dials[0]}</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#2fbf71]">
            <span className="text-base">{data.dials[1]}</span>
          </div>
        </div>
      </div>

      <div className={`${panelClass} col-[3/4] row-[3/5] flex-col`}>
        <div className="mb-1 text-xs">Propeller Pitch</div>
        <div className="flex gap-2">
          <div className="flex flex-col items-center">
            <span className="text-xs">Port</span>
            <div className="flex h-24 w-6 items-end justify-center rounded-lg bg-[#0b1627]">
              <div
                className="w-6 bg-[#c3a76b]"
                style={{ height: `${portPitch}%` }}
              />
            </div>
            <span className="text-xs">{portPitch}%</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs">Starboard</span>
            <div className="flex h-24 w-6 items-end justify-center rounded-lg bg-[#0b1627]">
              <div
                className="w-6 bg-[#c3a76b]"
                style={{ height: `${starboardPitch}%` }}
              />
            </div>
            <span className="text-xs">{starboardPitch}%</span>
          </div>
        </div>
      </div>

      <div className={`${panelClass} col-[2/4] row-[4/5] flex-col`}>
        <div className="mb-1 text-xs">Rate of Turn</div>
        <div className="flex w-full items-center justify-center">
          <div className="flex h-6 w-64 items-center rounded-lg bg-[#0b1627]">
            <div
              className="h-6 rounded-l-lg bg-[#2fbf71]"
              style={{ width: `${Math.abs(data.rateOfTurn)}%` }}
            />
            <div className="h-6 w-[10%] rounded-r-lg bg-[#c3a76b]" />
          </div>
        </div>
      </div>
    </div>
  );
};
