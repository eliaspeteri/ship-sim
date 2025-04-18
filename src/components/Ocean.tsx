'use client';
// Example implementation based on the Three.js ocean example
// src/components/Ocean.tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import React from 'react';

export default function Ocean() {
  const waterRef = useRef<THREE.Mesh | null>(null);

  const waterGeometry = useMemo(
    () => new THREE.PlaneGeometry(10000, 10000),
    [],
  );

  const water = useMemo(() => {
    // Initialize with parameters from the Three.js example
    return new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        '/textures/Water_1_M_Normal.jpg',
        texture => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(10, 10);
        },
      ),
      sunDirection: new THREE.Vector3(0, 1, 0),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: false,
    });
  }, [waterGeometry]);

  useFrame((state, delta) => {
    // Update water simulation
    if (waterRef.current) {
      (waterRef.current.material as THREE.ShaderMaterial).uniforms[
        'time'
      ].value += delta;
    }
  });

  return (
    <>
      <primitive ref={waterRef} object={water} rotation-x={-Math.PI / 2} />
    </>
  );
}
