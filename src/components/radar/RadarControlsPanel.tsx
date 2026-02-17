import React from 'react';

import ARPAPanel from './ARPAPanel';
import RadarControls from './RadarControls';

import type { ARPASettings, ARPATarget } from './arpa';
import type { GuardZone, RadarBand, RadarSettings, VRM, EBL } from './types';

type RadarControlsPanelProps = {
  settings: RadarSettings;
  onSettingChange: (
    setting: keyof RadarSettings,
    value: number | boolean | string | RadarBand,
  ) => void;
  onRangeChange: (direction: 'increase' | 'decrease') => void;
  ebl: EBL;
  vrm: VRM;
  onEblToggle: () => void;
  onEblAngleChange: (angle: number) => void;
  onVrmToggle: () => void;
  onVrmDistanceChange: (distance: number) => void;
  onToggleArpa: () => void;
  arpaEnabled: boolean;
  guardZone: GuardZone;
  onGuardZoneChange: (field: keyof GuardZone, value: number | boolean) => void;
  arpaTargets: ARPATarget[];
  selectedTargetId: string | null;
  onSelectTarget: (targetId: string | null) => void;
  arpaSettings: ARPASettings;
  onArpaSettingChange: (
    setting: keyof ARPASettings,
    value: boolean | number,
  ) => void;
  onAcquireTarget: () => void;
  onCancelTarget: (targetId: string) => void;
  arpaPanelClassName?: string;
};

export function RadarControlsPanel({
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
  arpaEnabled,
  guardZone,
  onGuardZoneChange,
  arpaTargets,
  selectedTargetId,
  onSelectTarget,
  arpaSettings,
  onArpaSettingChange,
  onAcquireTarget,
  onCancelTarget,
  arpaPanelClassName = 'w-full lg:w-72',
}: RadarControlsPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <RadarControls
        settings={settings}
        onSettingChange={onSettingChange}
        onRangeChange={onRangeChange}
        ebl={ebl}
        vrm={vrm}
        onEblToggle={onEblToggle}
        onEblAngleChange={onEblAngleChange}
        onVrmToggle={onVrmToggle}
        onVrmDistanceChange={onVrmDistanceChange}
        onToggleArpa={onToggleArpa}
        arpaEnabled={arpaEnabled}
        guardZone={guardZone}
        onGuardZoneChange={onGuardZoneChange}
      />
      {arpaEnabled ? (
        <div className={arpaPanelClassName}>
          <ARPAPanel
            arpaTargets={arpaTargets}
            selectedTargetId={selectedTargetId}
            onSelectTarget={onSelectTarget}
            arpaSettings={arpaSettings}
            onSettingChange={onArpaSettingChange}
            onAcquireTarget={onAcquireTarget}
            onCancelTarget={onCancelTarget}
          />
        </div>
      ) : null}
    </div>
  );
}
