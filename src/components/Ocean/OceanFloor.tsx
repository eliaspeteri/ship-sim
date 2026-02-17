'use client';

import { useFrame } from '@react-three/fiber';
import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

// Import shader code
import causticsFragmentShader from './shaders/caustics.frag';
import causticsVertexShader from './shaders/caustics.vert';

/**
 * Props for the OceanFloor component
 */
interface OceanFloorProps {
  size?: number;
  position?: [number, number, number];
  textureUrl?: string;
  causticsColor?: string;
  causticsIntensity?: number;
  causticsSpeed?: number;
}

/**
 * Renders the ocean floor with sand texture and dynamic caustics effect
 */
function OceanFloor({
  size = 100000,
  position = [0, -10, 0],
  textureUrl = '/textures/ocean_floor.jpg',
  causticsColor = '#ffffff',
  causticsIntensity = 0.3,
  causticsSpeed = 0.2,
}: OceanFloorProps): React.ReactElement {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const disposables = useRef<Array<{ dispose: () => void }>>([]);

  // Load sand texture
  const texture = useMemo(() => {
    const textureLoader = new THREE.TextureLoader();
    const tex = textureLoader.load(textureUrl);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(100, 100); // Scale texture to cover large area
    disposables.current.push(tex);
    return tex;
  }, [textureUrl]);

  // Create geometry
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size);
    disposables.current.push(geo);
    return geo;
  }, [size]);

  // Create shader material
  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: causticsVertexShader,
      fragmentShader: causticsFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: texture },
        uCausticsColor: { value: new THREE.Color(causticsColor) },
        uCausticsIntensity: { value: causticsIntensity },
        uCausticsScale: { value: 20.0 },
        uCausticsSpeed: { value: causticsSpeed },
        uCausticsThickness: { value: 0.4 },
        uCausticsOffset: { value: 0.75 },
      },
    });
    disposables.current.push(mat);
    return mat;
  }, [texture, causticsColor, causticsIntensity, causticsSpeed]);

  // Update time uniform in animation loop
  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      disposables.current.forEach(item => {
        if (item && typeof item.dispose === 'function') {
          item.dispose();
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
    >
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" ref={materialRef} />
    </mesh>
  );
}

export default OceanFloor;
