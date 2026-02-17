import { useGLTF, Detailed } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

import { getCompositeWaveSample, getGerstnerSample } from '../lib/waves';

import type { WaveState } from '../lib/waves';

function ShipModel({ modelPath }: { modelPath: string }): React.ReactElement {
  const model = useGLTF(modelPath);
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
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

    return () => {
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
    };
  }, [model]);

  if (!modelLoaded) return <></>;

  return (
    <Detailed distances={[0, 50, 300]}>
      <primitive
        object={model.scene.clone()}
        scale={[1, 1, 1]}
        castShadow
        receiveShadow
      />
      <primitive
        object={model.scene.clone()}
        scale={[1, 1, 1]}
        castShadow
        receiveShadow
      />
    </Detailed>
  );
}

interface ShipProps {
  vesselId?: string;
  position: { x: number; y: number; z: number };
  heading: number;
  shipType?: 'CONTAINER' | 'TANKER' | 'CARGO' | 'DEFAULT';
  modelPath?: string | null;
  renderOptions?: {
    modelYawDeg?: number;
    sinkFactor?: number;
    heaveScale?: number;
  };
  ballast?: number;
  draft?: number;
  length?: number;
  roll?: number;
  pitch?: number;
  horizonOcclusion?: {
    enabled: boolean;
    dropStart?: number;
    dropEnd?: number;
    planetRadius?: number;
  };
  wave?: WaveState;
  waveTimeRef?: React.MutableRefObject<number>;
  applyWaveHeave?: boolean;
  showDebugMarkers?: boolean;
  onSelect?: (id: string) => void;
}

const Ship: React.FC<ShipProps> = ({
  vesselId,
  position,
  heading,
  modelPath = null,
  renderOptions,
  ballast = 0.5,
  draft = 6,
  roll,
  pitch,
  horizonOcclusion,
  wave,
  waveTimeRef,
  applyWaveHeave = true,
  onSelect,
}) => {
  const shipRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    const obj = shipRef.current;
    if (obj) {
      const sinkFactor = renderOptions?.sinkFactor ?? 0.4;
      const heaveScale = renderOptions?.heaveScale ?? 1;
      const sink = -draft * (sinkFactor + sinkFactor * ballast);

      let drop = 0;
      if (horizonOcclusion?.enabled) {
        const dropStart = horizonOcclusion.dropStart ?? 3_800;
        const dropEnd = horizonOcclusion.dropEnd ?? 6_800;
        const R = horizonOcclusion.planetRadius ?? 6_371_000;
        const dx = position.x - camera.position.x;
        const dz = position.z - camera.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > dropStart) {
          const h = Math.max(camera.position.y, 1);
          const rawDrop = (dist * dist) / (2 * R);
          const t = THREE.MathUtils.clamp(
            (dist - dropStart) / Math.max(1, dropEnd - dropStart),
            0,
            1,
          );
          // Slightly reduce drop when viewer is very low to avoid harsh pop
          const heightScale = THREE.MathUtils.clamp(h / 50, 0.35, 1);
          drop = rawDrop * t * heightScale;
        }
      }

      let waveOffset = 0;
      if (applyWaveHeave && wave && waveTimeRef) {
        const t = waveTimeRef.current;
        const composite = getCompositeWaveSample(
          position.x,
          position.z,
          t,
          wave,
        );
        const base = getGerstnerSample(position.x, position.z, t, wave);
        waveOffset = composite.height - base.height;
      }

      const yPos =
        (position.y !== undefined ? position.y * heaveScale + sink : sink) -
        drop +
        waveOffset;
      // Position from props and physics state (use heave in y plus sink offset)
      obj.position.set(position.x, yPos, position.z);

      const rollAngle = roll ?? 0;
      const pitchAngle = pitch ?? 0;

      // Apply heading, roll, and pitch (roll/pitch from physics; heading from store)
      obj.rotation.set(pitchAngle, -heading, rollAngle);
    }
  });

  return (
    <group
      ref={shipRef}
      position={[position.x, position.y, position.z]}
      onPointerDown={event => {
        if (!onSelect || !vesselId) return;
        event.stopPropagation();
        onSelect(vesselId);
      }}
    >
      {modelPath ? <ShipModel modelPath={modelPath} /> : null}
    </group>
  );
};

export default Ship;
