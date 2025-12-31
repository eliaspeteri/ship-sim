// Scene with orbit camera, Environment lighting, and a Water plane that follows the vessel.
'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, Sky } from '@react-three/drei';
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
        <color attach="background" args={['#091623']} />
        <Sky
          distance={45000}
          sunPosition={[sunDirection.x * 3000, sunDirection.y * 3000, sunDirection.z * 3000]}
          turbidity={6}
          rayleigh={2}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
        <Environment preset="sunset" />
        <ambientLight intensity={0.45} />
        <hemisphereLight args={['#6fa6ff', '#0b1e2d', 0.25]} />
        <directionalLight ref={directionalLightRef} intensity={1.0} color={0xfff0dd} />
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
