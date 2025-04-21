import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Detailed } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store';

interface ShipProps {
  position: { x: number; y: number; z: number };
  heading: number;
  shipType?: 'CONTAINER' | 'TANKER' | 'CARGO' | 'DEFAULT';
}

const SHIP_MODELS = {
  CONTAINER: '/models/container_ship.glb',
  TANKER: '/models/tanker_ship.glb',
  CARGO: '/models/cargo_ship.glb',
  DEFAULT: null,
} as const;

const Ship: React.FC<ShipProps> = ({
  position,
  heading,
  shipType = 'DEFAULT',
}) => {
  const shipRef = useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const model = SHIP_MODELS[shipType] ? useGLTF(SHIP_MODELS[shipType]) : null;

  // Get vessel state from store including orientation data
  const { controls, velocity, orientation } = useStore(state => state.vessel);
  const rudderAngle = controls?.rudderAngle || 0;
  const speed = Math.hypot(velocity?.surge || 0, velocity?.sway || 0);

  // Get sea state for wave effect calculation
  const seaState = useStore(state => state.environment.seaState);

  // Get physics-calculated roll and pitch if available
  const roll = orientation?.roll || 0;
  const pitch = orientation?.pitch || 0;

  useEffect(() => {
    if (model) {
      setModelLoaded(true);
      model.scene.traverse(child => {
        const mat = (child as THREE.Mesh).material;
        if (!mat) return;
        const collected: THREE.Material[] = [];
        const collect = (m: THREE.Material | THREE.Material[]) =>
          Array.isArray(m) ? m.forEach(collect) : collected.push(m);
        collect(mat);
        collected.forEach(m => {
          if ('envMapIntensity' in m) {
            if (m instanceof THREE.MeshStandardMaterial) {
              m.envMapIntensity = 1;
            }
            m.needsUpdate = true;
          }
        });
      });
    }

    return () => {
      if (model?.scene) {
        model.scene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              const mats = Array.isArray(child.material)
                ? child.material
                : [child.material];
              mats.forEach((m: THREE.Material) => m.dispose());
            }
          }
        });
      }
    };
  }, [model]);

  // Calculate additional ship motion based on sea state when physics-based roll/pitch aren't available
  const calculateWaveMotion = (time: number, seaState: number) => {
    if (seaState < 1) return { roll: 0, pitch: 0 };

    // Scale motion intensity with sea state and ship speed
    const intensityFactor = Math.min(seaState * 0.02, 0.15);
    const speedDamping = Math.max(0.2, Math.min(1.0, speed * 0.1)); // More stable at higher speeds

    // Different frequencies for roll and pitch create more realistic motion
    const rollFreq = 0.6; // Roll typically has lower frequency than pitch
    const pitchFreq = 1.2;

    // Calculate the actual motion with some randomness
    const calculatedRoll =
      Math.sin(time * rollFreq) * intensityFactor * speedDamping;
    const calculatedPitch =
      Math.sin(time * pitchFreq + 1.3) * intensityFactor * 0.6 * speedDamping;

    return {
      roll: calculatedRoll,
      pitch: calculatedPitch,
    };
  };

  useFrame(({ clock }) => {
    const obj = shipRef.current;
    if (obj) {
      // Position from props
      obj.position.set(position.x, position.y, position.z);

      // Calculate wave-based motion if needed
      const time = clock.getElapsedTime();
      const { roll: waveRoll, pitch: wavePitch } = calculateWaveMotion(
        time,
        seaState,
      );

      // Use physics-based motion when available, otherwise fallback to calculated wave motion
      const effectiveRoll = roll || waveRoll;
      const effectivePitch = pitch || wavePitch;

      // Add rudder-induced heel (roll) when turning
      const rudderInducedRoll = -Math.abs(rudderAngle) * 0.05 * speed;

      // Apply heading, roll and pitch
      obj.rotation.set(
        effectivePitch, // X rotation (pitch)
        heading, // Y rotation (yaw/heading)
        effectiveRoll + rudderInducedRoll, // Z rotation (roll)
      );

      // Optional: Add small vertical motion based on wave height
      if (position.z === 0) {
        // Only apply if Z hasn't been explicitly set
        const bobAmount = Math.sin(time * 0.8) * Math.min(seaState * 0.05, 0.3);
        obj.position.y += bobAmount;
      }
    }
  });

  return (
    <group
      ref={shipRef}
      position={[position.x, position.y, position.z]}
      rotation={[0, heading, 0]}
    >
      {modelLoaded && model?.scene && (
        <Detailed distances={[0, 50, 300]}>
          <primitive
            object={model.scene.clone()}
            scale={[10, 10, 10]}
            castShadow
            receiveShadow
          />
          <primitive
            object={model.scene.clone()}
            scale={[10, 10, 10]}
            castShadow
            receiveShadow
          />
        </Detailed>
      )}
    </group>
  );
};

export default Ship;
