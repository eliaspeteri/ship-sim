import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import * as THREE from 'three';
import { majorCities } from '../lib/majorCities.ts';

const EARTH_RADIUS = 6371;
const SEGMENTS = 64;

function Marker({ lat, lon }: { lat: number; lon: number }) {
  const [x, y, z] = latLonToXYZ(lat, lon, EARTH_RADIUS); // Adjust radius for marker position
  const segments = 8;
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

function _Globe() {
  const texture = useTexture('/textures/Equirectangular-projection.jpg'); // Replace with your texture path

  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, SEGMENTS, SEGMENTS]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

/**
 * BathymetryLayer displays ocean depth data as a semi-transparent layer on the globe.
 * It uses the raster bathymetry tiles from the tile server.
 */
function BathymetryLayer() {
  const [bathyTexture, setBathyTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    // Load the bathymetry texture from the tile server
    const loader = new THREE.TextureLoader();
    loader.load(
      // URL to the bathymetry tile at zoom level 0 (whole earth)
      'http://localhost:8888/data/bathymetry-raster/0/0/0.png',
      texture => {
        // When loaded successfully, set the texture
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // Use the default UV mapping for direct texture mapping on a sphere
        texture.mapping = THREE.UVMapping;

        // Ensure the texture wraps correctly around the globe
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        // Flip the texture vertically to match the bathymetry data orientation
        texture.flipY = true;

        // Prevent seams at the edges
        texture.repeat.set(1, 1);

        setBathyTexture(texture);
      },
      undefined,
      err => console.error('Error loading bathymetry texture', err),
    );
  }, []);

  // Don't render anything until the texture is loaded
  if (!bathyTexture) return null;
  return (
    <mesh>
      {/* Use phi and theta segments to match texture mapping better */}
      <sphereGeometry
        args={[
          EARTH_RADIUS * 0.999, // Slightly smaller radius to appear under coastlines
          SEGMENTS, // phi segments (vertical)
          SEGMENTS * 2, // theta segments (horizontal) - doubled for better equirectangular mapping
        ]}
      />
      {/* Use a MeshBasicMaterial to display the texture without lighting */}
      <meshBasicMaterial
        map={bathyTexture}
        transparent
        opacity={1} // Adjust opacity as needed
        depthWrite={false} // Disable depth writing to allow transparency
      />
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
                EARTH_RADIUS + 20,
              ); // Slightly above surface
              points.push(new THREE.Vector3(posX, posY, posZ));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0xffffff });
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

/**
 * SpinningGlobeGroup wraps the globe, coastlines, and markers in a group and rotates the group.
 * This ensures all globe elements spin together.
 * @param spinSpeed - Rotation speed in radians per second (default: 0.05)
 */
function SpinningGlobeGroup({ spinSpeed = 0.00005 }: { spinSpeed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += spinSpeed * delta * 60;
    }
  });
  return (
    <group ref={groupRef}>
      {/*       <Globe /> */}
      <BathymetryLayer />
      <Coastlines />
      {majorCities.map((city, index) => (
        <Marker key={index} lat={city.lat} lon={city.lon} />
      ))}
    </group>
  );
}

const GlobePage = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black' }}>
      <Canvas
        camera={{ position: [0, 0, EARTH_RADIUS * 1.8], far: 30000 }}
        shadows
        style={{ background: 'black' }}
      >
        <directionalLight position={[5, 5, 5]} intensity={1} />
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
