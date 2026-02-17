import React from 'react';

import { RotaryDial } from '../dials';
import { PushButton } from '../PushButton';
import { ChangeoverSwitch } from '../switches';

import type { EBL, RadarSettings, VRM, GuardZone } from './types';

interface RadarControlsProps {
  settings: RadarSettings;
  onSettingChange: (
    setting: keyof RadarSettings,
    value: boolean | number | string,
  ) => void;
  onRangeChange: (direction: 'increase' | 'decrease') => void;
  ebl: EBL;
  vrm: VRM;
  onEblToggle: () => void;
  onEblAngleChange: (angle: number) => void;
  onVrmToggle: () => void;
  onVrmDistanceChange: (distance: number) => void;
  onToggleArpa?: () => void; // New prop for ARPA toggle
  arpaEnabled?: boolean; // New prop to show ARPA status
  guardZone?: GuardZone;
  onGuardZoneChange?: (field: keyof GuardZone, value: number | boolean) => void;
}

export default function RadarControls({
  settings,
  onSettingChange,
  onRangeChange,
  ebl,
  vrm,
  onEblToggle,
  onEblAngleChange,
  onVrmToggle,
  onVrmDistanceChange,
  onToggleArpa,
  arpaEnabled = false,
  guardZone,
  onGuardZoneChange,
}: RadarControlsProps) {
  return (
    <div className="mt-3 bg-gray-900/90 p-3 rounded-lg text-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {/* Band and Range Controls */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-center border-b border-gray-700 pb-1 uppercase tracking-[0.18em] text-gray-300">
            Radar Settings
          </h3>

          <div className="flex justify-center gap-3">
            {/* Band Selection */}
            <div className="flex flex-col items-center">
              <span className="text-xs mb-1 text-gray-300">Band</span>
              <ChangeoverSwitch
                position={settings.band}
                onPositionChange={band => onSettingChange('band', band)}
                positions={[
                  { value: 'X', label: 'X' },
                  { value: 'S', label: 'S' },
                ]}
                size={52}
              />
            </div>

            {/* Range Controls */}
            <div className="flex flex-col items-center">
              <span className="text-xs mb-1 text-gray-300">
                Range {settings.range} NM
              </span>
              <div className="flex gap-1">
                <PushButton
                  label="−"
                  onClick={() => onRangeChange('decrease')}
                  color="secondary"
                  size="small"
                />
                <PushButton
                  label="+"
                  onClick={() => onRangeChange('increase')}
                  color="secondary"
                  size="small"
                />
              </div>
            </div>
          </div>

          {/* Orientation Control */}
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1 text-gray-300">Orientation</span>
            <ChangeoverSwitch
              position={settings.orientation}
              onPositionChange={orientation =>
                onSettingChange('orientation', orientation)
              }
              positions={[
                { value: 'north-up', label: 'N-UP' },
                { value: 'head-up', label: 'H-UP' },
                { value: 'course-up', label: 'C-UP' },
              ]}
              size={68}
            />
          </div>

          {/* Night Mode Toggle */}
          <div className="flex justify-center gap-2 mt-1.5">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.nightMode}
                onChange={e => onSettingChange('nightMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-blue-600">
                <div className="absolute top-[2px] left-[2px] bg-white w-5 h-5 rounded-full transition-all peer-checked:translate-x-full"></div>
              </div>
              <span className="ml-2 text-xs font-medium text-gray-300">
                Night Mode
              </span>
            </label>
          </div>
        </div>

        {/* Gain and Clutter Controls */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-center border-b border-gray-700 pb-1 uppercase tracking-[0.18em] text-gray-300">
            Signal Processing
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <RotaryDial
                value={settings.gain}
                onChange={value => onSettingChange('gain', value)}
                min={0}
                max={100}
                label="Gain"
                unit="%"
                size={68}
              />
            </div>

            <div className="flex justify-center gap-3">
              <div>
                <RotaryDial
                  value={settings.seaClutter}
                  onChange={value => onSettingChange('seaClutter', value)}
                  min={0}
                  max={100}
                  label="Sea"
                  unit="%"
                  size={58}
                />
              </div>

              <div>
                <RotaryDial
                  value={settings.rainClutter}
                  onChange={value => onSettingChange('rainClutter', value)}
                  min={0}
                  max={100}
                  label="Rain"
                  unit="%"
                  size={58}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Electronic Bearing Line & Variable Range Marker */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-center border-b border-gray-700 pb-1 uppercase tracking-[0.18em] text-gray-300">
            Measurement Tools
          </h3>

          <div className="flex flex-col space-y-4">
            {/* EBL Controls */}
            <div className="flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-2">
                <span className="text-xs text-gray-300">
                  EBL {ebl.angle.toFixed(1)}°
                </span>
                <div className="inline-flex items-center">
                  <span className="mr-2 text-[10px] text-gray-400">Off/On</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ebl.active}
                      onChange={onEblToggle}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-amber-500"></div>
                    <div className="absolute top-[2px] left-[2px] bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-4"></div>
                  </label>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={359}
                step={0.5}
                value={ebl.angle}
                onChange={e => onEblAngleChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                disabled={!ebl.active}
              />
            </div>

            {/* VRM Controls */}
            <div className="flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-2">
                <span className="text-xs text-gray-300">
                  VRM {vrm.distance.toFixed(1)} NM
                </span>
                <div className="inline-flex items-center">
                  <span className="mr-2 text-[10px] text-gray-400">Off/On</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vrm.active}
                      onChange={onVrmToggle}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-amber-500"></div>
                    <div className="absolute top-[2px] left-[2px] bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-4"></div>
                  </label>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={settings.range}
                step={0.1}
                value={vrm.distance}
                onChange={e => onVrmDistanceChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                disabled={!vrm.active}
              />
            </div>

            {/* Guard Zone Controls */}
            {guardZone && onGuardZoneChange && (
              <div className="mt-4 p-2.5 bg-gray-800/70 rounded-lg">
                <h4 className="font-semibold text-xs mb-2 text-gray-300">
                  Guard Zone
                </h4>
                <div className="flex items-center mb-2 gap-2">
                  <label className="text-[10px] text-gray-400">On</label>
                  <input
                    type="checkbox"
                    checked={guardZone.active}
                    onChange={e =>
                      onGuardZoneChange('active', e.target.checked)
                    }
                    className="mr-1"
                  />
                  <label className="text-[10px] text-gray-400">Start</label>
                  <input
                    type="number"
                    min={0}
                    max={359}
                    value={guardZone.startAngle}
                    onChange={e =>
                      onGuardZoneChange('startAngle', Number(e.target.value))
                    }
                    className="w-12 text-black rounded px-1"
                  />
                  <label className="text-[10px] text-gray-400">End</label>
                  <input
                    type="number"
                    min={0}
                    max={359}
                    value={guardZone.endAngle}
                    onChange={e =>
                      onGuardZoneChange('endAngle', Number(e.target.value))
                    }
                    className="w-12 text-black rounded px-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-400">Inner</label>
                  <input
                    type="number"
                    min={0}
                    max={guardZone.outerRange}
                    step={0.1}
                    value={guardZone.innerRange}
                    onChange={e =>
                      onGuardZoneChange('innerRange', Number(e.target.value))
                    }
                    className="w-14 text-black rounded px-1"
                  />
                  <label className="text-[10px] text-gray-400">Outer</label>
                  <input
                    type="number"
                    min={guardZone.innerRange}
                    max={24}
                    step={0.1}
                    value={guardZone.outerRange}
                    onChange={e =>
                      onGuardZoneChange('outerRange', Number(e.target.value))
                    }
                    className="w-14 text-black rounded px-1"
                  />
                </div>
              </div>
            )}

            {/* ARPA Toggle */}
            {onToggleArpa && (
              <div className="flex justify-between items-center w-full pt-2 border-t border-gray-700">
                <span className="text-xs text-gray-300">ARPA Mode</span>
                <PushButton
                  label={arpaEnabled ? 'Disable ARPA' : 'Enable ARPA'}
                  onClick={onToggleArpa}
                  color={arpaEnabled ? 'secondary' : 'primary'}
                  size="small"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
