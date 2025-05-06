import React, { useEffect, useRef, useState } from 'react';
import {
  EBL,
  GuardZone,
  RadarBand,
  RadarEnvironment,
  RadarSettings,
  RadarTarget,
  VRM,
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

interface RadarDisplayProps {
  size?: number;
  initialSettings?: Partial<RadarSettings>;
  initialTargets?: RadarTarget[];
  environment?: RadarEnvironment;
  onSettingsChange?: (settings: RadarSettings) => void;
  className?: string;
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

const RANGE_OPTIONS = [0.5, 1.5, 3, 6, 12, 24, 48];

export default function RadarDisplay({
  size = 500,
  initialSettings,
  initialTargets = [],
  environment = DEFAULT_ENVIRONMENT,
  onSettingsChange,
  className = '',
}: RadarDisplayProps) {
  // Merge default settings with initial settings
  const [settings, setSettings] = useState<RadarSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  // State for targets, EBL, VRM, and guard zones
  const [targets, setTargets] = useState<RadarTarget[]>(initialTargets);
  const [ebl, setEbl] = useState<EBL>({ active: false, angle: 0 });
  const [vrm, setVrm] = useState<VRM>({ active: false, distance: 0 });
  const [guardZone] = useState<GuardZone>({
    active: false,
    startAngle: 320,
    endAngle: 40,
    innerRange: 0.5,
    outerRange: 3,
  });

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const radarSweepRef = useRef<HTMLDivElement>(null);

  // Animation frame ref
  const animationFrameRef = useRef<number | null>(null);

  // Current sweep angle
  const [sweepAngle, setSweepAngle] = useState(0);

  // Animation control
  const [isAnimating] = useState(true);

  // Refs for performance
  const settingsRef = useRef(settings);
  const environmentRef = useRef(environment);
  const targetsRef = useRef(targets);

  // Update refs when props change
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
    targetsRef.current = targets;
  }, [targets]);

  // Setup canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    // Start animation
    const animateRadar = () => {
      // Update sweep angle
      setSweepAngle(prev => (prev + 1) % 360);

      // Draw radar
      drawRadar();

      // Continue animation
      if (isAnimating) {
        animationFrameRef.current = requestAnimationFrame(animateRadar);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateRadar);

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [size, isAnimating]);

  // Update radar sweep visual element position
  useEffect(() => {
    if (radarSweepRef.current) {
      radarSweepRef.current.style.transform = `rotate(${sweepAngle}deg)`;
    }
  }, [sweepAngle]);

  // Draw the radar display
  const drawRadar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currSettings = settingsRef.current;
    const currEnvironment = environmentRef.current;
    const currTargets = targetsRef.current;

    const {
      band,
      range,
      gain,
      seaClutter,
      rainClutter,
      heading,
      orientation,
      nightMode,
    } = currSettings;
    const radius = size / 2;

    // Clear canvas with semi-transparent background for trail effect
    ctx.fillStyle = nightMode
      ? 'rgba(0, 10, 20, 0.15)'
      : 'rgba(0, 20, 10, 0.15)';
    ctx.fillRect(0, 0, size, size);

    // Draw background
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
    ctx.fillStyle = nightMode ? '#000B14' : '#001A14';
    ctx.fill();

    // Draw range rings
    ctx.strokeStyle = nightMode ? '#113344' : '#114433';
    ctx.lineWidth = 1;

    // Calculate number of range rings based on range
    const numRings = 5;
    for (let i = 1; i <= numRings; i++) {
      const ringRadius = (radius - 2) * (i / numRings);
      ctx.beginPath();
      ctx.arc(radius, radius, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw cardinal direction lines
    ctx.strokeStyle = nightMode ? '#1E4966' : '#1E664D';
    ctx.lineWidth = 1;

    // Calculate rotation based on orientation and heading
    let rotationAngle = 0;
    if (orientation === 'north-up') {
      rotationAngle = 0;
    } else if (orientation === 'head-up') {
      rotationAngle = heading;
    }

    // Draw heading lines (N, E, S, W)
    for (let i = 0; i < 4; i++) {
      const angle = (i * 90 - rotationAngle + 360) % 360;
      const angleRad = angle * (Math.PI / 180);

      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.lineTo(
        radius + Math.sin(angleRad) * (radius - 2),
        radius - Math.cos(angleRad) * (radius - 2),
      );
      ctx.stroke();

      // Add cardinal direction labels
      const labelRadius = radius - 20;
      const labelX = radius + Math.sin(angleRad) * labelRadius;
      const labelY = radius - Math.cos(angleRad) * labelRadius;

      ctx.fillStyle = nightMode ? '#5599CC' : '#55CC99';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let label = '';
      switch (i) {
        case 0:
          label = 'N';
          break;
        case 1:
          label = 'E';
          break;
        case 2:
          label = 'S';
          break;
        case 3:
          label = 'W';
          break;
      }

      ctx.fillText(label, labelX, labelY);
    }

    // Draw heading marker
    if (orientation === 'head-up') {
      ctx.beginPath();
      ctx.moveTo(radius, 10);
      ctx.lineTo(radius - 10, 30);
      ctx.lineTo(radius + 10, 30);
      ctx.closePath();
      ctx.fillStyle = nightMode ? '#5599CC' : '#55CC99';
      ctx.fill();
    }

    // Draw EBL if active
    if (ebl.active) {
      const angleRad =
        ((ebl.angle - rotationAngle + 360) % 360) * (Math.PI / 180);

      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.lineTo(
        radius + Math.sin(angleRad) * (radius - 2),
        radius - Math.cos(angleRad) * (radius - 2),
      );
      ctx.strokeStyle = nightMode ? '#FFAA33' : '#FFAA33';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add angle label
      ctx.fillStyle = nightMode ? '#FFAA33' : '#FFAA33';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`EBL: ${ebl.angle.toFixed(1)}°`, 10, size - 10);
    }

    // Draw VRM if active
    if (vrm.active) {
      const vrmRadius = (vrm.distance / range) * (radius - 2);

      ctx.beginPath();
      ctx.arc(radius, radius, vrmRadius, 0, Math.PI * 2);
      ctx.strokeStyle = nightMode ? '#FFAA33' : '#FFAA33';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add distance label
      ctx.fillStyle = nightMode ? '#FFAA33' : '#FFAA33';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`VRM: ${vrm.distance.toFixed(1)} NM`, 10, 10);
    }

    // Draw guard zone if active
    if (guardZone.active) {
      const innerRadius = (guardZone.innerRange / range) * (radius - 2);
      const outerRadius = (guardZone.outerRange / range) * (radius - 2);
      const startAngle =
        ((guardZone.startAngle - rotationAngle + 360) % 360) * (Math.PI / 180);
      const endAngle =
        ((guardZone.endAngle - rotationAngle + 360) % 360) * (Math.PI / 180);

      // Create guard zone path
      ctx.beginPath();
      // Outer arc
      ctx.arc(radius, radius, outerRadius, startAngle, endAngle);
      // Line to inner arc
      ctx.lineTo(
        radius + Math.cos(endAngle) * innerRadius,
        radius + Math.sin(endAngle) * innerRadius,
      );
      // Inner arc (counter-clockwise)
      ctx.arc(radius, radius, innerRadius, endAngle, startAngle, true);
      // Close path
      ctx.closePath();

      // Fill guard zone with semi-transparent color
      ctx.fillStyle = nightMode
        ? 'rgba(255, 0, 0, 0.15)'
        : 'rgba(255, 0, 0, 0.15)';
      ctx.fill();

      // Stroke guard zone border
      ctx.strokeStyle = nightMode
        ? 'rgba(255, 0, 0, 0.5)'
        : 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Generate radar noise
    const noiseLevel = generateRadarNoise(band, currEnvironment, gain);
    const noisePattern = generateNoisePattern(size, size, noiseLevel);

    // Apply noise pattern with low opacity
    ctx.globalAlpha = 0.2;
    ctx.putImageData(noisePattern, 0, 0);
    ctx.globalAlpha = 1.0;

    // Draw targets
    currTargets.forEach(target => {
      if (target.distance > range) return; // Skip targets outside range

      // Calculate target visibility
      const visibility = calculateTargetVisibility(
        target,
        band,
        gain,
        seaClutter,
        rainClutter,
        currEnvironment,
      );

      if (visibility <= 0) return; // Skip invisible targets

      // Convert target polar coordinates to Cartesian
      const { x, y } = polarToCartesian(
        target.distance,
        (target.bearing - rotationAngle + 360) % 360,
        range,
        radius,
      );

      // Draw target
      const targetSize = 3 + target.size * 4;

      // Draw with visibility-based opacity
      ctx.globalAlpha = visibility;

      if (target.type === 'land') {
        // Land masses are irregular shapes
        ctx.fillStyle = nightMode ? '#AAF7' : '#AFA7';
        ctx.beginPath();
        ctx.arc(x, y, targetSize * 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Ships and other targets are dots
        ctx.fillStyle = nightMode ? '#5F5' : '#5F5';
        ctx.beginPath();
        ctx.arc(x, y, targetSize, 0, Math.PI * 2);
        ctx.fill();

        // If target is tracked by ARPA, add track vector
        if (target.isTracked) {
          // Calculate vector end point based on course and speed
          const vectorLength = (target.speed / 10) * (radius / 5);
          const courseRad = target.course * (Math.PI / 180);

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(
            x + Math.sin(courseRad) * vectorLength,
            y - Math.cos(courseRad) * vectorLength,
          );
          ctx.strokeStyle = nightMode ? '#5F5' : '#5F5';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Add tracking box
          ctx.beginPath();
          ctx.rect(
            x - targetSize * 1.5,
            y - targetSize * 1.5,
            targetSize * 3,
            targetSize * 3,
          );
          ctx.strokeStyle = nightMode ? '#5F5' : '#5F5';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1.0;
    });

    // Draw the sweep line effect
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

    // Draw sea clutter
    const seaState = currEnvironment.seaState;
    if (seaState > 0) {
      // Draw sea clutter as a gradient from center
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

    // Draw rain clutter
    const rainIntensity = currEnvironment.rainIntensity;
    if (rainIntensity > 0) {
      // Draw random speckles across the radar for rain
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

        // More speckles for stronger rain
        const numSpeckles = Math.floor(rainClutterStrength * 500);

        for (let i = 0; i < numSpeckles; i++) {
          // Random position within the radar circle
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * (radius - 2);
          const x = radius + Math.cos(angle) * distance;
          const y = radius + Math.sin(angle) * distance;

          // Draw speckle
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1.0;
      }
    }

    // Draw radar information
    ctx.fillStyle = nightMode ? '#5599CC' : '#55CC99';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    // Band and range
    ctx.fillText(`${band}-BAND ${range} NM`, size - 10, size - 10);

    // Draw gain info
    ctx.textAlign = 'left';
    ctx.fillText(`GAIN: ${gain}%`, 10, size - 30);

    // Draw clutter reduction info
    ctx.fillText(`SEA: ${seaClutter}% RAIN: ${rainClutter}%`, 10, size - 50);
  };

  // Handle range change
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

  // Handle setting changes
  const handleSettingChange = (
    setting: keyof RadarSettings,
    value: number | boolean | string | RadarBand,
  ) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };

  // Handle EBL control
  const handleEblToggle = () => {
    setEbl(prev => ({ ...prev, active: !prev.active }));
  };

  const handleEblAngleChange = (angle: number) => {
    setEbl(prev => ({ ...prev, angle }));
  };

  // Handle VRM control
  const handleVrmToggle = () => {
    setVrm(prev => ({ ...prev, active: !prev.active }));
  };

  const handleVrmDistanceChange = (distance: number) => {
    setVrm(prev => ({ ...prev, distance: Math.min(distance, settings.range) }));
  };

  // Add a random target for testing
  const addRandomTarget = () => {
    const newTarget: RadarTarget = {
      id: `target-${Date.now()}`,
      distance: Math.random() * settings.range * 0.9,
      bearing: Math.random() * 360,
      size: 0.3 + Math.random() * 0.7,
      speed: Math.random() * 20,
      course: Math.random() * 360,
      type: Math.random() > 0.7 ? 'land' : 'ship',
      isTracked: Math.random() > 0.5,
    };

    setTargets(prev => [...prev, newTarget]);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div
        className="relative"
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
          className="absolute top-0 left-0 w-1/2 h-0.5 bg-green-400 opacity-70 origin-left"
          style={{
            transformOrigin: '50% 50%',
            left: '50%',
            top: '50%',
          }}
        />
      </div>

      <RadarControls
        settings={settings}
        onSettingChange={handleSettingChange}
        onRangeChange={handleRangeChange}
        ebl={ebl}
        vrm={vrm}
        onEblToggle={handleEblToggle}
        onEblAngleChange={handleEblAngleChange}
        onVrmToggle={handleVrmToggle}
        onVrmDistanceChange={handleVrmDistanceChange}
        onAddTarget={addRandomTarget}
      />
    </div>
  );
}
