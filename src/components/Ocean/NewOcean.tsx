'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store';
import waterVertexShader from './shaders/water.vert?raw';
import waterFragmentShader from './shaders/water.frag?raw';
import {
  MAX_AMPLITUDE,
  BASE_AMPLITUDE,
  AMPLITUDE_PER_SEASTATE,
  MIN_FREQUENCY,
  BASE_FREQUENCY,
  FREQUENCY_DROP_PER_SEASTATE,
  MAX_SPEED,
  BASE_SPEED,
  SPEED_PER_WINDSPEED,
  MAX_PERSISTENCE,
  BASE_PERSISTENCE,
  PERSISTENCE_PER_SEASTATE,
  MAX_LACUNARITY,
  BASE_LACUNARITY,
  LACUNARITY_PER_SEASTATE,
  MAX_PEAK_THRESHOLD,
  BASE_PEAK_THRESHOLD,
  PEAK_THRESHOLD_PER_SEASTATE,
  MIN_TROUGH_THRESHOLD,
  BASE_TROUGH_THRESHOLD,
  TROUGH_THRESHOLD_PER_SEASTATE,
  SMOOTHING_SPEED,
} from './constants';

interface NewOceanProps {
  size?: number;
  resolution?: number;
  position?: [number, number, number];
}

/**
 * Beaufort scale calculation based on wind speed.
 * @see https://en.wikipedia.org/wiki/Beaufort_scale
 * Formula is B = (v/0.836)^(2/3)
 * @param windSpeed - Wind speed in m/s
 */
function calculateBeaufortScale(windSpeed: number): number {
  const beaufortScale = Math.pow(windSpeed / 0.836, 2 / 3);
  return Math.min(Math.max(beaufortScale, 0), 12); // Clamp to [0, 12]
}

function quantize(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function NewOcean({
  size = 100000,
  resolution = 512,
  position = [0, -0.5, 0],
}: NewOceanProps): React.ReactElement {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const disposables = useRef<Array<{ dispose: () => void }>>([]);

  const environment = useStore(state => state.environment);
  const windSpeed = environment.wind.speed;
  const seaState = useMemo(
    () => calculateBeaufortScale(windSpeed),
    [windSpeed],
  );
  const timeOfDay = environment.timeOfDay;

  const envMap = useMemo(() => {
    const loader = new THREE.CubeTextureLoader().setPath('/textures/');
    return loader.load([
      'px.png',
      'nx.png',
      'py.png',
      'ny.png',
      'pz.png',
      'nz.png',
    ]);
  }, []);

  useEffect(() => {
    if (envMap) {
      envMap.mapping = THREE.CubeReflectionMapping;
      envMap.needsUpdate = true;
      disposables.current.push(envMap);
      console.info('Environment map assigned.');
    } else {
      console.error('Environment map failed to load!');
    }
  }, [envMap]);

  const calculatedWaveParams = useMemo(() => {
    const amplitude = Math.min(
      MAX_AMPLITUDE,
      BASE_AMPLITUDE + seaState * AMPLITUDE_PER_SEASTATE,
    );
    const frequency = Math.max(
      MIN_FREQUENCY,
      BASE_FREQUENCY - seaState * FREQUENCY_DROP_PER_SEASTATE,
    );
    const speed = Math.min(
      MAX_SPEED,
      BASE_SPEED + windSpeed * SPEED_PER_WINDSPEED,
    );
    const persistence = Math.min(
      MAX_PERSISTENCE,
      BASE_PERSISTENCE + seaState * PERSISTENCE_PER_SEASTATE,
    );
    const lacunarity = Math.min(
      MAX_LACUNARITY,
      BASE_LACUNARITY + seaState * LACUNARITY_PER_SEASTATE,
    );
    const peakThreshold = Math.min(
      MAX_PEAK_THRESHOLD,
      BASE_PEAK_THRESHOLD + seaState * PEAK_THRESHOLD_PER_SEASTATE,
    );
    const troughThreshold = Math.max(
      MIN_TROUGH_THRESHOLD,
      BASE_TROUGH_THRESHOLD + seaState * TROUGH_THRESHOLD_PER_SEASTATE,
    );

    return {
      amplitude,
      frequency,
      speed,
      persistence,
      lacunarity,
      peakThreshold,
      troughThreshold,
    };
  }, [seaState, quantize(windSpeed, 0.1)]);

  const waterColors = useMemo(() => {
    const dayFactor = Math.max(
      0,
      Math.min(1, 1 - Math.abs(timeOfDay - 12) / 6),
    );

    const troughNight = new THREE.Color('#051937');
    const troughDay = new THREE.Color('#186691');
    const trough = new THREE.Color().lerpColors(
      troughNight,
      troughDay,
      dayFactor,
    );

    const surfaceNight = new THREE.Color('#003f5c');
    const surfaceDay = new THREE.Color('#9bd8c0');
    const surface = new THREE.Color().lerpColors(
      surfaceNight,
      surfaceDay,
      dayFactor,
    );

    const peakNight = new THREE.Color('#346a88');
    const peakDay = new THREE.Color('#bbd8e0');
    const peak = new THREE.Color().lerpColors(peakNight, peakDay, dayFactor);

    return { trough, surface, peak };
  }, [timeOfDay]);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    disposables.current.push(geo);
    return geo;
  }, [size, resolution]);

  const targetValues = useRef({
    amplitude: calculatedWaveParams.amplitude,
    frequency: calculatedWaveParams.frequency,
    persistence: calculatedWaveParams.persistence,
    lacunarity: calculatedWaveParams.lacunarity,
    speed: calculatedWaveParams.speed,
    peakThreshold: calculatedWaveParams.peakThreshold,
    troughThreshold: calculatedWaveParams.troughThreshold,
    colors: {
      trough: new THREE.Color(waterColors.trough),
      surface: new THREE.Color(waterColors.surface),
      peak: new THREE.Color(waterColors.peak),
    },
  });

  const material = useMemo(() => {
    const initialTargets = targetValues.current;
    const mat = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.9 },
        uEnvironmentMap: { value: envMap },
        uMeshPosition: { value: new THREE.Vector3().fromArray(position) },
        uWavesAmplitude: { value: initialTargets.amplitude },
        uWavesFrequency: { value: initialTargets.frequency },
        uWavesPersistence: { value: initialTargets.persistence },
        uWavesLacunarity: { value: initialTargets.lacunarity },
        uWavesIterations: { value: 8 },
        uWavesSpeed: { value: initialTargets.speed },
        uTroughColor: { value: new THREE.Color(initialTargets.colors.trough) },
        uSurfaceColor: {
          value: new THREE.Color(initialTargets.colors.surface),
        },
        uPeakColor: { value: new THREE.Color(initialTargets.colors.peak) },
        uPeakThreshold: { value: initialTargets.peakThreshold },
        uPeakTransition: { value: 0.05 },
        uTroughThreshold: { value: initialTargets.troughThreshold },
        uTroughTransition: { value: 0.15 },
        uFresnelScale: { value: 0.8 },
        uFresnelPower: { value: 0.5 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
    });
    disposables.current.push(mat);
    return mat;
  }, [envMap]);

  useEffect(() => {
    targetValues.current.amplitude = calculatedWaveParams.amplitude;
    targetValues.current.frequency = calculatedWaveParams.frequency;
    targetValues.current.speed = calculatedWaveParams.speed;
    targetValues.current.persistence = calculatedWaveParams.persistence;
    targetValues.current.lacunarity = calculatedWaveParams.lacunarity;
    targetValues.current.peakThreshold = calculatedWaveParams.peakThreshold;
    targetValues.current.troughThreshold = calculatedWaveParams.troughThreshold;
  }, [calculatedWaveParams]);

  useEffect(() => {
    targetValues.current.colors.trough.copy(waterColors.trough);
    targetValues.current.colors.surface.copy(waterColors.surface);
    targetValues.current.colors.peak.copy(waterColors.peak);
  }, [waterColors]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uMeshPosition.value.fromArray(position);
    }
  }, [position]);

  useFrame((state, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    const uniforms = materialRef.current.uniforms;
    const targets = targetValues.current;

    const clampedDelta = Math.min(delta, 0.1);
    const lerpFactor = 1.0 - Math.exp(-clampedDelta * SMOOTHING_SPEED);

    // Update time with speed factor for correct wave animation
    uniforms.uTime.value += clampedDelta * uniforms.uWavesSpeed.value;

    // Update actual mesh world position for stable wave calculation
    if (meshRef.current) {
      meshRef.current.getWorldPosition(uniforms.uMeshPosition.value);
    }

    // Lerp uniform values towards targets
    uniforms.uWavesAmplitude.value = THREE.MathUtils.lerp(
      uniforms.uWavesAmplitude.value,
      targets.amplitude,
      lerpFactor,
    );
    uniforms.uWavesFrequency.value = THREE.MathUtils.lerp(
      uniforms.uWavesFrequency.value,
      targets.frequency,
      lerpFactor,
    );
    uniforms.uWavesSpeed.value = THREE.MathUtils.lerp(
      uniforms.uWavesSpeed.value,
      targets.speed,
      lerpFactor,
    );
    uniforms.uWavesLacunarity.value = THREE.MathUtils.lerp(
      uniforms.uWavesLacunarity.value,
      targets.lacunarity,
      lerpFactor,
    );
    uniforms.uWavesPersistence.value = THREE.MathUtils.lerp(
      uniforms.uWavesPersistence.value,
      targets.persistence,
      lerpFactor,
    );

    uniforms.uTroughColor.value.lerp(targets.colors.trough, lerpFactor);
    uniforms.uSurfaceColor.value.lerp(targets.colors.surface, lerpFactor);
    uniforms.uPeakColor.value.lerp(targets.colors.peak, lerpFactor);

    uniforms.uPeakThreshold.value = THREE.MathUtils.lerp(
      uniforms.uPeakThreshold.value,
      targets.peakThreshold,
      lerpFactor,
    );
    uniforms.uTroughThreshold.value = THREE.MathUtils.lerp(
      uniforms.uTroughThreshold.value,
      targets.troughThreshold,
      lerpFactor,
    );
  });

  useEffect(() => {
    return () => {
      disposables.current.forEach(item => {
        if (item && typeof item.dispose === 'function') {
          try {
            item.dispose();
          } catch (e) {
            console.error('Error disposing resource:', e);
          }
        }
      });
      disposables.current = [];
    };
  }, []);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow
    >
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" ref={materialRef} />
    </mesh>
  );
}

export default NewOcean;
