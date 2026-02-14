import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { majorCities } from '../lib/majorCities';

const EARTH_RADIUS = 6371;
const SEGMENTS = 512;

function latLonToXYZ(lat: number, lon: number, radius = EARTH_RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return [x, y, z];
}

function Marker({ lat, lon }: { lat: number; lon: number }) {
  const [x, y, z] = latLonToXYZ(lat, lon, EARTH_RADIUS * 1.01);
  const radius = EARTH_RADIUS * 0.004;

  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[radius, 8, 8]} />
      <meshStandardMaterial color="#f05d5e" />
    </mesh>
  );
}

function DisplacedGlobe() {
  const [colorTexture, heightTexture] = useTexture([
    '/textures/Equirectangular-projection.jpg',
    '/textures/ocean_floor.png',
  ]);

  useEffect(() => {
    colorTexture.colorSpace = THREE.SRGBColorSpace;
    colorTexture.wrapS = THREE.ClampToEdgeWrapping;
    colorTexture.wrapT = THREE.ClampToEdgeWrapping;
    heightTexture.wrapS = THREE.ClampToEdgeWrapping;
    heightTexture.wrapT = THREE.ClampToEdgeWrapping;
  }, [colorTexture, heightTexture]);

  const uniforms = useMemo(
    () => ({
      uColorMap: { value: colorTexture },
      uHeightMap: { value: heightTexture },
      uHeightScale: { value: 30 },
      uBaseRadius: { value: EARTH_RADIUS },
      uSeaLevel: { value: 0.5 },
    }),
    [colorTexture, heightTexture],
  );

  const vertexShader = `
    varying vec2 vUv;
    varying float vHeight;
    uniform sampler2D uHeightMap;
    uniform float uHeightScale;
    uniform float uBaseRadius;
    uniform float uSeaLevel;

    void main() {
      vUv = uv;
      vec3 heightColor = texture2D(uHeightMap, uv).rgb;
      float heightSample = dot(heightColor, vec3(0.3333));
      vHeight = heightSample;
      float elevation = (heightSample - uSeaLevel) * uHeightScale;
      vec3 displacedPosition = normalize(position) * (uBaseRadius + elevation);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    varying float vHeight;
    uniform sampler2D uColorMap;
    uniform float uSeaLevel;

    void main() {
      vec3 baseColor = texture2D(uColorMap, vUv).rgb;
      float landMask = smoothstep(uSeaLevel - 0.02, uSeaLevel + 0.02, vHeight);
      float depthT = smoothstep(uSeaLevel - 0.3, uSeaLevel, vHeight);
      vec3 deepWater = vec3(0.03, 0.08, 0.14);
      vec3 shallowWater = vec3(0.06, 0.22, 0.35);
      vec3 waterColor = mix(deepWater, shallowWater, depthT);
      vec3 landTint = mix(baseColor, vec3(0.24, 0.22, 0.18), 0.35);
      vec3 finalColor = mix(waterColor, landTint, landMask);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
      }),
    [uniforms],
  );

  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, SEGMENTS, SEGMENTS]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function SpinningGlobeGroup({ spinSpeed = 0.00005 }: { spinSpeed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += spinSpeed * delta * 60;
    }
  });

  return (
    <group ref={groupRef}>
      <DisplacedGlobe />
      {majorCities.map((city, index) => (
        <Marker key={index} lat={city.lat} lon={city.lon} />
      ))}
    </group>
  );
}

const GlobePage: React.FC & { fullBleedLayout?: boolean } = () => {
  return (
    <div className="h-[calc(100vh-var(--nav-height))] min-h-[calc(100vh-var(--nav-height))] w-full overflow-hidden bg-[#050b14]">
      <Canvas
        camera={{ position: [0, 0, EARTH_RADIUS * 1.8], far: 30000 }}
        shadows
        className="block h-full w-full bg-[#050b14]"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.1} />
        <SpinningGlobeGroup />
        <OrbitControls
          enablePan={false}
          minDistance={EARTH_RADIUS * 1.1}
          maxDistance={EARTH_RADIUS * 2}
        />
      </Canvas>
    </div>
  );
};

export default GlobePage;

GlobePage.fullBleedLayout = true;
