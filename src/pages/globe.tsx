import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';

function Marker({ lat, lon }: { lat: number; lon: number }) {
  const [x, y, z] = latLonToXYZ(lat, lon, EARTH_RADIUS); // Adjust radius for marker position
  const segments = 32;
  const radius = EARTH_RADIUS * 0.007; // Adjust the radius of the marker sphere

  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[radius, segments, segments]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}

const EARTH_RADIUS = 128;
const SEGMENTS = 16;

function latLonToXYZ(lat: number, lon: number, radius = EARTH_RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return [x, y, z];
}

function Globe() {
  const texture = useTexture('/textures/Equirectangular-projection.jpg'); // Replace with your texture path

  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, SEGMENTS, SEGMENTS]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

const GlobePage = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, EARTH_RADIUS * 1.8] }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Globe />
        <Marker lat={60.1999} lon={24.9354} />
        <Marker lat={40.7128} lon={-74.006} />
        <Marker lat={35.6895} lon={139.6917} />
        <Marker lat={51.5074} lon={-0.1278} />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
};

export default GlobePage;
