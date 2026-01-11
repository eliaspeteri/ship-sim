import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function FarWater({
  centerRef,
}: {
  centerRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(centerRef.current.x, -4, centerRef.current.y); // slightly below => no z-fight
  });

  return (
    <mesh ref={ref} renderOrder={-2} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[80000, 80000, 1, 1]} />
      <meshStandardMaterial color="#0c2f45" roughness={1} metalness={0} />
    </mesh>
  );
}
