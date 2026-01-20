import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Detailed } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store';

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
  showDebugMarkers?: boolean;
  onSelect?: (id: string) => void;
}

const SHIP_MODELS = {
  CONTAINER: '/models/container_ship.glb',
  TANKER: '/models/tanker_ship.glb',
  CARGO: '/models/cargo_ship.glb',
  DEFAULT: null,
} as const;

const Ship: React.FC<ShipProps> = ({
  vesselId,
  position,
  heading,
  shipType = 'DEFAULT',
  modelPath = null,
  renderOptions,
  ballast = 0.5,
  draft = 6,
  length = 150,
  roll,
  pitch,
  horizonOcclusion,
  showDebugMarkers = false,
  onSelect,
}) => {
  const shipRef = useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const resolvedModelPath = modelPath || SHIP_MODELS[shipType] || null;
  const model = resolvedModelPath ? useGLTF(resolvedModelPath) : null;
  const orientation = useStore(state => state.vessel.orientation);
  const markerOffset = length / 2;
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

      const yPos =
        (position.y !== undefined ? position.y * heaveScale + sink : sink) -
        drop;
      // Position from props and physics state (use heave in y plus sink offset)
      obj.position.set(position.x, yPos, position.z);

      const rollAngle = roll ?? orientation?.roll ?? 0;
      const pitchAngle = pitch ?? orientation?.pitch ?? 0;
      // Render heading: model forward (+Z) vs physics forward (+X). Rotate +90° to align axes.
      const modelYaw = ((renderOptions?.modelYawDeg ?? 0) * Math.PI) / 180;
      const renderHeading = Math.PI / 2 - heading + modelYaw;

      // Apply heading, roll, and pitch (roll/pitch from physics; heading from store)
      obj.rotation.set(pitchAngle, renderHeading, rollAngle);
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
      {modelLoaded && model?.scene && (
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
      )}
      {showDebugMarkers ? (
        <>
          <mesh position={[0, 2, markerOffset]}>
            <sphereGeometry args={[length / 2, 16, 16]} />
            <meshBasicMaterial color="#ff3b30" />
          </mesh>
          <mesh position={[0, 2, -markerOffset]}>
            <sphereGeometry args={[length / 2, 16, 16]} />
            <meshBasicMaterial color="#34c759" />
          </mesh>
          <mesh position={[markerOffset, 2, 0]}>
            <sphereGeometry args={[length / 2, 16, 16]} />
            <meshBasicMaterial color="#007aff" />
          </mesh>
          <mesh position={[-markerOffset, 2, 0]}>
            <sphereGeometry args={[length / 2, 16, 16]} />
            <meshBasicMaterial color="#ff9500" />
          </mesh>
        </>
      ) : null}
    </group>
  );
};

export default Ship;
