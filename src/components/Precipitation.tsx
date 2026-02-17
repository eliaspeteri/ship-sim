import { useFrame } from '@react-three/fiber';
import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import * as THREE from 'three';

// Define types for precipitation effects
interface PrecipitationProps {
  type: 'rain' | 'snow' | 'fog' | 'none';
  intensity: number; // 0 to 1
  position?: THREE.Vector3 | [number, number, number];
  color?: string;
  count?: number;
  size?: number;
  speed?: number;
  area?: number;
  inCanvas?: boolean; // Flag to determine if component is rendered inside Canvas
}

/**
 * Renders precipitation effects (rain, snow, or fog)
 *
 * @param type - Type of precipitation effect
 * @param intensity - Intensity of the effect (0-1)
 * @param position - Center position of the effect
 * @param color - Color of the particles
 * @param count - Number of particles
 * @param size - Size of particles
 * @param speed - Fall speed
 * @param area - Area covered by precipitation
 * @param inCanvas - Whether the component is rendered inside a Canvas component
 */
const Precipitation: React.FC<PrecipitationProps> = ({
  type,
  intensity,
  position = [0, 100, 0],
  color,
  count,
  size,
  speed,
  area = 1000,
  inCanvas = true, // Default to true for backward compatibility
}) => {
  const isDisabled = type === 'none' || intensity <= 0;

  const particlesRef = useRef<THREE.Points>(null);
  const seeded = (index: number, salt: number): number => {
    const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  // Calculate particles count based on intensity and type
  const particleCount = useMemo(() => {
    if (count) return count;

    const baseCount = type === 'fog' ? 200 : 1000;
    return Math.floor(baseCount * intensity);
  }, [type, intensity, count]);

  // Generate particle colors based on the type
  const particleColor = useMemo(() => {
    if (color) return new THREE.Color(color);

    switch (type) {
      case 'rain':
        return new THREE.Color('#d4f1f9');
      case 'snow':
        return new THREE.Color('#ffffff');
      case 'fog':
        return new THREE.Color('#e6e6e6');
      default:
        return new THREE.Color('#ffffff');
    }
  }, [type, color]);

  // Calculate particle size based on type and provided size
  const particleSize = useMemo(() => {
    if (size) return size;

    switch (type) {
      case 'rain':
        return 0.8;
      case 'snow':
        return 1.2;
      case 'fog':
        return 12;
      default:
        return 1.0;
    }
  }, [type, size]);

  // Calculate fall speed based on type and provided speed
  const fallSpeed = useMemo(() => {
    if (speed) return speed;

    switch (type) {
      case 'rain':
        return 80 * intensity;
      case 'snow':
        return 8 * intensity;
      case 'fog':
        return 0.8 * intensity;
      default:
        return 10 * intensity;
    }
  }, [type, intensity, speed]);

  // Create particles geometry and material
  const [geometry, material, particlePositions] = useMemo(() => {
    // Create buffer geometry
    const geometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    // Position particles randomly based on the area
    const halfArea = area / 2;
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Different distribution strategies based on precipitation type
      if (type === 'fog') {
        // Fog particles distributed more evenly, with limited height variation
        particlePositions[i3] = seeded(i, 1) * area - halfArea; // x
        particlePositions[i3 + 1] = seeded(i, 2) * 20; // y - low to the ground
        particlePositions[i3 + 2] = seeded(i, 3) * area - halfArea; // z
      } else {
        // Rain and snow distributed across the full area and height
        particlePositions[i3] = seeded(i, 4) * area - halfArea; // x
        particlePositions[i3 + 1] = seeded(i, 5) * 200; // y - up to 200 units high
        particlePositions[i3 + 2] = seeded(i, 6) * area - halfArea; // z
      }
    }

    // Set particle positions
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3),
    );

    // Create different materials based on precipitation type
    let material: THREE.Material;

    if (type === 'rain') {
      // Line material for rain streaks
      material = new THREE.LineBasicMaterial({
        color: particleColor,
        opacity: Math.min(0.6, intensity * 0.8),
        transparent: true,
        fog: true,
      });
    } else if (type === 'fog') {
      // Points material with larger, semi-transparent particles for fog
      material = new THREE.PointsMaterial({
        color: particleColor,
        size: particleSize,
        opacity: Math.min(0.4, intensity * 0.5),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: true,
        sizeAttenuation: true,
      });
    } else {
      // Point material for snow
      material = new THREE.PointsMaterial({
        color: particleColor,
        size: particleSize,
        opacity: Math.min(0.8, intensity * 0.9),
        transparent: true,
        fog: true,
        sizeAttenuation: true,
      });
    }

    return [geometry, material, particlePositions];
  }, [type, particleCount, area, intensity, particleColor, particleSize]);

  // Function to animate precipitation particles
  const animateParticles = useCallback(
    (delta: number) => {
      if (!particlesRef.current || !particlesRef.current.geometry) return;

      const positionAttribute =
        particlesRef.current.geometry.getAttribute('position');

      if (!positionAttribute || !positionAttribute.array) return;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Update Y position (falling)
        positionAttribute.array[i3 + 1] -= fallSpeed * delta;

        // Add side movement for snow and rain (wind effect)
        if (type !== 'fog') {
          if (type === 'snow') {
            // Snow has gentle side-to-side movement
            positionAttribute.array[i3] +=
              Math.sin(Date.now() * 0.001 + i) * 0.05 * intensity;
          } else if (type === 'rain') {
            // Rain falls straighter but has some wind effect
            positionAttribute.array[i3] += 0.2 * intensity;
          }
        } else {
          // Fog drifts slowly
          positionAttribute.array[i3] +=
            Math.sin(Date.now() * 0.0002 + i) * 0.02;
          positionAttribute.array[i3 + 2] +=
            Math.cos(Date.now() * 0.0002 + i) * 0.02;
        }

        // Reset particles that fell below the ground
        const xPos = positionAttribute.array[i3];
        const yPos = positionAttribute.array[i3 + 1];
        const zPos = positionAttribute.array[i3 + 2];
        const halfArea = area / 2;

        if (
          yPos < 0 ||
          xPos > halfArea ||
          xPos < -halfArea ||
          zPos > halfArea ||
          zPos < -halfArea
        ) {
          // Respawn at the top with random x,z position
          positionAttribute.array[i3] = Math.random() * area - halfArea;
          positionAttribute.array[i3 + 1] =
            type === 'fog' ? Math.random() * 20 : 200;
          positionAttribute.array[i3 + 2] = Math.random() * area - halfArea;
        }
      }

      positionAttribute.needsUpdate = true;
    },
    [area, fallSpeed, intensity, particleCount, type],
  );

  // Animation in Canvas.
  useFrame((_, delta) => {
    if (!inCanvas || isDisabled) return;
    animateParticles(delta);
  });

  // Fallback animation outside Canvas.
  useEffect(() => {
    if (inCanvas || isDisabled) return;
    let animationFrameId: number;
    let lastTime = 0;

    const animate = (time: number) => {
      if (lastTime === 0) lastTime = time;
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      animateParticles(delta);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [animateParticles, inCanvas, isDisabled]);

  const lineGeometry = useMemo(() => {
    if (type !== 'rain') return null;
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      vertices.push(
        particlePositions[i3],
        particlePositions[i3 + 1],
        particlePositions[i3 + 2],
        particlePositions[i3],
        particlePositions[i3 + 1] - 1.0 - intensity * 2,
        particlePositions[i3 + 2],
      );
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geo;
  }, [type, particleCount, particlePositions, intensity]);

  if (isDisabled) {
    return null;
  }

  // Return different primitives based on precipitation type
  if (type === 'rain') {
    return (
      <group
        position={
          position instanceof THREE.Vector3 ? position.toArray() : position
        }
      >
        <lineSegments
          ref={particlesRef}
          geometry={lineGeometry ?? undefined}
          attach={material}
        />
      </group>
    );
  }

  // For snow and fog, use points
  return (
    <group
      position={
        position instanceof THREE.Vector3 ? position.toArray() : position
      }
    >
      <points ref={particlesRef} geometry={geometry} attach={material} />
    </group>
  );
};

export default Precipitation;
