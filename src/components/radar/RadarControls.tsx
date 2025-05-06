import React from 'react';
import { EBL, RadarSettings, VRM } from './types';
import { PushButton } from '../PushButton';
import { ChangeoverSwitch } from '../switches';
import { RotaryDial } from '../dials';

interface RadarControlsProps {
  settings: RadarSettings;
  onSettingChange: (setting: keyof RadarSettings, value: any) => void;
  onRangeChange: (direction: 'increase' | 'decrease') => void;
  ebl: EBL;
  vrm: VRM;
  onEblToggle: () => void;
  onEblAngleChange: (angle: number) => void;
  onVrmToggle: () => void;
  onVrmDistanceChange: (distance: number) => void;
  onAddTarget?: () => void; // Optional for testing purposes
  onToggleArpa?: () => void; // New prop for ARPA toggle
  arpaEnabled?: boolean; // New prop to show ARPA status
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
  onAddTarget,
  onToggleArpa,
  arpaEnabled = false,
}: RadarControlsProps) {
  return (
    <div className="mt-4 bg-gray-900 p-4 rounded-lg text-gray-100">
      <div className="grid grid-cols-3 gap-4">
        {/* Band and Range Controls */}
        <div className="space-y-4">
          <h3 className="font-semibold text-center border-b border-gray-700 pb-1">
            Radar Settings
          </h3>

          <div className="flex justify-center space-x-4">
            {/* Band Selection */}
            <div className="flex flex-col items-center">
              <span className="text-sm mb-1">Band</span>
              <ChangeoverSwitch
                position={settings.band}
                onPositionChange={band => onSettingChange('band', band)}
                positions={[
                  { value: 'X', label: 'X' },
                  { value: 'S', label: 'S' },
                ]}
                size={60}
              />
            </div>

            {/* Range Controls */}
            <div className="flex flex-col items-center">
              <span className="text-sm mb-1">Range: {settings.range} NM</span>
              <div className="flex space-x-1">
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
            <span className="text-sm mb-1">Orientation</span>
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
              size={80}
            />
          </div>

          {/* Night Mode Toggle */}
          <div className="flex justify-center space-x-2 mt-2">
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
              <span className="ml-2 text-sm font-medium">Night Mode</span>
            </label>
          </div>
        </div>

        {/* Gain and Clutter Controls */}
        <div className="space-y-4">
          <h3 className="font-semibold text-center border-b border-gray-700 pb-1">
            Signal Processing
          </h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <RotaryDial
                value={settings.gain}
                onChange={value => onSettingChange('gain', value)}
                min={0}
                max={100}
                label="Gain"
                unit="%"
                size={80}
              />
            </div>

            <div className="flex justify-center space-x-4">
              <div>
                <RotaryDial
                  value={settings.seaClutter}
                  onChange={value => onSettingChange('seaClutter', value)}
                  min={0}
                  max={100}
                  label="Sea"
                  unit="%"
                  size={70}
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
                  size={70}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Electronic Bearing Line & Variable Range Marker */}
        <div className="space-y-4">
          <h3 className="font-semibold text-center border-b border-gray-700 pb-1">
            Measurement Tools
          </h3>

          <div className="flex flex-col space-y-4">
            {/* EBL Controls */}
            <div className="flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-2">
                <span className="text-sm">EBL: {ebl.angle.toFixed(1)}°</span>
                <div className="inline-flex items-center">
                  <span className="mr-2 text-xs">Off/On</span>
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
                <span className="text-sm">
                  VRM: {vrm.distance.toFixed(1)} NM
                </span>
                <div className="inline-flex items-center">
                  <span className="mr-2 text-xs">Off/On</span>
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

            {/* ARPA Toggle */}
            {onToggleArpa && (
              <div className="flex justify-between items-center w-full pt-2 border-t border-gray-700">
                <span className="text-sm">ARPA Mode</span>
                <PushButton
                  label={arpaEnabled ? 'Disable ARPA' : 'Enable ARPA'}
                  onClick={onToggleArpa}
                  color={arpaEnabled ? 'secondary' : 'primary'}
                  size="small"
                />
              </div>
            )}

            {/* Test Controls (only for development) */}
            {onAddTarget && (
              <div className="pt-4 border-t border-gray-700">
                <PushButton
                  label="Add Random Target"
                  onClick={onAddTarget}
                  color="secondary"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
