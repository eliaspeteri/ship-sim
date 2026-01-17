import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const DEEP_COLOR = new THREE.Color(0x0b2b3d);
const BRIGHT_COLOR = new THREE.Color(0x1c5a80);

export function FarWater({
  centerRef,
  sunDirection,
}: {
  centerRef: React.MutableRefObject<{ x: number; y: number }>;
  sunDirection: THREE.Vector3;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const tempColor = useRef(new THREE.Color());

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(centerRef.current.x, -4, centerRef.current.y); // slightly below => no z-fight

    if (materialRef.current) {
      const daylight = Math.max(0, sunDirection.y);
      const t = THREE.MathUtils.clamp(daylight, 0, 1) * 0.8;
      tempColor.current.copy(DEEP_COLOR).lerp(BRIGHT_COLOR, t);
      materialRef.current.color.copy(tempColor.current);
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={-2} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[80000, 80000, 1, 1]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#0c2f45"
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}
