'use client';
import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { extend, useFrame, useThree } from '@react-three/fiber';
import { Water } from 'three/examples/jsm/objects/Water.js';
import * as THREE from 'three';
import useStore from '../store';

// Extend Three.js with Water component
extend({ Water });

// Wave physics constants - increased amplitude factors for more dramatic visual effect
const WAVE_SPEED_FACTOR = 0.3; // How much wind speed affects wave speed
const WAVE_HEIGHT_FACTOR = 0.4; // Significantly increased for more dramatic waves
const WAVE_FOAM_THRESHOLD = 0.7; // When to show foam based on wave height
const MAX_WAVE_HEIGHT = 15.0; // Maximum wave height in meters for extreme conditions

// Wave frequency modulation by sea state - adjusted for more dramatic visual difference
const WAVE_FREQUENCY_FACTOR = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.15];

interface OceanProps {
  size: number;
  resolution: number;
  position: [number, number, number];
  waterColor: string;
  distortionScale: number;
}

function Ocean({
  size = 10000,
  resolution = 256,
  position = [0, -0.5, 0],
  waterColor = '#001e0f',
  distortionScale = 3.7,
}: OceanProps) {
  const ref = useRef<THREE.Mesh>(null);
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);

  // Track all resources that need to be disposed
  const disposables = useRef<Array<{ dispose: () => void }>>([]);

  // Get environment state from the store
  const environment = useStore(state => state.environment);
  const wasmVesselPtr = useStore(state => state.wasmVesselPtr);
  const wasmExports = useStore(state => state.wasmExports);
  const vesselPosition = useStore(state => state.vessel.position);

  // Compute sea state from wind speed (always in sync with physics engine)
  const computedSeaState = useMemo(
    () => calculateBeaufortScale(environment.wind.speed),
    [environment.wind.speed],
  );

  // Calculate wave parameters based on computed sea state
  const waveHeight = useMemo(() => {
    return Math.min(
      MAX_WAVE_HEIGHT,
      Math.max(0.1, computedSeaState * WAVE_HEIGHT_FACTOR),
    );
  }, [computedSeaState]);

  const waveSpeed = useMemo(() => {
    return environment.wind.speed * WAVE_SPEED_FACTOR;
  }, [environment.wind.speed]);

  // Convert wind direction from radians to degrees for calculations
  const windDirection = useMemo(() => {
    return environment.wind.direction * (180 / Math.PI);
  }, [environment.wind.direction]);

  // Load water normal maps with proper resource tracking
  const waterNormals = useMemo(() => {
    const textureLoader = new THREE.TextureLoader();
    const normalMap1 = textureLoader.load('/textures/Water_1_M_Normal.jpg');
    const normalMap2 = textureLoader.load('/textures/Water_2_M_Normal.jpg');

    normalMap1.wrapS = normalMap1.wrapT = THREE.RepeatWrapping;
    normalMap2.wrapS = normalMap2.wrapT = THREE.RepeatWrapping;

    // Add textures to disposables list
    disposables.current.push(normalMap1);
    disposables.current.push(normalMap2);

    return { normalMap1, normalMap2 };
  }, []);

  // Create a cubemap for reflections with proper resource tracking
  const cubeRenderTarget = useMemo(() => {
    const target = new THREE.WebGLCubeRenderTarget(512, {
      type: THREE.HalfFloatType,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    });
    target.texture.colorSpace = THREE.SRGBColorSpace;

    // Add to disposables list
    disposables.current.push(target);

    return target;
  }, []);

  // Create a cube camera for reflections
  const cubeCamera = useMemo(() => {
    return new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
  }, [cubeRenderTarget]);

  // Generate wave patterns based on wind and computed sea state
  const [primaryWave, secondaryWave, tertiaryWave] = useMemo(() => {
    // Calculate wave patterns based on wind direction and sea state
    const freqFactor = WAVE_FREQUENCY_FACTOR[Math.min(9, computedSeaState)];

    // Primary wave follows wind direction
    const primaryWave = {
      direction: new THREE.Vector2(
        Math.sin((windDirection * Math.PI) / 180),
        Math.cos((windDirection * Math.PI) / 180),
      ),
      wavelength: 20.0 * (1 + computedSeaState * 0.2), // Longer waves in higher sea states
      steepness: Math.min(0.6, 0.2 + computedSeaState * 0.05),
      frequency: freqFactor,
    };

    // Secondary wave at an angle to main wind direction
    const secondaryWave = {
      direction: new THREE.Vector2(
        Math.sin(((windDirection + 45) * Math.PI) / 180),
        Math.cos(((windDirection + 45) * Math.PI) / 180),
      ),
      wavelength: 30.0,
      steepness: Math.min(0.3, 0.1 + computedSeaState * 0.02),
      frequency: freqFactor * 1.3,
    };

    // Tertiary small chop waves
    const tertiaryWave = {
      direction: new THREE.Vector2(
        Math.sin(((windDirection + 120) * Math.PI) / 180),
        Math.cos(((windDirection + 120) * Math.PI) / 180),
      ),
      wavelength: 5.0,
      steepness: 0.1,
      frequency: freqFactor * 2.1,
    };

    return [primaryWave, secondaryWave, tertiaryWave];
  }, [windDirection, computedSeaState]);

  // Water material options
  const waterOptions = useMemo(() => {
    return {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: waterNormals.normalMap1,
      sunDirection: new THREE.Vector3(
        Math.sin(Math.PI * (environment.timeOfDay / 12)),
        Math.max(0.1, Math.sin(Math.PI * (environment.timeOfDay / 12))),
        Math.cos(Math.PI * (environment.timeOfDay / 12)),
      ),
      sunColor: new THREE.Color(
        environment.timeOfDay > 6 && environment.timeOfDay < 18
          ? 0xffffff
          : 0xaaaaff,
      ),
      waterColor: new THREE.Color(waterColor),
      distortionScale: distortionScale * waveHeight,
      fog: scene.fog !== undefined,
      alpha: 0.9,
      size: 4,
      clipBias: 0.0,
    };
  }, [
    scene.fog,
    waterColor,
    distortionScale,
    waveHeight,
    waterNormals,
    environment.timeOfDay,
  ]);

  // Create foam texture with proper resource tracking
  const foamTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = 'white';

      // Create noise pattern based on sea state
      const noiseCount = 1000 * (1 + computedSeaState * 0.3);
      for (let i = 0; i < noiseCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * (1 + computedSeaState * 0.2);

        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI);
        context.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    // Add to disposables list
    disposables.current.push(texture);

    return texture;
  }, [computedSeaState]);

  // Update shader when wave parameters change
  useEffect(() => {
    if (!ref.current || !ref.current.material) return;

    const material = ref.current.material as THREE.ShaderMaterial;

    // Replace vertex shader with our custom wave implementation
    if (material.vertexShader) {
      material.vertexShader = material.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        
        // Wave parameters from physics engine
        float steepness = ${waveHeight.toFixed(3)};
        float waveSpeed = ${waveSpeed.toFixed(3)};
        
        // Apply multiple wave patterns for realistic ocean
        vec3 modifiedPosition = transformed;
        
        // Primary wave pattern (follows wind)
        float k1 = 2.0 * 3.14159 / ${primaryWave.wavelength.toFixed(2)};
        float a1 = steepness / k1;
        vec2 d1 = normalize(vec2(${primaryWave.direction.x.toFixed(6)}, ${primaryWave.direction.y.toFixed(6)}));
        float f1 = k1 * (d1.x * modifiedPosition.x + d1.y * modifiedPosition.z - (waveSpeed * ${primaryWave.frequency.toFixed(3)}) * time);
        
        modifiedPosition.x += d1.x * a1 * cos(f1);
        modifiedPosition.y += steepness * ${primaryWave.steepness.toFixed(3)} * sin(f1);
        modifiedPosition.z += d1.y * a1 * cos(f1);
        
        // Secondary wave pattern
        float k2 = 2.0 * 3.14159 / ${secondaryWave.wavelength.toFixed(2)};
        float a2 = steepness / k2 * ${secondaryWave.steepness.toFixed(3)};
        vec2 d2 = normalize(vec2(${secondaryWave.direction.x.toFixed(6)}, ${secondaryWave.direction.y.toFixed(6)}));
        float f2 = k2 * (d2.x * modifiedPosition.x + d2.y * modifiedPosition.z - (waveSpeed * ${secondaryWave.frequency.toFixed(3)}) * time);
        
        modifiedPosition.x += d2.x * a2 * cos(f2);
        modifiedPosition.y += steepness * ${secondaryWave.steepness.toFixed(3)} * sin(f2);
        modifiedPosition.z += d2.y * a2 * cos(f2);
        
        // Tertiary wave pattern (small chop waves)
        float k3 = 2.0 * 3.14159 / ${tertiaryWave.wavelength.toFixed(2)};
        float a3 = steepness / k3 * ${tertiaryWave.steepness.toFixed(3)};
        vec2 d3 = normalize(vec2(${tertiaryWave.direction.x.toFixed(6)}, ${tertiaryWave.direction.y.toFixed(6)}));
        float f3 = k3 * (d3.x * modifiedPosition.x + d3.y * modifiedPosition.z - (waveSpeed * ${tertiaryWave.frequency.toFixed(3)}) * time);
        
        modifiedPosition.x += d3.x * a3 * cos(f3);
        modifiedPosition.y += steepness * ${tertiaryWave.steepness.toFixed(3)} * sin(f3);
        modifiedPosition.z += d3.y * a3 * cos(f3);
        
        // Calculate wave normal based on derivatives
        vec3 bitangent = vec3(
          1.0, 
          steepness * k1 * ${primaryWave.steepness.toFixed(3)} * d1.x * cos(f1) + 
          steepness * k2 * ${secondaryWave.steepness.toFixed(3)} * d2.x * cos(f2) + 
          steepness * k3 * ${tertiaryWave.steepness.toFixed(3)} * d3.x * cos(f3), 
          0.0
        );
        
        vec3 tangent = vec3(
          0.0, 
          steepness * k1 * ${primaryWave.steepness.toFixed(3)} * d1.y * cos(f1) + 
          steepness * k2 * ${secondaryWave.steepness.toFixed(3)} * d2.y * cos(f2) + 
          steepness * k3 * ${tertiaryWave.steepness.toFixed(3)} * d3.y * cos(f3), 
          1.0
        );
        
        vec3 waveNormal = normalize(cross(bitangent, tangent));
        
        // Use modified position and normal
        transformed = modifiedPosition;
        `,
      );

      // Also update fragment shader to add foam and wave caps
      const fragColorPos = material.fragmentShader.indexOf(
        'gl_FragColor = vec4( mix(',
      );

      if (fragColorPos !== -1) {
        const beforeFragColor = material.fragmentShader.substring(
          0,
          fragColorPos,
        );
        const afterSemicolon = material.fragmentShader.indexOf(
          ';',
          fragColorPos,
        );
        const afterFragColor = material.fragmentShader.substring(
          afterSemicolon + 1,
        );

        // Enhanced fragment shader with foam based on sea state
        const seaStateDependent = computedSeaState >= 4 ? 0.4 : 0.2;

        material.fragmentShader = `${beforeFragColor}
        // Calculate wave foam based on sea state ${computedSeaState}
        float waveHeight = vUv.y;
        float foamSpeed = time * ${(0.05 * waveSpeed).toFixed(3)};
        
        // Noise patterns for foam
        float smallWaves = sin(vUv.x * 20.0 + foamSpeed) * cos(vUv.y * 20.0 + foamSpeed) * 0.1;
        float mediumWaves = sin(vUv.x * 10.0 + foamSpeed) * cos(vUv.y * 10.0 + foamSpeed) * 0.2;
        float largeWaves = sin(vUv.x * 5.0 + foamSpeed) * cos(vUv.y * 5.0 + foamSpeed) * 0.3;
        
        // More foam in rough seas
        float foamFactor = clamp(
          smallWaves + mediumWaves + largeWaves + waveHeight * ${seaStateDependent.toFixed(2)}, 
          0.0, 
          1.0
        );
        
        // Foam color and application
        vec3 foamColor = vec3(1.0, 1.0, 1.0);
        float foamThreshold = ${WAVE_FOAM_THRESHOLD.toFixed(2)} - (${(computedSeaState * 0.03).toFixed(3)});
        float foamMask = smoothstep(foamThreshold, 0.95, foamFactor);
        
        // Mix water color with foam based on sea state
        vec3 waterColor = mix(reflectionSample, refractionSample, reflectance);
        vec3 finalColor = mix(waterColor, foamColor, foamMask * ${waveHeight.toFixed(3)} * ${(0.3 + computedSeaState * 0.1).toFixed(2)});
        
        // Add depth coloration
        float depth = 1.0 - reflectance;
        finalColor = mix(finalColor, vec3(0.0, 0.1, 0.2), depth * 0.2);
        
        gl_FragColor = vec4(finalColor, alpha);${afterFragColor}`;
      }

      // Force shader update
      material.needsUpdate = true;
    }
  }, [
    waveHeight,
    waveSpeed,
    primaryWave,
    secondaryWave,
    tertiaryWave,
    computedSeaState,
  ]);

  // Cleanup function to dispose of all resources
  const cleanup = useCallback(() => {
    console.info('Cleaning up ocean resources...');

    // Dispose all tracked disposables
    disposables.current.forEach(item => {
      if (item && typeof item.dispose === 'function') {
        item.dispose();
      }
    });

    // Clear the array
    disposables.current = [];

    // Clear references to help GC
    if (ref.current && ref.current.material) {
      const material = ref.current.material as THREE.ShaderMaterial;
      if (material.uniforms) {
        // Clear texture references in uniforms
        Object.values(material.uniforms).forEach(uniform => {
          if (uniform.value && uniform.value instanceof THREE.Texture) {
            uniform.value = null;
          }
        });
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Update water animation and reflections
  useFrame((_, delta) => {
    if (ref.current) {
      // Hide water for reflection camera to avoid recursion
      ref.current.visible = false;

      // Update reflections
      cubeCamera.update(gl, scene);

      // Show water again
      ref.current.visible = true;

      // Update wave animation
      const material = ref.current.material as THREE.ShaderMaterial;

      if (material.uniforms) {
        if (material.uniforms.time) {
          // Speed up waves in rough seas
          const timeScale = waveSpeed * (1 + computedSeaState * 0.1);
          material.uniforms.time.value += delta * timeScale;
        }

        // Update distortion based on sea state
        if (material.uniforms.distortionScale) {
          material.uniforms.distortionScale.value =
            distortionScale * waveHeight;
        }

        // Update sun position based on time of day
        if (material.uniforms.sunDirection) {
          const sunAngle = Math.PI * (environment.timeOfDay / 12);
          material.uniforms.sunDirection.value.set(
            Math.sin(sunAngle),
            Math.max(0.1, Math.sin(sunAngle)),
            Math.cos(sunAngle),
          );
        }

        // Occasional normal map switch for variety - reduced frequency to every 200 frames
        if (material.uniforms.normalSampler && Math.random() < 0.005) {
          material.uniforms.normalSampler.value =
            material.uniforms.normalSampler.value === waterNormals.normalMap1
              ? waterNormals.normalMap2
              : waterNormals.normalMap1;
        }
      }
    }

    // WASM-driven wave sync
    // Use captured values from top-level hooks, not hooks inside useFrame
    if (wasmVesselPtr && wasmExports && vesselPosition) {
      const x = vesselPosition.x;
      const z = vesselPosition.z;
      const time =
        ref.current &&
        ref.current.material &&
        (ref.current.material as any)?.uniforms?.time?.value
          ? (ref.current.material as any).uniforms.time.value
          : 0;
      if (
        wasmExports.calculateWaveHeight &&
        wasmExports.calculateWaveLength &&
        wasmExports.calculateWaveFrequency &&
        wasmExports.calculateWaveHeightAtPosition &&
        wasmExports.setWaveData
      ) {
        const seaState = computedSeaState;
        const waveHeightVal = wasmExports.calculateWaveHeight(seaState);
        const waveLength = wasmExports.calculateWaveLength(seaState);
        const waveFrequency = wasmExports.calculateWaveFrequency(seaState);
        const windDir = environment.wind.direction;
        const height = wasmExports.calculateWaveHeightAtPosition(
          x,
          z,
          time,
          waveHeightVal,
          waveLength,
          waveFrequency,
          windDir,
          seaState,
        );
        const k = (2.0 * Math.PI) / waveLength;
        const dirX = Math.cos(windDir);
        const dirY = Math.sin(windDir);
        const dot = x * dirX + z * dirY;
        const phase = k * dot - waveFrequency * time;
        wasmExports.setWaveData(wasmVesselPtr, height, phase);
      }
    }
  });

  // Calculate foam visibility based on sea state
  const foamOpacity = useMemo(() => {
    return Math.min(0.7, computedSeaState * 0.08);
  }, [computedSeaState]);

  // Create geometries with ref tracking for disposal
  const mainPlaneGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(
      size,
      size,
      resolution,
      resolution,
    );
    disposables.current.push(geometry);
    return geometry;
  }, [size, resolution]);

  const foamPlaneGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(size * 0.7, size * 0.7, 128, 128);
    disposables.current.push(geometry);
    return geometry;
  }, [size]);

  const waveCapsGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(size * 0.4, size * 0.4, 64, 64);
    disposables.current.push(geometry);
    return geometry;
  }, [size]);

  // Create materials with ref tracking for disposal
  const foamMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: foamTexture,
      transparent: true,
      opacity: foamOpacity,
      depthWrite: false,
    });

    // Apply texture settings
    foamTexture.repeat.set(4, 4);

    // Track for disposal
    disposables.current.push(material);

    return material;
  }, [foamTexture, foamOpacity]);

  const waveCapsMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: '#e0f0ff',
      transparent: true,
      opacity: Math.min(0.5, (computedSeaState - 4) * 0.1),
      depthWrite: false,
      map: foamTexture,
    });

    // Track for disposal
    disposables.current.push(material);

    return material;
  }, [foamTexture, computedSeaState]);

  // Create the Water object instance
  const waterMeshObject = useMemo(() => {
    const waterObj = new Water(mainPlaneGeometry, waterOptions);

    // We can't directly add a Water instance to disposables
    // since it's complex and needs to be handled specially
    // The geometry is already tracked, and the material will be handled in cleanup

    return waterObj;
  }, [mainPlaneGeometry, waterOptions]);

  return (
    <>
      {/* Main ocean water */}
      <primitive
        object={waterMeshObject}
        ref={ref}
        rotation={[-Math.PI / 2, 0, 0]}
        position={position}
        receiveShadow
      />

      {/* Foam layer - intensity based on sea state */}
      {computedSeaState > 2 && (
        <mesh
          position={[0, -0.3, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          geometry={foamPlaneGeometry}
          attach={foamMaterial}
        />
      )}

      {/* Wave caps for high sea states */}
      {computedSeaState >= 5 && (
        <mesh
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          geometry={waveCapsGeometry}
          attach={waveCapsMaterial}
        />
      )}
    </>
  );
}

/**
 * Converts wind speed (m/s) to Beaufort scale (sea state) using the same logic as the physics engine.
 * @param windSpeed - Wind speed in m/s
 * @returns Beaufort scale (0-12)
 */
function calculateBeaufortScale(windSpeed: number): number {
  if (windSpeed < 0.5) return 0;
  if (windSpeed < 1.5) return 1;
  if (windSpeed < 3.3) return 2;
  if (windSpeed < 5.5) return 3;
  if (windSpeed < 8.0) return 4;
  if (windSpeed < 10.8) return 5;
  if (windSpeed < 13.9) return 6;
  if (windSpeed < 17.2) return 7;
  if (windSpeed < 20.8) return 8;
  if (windSpeed < 24.5) return 9;
  if (windSpeed < 28.5) return 10;
  if (windSpeed < 32.7) return 11;
  return 12;
}

export default Ocean;
