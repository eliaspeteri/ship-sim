import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLonToXY, xyToLatLon } from '../../lib/geo';

export function GeoDebugMarkers({
  enabled,
  focusRef,
}: {
  enabled: boolean;
  focusRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const groupRef = React.useRef<THREE.Group>(null);
  const northRef = React.useRef<THREE.Mesh>(null);
  const eastRef = React.useRef<THREE.Mesh>(null);
  const tmpVec = React.useRef(new THREE.Vector3());
  const markerHeight = 6;
  const axesSize = 120;

  useFrame(() => {
    if (!enabled || !groupRef.current) return;

    groupRef.current.position.set(
      focusRef.current.x,
      markerHeight,
      focusRef.current.y,
    );

    const { lat, lon } = xyToLatLon({
      x: focusRef.current.x,
      y: focusRef.current.y,
    });
    const north = latLonToXY({ lat: lat + 0.01, lon });
    const east = latLonToXY({ lat, lon: lon + 0.01 });

    if (northRef.current) {
      northRef.current.position.copy(
        tmpVec.current.set(
          north.x - focusRef.current.x,
          0,
          north.y - focusRef.current.y,
        ),
      );
    }
    if (eastRef.current) {
      eastRef.current.position.copy(
        tmpVec.current.set(
          east.x - focusRef.current.x,
          0,
          east.y - focusRef.current.y,
        ),
      );
    }
  });

  if (!enabled) return null;

  return (
    <group ref={groupRef}>
      <axesHelper args={[axesSize]} />
      <mesh ref={northRef}>
        <sphereGeometry args={[10, 14, 14]} />
        <meshBasicMaterial color="#3da9ff" />
      </mesh>
      <mesh ref={eastRef}>
        <sphereGeometry args={[10, 14, 14]} />
        <meshBasicMaterial color="#ff6b6b" />
      </mesh>
    </group>
  );
}
