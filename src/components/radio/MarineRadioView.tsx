import React from 'react';
import { RotaryDial } from '../dials';
import type { RadioChannel } from './marineRadioState';

type MarineRadioViewProps = {
  width: number;
  height: number;
  disabled: boolean;
  powerOn: boolean;
  transmitting: boolean;
  distressActive: boolean;
  dscActive: boolean;
  scanActive: boolean;
  menuOpen: boolean;
  directEntryMode: boolean;
  highPower: boolean;
  signalBars: number;
  volume: number;
  squelch: number;
  channelDialValue: number;
  displayMessage: string;
  currentChannel: RadioChannel;
  currentTime: Date;
  showPosition: boolean;
  position?: { latitude: number; longitude: number };
  formatPosition: (coord: number, isLat: boolean) => string;
  onPowerToggle: () => void;
  onDistress: () => void;
  onDsc: () => void;
  onChannel16: () => void;
  onChannel9: () => void;
  onHiLoPower: () => void;
  onScan: () => void;
  onClear: () => void;
  onMenu: () => void;
  onMenuSelect: () => void;
  onTransmitPress: () => void;
  onTransmitRelease: () => void;
  onKeypadInput: (digit: number) => void;
  onVolumeChange: (value: number) => void;
  onSquelchChange: (value: number) => void;
  onChannelDialChange: (value: number) => void;
};

const buttonBase =
  'h-7 rounded border-0 px-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60';

export function MarineRadioView({
  width,
  height,
  disabled,
  powerOn,
  transmitting,
  distressActive,
  dscActive,
  scanActive,
  menuOpen,
  directEntryMode,
  highPower,
  signalBars,
  volume,
  squelch,
  channelDialValue,
  displayMessage,
  currentChannel,
  currentTime,
  showPosition,
  position,
  formatPosition,
  onPowerToggle,
  onDistress,
  onDsc,
  onChannel16,
  onChannel9,
  onHiLoPower,
  onScan,
  onClear,
  onMenu,
  onMenuSelect,
  onTransmitPress,
  onTransmitRelease,
  onKeypadInput,
  onVolumeChange,
  onSquelchChange,
  onChannelDialChange,
}: MarineRadioViewProps): React.ReactElement {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg bg-[#1a1a1a] p-3 shadow"
      style={{ width, minHeight: height }}
    >
      <div className="rounded bg-[#f7941d] p-3 font-mono text-black">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xl font-bold">
            {powerOn ? displayMessage : ''}
            {powerOn && currentChannel.isEmergency && !distressActive ? (
              <span className="rounded bg-red-600 px-1 text-xs text-white">
                EMERGENCY
              </span>
            ) : null}
            {powerOn && distressActive ? (
              <span className="rounded bg-red-600 px-1 text-xs text-white">
                DISTRESS ACTIVE
              </span>
            ) : null}
            {powerOn && !menuOpen && !directEntryMode && !distressActive ? (
              <span className="ml-2 text-sm">{highPower ? 'HI' : 'LO'}</span>
            ) : null}
          </div>
          <div className="flex h-8 items-end gap-1">
            {[1, 2, 3, 4, 5].map(bar => (
              <div
                key={`bar-${bar}`}
                className="w-1 rounded-sm"
                style={{
                  height: `${bar * 18}%`,
                  backgroundColor:
                    powerOn && bar <= signalBars ? '#000' : '#885000',
                }}
              />
            ))}
          </div>
        </div>

        {powerOn ? (
          <div className="mt-1 flex items-start justify-between text-sm">
            <div>
              {currentChannel.frequency.toFixed(3)} MHz
              <span className="ml-1 text-xs">{currentChannel.name}</span>
            </div>
            <div className="text-right text-xs leading-tight">
              {position && showPosition ? (
                <>
                  <div>{formatPosition(position.latitude, true)}</div>
                  <div>{formatPosition(position.longitude, false)}</div>
                </>
              ) : (
                currentTime.toTimeString().substring(0, 5)
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-[72px_1fr_72px] gap-3">
        <div className="flex flex-col items-center gap-2">
          <button
            onMouseDown={onTransmitPress}
            onMouseUp={onTransmitRelease}
            onMouseLeave={onTransmitRelease}
            onTouchStart={onTransmitPress}
            onTouchEnd={onTransmitRelease}
            disabled={!powerOn || disabled}
            className="flex h-24 w-full items-end justify-center rounded-md border-2 border-[#555] bg-[#333] pb-2 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            style={{ borderColor: transmitting ? '#f44' : '#555' }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[8px]"
              style={{ backgroundColor: transmitting ? '#f44' : '#444' }}
            >
              PTT
            </span>
          </button>
          <div className="text-[9px] text-[#aaa]">VOLUME</div>
          <RotaryDial
            value={volume}
            onChange={onVolumeChange}
            min={0}
            max={100}
            size={55}
            activeColor={powerOn ? '#22c55e' : '#4B5563'}
            disabled={!powerOn || disabled}
            showValue={false}
            numTicks={0}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-center gap-2">
            <button
              onClick={onDistress}
              disabled={!powerOn || disabled}
              className={`${buttonBase} w-[70px] bg-[#f44]`}
            >
              DISTRESS
            </button>
            <button
              onClick={onDsc}
              disabled={!powerOn || disabled || transmitting}
              className={`${buttonBase} w-[50px] ${dscActive ? 'bg-[#5bc0de]' : 'bg-[#1F2937]'}`}
            >
              DSC
            </button>
            <button
              onClick={onPowerToggle}
              disabled={disabled}
              className={`${buttonBase} w-[50px] ${powerOn ? 'bg-[#22c55e]' : 'bg-[#4B5563]'}`}
            >
              PWR
            </button>
          </div>

          <div className="flex justify-center gap-2">
            <button
              onClick={onChannel16}
              onDoubleClick={onChannel9}
              disabled={!powerOn || disabled || transmitting}
              className={`${buttonBase} w-[50px] ${currentChannel.number === 16 || currentChannel.number === 9 ? 'bg-[#22c55e]' : 'bg-[#1F2937]'}`}
            >
              16/9
            </button>
            <button
              onClick={onHiLoPower}
              disabled={!powerOn || disabled || transmitting}
              className={`${buttonBase} w-[50px] ${!highPower ? 'bg-[#5bc0de]' : 'bg-[#1F2937]'}`}
            >
              HI/LO
            </button>
            <button
              onClick={onScan}
              disabled={
                !powerOn ||
                disabled ||
                transmitting ||
                directEntryMode ||
                menuOpen
              }
              className={`${buttonBase} w-[50px] ${scanActive ? 'bg-[#5bc0de]' : 'bg-[#1F2937]'}`}
            >
              SCAN
            </button>
          </div>

          <div className="flex justify-center gap-2">
            <button
              onClick={onClear}
              disabled={!powerOn || disabled}
              className={`${buttonBase} w-[50px] bg-[#1F2937]`}
            >
              CLEAR
            </button>
            <button
              onClick={onMenu}
              onDoubleClick={onMenuSelect}
              disabled={!powerOn || disabled || transmitting}
              className={`${buttonBase} w-[50px] ${menuOpen ? 'bg-[#5bc0de]' : 'bg-[#1F2937]'}`}
            >
              MENU
            </button>
          </div>

          <div className="mx-auto mt-auto grid w-[90%] grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
              <button
                key={`digit-${digit}`}
                onClick={() => onKeypadInput(digit)}
                disabled={!powerOn || disabled || transmitting}
                className={`${buttonBase} h-[22px] rounded-[3px] bg-[#1F2937] p-0 text-[10px]`}
              >
                {digit}
              </button>
            ))}
            <div className="col-span-3">
              <button
                onClick={() => onKeypadInput(0)}
                disabled={!powerOn || disabled || transmitting}
                className={`${buttonBase} h-[22px] w-full rounded-[3px] bg-[#1F2937] p-0 text-[10px]`}
              >
                0
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="text-[9px] text-[#aaa]">SQUELCH</div>
          <RotaryDial
            value={squelch}
            onChange={onSquelchChange}
            min={0}
            max={100}
            size={55}
            activeColor={powerOn ? '#22c55e' : '#4B5563'}
            disabled={!powerOn || disabled}
            showValue={false}
            numTicks={0}
          />

          <div className="mt-auto text-[9px] text-[#aaa]">SELECT</div>
          <RotaryDial
            value={channelDialValue}
            onChange={onChannelDialChange}
            min={0}
            max={100}
            size={70}
            activeColor={powerOn ? '#22c55e' : '#4B5563'}
            disabled={!powerOn || disabled || transmitting || distressActive}
            showValue={false}
            numTicks={0}
          />
        </div>
      </div>
    </div>
  );
}
