import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  EBL,
  GuardZone,
  RadarEnvironment,
  RadarSettings,
  RadarTarget,
  VRM,
  AISTarget,
} from './types';
import type { ARPASettings, ARPATarget, OwnShipData } from './arpa';
import { DEFAULT_ARPA_SETTINGS, processRadarTargets } from './arpa';
import { renderRadarFrame } from './render';
import { RadarView } from './RadarView';
import { RadarControlsPanel } from './RadarControlsPanel';
import { createRadarControlHandlers } from './controlHandlers';

interface RadarDisplayProps {
  size?: number;
  initialSettings?: Partial<RadarSettings>;
  initialTargets?: RadarTarget[];
  environment?: RadarEnvironment;
  liveTargets?: RadarTarget[];
  onSettingsChange?: (settings: RadarSettings) => void;
  ebl?: EBL;
  onEblChange?: (ebl: EBL) => void;
  vrm?: VRM;
  onVrmChange?: (vrm: VRM) => void;
  guardZone?: GuardZone;
  onGuardZoneChange?: (guardZone: GuardZone) => void;
  arpaSettings?: ARPASettings;
  onArpaSettingsChange?: (settings: ARPASettings) => void;
  arpaEnabled?: boolean;
  onArpaEnabledChange?: (enabled: boolean) => void;
  arpaTargets?: ARPATarget[];
  onArpaTargetsChange?: (targets: ARPATarget[]) => void;
  className?: string;
  layout?: 'stacked' | 'side';
  ownShipData?: OwnShipData;
  /**
   * List of AIS targets to display on the radar.
   */
  aisTargets?: AISTarget[];
}

const DEFAULT_SETTINGS: RadarSettings = {
  band: 'X',
  range: 6,
  gain: 70,
  seaClutter: 50,
  rainClutter: 50,
  heading: 0,
  orientation: 'head-up',
  trails: true,
  trailDuration: 30,
  nightMode: false,
};

const DEFAULT_ENVIRONMENT: RadarEnvironment = {
  seaState: 3,
  rainIntensity: 2,
  visibility: 8,
};

const DEFAULT_OWN_SHIP: OwnShipData = {
  position: { lat: 0, lon: 0 },
  course: 0,
  speed: 0,
  heading: 0,
};

const DEFAULT_EBL: EBL = { active: false, angle: 0 };
const DEFAULT_VRM: VRM = { active: false, distance: 0 };
const DEFAULT_GUARD_ZONE: GuardZone = {
  active: false,
  startAngle: 320,
  endAngle: 40,
  innerRange: 0.5,
  outerRange: 3,
};

export default function RadarDisplay({
  size = 500,
  initialSettings,
  initialTargets = [],
  environment = DEFAULT_ENVIRONMENT,
  liveTargets = [],
  onSettingsChange,
  ebl,
  onEblChange,
  vrm,
  onVrmChange,
  guardZone,
  onGuardZoneChange,
  arpaSettings,
  onArpaSettingsChange,
  arpaEnabled,
  onArpaEnabledChange,
  arpaTargets,
  onArpaTargetsChange,
  className = '',
  layout = 'stacked',
  ownShipData = DEFAULT_OWN_SHIP,
  aisTargets = [],
}: RadarDisplayProps) {
  const [settings, setSettings] = useState<RadarSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  const [internalEbl, setInternalEbl] = useState<EBL>(DEFAULT_EBL);
  const [internalVrm, setInternalVrm] = useState<VRM>(DEFAULT_VRM);
  const [internalGuardZone, setInternalGuardZone] =
    useState<GuardZone>(DEFAULT_GUARD_ZONE);
  const [internalArpaSettings, setInternalArpaSettings] =
    useState<ARPASettings>(DEFAULT_ARPA_SETTINGS);
  const [internalArpaEnabled, setInternalArpaEnabled] = useState(false);
  const [internalArpaTargets, setInternalArpaTargets] = useState<ARPATarget[]>(
    [],
  );
  const mergedTargets = useMemo(() => {
    const merged = new Map<string, RadarTarget>();
    [...liveTargets, ...initialTargets].forEach(target => {
      merged.set(target.id, target);
    });
    return Array.from(merged.values());
  }, [liveTargets, initialTargets]);
  const eblState = ebl ?? internalEbl;
  const vrmState = vrm ?? internalVrm;
  const guardZoneState = guardZone ?? internalGuardZone;
  const arpaSettingsState = arpaSettings ?? internalArpaSettings;
  const arpaEnabledState = arpaEnabled ?? internalArpaEnabled;
  const arpaTargetsState = arpaTargets ?? internalArpaTargets;
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const radarSweepRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sweepAngleRef = useRef(0);

  const settingsRef = useRef(settings);
  const environmentRef = useRef(environment);
  const targetsRef = useRef(mergedTargets);
  const arpaSettingsRef = useRef(arpaSettingsState);
  const arpaTargetsRef = useRef(arpaTargetsState);
  const ownShipRef = useRef(ownShipData);
  const eblRef = useRef(eblState);
  const vrmRef = useRef(vrmState);
  const guardZoneRef = useRef(guardZoneState);
  const arpaEnabledRef = useRef(arpaEnabledState);
  const aisTargetsRef = useRef(aisTargets);
  const updateArpaTargets = (
    updater: ARPATarget[] | ((prev: ARPATarget[]) => ARPATarget[]),
  ) => {
    const next =
      typeof updater === 'function' ? updater(arpaTargetsRef.current) : updater;
    arpaTargetsRef.current = next;
    if (onArpaTargetsChange) {
      onArpaTargetsChange(next);
    } else {
      setInternalArpaTargets(next);
    }
  };

  useEffect(() => {
    settingsRef.current = settings;
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  }, [settings, onSettingsChange]);

  useEffect(() => {
    environmentRef.current = environment;
  }, [environment]);

  useEffect(() => {
    targetsRef.current = mergedTargets;
  }, [mergedTargets]);

  useEffect(() => {
    arpaSettingsRef.current = arpaSettingsState;
  }, [arpaSettingsState]);

  useEffect(() => {
    arpaTargetsRef.current = arpaTargetsState;
  }, [arpaTargetsState]);

  useEffect(() => {
    ownShipRef.current = ownShipData;
  }, [ownShipData]);

  useEffect(() => {
    eblRef.current = eblState;
  }, [eblState]);

  useEffect(() => {
    vrmRef.current = vrmState;
  }, [vrmState]);

  useEffect(() => {
    guardZoneRef.current = guardZoneState;
  }, [guardZoneState]);

  useEffect(() => {
    arpaEnabledRef.current = arpaEnabledState;
  }, [arpaEnabledState]);

  useEffect(() => {
    aisTargetsRef.current = aisTargets;
  }, [aisTargets]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = size;
    canvas.height = size;

    const animateRadar = () => {
      const nextSweepAngle = (sweepAngleRef.current + 1) % 360;
      sweepAngleRef.current = nextSweepAngle;
      if (radarSweepRef.current) {
        radarSweepRef.current.style.transform = `translateY(-50%) rotate(${nextSweepAngle}deg)`;
      }
      drawRadar(nextSweepAngle);
      animationFrameRef.current = requestAnimationFrame(animateRadar);
    };

    animationFrameRef.current = requestAnimationFrame(animateRadar);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [size]);

  useEffect(() => {
    if (!arpaEnabledState) return;

    const intervalId = setInterval(() => {
      const updatedArpaTargets = processRadarTargets(
        targetsRef.current,
        arpaTargetsRef.current,
        arpaSettingsRef.current,
        ownShipRef.current,
      );

      updateArpaTargets(updatedArpaTargets);

      if (selectedTargetId) {
        const targetExists = updatedArpaTargets.some(
          t => t.id === selectedTargetId,
        );
        if (!targetExists) {
          setSelectedTargetId(null);
        }
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [arpaEnabledState, selectedTargetId]);

  const drawRadar = (sweepAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currSettings = settingsRef.current;
    const currEnvironment = environmentRef.current;
    const currTargets = targetsRef.current;
    const currArpaSettings = arpaSettingsRef.current;
    const currArpaTargets = arpaTargetsRef.current;
    const currEbl = eblRef.current;
    const currVrm = vrmRef.current;
    const currGuardZone = guardZoneRef.current;
    const currArpaEnabled = arpaEnabledRef.current;
    const currAisTargets = aisTargetsRef.current;

    renderRadarFrame(ctx, {
      size,
      sweepAngle,
      settings: currSettings,
      environment: currEnvironment,
      targets: currTargets,
      aisTargets: currAisTargets,
      arpaSettings: currArpaSettings,
      arpaTargets: currArpaTargets,
      arpaEnabled: currArpaEnabled,
      ownShip: ownShipRef.current,
      ebl: currEbl,
      vrm: currVrm,
      guardZone: currGuardZone,
    });
  };

  const {
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
  } = createRadarControlHandlers({
    settings,
    ebl: eblState,
    vrm: vrmState,
    guardZone: guardZoneState,
    arpaSettings: arpaSettingsState,
    arpaEnabled: arpaEnabledState,
    arpaTargets: arpaTargetsState,
    selectedTargetId,
    ownShipData,
    targetsRef,
    onEblChange,
    onVrmChange,
    onGuardZoneChange,
    onArpaSettingsChange,
    onArpaEnabledChange,
    setSettings,
    setInternalEbl,
    setInternalVrm,
    setInternalGuardZone,
    setInternalArpaSettings,
    setInternalArpaEnabled,
    updateArpaTargets,
    setSelectedTargetId,
  });
  const controlsPanelProps = {
    settings,
    onSettingChange: handleSettingChange,
    onRangeChange: handleRangeChange,
    ebl: eblState,
    vrm: vrmState,
    onEblToggle: handleEblToggle,
    onEblAngleChange: handleEblAngleChange,
    onVrmToggle: handleVrmToggle,
    onVrmDistanceChange: handleVrmDistanceChange,
    onToggleArpa: toggleArpaPanel,
    arpaEnabled: arpaEnabledState,
    guardZone: guardZoneState,
    onGuardZoneChange: handleGuardZoneChange,
    arpaTargets: arpaTargetsState,
    selectedTargetId,
    onSelectTarget: setSelectedTargetId,
    arpaSettings: arpaSettingsState,
    onArpaSettingChange: handleArpaSettingChange,
    onAcquireTarget: handleAcquireTarget,
    onCancelTarget: handleCancelTarget,
  };
  const radarView = (
    <RadarView
      size={size}
      nightMode={settings.nightMode}
      canvasRef={canvasRef}
      radarSweepRef={radarSweepRef}
    />
  );

  if (layout === 'side') {
    return (
      <div
        className={`grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] ${className}`}
      >
        <div className="flex justify-center lg:justify-start">{radarView}</div>
        <RadarControlsPanel {...controlsPanelProps} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {radarView}
      <div className="flex flex-col lg:flex-row gap-4 mt-4 w-full">
        <div className="flex-1">
          <RadarControlsPanel
            {...controlsPanelProps}
            arpaPanelClassName="w-full lg:w-72 lg:ml-4"
          />
        </div>
      </div>
    </div>
  );
}
