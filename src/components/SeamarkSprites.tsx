import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../store';
import { latLonToXY } from '../lib/geo';

/**
 * Efficient seamark beacon visualization using a single GPU Points draw call.
 * - Renders seamarks as camera-facing point sprites driven by a small shader.
 * - Per-feature attributes: phase and pattern id to vary flash timing.
 */
export default function SeamarkSprites() {
  const seamarks = useStore(s => s.seamarks.features) || [];
  const { camera } = useThree();
  const envTime = useStore(s => s.environment.timeOfDay);
  const geomRef = useRef<THREE.BufferGeometry | null>(null);
  const matRef = useRef<THREE.ShaderMaterial | null>(null);

  const { positions, phases, patterns } = useMemo(() => {
    const posArr: number[] = [];
    const phaseArr: number[] = [];
    const patternArr: number[] = [];

    seamarks.forEach((f, i) => {
      if (!f || f.geometry?.type !== 'Point') return;
      const [lon, lat] = f.geometry.coordinates as [number, number];
      const { x, y } = latLonToXY({ lat, lon });
      // place slightly above water surface
      posArr.push(x, 1.0, y);

      // derive a semi-stable phase from feature id or index
      const phase = ((f.id ? hashString(String(f.id)) : i) % 1000) / 1000;
      phaseArr.push(phase);

      // pattern id: map cardinal direction to simple numbers if available
      const props = (f.properties || {}) as Record<string, unknown>;
      let pat = 0;
      const type =
        typeof props['seamark:type'] === 'string'
          ? (props['seamark:type'] as string)
          : '';
      if (type.includes('cardinal')) {
        const dirProp = props['seamark:buoy_cardinal:category'];
        const dir = typeof dirProp === 'string' ? dirProp : 'north';
        pat = dirToPatternId(dir);
      }
      patternArr.push(pat);
    });

    return {
      positions: new Float32Array(posArr),
      phases: new Float32Array(phaseArr),
      patterns: new Float32Array(patternArr),
    };
  }, [seamarks]);

  // Build geometry once when attributes change
  useMemo(() => {
    if (!geomRef.current) geomRef.current = new THREE.BufferGeometry();
    const geo = geomRef.current;
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aPattern', new THREE.BufferAttribute(patterns, 1));
    return () => {};
  }, [positions, phases, patterns]);

  // Shader material
  const material = useMemo(() => {
    const uniforms: Record<string, { value: unknown }> = {
      uTime: { value: 0 },
      uCameraPos: { value: new THREE.Vector3() },
      uSize: { value: 180.0 },
      uColor: { value: new THREE.Color('white') },
      uDaylight: { value: 1.0 },
    };

    const vert = `
      attribute float aPhase;
      attribute float aPattern;
      varying float vPhase;
      varying float vPattern;
      void main(){
        vPhase = aPhase;
        vPattern = aPattern;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float dist = -mvPosition.z;
        float size = mix(60.0, 400.0, clamp(dist / 800.0, 0.0, 1.0));
        // enlarge points at night (uDaylight closer to 0)
        gl_PointSize = size * (1.0 + (1.0 - uDaylight) * 1.5);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const frag = `
      precision mediump float;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uDaylight;
      varying float vPhase;
      varying float vPattern;
      void main(){
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if(dist > 0.5) discard;
        // basic flash pattern using phase + pattern id
        float t = fract(uTime + vPhase);
        float flash = 0.0;
        if(vPattern < 0.5) {
          // north-like: steady sine
          flash = smoothstep(0.4, 0.6, sin((uTime + vPhase) * 10.0) * 0.5 + 0.5);
        } else if (vPattern < 1.5) {
          // east-like: short periodic flashes
          flash = step(0.95, fract((uTime + vPhase) * 5.0));
        } else if (vPattern < 2.5) {
          // south-like: burst pattern
          float p = fract((uTime + vPhase) * 1.0);
          flash = step(0.0, smoothstep(0.0, 0.2, p));
        } else {
          // west-like: long on/off
          flash = step(0.5, fract((uTime + vPhase) * 0.5));
        }

        float alpha = smoothstep(0.45, 0.5, 0.5 - dist);
        // make lights much brighter at night by scaling with (1-uDaylight)
        float nightBoost = mix(1.0, 3.0, 1.0 - uDaylight);
        float glow = (1.0 - dist) * (0.8 + 1.2 * flash) * nightBoost;
        vec3 col = uColor * (0.9 + 1.2 * flash) * nightBoost;
        float outAlpha = alpha * (0.5 + 0.6 * flash) * mix(0.6, 1.6, 1.0 - uDaylight);
        gl_FragColor = vec4(col * glow, outAlpha);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      depthTest: false, // render on top for visibility over water
      blending: THREE.AdditiveBlending,
    });
    matRef.current = mat;
    return mat;
  }, []);

  useFrame(state => {
    if (material) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uCameraPos.value.copy(camera.position);
      // compute daylight from envTime (simple solar elevation model)
      const t = (typeof envTime === 'number' ? envTime : 12) % 24;
      const normalized = ((t % 24) + 24) / 24;
      const elevation = Math.sin((normalized - 0.25) * Math.PI * 2);
      const daylight = Math.max(0, elevation);
      material.uniforms.uDaylight.value = daylight;
    }
  });

  if (!positions || positions.length === 0) return null;

  return (
    <points>
      <bufferGeometry attach="geometry" ref={geomRef} />
      <primitive object={material} attach="material" />
    </points>
  );
}

function dirToPatternId(dir: string) {
  switch (dir) {
    case 'north':
      return 0;
    case 'east':
      return 1;
    case 'south':
      return 2;
    case 'west':
      return 3;
  }
  return 0;
}

function hashString(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}
