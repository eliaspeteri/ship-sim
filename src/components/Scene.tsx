// Scene with orbit camera, Environment lighting, and a Water plane that follows the vessel.
'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
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
}

function createNormalMap(size = 256): THREE.DataTexture {
  const data = new Uint8Array(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    const stride = i * 3;
    // Subtle perturbation around a neutral normal
    data[stride] = 128 + (Math.random() * 40 - 20);
    data[stride + 1] = 128 + (Math.random() * 40 - 20);
    data[stride + 2] = 255;
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.needsUpdate = true;
  texture.anisotropy = 4;
  return texture;
}

function WaterPlane({
  center,
  sunDirection,
}: {
  center: { x: number; y: number };
  sunDirection: THREE.Vector3;
}) {
  const waterRef = useRef<Water | null>(null);
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(40000, 40000, 32, 32),
    [],
  );
  const waterNormals = useMemo(() => createNormalMap(), []);

  const water = useMemo(
    () =>
      new Water(geometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals,
        sunDirection: sunDirection.clone(),
        sunColor: 0xffffff,
        waterColor: 0x14324a,
        distortionScale: 3.5,
        fog: false,
      }),
    [geometry, sunDirection, waterNormals],
  );

  useEffect(() => {
    const current = waterRef.current;
    if (current) {
      current.material.uniforms.sunDirection.value.copy(sunDirection);
      current.material.uniforms.size.value = 8.0;
      current.material.uniforms.distortionScale.value = 3.5;
      current.material.uniforms.alpha.value = 0.95;
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
    waterRef.current.position.set(center.x, 0, center.y);
  });

  return (
    <primitive
      ref={waterRef}
      object={water}
      position={[center.x, 0, center.y]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
}

export default function Scene({ vesselPosition }: SceneProps) {
  const vesselProperties = useStore(state => state.vessel.properties);
  const envTime = useStore(state => state.environment.timeOfDay);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);

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
    if (!directionalLightRef.current) return;
    const light = directionalLightRef.current;
    const scaled = sunDirection.clone().multiplyScalar(400);
    light.position.copy(scaled);
    light.target.position.set(vesselPosition.x, 0, vesselPosition.y);
    light.target.updateMatrixWorld();
  }, [sunDirection, vesselPosition.x, vesselPosition.y]);

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
          position: [vesselPosition.x - 50, 30, vesselPosition.y - 50],
          fov: 60,
          near: 1,
          far: 50000,
        }}
      >
        <color attach="background" args={['#0c1a2b']} />
        <Environment preset="sunset" />
        <ambientLight intensity={0.4} />
        <directionalLight ref={directionalLightRef} intensity={0.9} />
        <WaterPlane
          center={{ x: vesselPosition.x, y: vesselPosition.y }}
          sunDirection={sunDirection}
        />
        <Ship
          position={{
            x: vesselPosition.x,
            y: 0,
            z: vesselPosition.y,
          }}
          heading={-vesselPosition.heading}
          shipType={vesselProperties.type}
        />
        <OrbitControls
          target={[vesselPosition.x, 0, vesselPosition.y]}
          enablePan={false}
          minDistance={vesselProperties.length * 0.8}
          maxDistance={vesselProperties.length * 5}
          minPolarAngle={Math.PI * 0.05}
          maxPolarAngle={Math.PI * 0.5}
          enableDamping
          dampingFactor={0.1}
        />
      </Canvas>
    </div>
  );
}
