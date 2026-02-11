import React from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function AdminDragLayer({
  enabled,
  targets,
  previewPositions,
  onPreview,
  onPreviewEnd,
  onDrop,
  onDragStateChange,
}: {
  enabled: boolean;
  targets: Array<{ id: string; x: number; y: number }>;
  previewPositions: Record<string, { x: number; y: number }>;
  onPreview: (id: string, x: number, y: number) => void;
  onPreviewEnd: (id: string) => void;
  onDrop: (id: string, x: number, y: number) => void;
  onDragStateChange: (dragging: boolean) => void;
}) {
  const { camera, gl } = useThree();
  const plane = React.useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    [],
  );
  const dragRef = React.useRef<{ id: string | null }>({ id: null });
  const hitPoint = React.useRef(new THREE.Vector3());
  const pointer = React.useRef(new THREE.Vector2());
  const raycaster = React.useRef(new THREE.Raycaster());
  const activePointerIdRef = React.useRef<number | null>(null);
  const lastPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const moveListenerRef = React.useRef<((event: PointerEvent) => void) | null>(
    null,
  );
  const upListenerRef = React.useRef<((event: PointerEvent) => void) | null>(
    null,
  );

  const updateDragPosition = React.useCallback(
    (clientX: number, clientY: number) => {
      const id = dragRef.current.id;
      if (!id) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;

      pointer.current.set(x, y);
      raycaster.current.setFromCamera(pointer.current, camera);

      if (!raycaster.current.ray.intersectPlane(plane, hitPoint.current)) {
        return;
      }

      lastPosRef.current = {
        x: hitPoint.current.x,
        y: hitPoint.current.z,
      };
      onPreview(id, hitPoint.current.x, hitPoint.current.z);
    },
    [camera, gl, onPreview, plane],
  );

  React.useEffect(() => {
    return () => {
      if (moveListenerRef.current) {
        window.removeEventListener('pointermove', moveListenerRef.current);
      }
      if (upListenerRef.current) {
        window.removeEventListener('pointerup', upListenerRef.current);
        window.removeEventListener('pointercancel', upListenerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (enabled || !dragRef.current.id) return;

    const dropId = dragRef.current.id;
    dragRef.current.id = null;
    activePointerIdRef.current = null;
    lastPosRef.current = null;

    onPreviewEnd(dropId);
    onDragStateChange(false);

    if (moveListenerRef.current) {
      window.removeEventListener('pointermove', moveListenerRef.current);
    }
    if (upListenerRef.current) {
      window.removeEventListener('pointerup', upListenerRef.current);
      window.removeEventListener('pointercancel', upListenerRef.current);
    }
  }, [enabled, onDragStateChange, onPreviewEnd]);

  const handlePointerDown = React.useCallback(
    (id: string) => (event: ThreeEvent<PointerEvent>) => {
      if (!enabled) return;

      event.stopPropagation();
      dragRef.current.id = id;
      activePointerIdRef.current = event.pointerId;
      onDragStateChange(true);
      updateDragPosition(event.clientX, event.clientY);

      const handleMove = (moveEvent: PointerEvent) => {
        if (activePointerIdRef.current !== moveEvent.pointerId) return;
        updateDragPosition(moveEvent.clientX, moveEvent.clientY);
      };

      const handleUp = (upEvent: PointerEvent) => {
        if (activePointerIdRef.current !== upEvent.pointerId) return;

        const dropId = dragRef.current.id;
        if (dropId && lastPosRef.current) {
          onDrop(dropId, lastPosRef.current.x, lastPosRef.current.y);
        }
        if (dropId) {
          onPreviewEnd(dropId);
        }

        dragRef.current.id = null;
        activePointerIdRef.current = null;
        lastPosRef.current = null;
        onDragStateChange(false);

        if (moveListenerRef.current) {
          window.removeEventListener('pointermove', moveListenerRef.current);
        }
        if (upListenerRef.current) {
          window.removeEventListener('pointerup', upListenerRef.current);
          window.removeEventListener('pointercancel', upListenerRef.current);
        }
      };

      moveListenerRef.current = handleMove;
      upListenerRef.current = handleUp;
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
    },
    [enabled, onDragStateChange, onDrop, onPreviewEnd, updateDragPosition],
  );

  if (!enabled || targets.length === 0) return null;

  return (
    <>
      {targets.map(target => (
        <mesh
          key={target.id}
          position={[
            previewPositions[target.id]?.x ?? target.x,
            2,
            previewPositions[target.id]?.y ?? target.y,
          ]}
          onPointerDown={handlePointerDown(target.id)}
        >
          <sphereGeometry args={[20, 20, 20]} />
          <meshBasicMaterial
            color="#1b9aaa"
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
