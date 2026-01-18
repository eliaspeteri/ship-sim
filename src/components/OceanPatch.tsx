import * as THREE from 'three';
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

type WaveState = {
  amplitude: number;
  wavelength: number;
  direction: number;
  steepness: number;
  speed: number;
  k: number;
  omega: number;
};

const oceanVertexShader = /* glsl */ `
#define WAVE_COUNT 4

uniform float uTime;

uniform float uAmp[WAVE_COUNT];
uniform float uK[WAVE_COUNT];
uniform float uOmega[WAVE_COUNT];
uniform vec2  uDir[WAVE_COUNT];

uniform vec2 uCenter;
uniform float uFadeStart;
uniform float uFadeEnd;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;

#include <fog_pars_vertex>

void main() {
  vec3 p = position;

  // World-space XZ for fade distance (square)
  vec4 worldPos0 = modelMatrix * vec4(p, 1.0);
  vec2 worldXZ = worldPos0.xz;

  vec2 dXZ = worldXZ - uCenter;
  float dSquare = max(abs(dXZ.x), abs(dXZ.y));          // 0 center -> grows toward edges
  float edge = smoothstep(uFadeStart, uFadeEnd, dSquare); // 0 center -> 1 edge
  float fadeMul = 1.0 - edge;

  // Sum waves (vertical displacement + analytic derivatives for normals)
  float disp = 0.0;
  float dydx = 0.0;
  float dydz = 0.0;

  for (int i = 0; i < WAVE_COUNT; i++) {
    vec2 dir = normalize(uDir[i]);

    // Phase in local coordinates (keeps frequency stable even when you scale the mesh),
    // since scaling the mesh also scales p in world units.
    float phase = uK[i] * (dir.x * p.x + dir.y * p.z) - uOmega[i] * uTime;

    float s = sin(phase);
    float c = cos(phase);

    float a = uAmp[i] * fadeMul;

    disp += a * s;

    // d/dx and d/dz of height
    dydx += a * c * uK[i] * dir.x;
    dydz += a * c * uK[i] * dir.y;
  }

  // Displace
  p.y += disp;

  // Object-space normal from summed derivatives
  vec3 nObj = normalize(vec3(-dydx, 1.0, -dydz));

  // Final world position
  vec4 worldPos = modelMatrix * vec4(p, 1.0);
  vWorldPos = worldPos.xyz;

  // Correct normal transform
  vWorldNormal = normalize(normalMatrix * nObj);

  // Standard transforms
  vec4 mvPosition = viewMatrix * worldPos;
  gl_Position = projectionMatrix * mvPosition;

  #include <fog_vertex>
}
`;

const oceanFragmentShader = /* glsl */ `
precision highp float;

#define WAVE_COUNT 4

uniform float uTime;

uniform float uAmp[WAVE_COUNT];
uniform float uK[WAVE_COUNT];
uniform float uOmega[WAVE_COUNT];
uniform vec2  uDir[WAVE_COUNT];

uniform vec3 uSunDirection;
uniform vec3 uCameraPos;

uniform vec3 uWaterColor;
uniform float uAmbient;

uniform float uSpecPower;
uniform float uSpecStrength;

uniform vec3 uFarColor;

uniform vec2 uCenter;
uniform float uFadeStart;
uniform float uFadeEnd;

varying vec3 vWorldPos;

#include <fog_pars_fragment>

void heightAndDerivs(in vec2 xz, in float fadeMul, out float dhdx, out float dhdz) {
  dhdx = 0.0;
  dhdz = 0.0;

  for (int i = 0; i < WAVE_COUNT; i++) {
    vec2 dir = normalize(uDir[i]);

    float phase = uK[i] * dot(dir, xz) - uOmega[i] * uTime;
    float c = cos(phase);

    float a = uAmp[i] * fadeMul;

    // derivatives in WORLD units:
    // y = a * sin(k * dot(dir, xz) - w t)
    // dy/dx = a * cos(...) * k * dir.x
    // dy/dz = a * cos(...) * k * dir.y
    float tmp = a * c * uK[i];
    dhdx += tmp * dir.x;
    dhdz += tmp * dir.y;
  }
}

void main() {
  vec2 dXZ = vWorldPos.xz - uCenter;
  float dSquare = max(abs(dXZ.x), abs(dXZ.y));
  float edge = smoothstep(uFadeStart, uFadeEnd, dSquare);

  // match vertex fade amplitude behavior
  float fadeMul = 1.0 - edge;

  // Per-pixel normal from summed derivatives (removes faceted grid look)
  float dhdx, dhdz;
  heightAndDerivs(vWorldPos.xz, fadeMul, dhdx, dhdz);
  vec3 N = normalize(vec3(-dhdx, 1.0, -dhdz));

  vec3 V = normalize(uCameraPos - vWorldPos);
  vec3 L = normalize(uSunDirection);

  float ndl = clamp(dot(N, L), 0.0, 1.0);
  vec3 diffuse = uWaterColor * (uAmbient + ndl * 0.9);

  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), uSpecPower) * uSpecStrength;

  vec3 color = mix(diffuse + spec, uFarColor, edge);

  gl_FragColor = vec4(color, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}

`;

export function OceanPatch({
  centerRef,
  size = 4000,
  segments = 128,
  wave,
  timeRef,
  sunDirection,
  yOffset = 0,
}: {
  centerRef: React.MutableRefObject<{ x: number; y: number }>;
  size?: number;
  segments?: number;
  wave: WaveState;
  timeRef?: React.MutableRefObject<number>;
  sunDirection: THREE.Vector3;
  yOffset?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, segments, segments);
    g.rotateX(-Math.PI / 2); // local XZ plane
    return g;
  }, [size, segments]);

  const WAVE_COUNT = 4;

  const material = useMemo(() => {
    const uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uWaveCount: { value: WAVE_COUNT },
        uAmp: { value: new Array(WAVE_COUNT).fill(0) },
        uK: { value: new Array(WAVE_COUNT).fill(0.0001) },
        uOmega: { value: new Array(WAVE_COUNT).fill(0) },
        uDir: {
          value: Array.from(
            { length: WAVE_COUNT },
            () => new THREE.Vector2(1, 0),
          ),
        },

        uSunDirection: { value: new THREE.Vector3(0.3, 1, 0.2).normalize() },
        uCameraPos: { value: new THREE.Vector3() },

        uWaterColor: { value: new THREE.Color(0x0c2f45) },
        uSkyColor: { value: new THREE.Color(0x87b7ff) },
        uAmbient: { value: 0.18 },

        uSpecPower: { value: 20 },
        uSpecStrength: { value: 0.1 },
        uCenter: { value: new THREE.Vector2() },
        uFadeStart: { value: 0 },
        uFadeEnd: { value: 0 },
        uFarColor: { value: new THREE.Color(0x0c2f45) },
      },
    ]);

    const mat = new THREE.ShaderMaterial({
      vertexShader: oceanVertexShader,
      fragmentShader: oceanFragmentShader,
      uniforms,
      fog: true,
      transparent: false,
      depthWrite: true,
      side: THREE.DoubleSide,
    });

    return mat;
  }, []);

  useEffect(() => {
    const baseAmp = wave.amplitude;
    const baseK = wave.k;
    const baseOmega = wave.omega;
    const baseDir = wave.direction;

    const amps = [1.0, 0.5, 0.25, 0.15].map(m => baseAmp * m);
    const ks = [1.0, 1.8, 3.2, 5.0].map(m => baseK * m);
    const omegas = [1.0, 1.6, 2.2, 3.0].map(m => baseOmega * m);

    const dirs = [
      new THREE.Vector2(Math.cos(baseDir), Math.sin(baseDir)),
      new THREE.Vector2(Math.cos(baseDir + 0.9), Math.sin(baseDir + 0.9)),
      new THREE.Vector2(Math.cos(baseDir - 0.6), Math.sin(baseDir - 0.6)),
      new THREE.Vector2(Math.cos(baseDir + 2.2), Math.sin(baseDir + 2.2)),
    ];

    material.uniforms.uAmp.value = amps;
    material.uniforms.uK.value = ks;
    material.uniforms.uOmega.value = omegas;
    material.uniforms.uDir.value = dirs;

    const daylight = Math.max(0, sunDirection.y);
    material.uniforms.uSunDirection.value.copy(sunDirection).normalize();
    const deep = new THREE.Color(0x0b2b3d);
    const bright = new THREE.Color(0x1c5a80);
    const shade = THREE.MathUtils.lerp(0.35, 1, daylight);
    const waterMixed = deep
      .clone()
      .lerp(bright, THREE.MathUtils.clamp(daylight, 0, 1) * 0.8)
      .multiplyScalar(shade);
    material.uniforms.uWaterColor.value.copy(waterMixed);
    material.uniforms.uFarColor.value.copy(waterMixed);
    material.uniforms.uAmbient.value = 0.03 + 0.25 * daylight;
    material.uniforms.uSpecStrength.value = 0.02 + 0.12 * daylight;

    material.toneMapped = true;
  }, [material, wave.amplitude, wave.k, wave.omega, wave.direction]);

  useEffect(() => {
    material.uniforms.uSunDirection.value.copy(sunDirection).normalize();
  }, [material, sunDirection]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(({ camera }, delta) => {
    if (meshRef.current) {
      meshRef.current.position.set(
        centerRef.current.x,
        yOffset,
        centerRef.current.y,
      );
      // --- NEW: scale patch based on camera height ---
      const h = camera.position.y;
      const scale = THREE.MathUtils.clamp(h / 220, 1, 8); // tune: 220 and 8
      meshRef.current.scale.set(scale, 1, scale);
      material.uniforms.uFadeStart.value = size * 0.35 * scale;
      material.uniforms.uFadeEnd.value = size * 0.5 * scale;
    }

    // time
    material.uniforms.uTime.value = timeRef
      ? timeRef.current
      : material.uniforms.uTime.value + delta;

    material.uniforms.uCameraPos.value.copy(camera.position);

    material.uniforms.uCenter.value.set(
      centerRef.current.x,
      centerRef.current.y,
    );
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}
