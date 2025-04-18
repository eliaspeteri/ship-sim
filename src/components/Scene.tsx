// src/components/Scene.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import dynamic from 'next/dynamic';
import React, { Suspense, useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import Ship from './Ship';
import useStore from '../store';

// Import Ocean dynamically to avoid SSR issues
const Ocean = dynamic(() => import('./Ocean'), { ssr: false });

interface SceneProps {
  vesselPosition: {
    x: number;
    y: number;
    heading: number;
  };
}

export default function Scene({ vesselPosition }: SceneProps) {
  // Get vessel properties from store
  const vesselProperties = useStore(state => state.vessel.properties);
  const environment = useStore(state => state.environment);

  // Create ref for orbit controls
  const controlsRef = useRef<any>(null);

  // Update the orbit controls target when the ship position changes
  useEffect(() => {
    if (controlsRef.current) {
      // Set the target to follow the ship
      controlsRef.current.target.set(vesselPosition.x, 0, vesselPosition.y);
    }
  }, [vesselPosition.x, vesselPosition.y]);

  // Calculate sun position based on time of day
  const hour = new Date().getHours();
  const sunPosition = [
    Math.cos((hour / 24) * Math.PI * 2) * 100,
    Math.sin((hour / 24) * Math.PI * 2) * 100,
    0,
  ];

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas
        shadows
        camera={{
          position: [vesselPosition.x - 30, 20, vesselPosition.y - 30],
          fov: 60,
        }}
      >
        {/* Sky and lighting */}
        <Sky sunPosition={sunPosition as [number, number, number]} />
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        {/* Ocean */}
        <Suspense fallback={null}>
          <Ocean />
        </Suspense>

        {/* Ship at the specified position and heading */}
        <Ship
          position={{
            x: vesselPosition.x,
            y: 0, // At water level
            z: vesselPosition.y, // Note: Z is used for Y in the 3D world
          }}
          heading={vesselPosition.heading}
          length={vesselProperties.length}
          beam={vesselProperties.beam}
          draft={vesselProperties.draft}
        />

        {/* Camera Controls */}
        <OrbitControls
          ref={controlsRef}
          target={[vesselPosition.x, 0, vesselPosition.y]}
          enableDamping={true}
          dampingFactor={0.1}
          minDistance={10}
          maxDistance={150}
          // Prevent camera from going below water level
          minPolarAngle={Math.PI * 0.05}
          maxPolarAngle={Math.PI * 0.5}
        />
      </Canvas>
    </div>
  );
}
