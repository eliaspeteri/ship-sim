// src/components/Scene.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import dynamic from 'next/dynamic';
import React, { Suspense, useRef, useEffect } from 'react';
import { Object3D, Vector3, Mesh as THREE_Mesh } from 'three';

// Import Ocean dynamically
const Ocean = dynamic(() => import('./Ocean'), { ssr: false });

// Add Ship component
interface ShipProps {
  position: { x: number; y: number };
  rotation: number;
}

const Ship: React.FC<ShipProps> = ({ position, rotation }) => {
  // Create a reference to the ship mesh
  const shipRef = useRef<THREE_Mesh>(null);

  return (
    <mesh
      ref={shipRef}
      position={[position.x, 1, position.y]}
      rotation={[0, -rotation, 0]}
    >
      <boxGeometry args={[5, 2, 10]} /> {/* Simple box ship for now */}
      <meshStandardMaterial color="red" />
    </mesh>
  );
};

export default function Scene({ vesselPosition = { x: 0, y: 0, heading: 0 } }) {
  // Create refs for the ship position and controls
  const shipPositionRef = useRef(
    new Vector3(vesselPosition.x, 1, vesselPosition.y),
  );
  const controlsRef = useRef<any>(null);

  // Update the orbit controls target when the ship position changes
  useEffect(() => {
    if (controlsRef.current) {
      // Set the target to follow the ship
      controlsRef.current.target.set(vesselPosition.x, 1, vesselPosition.y);
    }
  }, [vesselPosition.x, vesselPosition.y]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas
        camera={{
          position: [vesselPosition.x, 15, vesselPosition.y + 30],
          fov: 60,
        }}
      >
        <color attach="background" args={['#87ceeb']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

        <Suspense fallback={null}>
          <Ocean />
        </Suspense>

        <Ship
          position={{ x: vesselPosition.x, y: vesselPosition.y }}
          rotation={vesselPosition.heading}
        />

        {/* Add ref to OrbitControls with height restrictions */}
        <OrbitControls
          ref={controlsRef}
          target={[vesselPosition.x, 1, vesselPosition.y]}
          enableDamping={true}
          dampingFactor={0.1}
          minDistance={10}
          maxDistance={100}
          // Prevent camera from going below water level
          minPolarAngle={Math.PI * 0.05} // About 9 degrees above horizontal
          maxPolarAngle={Math.PI * 0.5} // Maximum is straight horizontal (90 degrees)
        />
      </Canvas>
    </div>
  );
}
