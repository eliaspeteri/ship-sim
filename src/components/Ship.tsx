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

  const { controls, velocity } = useStore(state => state.vessel) || {};
  const rudderAngle = controls?.rudderAngle || 0;
  const speed = Math.hypot(velocity?.surge || 0, velocity?.sway || 0);

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
        model.scene.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            const mats = Array.isArray(child.material)
              ? child.material
              : [child.material];
            mats.forEach((m: THREE.Material) => m.dispose());
          }
        });
      }
    };
  }, [model]);

  useFrame(() => {
    const obj = shipRef.current;
    if (obj) {
      obj.position.set(position.x, position.y, position.z);
      obj.rotation.set(
        Math.sin(Date.now() / 2000) * 0.02 * speed,
        heading,
        Math.sin(Date.now() / 1500) * 0.01 * speed -
          Math.abs(rudderAngle) * 0.05 * speed,
      );
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
            scale={[0.1, 0.1, 0.1]}
            castShadow
            receiveShadow
          />
        </Detailed>
      )}
    </group>
  );
};

export default Ship;
