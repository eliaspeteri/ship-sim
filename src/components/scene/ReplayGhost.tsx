import React from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';

export function ReplayGhost({
  frames,
  playing,
  size,
  onComplete,
}: {
  frames: Array<{
    timestamp: number;
    position: { x: number; y: number; z: number };
    orientation: { heading: number; roll: number; pitch: number };
  }>;
  playing: boolean;
  size: { length: number; beam: number; draft: number };
  onComplete: () => void;
}) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const indexRef = React.useRef(0);
  const startRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!playing) {
      indexRef.current = 0;
      startRef.current = null;
    }
  }, [playing]);

  useFrame(() => {
    if (!playing || frames.length === 0 || !meshRef.current) return;

    if (startRef.current === null) {
      startRef.current = performance.now();
      indexRef.current = 0;
    }

    const elapsed = performance.now() - startRef.current;
    const targetTime = frames[0].timestamp + elapsed;

    while (
      indexRef.current < frames.length - 1 &&
      frames[indexRef.current].timestamp < targetTime
    ) {
      indexRef.current += 1;
    }

    const frame = frames[indexRef.current];
    const sink = -size.draft * 0.35;
    meshRef.current.position.set(
      frame.position.x,
      frame.position.y + sink,
      frame.position.z,
    );
    meshRef.current.rotation.set(
      frame.orientation.pitch,
      -frame.orientation.heading - Math.PI / 2,
      frame.orientation.roll,
    );

    if (indexRef.current >= frames.length - 1) {
      onComplete();
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[size.length, size.draft * 1.2, size.beam]} />
      <meshStandardMaterial
        color="#8cc6ff"
        opacity={0.35}
        transparent
        roughness={0.2}
        metalness={0.1}
      />
    </mesh>
  );
}
