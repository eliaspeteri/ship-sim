import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls /*useTexture*/ } from '@react-three/drei';
import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import * as THREE from 'three';

const EARTH_RADIUS = 512;
const SEGMENTS = 64;

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

function latLonToXYZ(lat: number, lon: number, radius = EARTH_RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return [x, y, z];
}

function Globe() {
  //const texture = useTexture('/textures/Equirectangular-projection.jpg'); // Replace with your texture path

  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, SEGMENTS, SEGMENTS]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
}

/**
 * Coastlines component fetches a vector tile and renders the coastline lines on the globe.
 * Uses @mapbox/vector-tile and pbf to parse MVT data from the tile server.
 */
function Coastlines() {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // Example: fetch the lowest zoom tile (z=0, x=0, y=0)
    const url = 'http://localhost:8888/data/coastlines/0/0/0.pbf';
    fetch(url)
      .then(res => res.arrayBuffer())
      .then(buf => {
        const tile = new VectorTile(new Pbf(buf));
        // Layer name must match your Tippecanoe -l argument
        const layer = tile.layers['ne_10m_coastline'];
        if (!layer) return;
        const lines: THREE.Line[] = [];
        for (let i = 0; i < layer.length; i++) {
          const feature = layer.feature(i);
          if (feature.type !== 2) continue; // Only LineString
          const geom = feature.loadGeometry();

          // MVT coordinates are tile-local (0..4096), need to convert to lat/lon
          // For z=0, x=0, y=0, the tile covers the whole world
          for (const line of geom) {
            const points: THREE.Vector3[] = [];
            for (const pt of line) {
              // Convert tile coordinates to lat/lon with Web Mercator unprojection
              // Web Mercator is the projection used by most web maps and vector tiles
              const x = (pt.x / 4096) * 2 - 1; // normalize to [-1, 1]
              const y = 1 - (pt.y / 4096) * 2; // normalize to [1, -1] and flip y
              // Convert Web Mercator to lat/lon
              const lon = x * 180;
              const lat = Math.atan(Math.sinh(y * Math.PI)) * (180 / Math.PI);

              const [posX, posY, posZ] = latLonToXYZ(
                lat,
                lon,
                EARTH_RADIUS + 1,
              ); // Slightly above surface
              points.push(new THREE.Vector3(posX, posY, posZ));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x222222 });
            const lineObj = new THREE.Line(geometry, material);
            lines.push(lineObj);
          }
        }
        // Add lines to the group
        if (groupRef.current) {
          groupRef.current.clear();
          for (const line of lines) {
            groupRef.current.add(line);
          }
        }
      });
  }, []);

  return <group ref={groupRef} />;
}

const GlobePage = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, EARTH_RADIUS * 1.8] }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Globe />
        <Coastlines />
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
