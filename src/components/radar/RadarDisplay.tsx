import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  EBL,
  GuardZone,
  RadarBand,
  RadarEnvironment,
  RadarSettings,
  RadarTarget,
  VRM,
  AISTarget, // Import AISTarget from types
} from './types';
import {
  calculateTargetVisibility,
  generateNoisePattern,
  generateRadarNoise,
  getRainClutterStrength,
  getSeaClutterStrength,
  polarToCartesian,
} from './utils';
import RadarControls from './RadarControls';
import ARPAPanel from './ARPAPanel';
import {
  ARPASettings,
  ARPATarget,
  ARPATargetStatus,
  DEFAULT_ARPA_SETTINGS,
  OwnShipData,
  convertToARPATarget,
  getTargetStatus,
  getVectorEndpoint,
  processRadarTargets,
} from './arpa';

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

const RANGE_OPTIONS = [0.5, 1.5, 3, 6, 12, 24, 48];

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
  const [sweepAngle, setSweepAngle] = useState(0);
  const [isAnimating] = useState(true);

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
      setSweepAngle(prev => (prev + 1) % 360);
      drawRadar();

      if (isAnimating) {
        animationFrameRef.current = requestAnimationFrame(animateRadar);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateRadar);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [size, isAnimating]);

  useEffect(() => {
    if (radarSweepRef.current) {
      radarSweepRef.current.style.transform = `translateY(-50%) rotate(${sweepAngle}deg)`;
    }
  }, [sweepAngle]);

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

  const drawRadar = () => {
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

    const {
      band,
      range,
      gain,
      seaClutter,
      rainClutter,
      orientation,
      nightMode,
    } = currSettings;
    const radius = size / 2;

    ctx.fillStyle = nightMode
      ? 'rgba(0, 10, 20, 0.15)'
      : 'rgba(0, 20, 10, 0.15)';
    ctx.fillRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
    ctx.fillStyle = nightMode ? '#000B14' : '#001A14';
    ctx.fill();

    ctx.strokeStyle = nightMode ? '#113344' : '#114433';
    ctx.lineWidth = 1;

    const numRings = 5;
    for (let i = 1; i <= numRings; i++) {
      const ringRadius = (radius - 2) * (i / numRings);
      ctx.beginPath();
      ctx.arc(radius, radius, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      if (i < numRings) {
        const ringRange = ((range * i) / numRings).toFixed(1);
        ctx.fillStyle = nightMode ? '#335566' : '#336655';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${ringRange}`, radius, radius - ringRadius + 12);
      }
    }

    let rotationAngle = 0;
    if (orientation === 'head-up') {
      rotationAngle = ownShipRef.current.heading ?? 0;
    } else if (orientation === 'course-up') {
      rotationAngle = ownShipRef.current.course ?? 0;
    }

    if (currEbl.active) {
      const angleRad =
        ((currEbl.angle - rotationAngle + 360) % 360) * (Math.PI / 180);

      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.lineTo(
        radius + Math.sin(angleRad) * (radius - 2),
        radius - Math.cos(angleRad) * (radius - 2),
      );
      ctx.strokeStyle = nightMode ? '#FFAA33' : '#FFAA33';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = nightMode ? '#FFAA33' : '#FFAA33';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`EBL: ${currEbl.angle.toFixed(1)}°`, 10, size - 10);
    }

    if (currVrm.active) {
      const vrmRadius = (currVrm.distance / range) * (radius - 2);

      ctx.beginPath();
      ctx.arc(radius, radius, vrmRadius, 0, Math.PI * 2);
      ctx.strokeStyle = nightMode ? '#FFAA33' : '#FFAA33';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = nightMode ? '#FFAA33' : '#FFAA33';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`VRM: ${currVrm.distance.toFixed(1)} NM`, 10, 10);
    }

    if (currGuardZone.active) {
      const innerRadius = (currGuardZone.innerRange / range) * (radius - 2);
      const outerRadius = (currGuardZone.outerRange / range) * (radius - 2);
      const startAngle =
        ((currGuardZone.startAngle - rotationAngle + 360) % 360) *
        (Math.PI / 180);
      const endAngle =
        ((currGuardZone.endAngle - rotationAngle + 360) % 360) *
        (Math.PI / 180);

      ctx.beginPath();
      ctx.arc(radius, radius, outerRadius, startAngle, endAngle);
      ctx.lineTo(
        radius + Math.cos(endAngle) * innerRadius,
        radius + Math.sin(endAngle) * innerRadius,
      );
      ctx.arc(radius, radius, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = nightMode
        ? 'rgba(255, 0, 0, 0.15)'
        : 'rgba(255, 0, 0, 0.15)';
      ctx.fill();

      ctx.strokeStyle = nightMode
        ? 'rgba(255, 0, 0, 0.5)'
        : 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const noiseLevel = generateRadarNoise(band, currEnvironment, gain);
    const noisePattern = generateNoisePattern(size, size, noiseLevel);

    ctx.globalAlpha = 0.2;
    ctx.putImageData(noisePattern, 0, 0);
    ctx.globalAlpha = 1.0;

    const isTargetInGuardZone = (target: RadarTarget): boolean => {
      if (!currGuardZone.active) return false;
      let start = currGuardZone.startAngle % 360;
      let end = currGuardZone.endAngle % 360;
      let bearing = target.bearing % 360;
      if (start < 0) start += 360;
      if (end < 0) end += 360;
      if (bearing < 0) bearing += 360;
      const inAngle =
        start < end
          ? bearing >= start && bearing <= end
          : bearing >= start || bearing <= end;
      const inRange =
        target.distance >= currGuardZone.innerRange &&
        target.distance <= currGuardZone.outerRange;
      return inAngle && inRange;
    };

    currTargets.forEach(target => {
      if (target.distance > range) return;

      const visibility = calculateTargetVisibility(
        target,
        band,
        gain,
        seaClutter,
        rainClutter,
        currEnvironment,
      );

      if (visibility <= 0) return;

      const { x, y } = polarToCartesian(
        target.distance,
        (target.bearing - rotationAngle + 360) % 360,
        range,
        radius,
      );

      const targetSize = 3 + target.size * 4;

      ctx.globalAlpha = visibility;

      if (isTargetInGuardZone(target)) {
        ctx.beginPath();
        ctx.arc(x, y, targetSize * 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (target.type === 'land') {
        ctx.fillStyle = nightMode ? '#AAF7' : '#AFA7';
        ctx.beginPath();
        ctx.arc(x, y, targetSize * 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = nightMode ? '#5F5' : '#5F5';
        ctx.beginPath();
        ctx.arc(x, y, targetSize, 0, Math.PI * 2);
        ctx.fill();

        if (target.isTracked && currArpaEnabled) {
          const arpaTarget = currArpaTargets.find(at => at.id === target.id);

          if (arpaTarget) {
            const targetStatus = getTargetStatus(arpaTarget, currArpaSettings);

            let color;
            switch (targetStatus) {
              case ARPATargetStatus.DANGEROUS:
                color = '#FF3333';
                break;
              case ARPATargetStatus.LOST:
                color = '#888888';
                break;
              case ARPATargetStatus.ACQUIRING:
                color = '#FFAA33';
                break;
              default:
                color = '#55FF55';
            }

            if (targetStatus !== ARPATargetStatus.ACQUIRING) {
              const vectorEndpoint = getVectorEndpoint(
                arpaTarget,
                currArpaSettings,
                ownShipRef.current,
              );

              const { x: endX, y: endY } = polarToCartesian(
                vectorEndpoint.distance,
                (vectorEndpoint.bearing - rotationAngle + 360) % 360,
                range,
                radius,
              );

              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(endX, endY);
              ctx.strokeStyle = color;
              ctx.lineWidth = 1;
              ctx.stroke();
            }

            ctx.beginPath();
            ctx.rect(
              x - targetSize * 1.5,
              y - targetSize * 1.5,
              targetSize * 3,
              targetSize * 3,
            );
            ctx.strokeStyle = color;
            ctx.lineWidth = targetStatus === ARPATargetStatus.DANGEROUS ? 2 : 1;
            ctx.stroke();

            if (targetStatus === ARPATargetStatus.DANGEROUS) {
              ctx.beginPath();
              ctx.arc(x, y, targetSize * 4, 0, Math.PI * 2);
              ctx.strokeStyle = '#FF3333';
              ctx.lineWidth = 1;
              ctx.setLineDash([5, 3]);
              ctx.stroke();
              ctx.setLineDash([]);
            }

            ctx.fillStyle = color;
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(
              arpaTarget.trackId.replace('ARPA-', ''),
              x + targetSize * 2,
              y - targetSize * 2,
            );

            if (
              arpaTarget.historicalPositions.length > 1 &&
              targetStatus !== ARPATargetStatus.ACQUIRING
            ) {
              ctx.beginPath();

              const numPositions = Math.min(
                currArpaSettings.historyPointsCount,
                arpaTarget.historicalPositions.length,
              );

              for (let i = 1; i < numPositions; i++) {
                const historyIndex =
                  arpaTarget.historicalPositions.length - 1 - i;
                if (historyIndex < 0) break;

                const historyPos = arpaTarget.historicalPositions[historyIndex];
                const { x: histX, y: histY } = polarToCartesian(
                  historyPos.distance,
                  (historyPos.bearing - rotationAngle + 360) % 360,
                  range,
                  radius,
                );

                ctx.beginPath();
                ctx.arc(histX, histY, targetSize * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = Math.max(0.2, 1 - i * 0.2);
                ctx.fill();
              }

              ctx.globalAlpha = visibility;
            }
          }
        }
      }

      ctx.globalAlpha = 1.0;
    });

    // Draw AIS targets
    currAisTargets.forEach(ais => {
      if (ais.distance > range) return;
      const { x, y } = polarToCartesian(
        ais.distance,
        (ais.bearing - rotationAngle + 360) % 360,
        range,
        radius,
      );
      // Draw AIS as a blue diamond
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(
        (((ais.heading ?? ais.course) - rotationAngle) * Math.PI) / 180,
      );
      ctx.beginPath();
      ctx.moveTo(0, -8); // Top
      ctx.lineTo(7, 0); // Right
      ctx.lineTo(0, 8); // Bottom
      ctx.lineTo(-7, 0); // Left
      ctx.closePath();
      ctx.fillStyle = nightMode ? '#3AB7FF' : '#2563EB';
      ctx.globalAlpha = 0.95;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1.0;
      ctx.stroke();
      ctx.restore();
      // Draw MMSI or name below
      ctx.save();
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = nightMode ? '#BFEFFF' : '#1E293B';
      ctx.fillText(ais.name || ais.mmsi, x, y + 10);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.moveTo(radius, radius);
    const sweepRad = sweepAngle * (Math.PI / 180);
    ctx.lineTo(
      radius + Math.sin(sweepRad) * (radius - 2),
      radius - Math.cos(sweepRad) * (radius - 2),
    );
    ctx.strokeStyle = nightMode
      ? 'rgba(85, 255, 85, 0.7)'
      : 'rgba(85, 255, 85, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const seaState = currEnvironment.seaState;
    if (seaState > 0) {
      const seaClutterGradient = ctx.createRadialGradient(
        radius,
        radius,
        0,
        radius,
        radius,
        radius * 0.6,
      );

      const clutterColor = nightMode ? '0, 255, 85' : '0, 255, 85';
      seaClutterGradient.addColorStop(
        0,
        `rgba(${clutterColor}, ${getSeaClutterStrength(0, range, seaState, seaClutter)})`,
      );
      seaClutterGradient.addColorStop(
        0.3,
        `rgba(${clutterColor}, ${getSeaClutterStrength(range * 0.3, range, seaState, seaClutter)})`,
      );
      seaClutterGradient.addColorStop(1, `rgba(${clutterColor}, 0)`);

      ctx.fillStyle = seaClutterGradient;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(radius, radius, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    const rainIntensity = currEnvironment.rainIntensity;
    if (rainIntensity > 0) {
      const rainClutterStrength = getRainClutterStrength(
        band,
        rainIntensity,
        rainClutter,
      );
      if (rainClutterStrength > 0) {
        ctx.fillStyle = nightMode
          ? 'rgba(85, 255, 85, 0.5)'
          : 'rgba(85, 255, 85, 0.5)';
        ctx.globalAlpha = rainClutterStrength * 0.3;

        const numSpeckles = Math.floor(rainClutterStrength * 500);

        for (let i = 0; i < numSpeckles; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * (radius - 2);
          const x = radius + Math.cos(angle) * distance;
          const y = radius + Math.sin(angle) * distance;

          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1.0;
      }
    }

    ctx.fillStyle = nightMode ? '#5599CC' : '#55CC99';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    ctx.fillText(`${band}-BAND ${range} NM`, size - 10, size - 10);

    ctx.textAlign = 'left';
    ctx.fillText(`GAIN: ${gain}%`, 10, size - 30);

    ctx.fillText(`SEA: ${seaClutter}% RAIN: ${rainClutter}%`, 10, size - 50);

    if (currArpaEnabled) {
      ctx.textAlign = 'right';
      ctx.fillText(
        `ARPA: ${arpaTargetsState.length} TARGETS`,
        size - 10,
        size - 30,
      );
    }
  };

  const handleRangeChange = (direction: 'increase' | 'decrease') => {
    setSettings(prev => {
      const currentIndex = RANGE_OPTIONS.indexOf(prev.range);
      let newIndex = currentIndex;

      if (direction === 'increase' && currentIndex < RANGE_OPTIONS.length - 1) {
        newIndex = currentIndex + 1;
      } else if (direction === 'decrease' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      }

      return { ...prev, range: RANGE_OPTIONS[newIndex] };
    });
  };

  const handleSettingChange = (
    setting: keyof RadarSettings,
    value: number | boolean | string | RadarBand,
  ) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handleEblToggle = () => {
    const next = { ...eblState, active: !eblState.active };
    if (onEblChange) {
      onEblChange(next);
    } else {
      setInternalEbl(next);
    }
  };

  const handleEblAngleChange = (angle: number) => {
    const next = { ...eblState, angle };
    if (onEblChange) {
      onEblChange(next);
    } else {
      setInternalEbl(next);
    }
  };

  const handleVrmToggle = () => {
    const next = { ...vrmState, active: !vrmState.active };
    if (onVrmChange) {
      onVrmChange(next);
    } else {
      setInternalVrm(next);
    }
  };

  const handleVrmDistanceChange = (distance: number) => {
    const next = {
      ...vrmState,
      distance: Math.min(distance, settings.range),
    };
    if (onVrmChange) {
      onVrmChange(next);
    } else {
      setInternalVrm(next);
    }
  };

  const handleGuardZoneChange = (
    field: keyof GuardZone,
    value: number | boolean,
  ) => {
    const next = { ...guardZoneState, [field]: value };
    if (onGuardZoneChange) {
      onGuardZoneChange(next);
    } else {
      setInternalGuardZone(next);
    }
  };

  const handleArpaSettingChange = (
    setting: keyof ARPASettings,
    value: boolean | number,
  ) => {
    const next = { ...arpaSettingsState, [setting]: value };
    if (onArpaSettingsChange) {
      onArpaSettingsChange(next);
    } else {
      setInternalArpaSettings(next);
    }
  };

  const handleAcquireTarget = () => {
    const untracked = targetsRef.current.filter(
      t =>
        !arpaTargetsState.some(at => at.id === t.id) &&
        t.type !== 'land' &&
        t.distance <= arpaSettingsState.autoAcquisitionRange,
    );

    if (untracked.length > 0) {
      const closest = [...untracked].sort((a, b) => a.distance - b.distance)[0];
      const newArpaTarget = convertToARPATarget(closest, ownShipData);
      updateArpaTargets(prev => [...prev, newArpaTarget]);
      setSelectedTargetId(closest.id);
    }
  };

  const handleCancelTarget = (targetId: string) => {
    updateArpaTargets(prev => prev.filter(t => t.id !== targetId));

    if (selectedTargetId === targetId) {
      setSelectedTargetId(null);
    }
  };

  const toggleArpaPanel = () => {
    const next = !arpaEnabledState;
    if (onArpaEnabledChange) {
      onArpaEnabledChange(next);
    } else {
      setInternalArpaEnabled(next);
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div
        className="relative mx-auto"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: settings.nightMode ? '#000B14' : '#001A14',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="absolute top-0 left-0"
        />
        <div
          ref={radarSweepRef}
          className="absolute left-1/2 top-1/2 h-0.5 w-1/2 bg-green-400 opacity-70"
          style={{
            transformOrigin: '0% 50%',
          }}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mt-4 w-full">
        <div className="flex-1">
          <RadarControls
            settings={settings}
            onSettingChange={handleSettingChange}
            onRangeChange={handleRangeChange}
            ebl={eblState}
            vrm={vrmState}
            onEblToggle={handleEblToggle}
            onEblAngleChange={handleEblAngleChange}
            onVrmToggle={handleVrmToggle}
            onVrmDistanceChange={handleVrmDistanceChange}
            onToggleArpa={toggleArpaPanel}
            arpaEnabled={arpaEnabledState}
            guardZone={guardZoneState}
            onGuardZoneChange={handleGuardZoneChange}
          />
        </div>

        {arpaEnabledState && (
          <div className="w-full lg:w-72 lg:ml-4">
            <ARPAPanel
              arpaTargets={arpaTargetsState}
              selectedTargetId={selectedTargetId}
              onSelectTarget={setSelectedTargetId}
              arpaSettings={arpaSettingsState}
              onSettingChange={handleArpaSettingChange}
              onAcquireTarget={handleAcquireTarget}
              onCancelTarget={handleCancelTarget}
            />
          </div>
        )}
      </div>
    </div>
  );
}
