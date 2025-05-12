import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';

function Globe() {
  const texture = useTexture('/textures/Equirectangular-projection.jpg'); // Replace with your texture path
  const radius = 1;
  const widthSegments = 32;
  const heightSegments = 32;

  return (
    <mesh>
      <sphereGeometry args={[radius, widthSegments, heightSegments]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

const GlobePage = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 3] }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Globe />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
};

export default GlobePage;
