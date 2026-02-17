import { convertToARPATarget } from './arpa';

import type { ARPASettings, ARPATarget, OwnShipData } from './arpa';
import type {
  EBL,
  GuardZone,
  RadarBand,
  RadarSettings,
  RadarTarget,
  VRM,
} from './types';
import type { Dispatch, RefObject, SetStateAction } from 'react';

const RANGE_OPTIONS = [0.5, 1.5, 3, 6, 12, 24, 48];

type ControlHandlerDeps = {
  settings: RadarSettings;
  ebl: EBL;
  vrm: VRM;
  guardZone: GuardZone;
  arpaSettings: ARPASettings;
  arpaEnabled: boolean;
  arpaTargets: ARPATarget[];
  selectedTargetId: string | null;
  ownShipData: OwnShipData;
  targetsRef: RefObject<RadarTarget[]>;
  onEblChange?: (ebl: EBL) => void;
  onVrmChange?: (vrm: VRM) => void;
  onGuardZoneChange?: (guardZone: GuardZone) => void;
  onArpaSettingsChange?: (settings: ARPASettings) => void;
  onArpaEnabledChange?: (enabled: boolean) => void;
  setSettings: Dispatch<SetStateAction<RadarSettings>>;
  setInternalEbl: Dispatch<SetStateAction<EBL>>;
  setInternalVrm: Dispatch<SetStateAction<VRM>>;
  setInternalGuardZone: Dispatch<SetStateAction<GuardZone>>;
  setInternalArpaSettings: Dispatch<SetStateAction<ARPASettings>>;
  setInternalArpaEnabled: Dispatch<SetStateAction<boolean>>;
  updateArpaTargets: (
    updater: ARPATarget[] | ((prev: ARPATarget[]) => ARPATarget[]),
  ) => void;
  setSelectedTargetId: Dispatch<SetStateAction<string | null>>;
};

export function createRadarControlHandlers(deps: ControlHandlerDeps) {
  const handleRangeChange = (direction: 'increase' | 'decrease') => {
    deps.setSettings(previous => {
      const currentIndex = RANGE_OPTIONS.indexOf(previous.range);
      let newIndex = currentIndex;

      if (direction === 'increase' && currentIndex < RANGE_OPTIONS.length - 1) {
        newIndex = currentIndex + 1;
      } else if (direction === 'decrease' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      }

      return { ...previous, range: RANGE_OPTIONS[newIndex] };
    });
  };

  const handleSettingChange = (
    setting: keyof RadarSettings,
    value: number | boolean | string | RadarBand,
  ) => {
    deps.setSettings(previous => ({ ...previous, [setting]: value }));
  };

  const handleEblToggle = () => {
    const next = { ...deps.ebl, active: !deps.ebl.active };
    if (deps.onEblChange) {
      deps.onEblChange(next);
    } else {
      deps.setInternalEbl(next);
    }
  };

  const handleEblAngleChange = (angle: number) => {
    const next = { ...deps.ebl, angle };
    if (deps.onEblChange) {
      deps.onEblChange(next);
    } else {
      deps.setInternalEbl(next);
    }
  };

  const handleVrmToggle = () => {
    const nextActive = !deps.vrm.active;
    const nextDistance =
      nextActive && deps.vrm.distance === 0
        ? Math.max(0.1, deps.settings.range * 0.25)
        : deps.vrm.distance;
    const next = { ...deps.vrm, active: nextActive, distance: nextDistance };
    if (deps.onVrmChange) {
      deps.onVrmChange(next);
    } else {
      deps.setInternalVrm(next);
    }
  };

  const handleVrmDistanceChange = (distance: number) => {
    const next = {
      ...deps.vrm,
      distance: Math.min(distance, deps.settings.range),
    };
    if (deps.onVrmChange) {
      deps.onVrmChange(next);
    } else {
      deps.setInternalVrm(next);
    }
  };

  const handleGuardZoneChange = (
    field: keyof GuardZone,
    value: number | boolean,
  ) => {
    const next = { ...deps.guardZone, [field]: value };
    if (deps.onGuardZoneChange) {
      deps.onGuardZoneChange(next);
    } else {
      deps.setInternalGuardZone(next);
    }
  };

  const handleArpaSettingChange = (
    setting: keyof ARPASettings,
    value: boolean | number,
  ) => {
    const next = { ...deps.arpaSettings, [setting]: value };
    if (deps.onArpaSettingsChange) {
      deps.onArpaSettingsChange(next);
    } else {
      deps.setInternalArpaSettings(next);
    }
  };

  const handleAcquireTarget = () => {
    const untracked = deps.targetsRef.current.filter(
      target =>
        !deps.arpaTargets.some(arpa => arpa.id === target.id) &&
        target.type !== 'land' &&
        target.distance <= deps.arpaSettings.autoAcquisitionRange,
    );

    if (untracked.length === 0) return;
    const closestTarget = [...untracked].sort(
      (a, b) => a.distance - b.distance,
    )[0];
    const newArpaTarget = convertToARPATarget(closestTarget, deps.ownShipData);
    deps.updateArpaTargets(previous => [...previous, newArpaTarget]);
    deps.setSelectedTargetId(closestTarget.id);
  };

  const handleCancelTarget = (targetId: string) => {
    deps.updateArpaTargets(previous => previous.filter(t => t.id !== targetId));
    if (deps.selectedTargetId === targetId) {
      deps.setSelectedTargetId(null);
    }
  };

  const toggleArpaPanel = () => {
    const next = !deps.arpaEnabled;
    if (deps.onArpaEnabledChange) {
      deps.onArpaEnabledChange(next);
    } else {
      deps.setInternalArpaEnabled(next);
    }
  };

  return {
    handleRangeChange,
    handleSettingChange,
    handleEblToggle,
    handleEblAngleChange,
    handleVrmToggle,
    handleVrmDistanceChange,
    handleGuardZoneChange,
    handleArpaSettingChange,
    handleAcquireTarget,
    handleCancelTarget,
    toggleArpaPanel,
  };
}
