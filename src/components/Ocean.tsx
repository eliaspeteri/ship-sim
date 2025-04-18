'use client';
// Example implementation based on the Three.js ocean example
// src/components/Ocean.tsx
import React, { useRef, useMemo, useEffect } from 'react';
import { extend, useFrame, useThree, ThreeElement } from '@react-three/fiber';
import { Water } from 'three/examples/jsm/objects/Water.js';
import * as THREE from 'three';
import useStore from '../store';

// Extend Three.js with Water component
extend({ Water });

// Add type definitions for custom water component
declare module '@react-three/fiber' {
  interface ThreeElements {
    water: ThreeElement<typeof Water>;
  }
}

interface OceanProps {
  size?: number;
  resolution?: number;
  position?: [number, number, number];
  waterColor?: string;
  distortionScale?: number;
}

const Ocean: React.FC<OceanProps> = ({
  size = 10000,
  resolution = 256,
  position = [0, -0.5, 0],
  waterColor = '#001e0f',
  distortionScale = 3.7,
}) => {
  const ref = useRef<THREE.Mesh>(null!);
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);
  const camera = useThree(state => state.camera);

  // Get environment state
  const environment = useStore(state => state.environment);
  const { waveHeight, waveDirection, wind } = environment;
  // Derive waveSpeed from wind speed
  const waveSpeed = wind.speed * 0.2; // Scale wind speed to reasonable wave speed
  // Use wind direction for wave direction if needed
  const windDirection = wind.direction * (180 / Math.PI); // Convert to degrees for calculations

  // Normal maps for water
  const waterNormals = useMemo(() => {
    const textureLoader = new THREE.TextureLoader();
    const normalMap1 = textureLoader.load('/textures/Water_1_M_Normal.jpg');
    const normalMap2 = textureLoader.load('/textures/Water_2_M_Normal.jpg');

    normalMap1.wrapS = normalMap1.wrapT = THREE.RepeatWrapping;
    normalMap2.wrapS = normalMap2.wrapT = THREE.RepeatWrapping;

    return { normalMap1, normalMap2 };
  }, []);

  // Create a cubemap for reflections
  const cubeRenderTarget = useMemo(() => {
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
      format: THREE.RGBFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    });
    // Update to use colorSpace instead of encoding
    cubeRenderTarget.texture.colorSpace = THREE.SRGBColorSpace;
    return cubeRenderTarget;
  }, []);

  // Create a cube camera for reflections
  const cubeCamera = useMemo(() => {
    return new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
  }, [cubeRenderTarget]);

  // Water parameters that respond to environment settings
  const waterOptions = useMemo(() => {
    return {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: waterNormals.normalMap1,
      sunDirection: new THREE.Vector3(0, 1, 0),
      sunColor: 0xffffff,
      waterColor: new THREE.Color(waterColor),
      distortionScale: distortionScale * waveHeight,
      fog: scene.fog !== undefined,
      alpha: 0.9,
      size: 4,
      clipBias: 0.0,
    };
  }, [scene.fog, waterColor, distortionScale, waveHeight, waterNormals]);

  // Wave patterns
  const [wavePattern1, wavePattern2, wavePattern3] = useMemo(() => {
    // Primary wave pattern
    const pattern1 = {
      direction: new THREE.Vector2(
        Math.sin((windDirection * Math.PI) / 180),
        Math.cos((windDirection * Math.PI) / 180),
      ),
      steepness: 0.5,
      wavelength: 20.0,
    };

    // Secondary wave pattern (perpendicular to wind)
    const pattern2 = {
      direction: new THREE.Vector2(
        Math.sin(((windDirection + 90) * Math.PI) / 180),
        Math.cos(((windDirection + 90) * Math.PI) / 180),
      ),
      steepness: 0.15,
      wavelength: 30.0,
    };

    // Tertiary wave pattern (small chop)
    const pattern3 = {
      direction: new THREE.Vector2(
        Math.sin(((windDirection + 45) * Math.PI) / 180),
        Math.cos(((windDirection + 45) * Math.PI) / 180),
      ),
      steepness: 0.05,
      wavelength: 5.0,
    };

    return [pattern1, pattern2, pattern3];
  }, [windDirection]);

  // Water material ref for updating uniforms
  const waterMaterialRef = useRef<THREE.ShaderMaterial>(null!);

  // Generate procedural waves on a custom water shader
  const generateWave = (
    position: THREE.Vector3,
    pattern: any,
    time: number,
  ) => {
    const steepness = pattern.steepness;
    const wavelength = pattern.wavelength;
    const k = (2 * Math.PI) / wavelength;
    const c = Math.sqrt(9.8 / k);
    const d = pattern.direction;
    const f = k * (d.x * position.x + d.y * position.z - c * time);
    const a = steepness / k;

    position.x += d.x * a * Math.cos(f);
    position.y += steepness * Math.sin(f);
    position.z += d.y * a * Math.cos(f);
  };

  // Set up a custom shader for the water with more realistic waves
  useEffect(() => {
    if (ref.current && ref.current.material) {
      const material = ref.current.material as THREE.ShaderMaterial;
      waterMaterialRef.current = material;

      // Store original vertex shader
      const originalVertexShader = material.vertexShader;

      // Enhance vertex shader with custom wave functions
      material.vertexShader = originalVertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        
        // Custom Gerstner waves implementation
        float steepness = ${waveHeight.toFixed(2)};
        float speed = ${waveSpeed.toFixed(2)};
        
        // Apply multiple wave patterns
        vec3 modifiedPosition = transformed;
        
        // Primary wave
        float k1 = 2.0 * 3.14159 / 20.0;
        float a1 = steepness / k1;
        vec2 d1 = normalize(vec2(${wavePattern1.direction.x.toFixed(4)}, ${wavePattern1.direction.y.toFixed(4)}));
        float f1 = k1 * (d1.x * modifiedPosition.x + d1.y * modifiedPosition.z - speed * time);
        modifiedPosition.x += d1.x * a1 * cos(f1);
        modifiedPosition.y += steepness * sin(f1);
        modifiedPosition.z += d1.y * a1 * cos(f1);
        
        // Secondary wave
        float k2 = 2.0 * 3.14159 / 30.0;
        float a2 = (steepness * 0.3) / k2;
        vec2 d2 = normalize(vec2(${wavePattern2.direction.x.toFixed(4)}, ${wavePattern2.direction.y.toFixed(4)}));
        float f2 = k2 * (d2.x * modifiedPosition.x + d2.y * modifiedPosition.z - (speed * 0.7) * time);
        modifiedPosition.x += d2.x * a2 * cos(f2);
        modifiedPosition.y += steepness * 0.3 * sin(f2);
        modifiedPosition.z += d2.y * a2 * cos(f2);
        
        // Tertiary smaller waves
        float k3 = 2.0 * 3.14159 / 5.0;
        float a3 = (steepness * 0.1) / k3;
        vec2 d3 = normalize(vec2(${wavePattern3.direction.x.toFixed(4)}, ${wavePattern3.direction.y.toFixed(4)}));
        float f3 = k3 * (d3.x * modifiedPosition.x + d3.y * modifiedPosition.z - (speed * 1.3) * time);
        modifiedPosition.x += d3.x * a3 * cos(f3);
        modifiedPosition.y += steepness * 0.1 * sin(f3);
        modifiedPosition.z += d3.y * a3 * cos(f3);
        
        // Update normal based on wave gradient
        vec3 bitangent = vec3(1.0, 
          steepness * k1 * d1.x * cos(f1) + 
          steepness * 0.3 * k2 * d2.x * cos(f2) + 
          steepness * 0.1 * k3 * d3.x * cos(f3), 
          0.0);
          
        vec3 tangent = vec3(0.0, 
          steepness * k1 * d1.y * cos(f1) + 
          steepness * 0.3 * k2 * d2.y * cos(f2) + 
          steepness * 0.1 * k3 * d3.y * cos(f3), 
          1.0);
          
        vec3 waveNormal = normalize(cross(bitangent, tangent));
        
        // Use the modified position
        transformed = modifiedPosition;
        `,
      );

      // Update fragment shader for better caustics and foam
      const originalFragmentShader = material.fragmentShader;
      material.fragmentShader = originalFragmentShader
        .replace(
          'void main() {',
          `
        uniform float time;
        
        // Function to create foam based on wave height and position
        float foam(vec2 position, float time, float turbulence) {
          float speed = time * 0.05;
          float smallWaves = sin(position.x * 10.0 + speed) * 
                            cos(position.y * 10.0 + speed) * 0.1;
                            
          float mediumWaves = sin(position.x * 4.0 + speed) * 
                             cos(position.y * 4.0 + speed) * 0.25;
                             
          return clamp(smallWaves + mediumWaves + turbulence, 0.0, 1.0);
        }
        
        void main() {
        `,
        )
        .replace(
          'gl_FragColor = vec4( mix(reflectionSample, refractionSample, reflectance) , alpha );',
          `
        // Add foam based on wave height
        float waveHeight = vUv.y;
        float foamFactor = foam(vUv * 10.0, time, waveHeight * 0.05);
        
        // Mix foam with water color
        vec3 foamColor = vec3(1.0, 1.0, 1.0);
        float foamMask = smoothstep(0.8, 0.95, foamFactor);
        
        // Final mix including foam for whitecaps
        vec3 waterColor = mix(reflectionSample, refractionSample, reflectance);
        vec3 finalColor = mix(waterColor, foamColor, foamMask * ${waveHeight.toFixed(2)} * 0.3);
        
        // Add slight blue tint to deeper areas
        finalColor = mix(finalColor, vec3(0.0, 0.1, 0.2), 0.1);
        
        gl_FragColor = vec4(finalColor, alpha);
        `,
        );

      // Force update shader
      material.needsUpdate = true;
    }
  }, [waveHeight, waveSpeed, wavePattern1, wavePattern2, wavePattern3]);

  // Update cubemap reflections and wave animation
  useFrame((state, delta) => {
    if (ref.current) {
      // Hide water from cubecam
      ref.current.visible = false;

      // Update cube camera reflections
      cubeCamera.update(gl, scene);

      // Show water again
      ref.current.visible = true;

      // Set material uniforms
      const material = ref.current.material as THREE.ShaderMaterial;

      // Update wave parameters based on environment settings
      if (material.uniforms.time) {
        material.uniforms.time.value += delta * waveSpeed;
      }

      if (material.uniforms.distortionScale) {
        material.uniforms.distortionScale.value = distortionScale * waveHeight;
      }

      // Switch between normal maps for variety
      if (material.uniforms.normalSampler && Math.random() < 0.01) {
        material.uniforms.normalSampler.value =
          material.uniforms.normalSampler.value === waterNormals.normalMap1
            ? waterNormals.normalMap2
            : waterNormals.normalMap1;
      }
    }
  });

  // Generate foam texture pattern
  const foamTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = 'white';

      // Create noise pattern for foam
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.5;

        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI);
        context.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  return (
    <>
      {/* Main ocean water */}
      <water
        ref={ref}
        args={[
          new THREE.PlaneGeometry(size, size, resolution, resolution),
          waterOptions,
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={position}
        receiveShadow
      />

      {/* Ship wakes and interaction layer */}
      <mesh
        position={[0, -0.3, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={waveHeight > 0.1}
      >
        <planeGeometry args={[size / 2, size / 2, 128, 128]} />
        <meshStandardMaterial
          color="#ffffff"
          map={foamTexture}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
    </>
  );
};

export default Ocean;
