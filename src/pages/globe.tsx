import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls /*useTexture*/ } from '@react-three/drei';
import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import * as THREE from 'three';

const EARTH_RADIUS = 512;
const SEGMENTS = 64;

const majorCities = [
  {
    name: 'Helsinki',
    lat: 60.1695,
    lon: 24.9354,
  },
  {
    name: 'New York',
    lat: 40.7128,
    lon: -74.006,
  },
  {
    name: 'Tokyo',
    lat: 35.6895,
    lon: 139.6917,
  },
  {
    name: 'London',
    lat: 51.5074,
    lon: -0.1278,
  },
  {
    name: 'Paris',
    lat: 48.8566,
    lon: 2.3522,
  },
  {
    name: 'Berlin',
    lat: 52.52,
    lon: 13.405,
  },
  {
    name: 'Sydney',
    lat: -33.8688,
    lon: 151.2093,
  },
  {
    name: 'Cairo',
    lat: 30.0444,
    lon: 31.2357,
  },
  {
    name: 'Moscow',
    lat: 55.7558,
    lon: 37.6173,
  },
  {
    name: 'Rio de Janeiro',
    lat: -22.9068,
    lon: -43.1729,
  },
  {
    name: 'Cape Town',
    lat: -33.9249,
    lon: 18.4241,
  },
  {
    name: 'Mexico City',
    lat: 19.4326,
    lon: -99.1332,
  },
  {
    name: 'Bangkok',
    lat: 13.7563,
    lon: 100.5018,
  },
  {
    name: 'Istanbul',
    lat: 41.0082,
    lon: 28.9784,
  },
  {
    name: 'Buenos Aires',
    lat: -34.6037,
    lon: -58.3816,
  },
  {
    name: 'Lagos',
    lat: 6.5244,
    lon: 3.3792,
  },
  {
    name: 'Seoul',
    lat: 37.5665,
    lon: 126.978,
  },
  {
    name: 'Madrid',
    lat: 40.4168,
    lon: -3.7038,
  },
  {
    name: 'Rome',
    lat: 41.9028,
    lon: 12.4964,
  },
  {
    name: 'Toronto',
    lat: 43.6511,
    lon: -79.347015,
  },
  {
    name: 'Lima',
    lat: -12.0464,
    lon: -77.0428,
  },
  {
    name: 'Kuala Lumpur',
    lat: 3.139,
    lon: 101.6869,
  },
  {
    name: 'Santiago',
    lat: -33.4489,
    lon: -70.6693,
  },
  {
    name: 'Athens',
    lat: 37.9838,
    lon: 23.7275,
  },
  {
    name: 'Hanoi',
    lat: 21.0285,
    lon: 105.8542,
  },
  {
    name: 'Colombo',
    lat: 6.9271,
    lon: 79.9585,
  },
  {
    name: 'Nairobi',
    lat: -1.2864,
    lon: 36.8172,
  },
  {
    name: 'Addis Ababa',
    lat: 9.03,
    lon: 38.74,
  },
  {
    name: 'Casablanca',
    lat: 33.5731,
    lon: -7.5898,
  },
];

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
                EARTH_RADIUS + 20,
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

/**
 * SpinningGlobeGroup wraps the globe, coastlines, and markers in a group and rotates the group.
 * This ensures all globe elements spin together.
 * @param spinSpeed - Rotation speed in radians per second (default: 0.05)
 */
function SpinningGlobeGroup({ spinSpeed = 0.0005 }: { spinSpeed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += spinSpeed * delta * 60;
    }
  });
  return (
    <group ref={groupRef}>
      <Globe />
      <Coastlines />
      {majorCities.map((city, index) => (
        <Marker key={index} lat={city.lat} lon={city.lon} />
      ))}
    </group>
  );
}

const GlobePage = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 0, EARTH_RADIUS * 1.8], far: 30000 }}
        shadows
      >
        <ambientLight intensity={0.5} />
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
