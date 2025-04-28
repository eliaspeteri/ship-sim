import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useStore from '../store';

/**
 * Interface for WaveSystem props
 */
interface WaveSystemProps {
  resolution: number;
  size: number;
  position?: [number, number, number];
  followTarget?: THREE.Vector3 | [number, number, number];
}

/**
 * Generates a realistic 3D wave surface using Gerstner wave algorithms
 * and integrates with WASM physics for wave calculations
 */
const WaveSystem: React.FC<WaveSystemProps> = ({
  resolution = 128,
  size = 1000,
  position = [0, 0, 0],
  followTarget,
}) => {
  // References to mesh and material
  const meshRef = useRef<THREE.Mesh>(null);

  // Get environment state from store
  const environment = useStore(state => state.environment);
  const wasmVesselPtr = useStore(state => state.wasmVesselPtr);
  const wasmExports = useStore(state => state.wasmExports);

  // Calculate wave parameters based on environment
  const waveHeight = useMemo(() => {
    // Use exponential scaling for more dramatic effect at higher sea states
    return Math.max(0.1, Math.pow(environment.seaState, 1.5) * 0.4);
  }, [environment.seaState]);

  const waveSpeed = useMemo(() => {
    // Wave speed increases with wind speed
    return Math.max(0.2, environment.wind.speed * 0.3);
  }, [environment.wind.speed]);

  // Convert wind direction from radians to normalized vector
  const windDirection = useMemo(() => {
    return new THREE.Vector2(
      Math.sin(environment.wind.direction),
      Math.cos(environment.wind.direction),
    );
  }, [environment.wind.direction]);

  // Create geometry
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);

    // Initialize custom attributes for wave animation
    const waveFactor = new Float32Array(resolution * resolution);
    const waveHeight = new Float32Array(resolution * resolution);
    const wavePhase = new Float32Array(resolution * resolution);

    for (let i = 0; i < resolution * resolution; i++) {
      waveFactor[i] = Math.random();
      waveHeight[i] = Math.random();
      wavePhase[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('waveFactor', new THREE.BufferAttribute(waveFactor, 1));
    geo.setAttribute('waveHeight', new THREE.BufferAttribute(waveHeight, 1));
    geo.setAttribute('wavePhase', new THREE.BufferAttribute(wavePhase, 1));

    return geo;
  }, [size, resolution]);

  // Create material with custom shaders for wave animation
  const material = useMemo(() => {
    // Calculate wave steepness based on sea state
    const steepness = Math.min(1.0, 0.1 + environment.seaState * 0.08);

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWindDirection: { value: windDirection },
        uWindSpeed: { value: environment.wind.speed },
        uWaveHeight: { value: waveHeight },
        uWaveSpeed: { value: waveSpeed },
        uSeaState: { value: environment.seaState },
        uSteepness: { value: steepness },
        uWaveLength: { value: 40.0 + environment.seaState * 5 },
        uWaterColor: { value: new THREE.Color('#104070') },
        uFoamColor: { value: new THREE.Color('#FFFFFF') },
        uFoamThreshold: {
          value: Math.max(0.6, 0.65 - environment.seaState * 0.02),
        },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2 uWindDirection;
        uniform float uWindSpeed;
        uniform float uWaveHeight;
        uniform float uWaveSpeed;
        uniform float uSeaState;
        uniform float uSteepness;
        uniform float uWaveLength;
        
        attribute float waveFactor;
        attribute float waveHeight;
        attribute float wavePhase;
        
        varying float vElevation;
        varying vec3 vNormal;
        
        // Gerstner wave function for realistic ocean waves
        vec3 gerstnerWave(vec3 position, float steepness, float wavelength, float speed, vec2 direction, float phase) {
          vec3 result = position;
          
          float k = 2.0 * 3.14159 / wavelength;
          float a = steepness / k;
          float f = k * (dot(direction, position.xz) - speed * uTime + phase);
          
          result.x += direction.x * a * cos(f);
          result.y += a * sin(f);
          result.z += direction.y * a * cos(f);
          
          return result;
        }
        
        void main() {
          vec3 pos = position;
          float positionFactor = waveFactor * 0.5 + 0.5;
          
          // Primary wave following wind direction
          vec2 primaryDirection = normalize(uWindDirection);
          float primarySpeed = uWaveSpeed * (1.0 + uSeaState * 0.2);
          float primaryLength = uWaveLength * (1.0 + waveHeight * 0.2);
          pos = gerstnerWave(pos, uSteepness, primaryLength, primarySpeed, primaryDirection, wavePhase);
          
          // Secondary wave at angle to wind
          vec2 secondaryDirection = normalize(vec2(primaryDirection.y, -primaryDirection.x));
          float secondarySpeed = uWaveSpeed * 0.7;
          float secondaryLength = uWaveLength * 0.6;
          pos = gerstnerWave(pos, uSteepness * 0.6, secondaryLength, secondarySpeed, secondaryDirection, wavePhase * 1.3);
          
          // Additional choppy waves for high sea states
          if (uSeaState > 3.0) {
            vec2 choppyDir = normalize(primaryDirection + vec2(waveFactor - 0.5, waveHeight - 0.5) * 0.2);
            float choppyLength = 8.0 + waveFactor * 4.0;
            pos = gerstnerWave(pos, uSteepness * 0.3, choppyLength, uWaveSpeed * 1.5, choppyDir, wavePhase * 2.7);
          }
          
          // Final height modulation for more natural look
          float heightScale = uWaveHeight * (0.8 + waveHeight * 0.4);
          vElevation = pos.y * heightScale;
          pos.y *= heightScale;
          
          // Calculate vertex normal for lighting
          vec3 tangent = vec3(1.0, 
            uSteepness * sin(wavePhase + uTime * uWaveSpeed),
            0.0);
            
          vec3 bitangent = vec3(0.0, 
            uSteepness * sin(wavePhase + uTime * uWaveSpeed + 3.14159 * 0.5),
            1.0);
            
          vNormal = normalize(cross(tangent, bitangent));
            
          // Final position
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uWaterColor;
        uniform vec3 uFoamColor;
        uniform float uSeaState;
        uniform float uFoamThreshold;
        
        varying float vElevation;
        varying vec3 vNormal;
        
        void main() {
          // Basic water coloring with foam on wave crests
          float foam = smoothstep(uFoamThreshold, 1.0, vElevation);
          
          // Adjust foam based on sea state
          foam *= min(1.0, uSeaState * 0.15);
          
          // Mix water and foam color
          vec3 color = mix(uWaterColor, uFoamColor, foam);
          
          // Simple diffuse lighting
          float diffuse = max(0.3, dot(vNormal, normalize(vec3(0.5, 1.0, 0.3))));
          color *= diffuse;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
  }, [
    environment.seaState,
    environment.wind.speed,
    windDirection,
    waveHeight,
    waveSpeed,
  ]);

  // Follow target if provided
  useEffect(() => {
    if (!followTarget || !meshRef.current) return;

    const targetPosition =
      followTarget instanceof THREE.Vector3
        ? followTarget
        : new THREE.Vector3(...followTarget);

    meshRef.current.position.x = targetPosition.x;
    meshRef.current.position.z = targetPosition.z;
  }, [followTarget]);

  // Update wave animation
  useFrame((_, delta) => {
    if (meshRef.current && material) {
      // Update time uniform for wave animation
      material.uniforms.uTime.value += delta * waveSpeed;

      // If we have a WASM pointer and followTarget, update vessel wave height data
      if (wasmVesselPtr && followTarget && wasmExports) {
        const mesh = meshRef.current;
        const targetPos =
          followTarget instanceof THREE.Vector3
            ? followTarget
            : new THREE.Vector3(...followTarget);

        // Sample wave height at vessel position - this would be used by the physics engine
        const samplePos = new THREE.Vector3(
          targetPos.x - mesh.position.x,
          0,
          targetPos.z - mesh.position.z,
        );

        // Calculate wave properties for the current location
        if (
          wasmExports.calculateWaveHeight &&
          wasmExports.calculateWaveLength &&
          wasmExports.calculateWaveFrequency &&
          wasmExports.calculateWaveHeightAtPosition
        ) {
          const waveHeight = wasmExports.calculateWaveHeight(
            environment.seaState,
          );
          const waveLength = wasmExports.calculateWaveLength(
            environment.seaState,
          );
          const waveFrequency = wasmExports.calculateWaveFrequency(
            environment.seaState,
          );

          // Use the physics engine to calculate actual wave height at vessel position
          const height = wasmExports.calculateWaveHeightAtPosition(
            samplePos.x,
            samplePos.z,
            material.uniforms.uTime.value,
            waveHeight,
            waveLength,
            waveFrequency,
            environment.wind.direction,
            environment.seaState,
          );
          console.info('Wave height at vessel position:', height);

          // Get current phase based on position and time
          const k = (2.0 * Math.PI) / waveLength;
          const dirX = Math.cos(environment.wind.direction);
          const dirY = Math.sin(environment.wind.direction);
          const dot = samplePos.x * dirX + samplePos.z * dirY;
          const phase = k * dot - waveFrequency * material.uniforms.uTime.value;

          // Update vessel wave data in the physics engine
          if (wasmExports.setWaveData) {
            wasmExports.setWaveData(wasmVesselPtr, height, phase);
          }
        }
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      attach={material}
      position={
        position instanceof THREE.Vector3 ? position.toArray() : position
      }
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
};

export default WaveSystem;
