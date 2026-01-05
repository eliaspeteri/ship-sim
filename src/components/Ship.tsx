import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Detailed } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store';

interface ShipProps {
  position: { x: number; y: number; z: number };
  heading: number;
  shipType?: 'CONTAINER' | 'TANKER' | 'CARGO' | 'DEFAULT';
  ballast?: number;
  draft?: number;
  roll?: number;
  pitch?: number;
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
  ballast = 0.5,
  draft = 6,
  roll,
  pitch,
}) => {
  const shipRef = useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const model = SHIP_MODELS[shipType] ? useGLTF(SHIP_MODELS[shipType]) : null;
  const orientation = useStore(state => state.vessel.orientation);
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

  useFrame(() => {
    const obj = shipRef.current;
    if (obj) {
      const sink = -draft * (0.4 + 0.4 * ballast); // simple visual offset
      const yPos =
        position.y !== undefined ? position.y + sink : sink;
      // Position from props and physics state (use heave in y plus sink offset)
      obj.position.set(position.x, yPos, position.z);

      const rollAngle = roll ?? orientation?.roll ?? 0;
      const pitchAngle = pitch ?? orientation?.pitch ?? 0;
      // Render heading: model forward (+Z) vs physics forward (+X). Rotate -90° to align axes and invert for Three.js.
      const renderHeading = -heading - Math.PI / 2;

      // Apply heading, roll, and pitch (roll/pitch from physics; heading from store)
      obj.rotation.set(pitchAngle, renderHeading, rollAngle);
    }
  });

  return (
    <group ref={shipRef} position={[position.x, position.y, position.z]}>
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
