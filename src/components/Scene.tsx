// src/components/Scene.tsx
'use client';

import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Sky,
  AdaptiveDpr,
  AdaptiveEvents,
} from '@react-three/drei';
import dynamic from 'next/dynamic';
import React, {
  Suspense,
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';
import * as THREE from 'three';
import Ship from './Ship';
import useStore from '../store';

// Import Ocean dynamically to avoid SSR issues
const Ocean = dynamic(() => import('./Ocean'), { ssr: false });

// Create low detail version for when simulation is in background or performance is low
const LowDetailOcean = dynamic(
  () =>
    import('./Ocean').then(mod => ({
      default: (props: any) => (
        <mod.default {...props} resolution={64} size={5000} />
      ),
    })),
  { ssr: false },
);

interface SceneProps {
  vesselPosition: {
    x: number;
    y: number;
    heading: number;
  };
}

// Performance monitoring component
function PerformanceMonitor({
  onPerformanceDrop,
}: {
  onPerformanceDrop: (isLow: boolean) => void;
}) {
  const { gl: _gl } = useThree(); // Prefix with underscore to indicate it's not used
  const frameRates: number[] = useRef<number[]>([]).current;
  const lastTime = useRef(performance.now());
  const checkInterval = useRef<number | null>(null);

  useEffect(() => {
    const checkPerformance = () => {
      const now = performance.now();
      const delta = now - lastTime.current;
      lastTime.current = now;

      // Calculate FPS (cap at 60)
      const fps = Math.min(1000 / delta, 60);

      // Keep last 60 frames for analysis
      frameRates.push(fps);
      if (frameRates.length > 60) frameRates.shift();

      // Get average FPS
      const avgFps =
        frameRates.reduce((sum, fps) => sum + fps, 0) / frameRates.length;

      // Signal low performance if average drops below 30fps
      if (avgFps < 30) {
        onPerformanceDrop(true);
      } else if (avgFps > 40) {
        onPerformanceDrop(false);
      }
    };

    // Check every second
    checkInterval.current = window.setInterval(checkPerformance, 1000);

    return () => {
      if (checkInterval.current) window.clearInterval(checkInterval.current);
    };
  }, [frameRates, onPerformanceDrop]);

  return null;
}

export default function Scene({ vesselPosition }: SceneProps) {
  // Get vessel properties from store
  const vesselProperties = useStore(state => state.vessel.properties);

  // Performance state
  const [lowPerformanceMode, setLowPerformanceMode] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Create ref for orbit controls
  const controlsRef = useRef<any>(null);

  // Memory management for disposable objects
  const disposables = useRef<THREE.Object3D[]>([]);

  // Handle visibility change to reduce performance when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Clean up function to dispose of Three.js objects and prevent memory leaks
  const cleanupScene = useCallback(() => {
    disposables.current.forEach(obj => {
      if ((obj as any).geometry) (obj as any).geometry.dispose();
      if ((obj as any).material) {
        const materials = Array.isArray((obj as any).material)
          ? (obj as any).material
          : [(obj as any).material];

        materials.forEach((material: any) => {
          Object.keys(material).forEach(prop => {
            if (
              material[prop] &&
              typeof material[prop].dispose === 'function'
            ) {
              material[prop].dispose();
            }
          });
          material.dispose();
        });
      }
    });
    disposables.current = [];
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupScene();
    };
  }, [cleanupScene]);

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

  // Handle performance drops
  const handlePerformanceDrop = useCallback((isLow: boolean) => {
    setLowPerformanceMode(isLow);
  }, []);

  // Determine which ocean component to use based on performance
  const OceanComponent =
    isTabVisible && !lowPerformanceMode ? Ocean : LowDetailOcean;

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas
        shadows={isTabVisible}
        dpr={[1, isTabVisible ? 2 : 1]} // Lower resolution when tab not visible
        camera={{
          position: [vesselPosition.x - 30, 20, vesselPosition.y - 30],
          fov: 60,
        }}
        frameloop={isTabVisible ? 'always' : 'demand'}
        gl={{
          powerPreference: 'high-performance',
          antialias: isTabVisible && !lowPerformanceMode,
          logarithmicDepthBuffer: false,
        }}
        performance={{ min: 0.5 }}
      >
        <PerformanceMonitor onPerformanceDrop={handlePerformanceDrop} />
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        {/* Sky and lighting */}
        <Sky sunPosition={sunPosition as [number, number, number]} />
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow={isTabVisible}
          shadow-mapSize={lowPerformanceMode ? [1024, 1024] : [2048, 2048]}
        />

        {/* Ocean */}
        <Suspense fallback={null}>
          <OceanComponent />
        </Suspense>

        {/* Ship at the specified position and heading */}
        <Ship
          position={{
            x: vesselPosition.x,
            y: vesselProperties.draft, // At water level
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
          enableDamping={isTabVisible}
          enablePan={false}
          dampingFactor={0.1}
          minDistance={10}
          maxDistance={300}
          // Prevent camera from going below water level
          minPolarAngle={Math.PI * 0.05}
          maxPolarAngle={Math.PI * 0.5}
        />
      </Canvas>
    </div>
  );
}
