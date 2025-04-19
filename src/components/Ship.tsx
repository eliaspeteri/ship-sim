import React, { useRef, useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useFrame } from '@react-three/fiber';
import { useGLTF, Detailed, Instance, Instances } from '@react-three/drei'; // Added Instance, Instances
import * as THREE from 'three';
import useStore from '../store';

// Define the different ship types available
const SHIP_MODELS = {
  CONTAINER: '/models/container_ship.glb',
  TANKER: '/models/tanker_ship.glb',
  CARGO: '/models/cargo_ship.glb',
  DEFAULT: null,
} as const;

interface ShipProps {
  position: { x: number; y: number; z: number };
  heading: number;
  length?: number;
  beam?: number;
  draft?: number;
  shipType?: 'CONTAINER' | 'TANKER' | 'CARGO' | 'DEFAULT';
}

const Ship: React.FC<ShipProps> = ({
  position,
  heading,
  length = 50,
  beam = 10,
  draft = 3,
  shipType = 'DEFAULT',
}) => {
  const shipRef = useRef<THREE.Group>(null);
  const propellerRef = useRef<THREE.Mesh>(null);
  const rudderRef = useRef<THREE.Mesh>(null);
  const wakeRef = useRef<THREE.Mesh>(null);
  const smokeRef = useRef<THREE.Points>(null);

  // Create geometry refs for procedural ship hulls
  const shipHullGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const simplifiedHullGeometryRef = useRef<THREE.BufferGeometry | null>(null);

  // Get vessel data from store
  const vessel = useStore(state => state.vessel) || {};
  const engineRPM = vessel?.engineState?.rpm || 0;
  const rudderAngle = vessel?.controls?.rudderAngle || 0;
  const speed = Math.sqrt(
    (vessel?.velocity?.surge || 0) * (vessel?.velocity?.surge || 0) +
      (vessel?.velocity?.sway || 0) * (vessel?.velocity?.sway || 0),
  );

  // Use GLTF loader if a model is specified
  const [modelLoaded, setModelLoaded] = useState(false);
  const model = SHIP_MODELS[shipType] ? useGLTF(SHIP_MODELS[shipType]) : null;

  // Create procedural textures instead of loading from files
  const createProceduralTextures = () => {
    // Create a procedural wake texture
    const wakeCanvas = document.createElement('canvas');
    wakeCanvas.width = 512;
    wakeCanvas.height = 512;
    const wakeCtx = wakeCanvas.getContext('2d');
    if (wakeCtx) {
      wakeCtx.fillStyle = 'black';
      wakeCtx.fillRect(0, 0, 512, 512);

      // Create radial gradient for wake effect
      const gradient = wakeCtx.createRadialGradient(256, 256, 0, 256, 256, 256);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      wakeCtx.fillStyle = gradient;
      wakeCtx.fillRect(0, 0, 512, 512);

      // Add some noise for texture
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = Math.random() * 2 + 1;
        const opacity = Math.random() * 0.2;

        wakeCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        wakeCtx.beginPath();
        wakeCtx.arc(x, y, radius, 0, Math.PI * 2);
        wakeCtx.fill();
      }
    }

    // Create a procedural ship texture
    const shipCanvas = document.createElement('canvas');
    shipCanvas.width = 512;
    shipCanvas.height = 512;
    const shipCtx = shipCanvas.getContext('2d');
    if (shipCtx) {
      shipCtx.fillStyle = '#555555';
      shipCtx.fillRect(0, 0, 512, 512);

      // Add some panels and details
      shipCtx.fillStyle = '#444444';
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 5; j++) {
          shipCtx.fillRect(i * 50 + 5, j * 100 + 5, 40, 90);
        }
      }

      // Add some rivets
      shipCtx.fillStyle = '#666666';
      for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 10; j++) {
          shipCtx.beginPath();
          shipCtx.arc(i * 25 + 12, j * 50 + 25, 2, 0, Math.PI * 2);
          shipCtx.fill();
        }
      }
    }

    // Create a metal texture
    const metalCanvas = document.createElement('canvas');
    metalCanvas.width = 256;
    metalCanvas.height = 256;
    const metalCtx = metalCanvas.getContext('2d');
    if (metalCtx) {
      metalCtx.fillStyle = '#888888';
      metalCtx.fillRect(0, 0, 256, 256);

      // Add some scratches
      for (let i = 0; i < 30; i++) {
        metalCtx.strokeStyle = `rgba(50, 50, 50, ${Math.random() * 0.5})`;
        metalCtx.lineWidth = Math.random() * 2 + 0.5;
        metalCtx.beginPath();
        metalCtx.moveTo(Math.random() * 256, Math.random() * 256);
        metalCtx.lineTo(Math.random() * 256, Math.random() * 256);
        metalCtx.stroke();
      }

      // Add some noise
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const gray = Math.floor(Math.random() * 50) + 100;
        metalCtx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        metalCtx.fillRect(x, y, 1, 1);
      }
    }

    // Create a rust texture
    const rustCanvas = document.createElement('canvas');
    rustCanvas.width = 256;
    rustCanvas.height = 256;
    const rustCtx = rustCanvas.getContext('2d');
    if (rustCtx) {
      rustCtx.fillStyle = '#8B4513'; // Saddle brown base
      rustCtx.fillRect(0, 0, 256, 256);

      // Add rust variations
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const radius = Math.random() * 10 + 2;
        const r = Math.floor(Math.random() * 60) + 120;
        const g = Math.floor(Math.random() * 30) + 30;
        const b = Math.floor(Math.random() * 20);

        rustCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        rustCtx.beginPath();
        rustCtx.arc(x, y, radius, 0, Math.PI * 2);
        rustCtx.fill();
      }
    }

    // Create a smoke texture
    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.width = 64;
    smokeCanvas.height = 64;
    const smokeCtx = smokeCanvas.getContext('2d');
    if (smokeCtx) {
      // Create radial gradient
      const gradient = smokeCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      smokeCtx.fillStyle = gradient;
      smokeCtx.fillRect(0, 0, 64, 64);
    }

    // Convert canvases to textures
    const wakeTexture = new THREE.CanvasTexture(wakeCanvas);
    const shipTexture = new THREE.CanvasTexture(shipCanvas);
    const metalTexture = new THREE.CanvasTexture(metalCanvas);
    const rustTexture = new THREE.CanvasTexture(rustCanvas);
    const smokeTexture = new THREE.CanvasTexture(smokeCanvas);

    return {
      wakeTexture,
      shipTexture,
      metalTexture,
      rustTexture,
      smokeTexture,
    };
  };

  // Create and use procedural textures
  const { wakeTexture, shipTexture, metalTexture, rustTexture, smokeTexture } =
    createProceduralTextures();

  // Create hull geometries
  useEffect(() => {
    // Create the detailed hull geometry
    const detailedGeometry = createShipHullGeometry(length, beam, draft);
    shipHullGeometryRef.current = detailedGeometry;

    // Create the simplified hull geometry
    const simplifiedGeometry = createSimplifiedShipHullGeometry(
      length,
      beam,
      draft,
    );
    simplifiedHullGeometryRef.current = simplifiedGeometry;
  }, [length, beam, draft]);

  // Smoke particle system
  const [smokeParticles, setSmokeParticles] =
    useState<THREE.BufferGeometry | null>(null);
  const [particleSystem, setParticleSystem] = useState<THREE.Points | null>(
    null,
  );

  useEffect(() => {
    // Create smoke particles
    if (!smokeParticles) {
      const particleCount = 100;
      const particles = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      const particleSizes = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random() - 0.5) * 2;
        particlePositions[i3 + 1] = Math.random() * 5;
        particlePositions[i3 + 2] = (Math.random() - 0.5) * 2;
        particleSizes[i] = Math.random() * 2 + 1;
      }

      particles.setAttribute(
        'position',
        new THREE.BufferAttribute(particlePositions, 3),
      );
      particles.setAttribute(
        'size',
        new THREE.BufferAttribute(particleSizes, 1),
      );
      setSmokeParticles(particles);

      const smokeMaterial = new THREE.PointsMaterial({
        size: 2,
        map: smokeTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.7,
        color: 0x666666,
      });

      const system = new THREE.Points(particles, smokeMaterial);
      setParticleSystem(system);
    }
  }, []);

  // Flag to use procedural geometry when model not available
  const useProceduralShip = !model || !modelLoaded;

  useEffect(() => {
    if (model) {
      setModelLoaded(true);

      // Add environment maps to model materials if needed
      if (model.scene) {
        model.scene.traverse(child => {
          if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                mat.envMapIntensity = 1;
                mat.needsUpdate = true;
              });
            } else {
              child.material.envMapIntensity = 1;
              child.material.needsUpdate = true;
            }
          }
        });
      }
    }
  }, [model]);

  // Update ship position, rotation, and animations
  useFrame((_, delta) => {
    if (shipRef.current) {
      // Update ship position and heading
      shipRef.current.position.set(position.x, position.y, position.z);
      shipRef.current.rotation.y = heading;

      // Add subtle pitch and roll based on speed and turning
      shipRef.current.rotation.z = Math.sin(Date.now() / 2000) * 0.02 * speed;
      shipRef.current.rotation.x =
        Math.sin(Date.now() / 1500) * 0.01 * speed -
        Math.abs(rudderAngle) * 0.05 * speed;

      // Animate propeller based on engine RPM
      if (propellerRef.current) {
        propellerRef.current.rotation.z +=
          delta * (engineRPM / 60) * Math.PI * 2;
      }

      // Update rudder angle
      if (rudderRef.current) {
        rudderRef.current.rotation.y = rudderAngle;
      }

      // Update wake visibility and opacity based on speed
      if (wakeRef.current && wakeRef.current.material) {
        const wakeMaterial = wakeRef.current
          .material as THREE.MeshStandardMaterial;
        wakeMaterial.opacity = THREE.MathUtils.clamp(speed * 0.2, 0, 0.8);
        wakeRef.current.scale.x = 1 + speed * 0.05;
        wakeRef.current.scale.z = 1 + speed * 0.1;
      }

      // Update smoke particles
      if (smokeRef.current && engineRPM > 10) {
        const particles = smokeRef.current.geometry as THREE.BufferGeometry;
        const positions = particles.getAttribute('position');
        const sizes = particles.getAttribute('size');

        const particleCount = positions.count;
        const smokeIntensity = engineRPM / 1000;

        // Move particles upward
        for (let i = 0; i < particleCount; i++) {
          positions.setY(i, positions.getY(i) + delta * 2 * smokeIntensity);

          // Reset particles that go too high
          if (positions.getY(i) > 15) {
            positions.setX(i, (Math.random() - 0.5) * 2);
            positions.setY(i, 0);
            positions.setZ(i, (Math.random() - 0.5) * 2);

            // Vary size based on engine power
            sizes.setX(i, Math.random() * 2 * smokeIntensity + 1);
          }
        }

        positions.needsUpdate = true;
        sizes.needsUpdate = true;
      }
    }
  });

  // Create the ship using either loaded model or procedural geometry
  return (
    <group
      ref={shipRef}
      position={[position.x, position.y, position.z]}
      rotation={[0, heading, 0]}
    >
      {!useProceduralShip ? (
        // Render loaded 3D model if available
        <Detailed distances={[0, 50, 300]}>
          {/* High detail at close range */}
          <primitive
            object={model.scene.clone()}
            scale={[10, 10, 10]} // Adjust scale as needed
            position={[0, -draft, 0]}
          />
          {/* Medium detail at medium range */}
          <primitive
            object={model.scene.clone()}
            scale={[0.1, 0.1, 0.1]}
            position={[0, -draft / 2, 0]}
          />
          {/* Low detail at far range */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <bufferGeometry attach="geometry">
              {(() => {
                if (!simplifiedHullGeometryRef.current) {
                  simplifiedHullGeometryRef.current =
                    createSimplifiedShipHullGeometry(length, beam, draft);
                }
                return null;
              })()}
            </bufferGeometry>
            <meshStandardMaterial
              color="#555555"
              roughness={0.7}
              metalness={0.3}
            />
          </mesh>
        </Detailed>
      ) : // Procedurally generated ship using geometry
      shipHullGeometryRef.current && simplifiedHullGeometryRef.current ? (
        <Detailed distances={[0, 150, 300]}>
          {/* High detail procedural model */}
          <group>
            {/* Hull with more realistic shape */}
            <mesh
              position={[0, 0, 0]} // Hull origin at deck level
              castShadow
              receiveShadow
              geometry={shipHullGeometryRef.current}
            >
              <meshStandardMaterial
                color="#555555"
                roughness={0.7}
                metalness={0.3}
                map={shipTexture}
                roughnessMap={metalTexture}
              />
            </mesh>

            {/* Ship superstructure - Position Y relative to deck (Y=0) */}
            <mesh position={[length * 0.2, draft, 0]} castShadow receiveShadow>
              <boxGeometry args={[length * 0.3, draft * 2, beam * 0.8]} />
              <meshStandardMaterial
                color="#FFFFFF"
                roughness={0.8}
                map={shipTexture}
              />
            </mesh>

            {/* Bridge - Position Y relative to top of superstructure */}
            <mesh
              position={[length * 0.3, draft * 2 + draft / 2, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[length * 0.1, draft, beam * 0.6]} />
              <meshStandardMaterial color="#333333" roughness={0.5} />
            </mesh>

            {/* Windows on bridge - Position relative to bridge center */}
            <mesh
              position={[length * 0.3, draft * 2 + draft * 0.7, beam * 0.31]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[length * 0.08, draft * 0.5, 0.1]} />
              <meshStandardMaterial
                color="#88CCFF"
                roughness={0.2}
                metalness={0.8}
                emissive="#447799"
                emissiveIntensity={0.5}
              />
            </mesh>
            <mesh
              position={[length * 0.3, draft * 2 + draft * 0.7, -beam * 0.31]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[length * 0.08, draft * 0.5, 0.1]} />
              <meshStandardMaterial
                color="#88CCFF"
                roughness={0.2}
                metalness={0.8}
                emissive="#447799"
                emissiveIntensity={0.5}
              />
            </mesh>

            {/* Funnel/Smokestack - Position Y relative to top of superstructure */}
            <mesh
              position={[length * 0.1, draft * 2 + draft, 0]}
              castShadow
              receiveShadow
            >
              <cylinderGeometry
                args={[beam * 0.15, beam * 0.2, draft * 2, 16]}
              />
              <meshStandardMaterial
                color="#DD3333"
                roughness={0.8}
                map={rustTexture}
              />
            </mesh>

            {/* Smoke effect from funnel - Position relative to top of funnel */}
            {particleSystem && (
              <primitive
                ref={smokeRef}
                object={particleSystem}
                position={[length * 0.1, draft * 2 + draft * 2, 0]}
              />
            )}

            {/* Deck equipment - crane - Position Y relative to deck */}
            <group position={[-length * 0.1, 0, 0]}>
              <mesh position={[0, draft * 1.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[length * 0.05, draft * 3, beam * 0.05]} />
                <meshStandardMaterial color="#888888" />
              </mesh>
              <mesh
                position={[0, draft * 3, beam * 0.2]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[length * 0.05, beam * 0.05, beam * 0.4]} />
                <meshStandardMaterial color="#888888" />
              </mesh>
              <mesh
                position={[0, draft * 3, beam * 0.4]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#333333" />
              </mesh>
              {/* Cable */}
              <mesh position={[0, draft * 1.5, beam * 0.4]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, draft * 3, 8]} />
                <meshStandardMaterial color="#111111" />
              </mesh>
            </group>

            {/* Propeller - Position relative to hull bottom/stern */}
            <mesh
              ref={propellerRef}
              position={[-length * 0.45, -draft * 0.5, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
              <meshStandardMaterial color="#CCAA00" metalness={0.8} />
              {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, i) => (
                <mesh
                  key={i}
                  position={[0, 0, 0]}
                  rotation={[Math.PI / 2, 0, angle]}
                >
                  <boxGeometry args={[0.2, 2, 0.1]} />
                  <meshStandardMaterial color="#CCAA00" metalness={0.8} />
                </mesh>
              ))}
            </mesh>

            {/* Rudder - Position relative to hull bottom/stern */}
            <group position={[-length * 0.45, -draft * 0.2, 0]}>
              <mesh ref={rudderRef} castShadow receiveShadow>
                <boxGeometry args={[length * 0.05, draft * 0.8, beam * 0.05]} />
                <meshStandardMaterial color="#444444" />
              </mesh>
            </group>

            {/* Bow decoration - Position Y relative to deck */}
            <mesh position={[length * 0.48, 0, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.1, 0.1, beam * 0.9, 8]} />
              <meshStandardMaterial color="#444444" />
              <mesh position={[0, beam * 0.45, 0]}>
                <sphereGeometry args={[0.3]} />
                <meshStandardMaterial color="red" />
              </mesh>
            </mesh>

            {/* Railings */}
            <CreateRailings length={length} beam={beam} draft={draft} />

            {/* Cargo containers for container ships */}
            {shipType === 'CONTAINER' && (
              <CreateContainers length={length} beam={beam} draft={draft} />
            )}

            {/* Tanker specific elements */}
            {shipType === 'TANKER' && (
              <CreateTankerElements length={length} beam={beam} draft={draft} />
            )}

            {/* Navigation lights */}
            <CreateNavigationLights length={length} beam={beam} draft={draft} />
          </group>

          {/* Medium detail procedural model */}
          <group>
            {/* Simplified hull */}
            <mesh
              position={[0, 0, 0]}
              castShadow
              receiveShadow
              geometry={shipHullGeometryRef.current}
            >
              <meshStandardMaterial
                color="#555555"
                roughness={0.7}
                metalness={0.3}
              />
            </mesh>

            {/* Simplified superstructure - Adjusted Y */}
            <mesh position={[length * 0.2, draft, 0]} castShadow receiveShadow>
              <boxGeometry args={[length * 0.3, draft * 2, beam * 0.8]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
            </mesh>

            {/* Simplified bridge - Adjusted Y */}
            <mesh
              position={[length * 0.3, draft * 2 + draft / 2, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[length * 0.1, draft, beam * 0.6]} />
              <meshStandardMaterial color="#333333" roughness={0.5} />
            </mesh>

            {/* Navigation lights */}
            <CreateNavigationLights length={length} beam={beam} draft={draft} />
          </group>

          {/* Low detail model for far-away viewing */}
          <mesh
            position={[0, 0, 0]}
            castShadow
            receiveShadow
            geometry={simplifiedHullGeometryRef.current}
          >
            <meshStandardMaterial color="#555555" />
          </mesh>
        </Detailed>
      ) : null}

      {/* Wake effect - always visible regardless of detail level */}
      <mesh
        ref={wakeRef}
        position={[-length * 0.3, -draft * 0.9, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[length * 0.8, beam * 1.5]} />
        <meshStandardMaterial
          color="white"
          map={wakeTexture}
          transparent={true}
          opacity={0.5}
          alphaTest={0.1}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// Function to create hull geometry
function createShipHullGeometry(length: number, beam: number, draft: number) {
  // Create a more realistic hull shape with tapered ends
  const vertices = [];
  const indices = [];

  const segments = 20;
  const halfLength = length / 2;
  const halfBeam = beam / 2;

  // Create hull points
  for (let i = 0; i <= segments; i++) {
    const x = -halfLength + (i / segments) * length;
    const xRatio = 1 - Math.abs(x / halfLength);

    // Width tapers at bow and stern
    const segmentBeam = halfBeam * (0.3 + 0.7 * Math.sin(Math.PI * xRatio));

    // Bottom points
    vertices.push(x, -draft, -segmentBeam); // Port bottom
    vertices.push(x, -draft, segmentBeam); // Starboard bottom

    // Top points
    vertices.push(x, 0, -segmentBeam); // Port top
    vertices.push(x, 0, segmentBeam); // Starboard top

    // Create faces (triangles)
    if (i < segments) {
      const baseIdx = i * 4;

      // Port side face
      indices.push(baseIdx, baseIdx + 4, baseIdx + 6);
      indices.push(baseIdx, baseIdx + 6, baseIdx + 2);

      // Starboard side face
      indices.push(baseIdx + 1, baseIdx + 3, baseIdx + 7);
      indices.push(baseIdx + 1, baseIdx + 7, baseIdx + 5);

      // Bottom face
      indices.push(baseIdx, baseIdx + 1, baseIdx + 5);
      indices.push(baseIdx, baseIdx + 5, baseIdx + 4);

      // Top face (deck)
      indices.push(baseIdx + 2, baseIdx + 6, baseIdx + 7);
      indices.push(baseIdx + 2, baseIdx + 7, baseIdx + 3);

      // Bow face (front)
      if (i === 0) {
        indices.push(baseIdx, baseIdx + 2, baseIdx + 3);
        indices.push(baseIdx, baseIdx + 3, baseIdx + 1);
      }

      // Stern face (back)
      if (i === segments - 1) {
        indices.push(baseIdx + 4, baseIdx + 5, baseIdx + 7);
        indices.push(baseIdx + 4, baseIdx + 7, baseIdx + 6);
      }
    }
  }

  // Create a BufferGeometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// Create a simplified hull geometry for distant views
function createSimplifiedShipHullGeometry(
  length: number,
  beam: number,
  draft: number,
) {
  const vertices = [];
  const indices = [];

  const segments = 8; // Fewer segments for lower detail
  const halfLength = length / 2;
  const halfBeam = beam / 2;

  // Create hull points with fewer segments
  for (let i = 0; i <= segments; i++) {
    const x = -halfLength + (i / segments) * length;
    const xRatio = 1 - Math.abs(x / halfLength);
    const segmentBeam = halfBeam * (0.3 + 0.7 * Math.sin(Math.PI * xRatio));

    // Bottom points
    vertices.push(x, -draft, -segmentBeam);
    vertices.push(x, -draft, segmentBeam);

    // Top points
    vertices.push(x, 0, -segmentBeam);
    vertices.push(x, 0, segmentBeam);

    // Create faces
    if (i < segments) {
      const baseIdx = i * 4;

      // Sides, bottom, top
      indices.push(baseIdx, baseIdx + 4, baseIdx + 6);
      indices.push(baseIdx, baseIdx + 6, baseIdx + 2);
      indices.push(baseIdx + 1, baseIdx + 3, baseIdx + 7);
      indices.push(baseIdx + 1, baseIdx + 7, baseIdx + 5);
      indices.push(baseIdx, baseIdx + 1, baseIdx + 5);
      indices.push(baseIdx, baseIdx + 5, baseIdx + 4);
      indices.push(baseIdx + 2, baseIdx + 6, baseIdx + 7);
      indices.push(baseIdx + 2, baseIdx + 7, baseIdx + 3);

      // Front/back
      if (i === 0) {
        indices.push(baseIdx, baseIdx + 2, baseIdx + 3);
        indices.push(baseIdx, baseIdx + 3, baseIdx + 1);
      }
      if (i === segments - 1) {
        indices.push(baseIdx + 4, baseIdx + 5, baseIdx + 7);
        indices.push(baseIdx + 4, baseIdx + 7, baseIdx + 6);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// Component for ship railings using InstancedMesh
const CreateRailings: React.FC<{
  length: number;
  beam: number;
  draft: number; // Keep draft for post height calculation, but position relative to deck (y=0)
}> = ({ length, beam, draft }) => {
  const postHeight = draft * 0.6; // Keep original height calculation
  const railOffsetY = postHeight * 0.9; // Position rails near the top of posts
  const postGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.1, 0.1, postHeight, 6),
    [postHeight],
  );
  const railGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.05, 0.05, 1, 6),
    [],
  ); // Length set later via scale
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#AAAAAA' }),
    [],
  );

  const postsCount = Math.floor(length / 2);
  const railSegmentLength =
    (length * 0.9) / (postsCount > 1 ? postsCount - 1 : 1);

  const postInstances = useMemo(() => {
    const instances = [];
    const tempObject = new THREE.Object3D();
    for (let i = 0; i < postsCount; i++) {
      const xPos = -length * 0.45 + i * railSegmentLength;
      const yPos = postHeight / 2; // Position post center relative to deck (y=0)
      // Port post
      tempObject.position.set(xPos, yPos, -beam * 0.45);
      tempObject.updateMatrix();
      instances.push({
        key: `post_port_${i}`,
        matrix: tempObject.matrix.clone(),
      });
      // Starboard post
      tempObject.position.set(xPos, yPos, beam * 0.45);
      tempObject.updateMatrix();
      instances.push({
        key: `post_stbd_${i}`,
        matrix: tempObject.matrix.clone(),
      });
    }
    return instances;
  }, [length, beam, postsCount, railSegmentLength, postHeight]);

  const railInstances = useMemo(() => {
    const instances = [];
    const tempObject = new THREE.Object3D();
    if (postsCount > 1) {
      for (let i = 0; i < postsCount - 1; i++) {
        const xPos = -length * 0.45 + i * railSegmentLength;
        const midX = xPos + railSegmentLength / 2;
        const yPos = railOffsetY; // Position rail relative to deck (y=0)
        // Port rail
        tempObject.position.set(midX, yPos, -beam * 0.45);
        tempObject.rotation.set(0, 0, Math.PI / 2); // Rotate to be horizontal
        tempObject.scale.set(1, railSegmentLength, 1); // Scale to correct length
        tempObject.updateMatrix();
        instances.push({
          key: `rail_port_${i}`,
          matrix: tempObject.matrix.clone(),
        });
        // Starboard rail
        tempObject.position.set(midX, yPos, beam * 0.45);
        // rotation is same
        // scale is same
        tempObject.updateMatrix();
        instances.push({
          key: `rail_stbd_${i}`,
          matrix: tempObject.matrix.clone(),
        });
      }
    }
    return instances;
  }, [length, beam, postsCount, railSegmentLength, railOffsetY]);

  return (
    <>
      <Instances geometry={postGeometry} material={material} castShadow>
        {postInstances.map(props => (
          <Instance key={props.key} matrix={props.matrix} />
        ))}
      </Instances>
      <Instances geometry={railGeometry} material={material} castShadow>
        {railInstances.map(props => (
          <Instance key={props.key} matrix={props.matrix} />
        ))}
      </Instances>
    </>
  );
};

// Component for cargo containers using InstancedMesh
const CreateContainers: React.FC<{
  length: number;
  beam: number;
  draft: number;
}> = ({ length, beam, draft }) => {
  const colors = useMemo(
    () => ['#2A93D5', '#DD3333', '#33DD33', '#DDDD33', '#DD33DD'],
    [],
  );
  const containerGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []); // Scaled per instance

  const containerLength = length * 0.1;
  const containerWidth = beam * 0.2;
  const containerHeight = draft * 0.8;

  const rows = 3;
  const cols = Math.floor((length * 0.6) / containerLength);
  const stacks = Math.floor((beam * 0.8) / containerWidth);

  const instancesData = useMemo(() => {
    const data = [];
    const tempObject = new THREE.Object3D();
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        for (let stack = 0; stack < stacks; stack++) {
          const xPos =
            -length * 0.3 + col * containerLength + containerLength / 2;
          // Position containers starting from the deck (y=0)
          const yPos = row * containerHeight + containerHeight / 2;
          const zPos =
            -beam * 0.4 + stack * containerWidth + containerWidth / 2;

          tempObject.position.set(xPos, yPos, zPos);
          tempObject.scale.set(
            containerLength * 0.95,
            containerHeight * 0.95,
            containerWidth * 0.95,
          );
          tempObject.updateMatrix();

          const colorIndex = (row + col + stack) % colors.length;
          data.push({
            key: `container-${row}-${col}-${stack}`,
            matrix: tempObject.matrix.clone(),
            color: colors[colorIndex],
          });
        }
      }
    }
    return data;
  }, [
    length,
    beam,
    rows,
    cols,
    stacks,
    containerLength,
    containerWidth,
    containerHeight,
    colors,
  ]);

  // Group instances by color to use fewer <Instances> components
  const instancesByColor = useMemo(() => {
    const grouped: { [color: string]: typeof instancesData } = {};
    for (const instance of instancesData) {
      if (!grouped[instance.color]) {
        grouped[instance.color] = [];
      }
      grouped[instance.color].push(instance);
    }
    return grouped;
  }, [instancesData]);

  return (
    <>
      {Object.entries(instancesByColor).map(([color, instances]) => (
        <Instances
          key={color}
          geometry={containerGeometry}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={color} roughness={0.7} />
          {instances.map(props => (
            <Instance key={props.key} matrix={props.matrix} />
          ))}
        </Instances>
      ))}
    </>
  );
};

// Component for tanker-specific elements
const CreateTankerElements: React.FC<{
  length: number;
  beam: number;
  draft: number;
}> = ({ length, beam, draft }) => {
  return (
    <>
      {/* Pipes running along deck - Position Y relative to deck */}
      <mesh position={[0, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[beam * 0.03, beam * 0.03, length * 0.7, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Cargo hatches - Position Y relative to deck */}
      {Array.from({ length: 5 }).map((_, i) => (
        <group
          key={`hatch-${i}`}
          position={[-length * 0.3 + i * length * 0.15, 0.1, 0]}
        >
          {/* Base */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry
              args={[beam * 0.2, beam * 0.2, draft * 0.2, 16]}
            />
            <meshStandardMaterial
              color="#444444"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          {/* Lid */}
          <mesh position={[0, draft * 0.2, 0]}>
            <cylinderGeometry
              args={[beam * 0.18, beam * 0.18, draft * 0.05, 16]}
            />
            <meshStandardMaterial
              color="#333333"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
    </>
  );
};

// Component for navigation lights
const CreateNavigationLights: React.FC<{
  length: number;
  beam: number;
  draft: number;
}> = ({ length, beam, draft }) => {
  const lightHeight = draft * 2 + draft + 0.5; // Example height on bridge/mast
  const deckLightHeight = 0.5; // Height above deck for side/stern lights

  return (
    <>
      {/* Port (red) light - Position Y relative to deck */}
      <mesh
        position={[length * 0.45, deckLightHeight, -beam * 0.45]}
        castShadow
      >
        <sphereGeometry args={[0.4]} />
        <meshStandardMaterial
          color="#FF0000"
          emissive="#FF0000"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Starboard (green) light - Position Y relative to deck */}
      <mesh position={[length * 0.45, deckLightHeight, beam * 0.45]} castShadow>
        <sphereGeometry args={[0.4]} />
        <meshStandardMaterial
          color="#00FF00"
          emissive="#00FF00"
          emissiveIntensity={2}
        />
      </mesh>

      {/* White masthead light - Position Y relative to bridge/mast */}
      <mesh position={[length * 0.3, lightHeight, 0]} castShadow>
        <sphereGeometry args={[0.4]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#FFFFFF"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Stern light - Position Y relative to deck */}
      <mesh position={[-length * 0.45, deckLightHeight, 0]} castShadow>
        <sphereGeometry args={[0.4]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#FFFFFF"
          emissiveIntensity={2}
        />
      </mesh>
    </>
  );
};

export default Ship;
