import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import * as THREE from 'three';
import { majorCities } from '../lib/majorCities.ts';

const EARTH_RADIUS = 6371;
const SEGMENTS = 1024;

function Marker({ lat, lon }: { lat: number; lon: number }) {
  const [x, y, z] = latLonToXYZ(lat, lon, EARTH_RADIUS * 1.01); // Adjust radius for marker position
  const segments = 8;
  const radius = EARTH_RADIUS * 0.005; // Adjust the radius of the marker sphere

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

/**
 * DisplacedGlobe renders a sphere with vertex displacement based on a heightmap.
 * The heightmap is sampled in the vertex shader and used to displace vertices radially.
 * The fragment shader blends between land and water colors based on the sampled height.
 */
function DisplacedGlobe() {
  // State for the loaded heightmap texture
  const [heightmapTexture, setHeightmapTexture] =
    useState<THREE.Texture | null>(null);
  const colorTexture = useTexture('/textures/Equirectangular-projection.jpg');

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      'http://localhost:8888/data/bathymetry-raster/0/0/0.png',
      texture => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.mapping = THREE.UVMapping;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.flipY = true;
        texture.repeat.set(1, 1);
        texture.offset.set(0, 0);
        texture.rotation = 0;
        setHeightmapTexture(texture);
      },
      undefined,
      err => console.error('Error loading heightmap texture', err),
    );
  }, []);

  const vertexShader = `
    varying vec2 vUv;
    varying float vHeight;
    uniform sampler2D uHeightmap;
    uniform float uHeightScale;
    uniform float uBaseRadius;
    void main() {
      vUv = uv;
      float heightValue = texture2D(uHeightmap, uv).r;
      vHeight = heightValue;
      // Apply displacement based on heightmap and height scale
      vec3 displacedPosition = normalize(position) * (uBaseRadius + heightValue * uHeightScale);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
    }
  `;
  const fragmentShader = `
    varying vec2 vUv;
    varying float vHeight;
    uniform sampler2D uColorMap;

    void main() {
      // Deep blue for water, earthy brown for land
      vec3 waterColor = vec3(0.07, 0.23, 0.45);
      vec3 landColor = vec3(0.36, 0.29, 0.18);
      vec3 baseColor = texture2D(uColorMap, vUv).rgb;
      // Smooth transition at coastline
      float coast = smoothstep(0.48, 0.52, vHeight);
      vec3 blended = mix(waterColor, landColor, coast);
      // Modulate with base color for detail
      blended *= mix(vec3(1.0), baseColor, 0.5);
      gl_FragColor = vec4(blended, 1.0);
    }
  `;

  // Always call useMemo, even if texture is not loaded yet
  const material = React.useMemo(() => {
    const lowestPoint = 10_000; // Minimum height value in the heightmap
    const highestPoint = 8_800; // Maximum height value in the heightmap
    const heightScale = (highestPoint - lowestPoint) / 255; // Scale to match heightmap values

    return new THREE.ShaderMaterial({
      uniforms: {
        uColorMap: { value: colorTexture },
        uHeightmap: { value: heightmapTexture },
        uHeightScale: { value: heightScale }, // Should be around 73.33
        uBaseRadius: { value: EARTH_RADIUS },
      },
      vertexShader,
      fragmentShader,
      side: THREE.FrontSide,
    });
  }, [colorTexture, heightmapTexture]);

  React.useEffect(() => {
    if (material) {
      material.uniforms.uColorMap.value = colorTexture;
      material.uniforms.uHeightmap.value = heightmapTexture;
    }
  }, [colorTexture, heightmapTexture, material]);

  // Only return mesh if heightmap is loaded
  if (!heightmapTexture) return null;

  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, SEGMENTS, SEGMENTS]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/**
 * BathymetryLayer displays ocean depth data as a semi-transparent layer on the globe.
 * It uses the raster bathymetry tiles from the tile server.
 */
function _BathymetryLayer() {
  const [bathyTexture, setBathyTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    // Load the bathymetry texture from the tile server
    const loader = new THREE.TextureLoader();
    loader.load(
      // URL to the bathymetry tile at zoom level 0 (whole earth)
      'http://localhost:8888/data/bathymetry-raster/0/0/0.png',
      texture => {
        // When loaded successfully, set the texture
        // Use same settings as the main globe's texture
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // Use the default UV mapping for direct texture mapping on a sphere
        texture.mapping = THREE.UVMapping;

        // Ensure the texture wraps correctly around the globe
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        // Since GEBCO data is already in equirectangular projection,
        // we should make sure the texture is oriented correctly.
        // This matches how the main globe texture is oriented.
        texture.flipY = true;
        texture.repeat.set(1, 1);

        // Center the texture properly
        texture.offset.set(0, 0);

        // Apply rotation if needed to align with the main globe texture
        // If you still see misalignment, you may need to adjust this value
        texture.rotation = 0;

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
      {/* Use phi and theta segments to match texture mapping better */}{' '}
      <sphereGeometry
        args={[
          EARTH_RADIUS * 0.999, // Slightly smaller radius to appear under coastlines
          SEGMENTS, // phi segments (vertical)
          SEGMENTS, // theta segments (horizontal) - match main globe geometry
        ]}
      />
      {/* Use a MeshBasicMaterial to display the texture without lighting */}{' '}
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
                EARTH_RADIUS * 1.0105,
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
      <DisplacedGlobe />
      {/*       <BathymetryLayer /> */}
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
