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
  useMemo,
} from 'react';
import * as THREE from 'three';
import Ship from './Ship';
import useStore from '../store';
import MemoryMonitor from './MemoryMonitor';
import Precipitation from './Precipitation';

// Define interfaces for Ocean component props
interface OceanProps {
  size: number;
  resolution: number;
  position: [number, number, number];
  waterColor: string;
  distortionScale: number;
}

// Import Ocean dynamically to avoid SSR issues
const Ocean = dynamic(() => import('./Ocean'), { ssr: false });

// Create low detail version for when simulation is in background or performance is low
const LowDetailOcean = dynamic(
  () =>
    import('./Ocean').then(mod => ({
      default: (props: Partial<OceanProps>) => (
        <mod.default
          size={5000}
          resolution={64}
          position={[0, -0.5, 0]}
          waterColor="#001e0f"
          distortionScale={3.7}
          {...props}
        />
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

// Component that handles WebGL context loss events
function ContextLossHandler({ onContextLost }: { onContextLost: () => void }) {
  const { gl } = useThree();

  useEffect(() => {
    // Get the canvas element from the renderer
    const canvas = gl.domElement;

    const handleContextLost = (event: globalThis.Event) => {
      event.preventDefault?.();
      console.warn('WebGL context lost - forcing cleanup');
      onContextLost();
    };

    // Add event listener directly to the canvas
    canvas.addEventListener('webglcontextlost', handleContextLost);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
    };
  }, [gl, onContextLost]);

  return null;
}

// Performance monitoring component
function PerformanceMonitor({
  onPerformanceDrop,
}: {
  onPerformanceDrop: (isLow: boolean) => void;
}) {
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
      console.info('Cleaning up performance monitor...');
      if (checkInterval.current) window.clearInterval(checkInterval.current);
    };
  }, [frameRates, onPerformanceDrop]);

  return null;
}

export default function Scene({ vesselPosition }: SceneProps) {
  // Get vessel properties and environment from store
  const vesselProperties = useStore(state => state.vessel.properties);
  const environment = useStore(state => state.environment);

  // Performance state
  const [lowPerformanceMode, setLowPerformanceMode] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Create ref for orbit controls - using typeof to refer to the component value
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  // Memory management for disposable objects
  const disposables = useRef<THREE.Object3D[]>([]);

  // Handle visibility change to reduce performance when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      console.info('Cleaning up visibility change listener...');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Clean up function to dispose of Three.js objects and prevent memory leaks
  const cleanupScene = useCallback(() => {
    console.info('Cleaning up scene...');
    disposables.current.forEach(obj => {
      const objWithGeometry = obj as unknown as {
        geometry?: { dispose: () => void };
      };
      const objWithMaterial = obj as unknown as {
        material?: THREE.Material | THREE.Material[];
      };

      if (objWithGeometry.geometry) {
        objWithGeometry.geometry.dispose();
      }

      if (objWithMaterial.material) {
        const materials = Array.isArray(objWithMaterial.material)
          ? objWithMaterial.material
          : [objWithMaterial.material];

        materials.forEach((material: THREE.Material) => {
          Object.keys(material).forEach(prop => {
            const value = material[prop as keyof THREE.Material];
            if (
              value &&
              typeof (value as unknown as { dispose?: () => void }).dispose ===
                'function'
            ) {
              (value as unknown as { dispose: () => void }).dispose();
            }
          });
          material.dispose();
        });
      }
    });

    // Clear array and help GC
    disposables.current = [];

    // Attempt to force garbage collection when available
    const windowWithGC = window as unknown as { gc?: () => void };
    if (typeof window !== 'undefined' && windowWithGC.gc) {
      windowWithGC.gc();
    }
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
      // OrbitControls has a target property of type Vector3
      (controlsRef.current as unknown as { target: THREE.Vector3 }).target.set(
        vesselPosition.x,
        0,
        vesselPosition.y,
      );
    }
  }, [vesselPosition.x, vesselPosition.y]);

  // Calculate sun position based on time of day from environment
  const sunPosition = useMemo(() => {
    // Convert environment time (0-24) to radians (0-2π)
    const timeRad = (environment.timeOfDay / 24) * Math.PI * 2;

    // Position sun in the sky based on time
    return [Math.cos(timeRad) * 100, Math.sin(timeRad) * 100, 0] as [
      number,
      number,
      number,
    ];
  }, [environment.timeOfDay]);

  // Handle performance drops
  const handlePerformanceDrop = useCallback((isLow: boolean) => {
    setLowPerformanceMode(isLow);
  }, []);

  // Calculate water color based on environment conditions
  const getWaterColor = useCallback(() => {
    // Base deep ocean color
    let baseColor = '#001e0f';

    // Adjust color based on time of day
    if (environment.timeOfDay < 6 || environment.timeOfDay > 18) {
      // Darker at night
      baseColor = '#00090a';
    } else if (environment.timeOfDay < 8 || environment.timeOfDay > 16) {
      // Dawn/dusk tint
      baseColor = '#00121a';
    }

    // Adjust for stormy conditions
    if (environment.seaState > 5) {
      baseColor = '#001620'; // Darker, stormier color
    }

    return baseColor;
  }, [environment.timeOfDay, environment.seaState]);

  // Calculate distortion scale based on sea state
  const getDistortionScale = useCallback(() => {
    // Base distortion
    const baseDistortion = 3.7;

    // Increase distortion with sea state
    return baseDistortion * (1 + environment.seaState * 0.15);
  }, [environment.seaState]);

  // Default ocean props
  const oceanProps: OceanProps = {
    size: 10000,
    resolution: lowPerformanceMode ? 128 : 256,
    position: [0, -0.5, 0],
    waterColor: getWaterColor(),
    distortionScale: getDistortionScale(),
  };

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
        {/* Context loss handling moved to a separate component */}
        <ContextLossHandler onContextLost={cleanupScene} />
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
          <OceanComponent {...oceanProps} />
        </Suspense>

        {/* Precipitation */}
        {environment.precipitation !== 'none' &&
          environment.precipitationIntensity > 0 && (
            <Precipitation
              type={environment.precipitation}
              intensity={environment.precipitationIntensity}
              position={[vesselPosition.x, 0, vesselPosition.y]}
              area={2000}
              speed={
                environment.precipitation === 'rain'
                  ? 80 *
                    environment.precipitationIntensity *
                    (1 + environment.wind.speed * 0.1)
                  : undefined
              }
            />
          )}

        {/* Ship at the specified position and heading */}
        <Ship
          position={{
            x: vesselPosition.x,
            y: vesselProperties.draft, // At water level
            z: vesselPosition.y, // Note: Z is used for Y in the 3D world
          }}
          heading={vesselPosition.heading}
          shipType={vesselProperties.type}
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

      {/* Add memory monitor component */}
      <MemoryMonitor />
    </div>
  );
}
