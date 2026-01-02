// Scene with orbit camera, Environment lighting, and a Water plane that follows the vessel.
'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Sky } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import useStore from '../store';
import Ship from './Ship';

interface SceneProps {
  vesselPosition: {
    x: number;
    y: number;
    heading: number;
  };
  mode: 'player' | 'spectator';
}

// Generate a seamless tiled normal map using summed sine waves (tileable)
function createTiledNormalMap(size = 256): THREE.DataTexture {
  const data = new Uint8Array(size * size * 3);
  const freq1 = 2 * Math.PI;
  const freq2 = 4 * Math.PI;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      // Height field as sum of sines, guaranteed to tile
      // Approximate derivatives
      const du =
        Math.cos(freq1 * u) * freq1 * 0.6 +
        Math.cos(freq2 * (u + v)) * freq2 * 0.25;
      const dv =
        Math.cos(freq1 * v + Math.PI / 3) * freq1 * 0.6 +
        Math.cos(freq2 * (u + v)) * freq2 * 0.25;
      const nx = -du;
      const ny = -dv;
      const nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      const r = (nx / len) * 0.5 + 0.5;
      const g = (ny / len) * 0.5 + 0.5;
      const b = (nz / len) * 0.5 + 0.5;
      const i = (y * size + x) * 3;
      data[i] = Math.floor(r * 255);
      data[i + 1] = Math.floor(g * 255);
      data[i + 2] = Math.floor(b * 255);
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.needsUpdate = true;
  texture.anisotropy = 4;
  return texture;
}

function WaterPlane({
  centerRef,
  sunDirection,
  size,
}: {
  centerRef: React.MutableRefObject<{ x: number; y: number }>;
  sunDirection: THREE.Vector3;
  size: number;
}) {
  const waterRef = useRef<Water | null>(null);
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(size, size, 32, 32),
    [size],
  );
  const waterNormals = useMemo(() => createTiledNormalMap(), []);

  const water = useMemo(
    () =>
      new Water(geometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals,
        sunDirection: sunDirection.clone(),
        sunColor: 0xffffff,
        waterColor: 0x0c2f45,
        distortionScale: 2.4,
        fog: false,
      }),
    [geometry, sunDirection, waterNormals],
  );

  useEffect(() => {
    const current = waterRef.current;
    if (current) {
      current.material.uniforms.sunDirection.value.copy(sunDirection);
      current.material.uniforms.size.value = 6.0;
      current.material.uniforms.distortionScale.value = 2.4;
      current.material.uniforms.alpha.value = 0.96;
    }
  }, [sunDirection]);

  useEffect(
    () => () => {
      water.geometry.dispose();
      (water.material as THREE.Material).dispose();
    },
    [water],
  );

  useFrame((_, delta) => {
    if (!waterRef.current) return;
    waterRef.current.material.uniforms.time.value += delta;
    waterRef.current.position.set(centerRef.current.x, 0, centerRef.current.y);
  });

  return (
    <primitive
      ref={waterRef}
      object={water}
      position={[centerRef.current.x, 0, centerRef.current.y]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
}

function SpectatorController({
  mode,
  focusRef,
  entryTargetRef,
  controlsRef,
}: {
  mode: 'player' | 'spectator';
  focusRef: React.MutableRefObject<{ x: number; y: number }>;
  entryTargetRef: React.MutableRefObject<{ x: number; y: number }>;
  controlsRef: React.RefObject<OrbitControlsImpl>;
}) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const positionRef = useRef(
    new THREE.Vector3(
      entryTargetRef.current.x - 120,
      80,
      entryTargetRef.current.y - 120,
    ),
  );
  const forwardRef = useRef(new THREE.Vector3(0, 0, -1).normalize());
  const tmpVec = useRef(new THREE.Vector3());

  // Reset spectator pose when switching into spectator mode
  useEffect(() => {
    if (mode !== 'spectator') return;
    const start = entryTargetRef.current;
    positionRef.current.set(start.x - 150, 80, start.y - 150);
    forwardRef.current.set(0, 0, -1);
    focusRef.current = { x: positionRef.current.x, y: positionRef.current.z };
    camera.position.copy(positionRef.current);
    if (controlsRef.current) {
      controlsRef.current.target.set(focusRef.current.x, 0, focusRef.current.y);
      controlsRef.current.update();
    } else {
      camera.lookAt(
        tmpVec.current
          .copy(positionRef.current)
          .add(forwardRef.current.clone().multiplyScalar(50)),
      );
    }
  }, [mode, camera, focusRef, controlsRef, entryTargetRef]);

  // Key handling
  useEffect(() => {
    if (mode !== 'spectator') return;
    const handleDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const handleUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [mode]);

  useFrame((_, delta) => {
    if (mode !== 'spectator') return;
    const moveSpeed = (keys.current['shift'] ? 180 : 120) * delta;

    // Derive forward from camera orientation so mouse orbit still works
    camera.getWorldDirection(forwardRef.current).setY(0);
    if (forwardRef.current.lengthSq() === 0) {
      forwardRef.current.set(0, 0, -1);
    }
    forwardRef.current.normalize();

    const right = tmpVec.current
      .set(0, 1, 0)
      .cross(forwardRef.current)
      .normalize();
    const movement = new THREE.Vector3();

    if (keys.current['w'] || keys.current['arrowup']) {
      movement.add(forwardRef.current);
    }
    if (keys.current['s'] || keys.current['arrowdown']) {
      movement.sub(forwardRef.current);
    }
    if (keys.current['a']) {
      movement.sub(right);
    }
    if (keys.current['d']) {
      movement.add(right);
    }

    if (movement.lengthSq() > 0) {
      movement.normalize().multiplyScalar(moveSpeed);
      positionRef.current.add(movement);
      camera.position.add(movement);
    }

    focusRef.current = {
      x: positionRef.current.x,
      y: positionRef.current.z,
    };

    if (controlsRef.current) {
      controlsRef.current.target.set(focusRef.current.x, 0, focusRef.current.y);
      controlsRef.current.update();
    } else {
      const lookAt = tmpVec.current
        .copy(positionRef.current)
        .add(forwardRef.current.clone().multiplyScalar(200));
      camera.lookAt(lookAt);
    }
  });

  return null;
}

function LightTracker({
  lightRef,
  targetRef,
  sunDirection,
}: {
  lightRef: React.RefObject<THREE.DirectionalLight>;
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

export default function Scene({ vesselPosition, mode }: SceneProps) {
  const isSpectator = mode === 'spectator';
  const vesselProperties = useStore(state => state.vessel.properties);
  const envTime = useStore(state => state.environment.timeOfDay);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const focusRef = useRef<{ x: number; y: number }>({
    x: vesselPosition.x,
    y: vesselPosition.y,
  });
  const orbitRef = useRef<OrbitControlsImpl>(null);
  const spectatorStartRef = useRef<{ x: number; y: number }>({
    x: vesselPosition.x,
    y: vesselPosition.y,
  });

  // Simple sun direction derived from time of day (0-24). Kept adaptable for future lat/season logic.
  const sunDirection = useMemo(() => {
    const t = envTime ?? 12;
    const normalized = ((t % 24) + 24) / 24; // 0..1
    const azimuth = normalized * Math.PI * 2;
    const elevation = Math.max(0.1, Math.sin(normalized * Math.PI)); // keep sun above horizon for now
    const dir = new THREE.Vector3(
      Math.cos(azimuth) * Math.cos(elevation),
      elevation,
      Math.sin(azimuth) * Math.cos(elevation),
    );
    dir.normalize();
    return dir;
  }, [envTime]);

  useEffect(() => {
    if (!isSpectator) {
      focusRef.current = { x: vesselPosition.x, y: vesselPosition.y };
    }
  }, [isSpectator, vesselPosition.x, vesselPosition.y]);

  useEffect(() => {
    if (mode === 'spectator') {
      spectatorStartRef.current = { ...focusRef.current };
    }
  }, [mode]);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        position: 'fixed',
        inset: 0,
        zIndex: 0,
      }}
    >
      <Canvas
        camera={{
          position: isSpectator
            ? [focusRef.current.x - 120, 80, focusRef.current.y - 120]
            : [vesselPosition.x - 50, 30, vesselPosition.y - 50],
          fov: isSpectator ? 70 : 60,
          near: 1,
          far: 50000,
        }}
      >
        <color attach="background" args={['#091623']} />
        <Sky
          distance={45000}
          sunPosition={[
            sunDirection.x * 3000,
            sunDirection.y * 3000,
            sunDirection.z * 3000,
          ]}
          turbidity={6}
          rayleigh={2}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
        <Environment preset="sunset" />
        <ambientLight intensity={0.45} />
        <hemisphereLight args={['#6fa6ff', '#0b1e2d', 0.25]} />
        <directionalLight
          ref={directionalLightRef}
          intensity={1.0}
          color={0xfff0dd}
        />
        <LightTracker
          lightRef={directionalLightRef}
          targetRef={focusRef}
          sunDirection={sunDirection}
        />
        <WaterPlane
          centerRef={focusRef}
          sunDirection={sunDirection}
          size={isSpectator ? 80000 : 40000}
        />
        <Ship
          position={{
            x: vesselPosition.x,
            y: 0,
            z: vesselPosition.y,
          }}
          heading={vesselPosition.heading}
          shipType={vesselProperties.type}
        />
        <OrbitControls
          ref={orbitRef}
          target={
            isSpectator
              ? [focusRef.current.x, 0, focusRef.current.y]
              : [vesselPosition.x, 0, vesselPosition.y]
          }
          enablePan={false}
          minDistance={isSpectator ? 50 : vesselProperties.length * 0.8}
          maxDistance={
            isSpectator ? 5000 : Math.max(vesselProperties.length * 5, 500)
          }
          minPolarAngle={Math.PI * 0.05}
          maxPolarAngle={isSpectator ? Math.PI * 0.49 : Math.PI * 0.5}
          enableDamping
          dampingFactor={0.1}
        />
        {isSpectator ? (
          <SpectatorController
            mode={mode}
            focusRef={focusRef}
            entryTargetRef={spectatorStartRef}
            controlsRef={orbitRef}
          />
        ) : null}
      </Canvas>
    </div>
  );
}
