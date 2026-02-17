import { Environment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React from 'react';
import * as THREE from 'three';

import { SkyFollowCamera } from './SkyFollowCamera';

type LightingConfig = {
  sunDirection: THREE.Vector3;
  daylight: number;
  lightIntensity: {
    directional: number;
    ambient: number;
    hemi: number;
  };
};

function LightTracker({
  lightRef,
  targetRef,
  sunDirection,
}: {
  lightRef: React.RefObject<THREE.DirectionalLight | null>;
  targetRef: React.MutableRefObject<{ x: number; y: number }>;
  sunDirection: THREE.Vector3;
}) {
  useFrame(() => {
    if (!lightRef.current) return;

    const light = lightRef.current;
    const scaled = sunDirection.clone().multiplyScalar(400);
    light.position.copy(scaled);
    light.target.position.set(targetRef.current.x, 0, targetRef.current.y);
    light.target.updateMatrixWorld();
  });

  return null;
}

export function useLightingConfig(envTime: number | undefined): LightingConfig {
  return React.useMemo(() => {
    const t = envTime ?? 12;
    const normalized = ((t % 24) + 24) / 24;
    const elevation = Math.sin((normalized - 0.25) * Math.PI * 2);
    const azimuth = normalized * Math.PI * 2;
    const horizontalMag = Math.max(
      0,
      Math.sqrt(Math.max(0, 1 - elevation ** 2)),
    );

    const dir = new THREE.Vector3(
      Math.cos(azimuth) * horizontalMag,
      elevation,
      Math.sin(azimuth) * horizontalMag,
    ).normalize();

    const daylight = Math.max(0, elevation);
    const lightIntensity = {
      directional: daylight * 1.1,
      ambient: daylight * 0.25,
      hemi: daylight * 0.2,
    };

    return { sunDirection: dir, daylight, lightIntensity };
  }, [envTime]);
}

export function LightingController({
  directionalLightRef,
  focusRef,
  lighting,
}: {
  directionalLightRef: React.RefObject<THREE.DirectionalLight | null>;
  focusRef: React.MutableRefObject<{ x: number; y: number }>;
  lighting: LightingConfig;
}) {
  return (
    <>
      <SkyFollowCamera
        enabled
        distance={45000}
        sunPosition={new THREE.Vector3(
          lighting.sunDirection.x,
          lighting.sunDirection.y,
          lighting.sunDirection.z,
        ).normalize()}
        turbidity={1}
        rayleigh={4}
        mieCoefficient={0.001}
        mieDirectionalG={0.8}
      />

      <Environment
        preset="sunset"
        environmentIntensity={lighting.daylight * 0.9}
      />
      <ambientLight intensity={lighting.lightIntensity.ambient} />
      <hemisphereLight
        args={['#6fa6ff', '#0b1e2d', lighting.lightIntensity.hemi]}
      />
      <directionalLight
        ref={directionalLightRef}
        intensity={lighting.lightIntensity.directional}
        color={0xfff0dd}
      />
      <LightTracker
        lightRef={directionalLightRef}
        targetRef={focusRef}
        sunDirection={lighting.sunDirection}
      />
    </>
  );
}
