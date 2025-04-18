import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShipProps {
  position: { x: number; y: number; z: number };
  heading: number;
  length?: number;
  beam?: number;
  draft?: number;
}

const Ship: React.FC<ShipProps> = ({
  position,
  heading,
  length = 50,
  beam = 10,
  draft = 3,
}) => {
  const shipRef = useRef<THREE.Group>(null);

  // Update ship position and rotation
  useFrame(() => {
    if (shipRef.current) {
      shipRef.current.position.set(position.x, position.y, position.z);
      shipRef.current.rotation.y = heading; // Apply heading rotation around Y axis
    }
  });

  return (
    <group
      ref={shipRef}
      position={[position.x, position.y, position.z]}
      rotation={[0, heading, 0]}
    >
      {/* Main hull */}
      <mesh position={[0, 0, 0]} castShadow>
        {/* Create a simple hull shape using scaled box geometry */}
        <boxGeometry args={[length, draft, beam]} />
        <meshStandardMaterial color="#555555" />
      </mesh>

      {/* Ship superstructure */}
      <mesh position={[length * 0.2, draft, 0]} castShadow>
        <boxGeometry args={[length * 0.3, draft * 2, beam * 0.8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Bridge */}
      <mesh position={[length * 0.3, draft * 3, 0]} castShadow>
        <boxGeometry args={[length * 0.1, draft, beam * 0.6]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Bow decoration */}
      <mesh position={[length * 0.45, draft, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, beam * 0.9, 8]} />
        <meshStandardMaterial color="#444444" />
        <mesh position={[0, beam * 0.45, 0]}>
          <sphereGeometry args={[0.3]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </mesh>

      {/* Stern decoration */}
      <mesh position={[-length * 0.45, draft * 1.5, 0]} castShadow>
        <boxGeometry args={[length * 0.05, draft * 0.5, beam * 0.6]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
    </group>
  );
};

export default Ship;
