import { useFrame, useThree } from '@react-three/fiber';
import React from 'react';
import * as THREE from 'three';

export function CameraHeadingTracker({
  enabled,
  onHeadingChange,
}: {
  enabled: boolean;
  onHeadingChange: (headingDeg: number) => void;
}) {
  const { camera } = useThree();
  const lastUpdateRef = React.useRef({ heading: 0, timestamp: 0 });
  const directionRef = React.useRef(new THREE.Vector3());

  useFrame(() => {
    if (!enabled) return;

    camera.getWorldDirection(directionRef.current).setY(0);
    if (directionRef.current.lengthSq() === 0) return;
    directionRef.current.normalize();

    const headingRad = Math.atan2(
      -directionRef.current.x,
      directionRef.current.z,
    );
    const headingDeg = (THREE.MathUtils.radToDeg(headingRad) + 360) % 360;
    const now = performance.now();

    if (
      Math.abs(headingDeg - lastUpdateRef.current.heading) < 0.5 &&
      now - lastUpdateRef.current.timestamp < 120
    ) {
      return;
    }

    lastUpdateRef.current = { heading: headingDeg, timestamp: now };
    onHeadingChange(headingDeg);
  });

  return null;
}
