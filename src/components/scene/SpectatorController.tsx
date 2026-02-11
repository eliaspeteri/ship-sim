import React from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

export function SpectatorController({
  mode,
  focusRef,
  entryTargetRef,
  controlsRef,
}: {
  mode: 'player' | 'spectator';
  focusRef: React.MutableRefObject<{ x: number; y: number }>;
  entryTargetRef: React.MutableRefObject<{ x: number; y: number }>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const keys = React.useRef<Record<string, boolean>>({});
  const positionRef = React.useRef(
    new THREE.Vector3(
      entryTargetRef.current.x - 200,
      220,
      entryTargetRef.current.y - 200,
    ),
  );
  const forwardRef = React.useRef(new THREE.Vector3(0, 0, -1).normalize());
  const tmpVec = React.useRef(new THREE.Vector3());
  const distanceVec = React.useRef(new THREE.Vector3());

  React.useEffect(() => {
    if (mode !== 'spectator') return;

    const start = entryTargetRef.current;
    positionRef.current.set(start.x - 200, 220, start.y - 200);
    tmpVec.current.set(start.x, 0, start.y);
    forwardRef.current
      .copy(tmpVec.current)
      .sub(positionRef.current)
      .normalize();
    focusRef.current = { x: start.x, y: start.y };
    camera.position.copy(positionRef.current);

    if (controlsRef.current) {
      controlsRef.current.target.set(focusRef.current.x, 0, focusRef.current.y);
      controlsRef.current.update();
    } else {
      camera.lookAt(
        tmpVec.current.set(focusRef.current.x, 0, focusRef.current.y),
      );
    }
  }, [mode, camera, focusRef, controlsRef, entryTargetRef]);

  React.useEffect(() => {
    if (mode !== 'spectator') return;

    const handleDown = (event: globalThis.KeyboardEvent) => {
      keys.current[event.key.toLowerCase()] = true;
    };
    const handleUp = (event: globalThis.KeyboardEvent) => {
      keys.current[event.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);

    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [mode]);

  useFrame((_, delta) => {
    if (mode !== 'spectator') return;

    distanceVec.current.set(focusRef.current.x, 0, focusRef.current.y);
    const distance = camera.position.distanceTo(distanceVec.current);
    const speedScale = THREE.MathUtils.clamp(distance / 200, 0.3, 6);
    const baseSpeed = 330;
    const boostSpeed = 820;
    const moveSpeed =
      (keys.current['shift'] ? boostSpeed : baseSpeed) * delta * speedScale;

    camera.getWorldDirection(forwardRef.current).setY(0);
    if (forwardRef.current.lengthSq() === 0) {
      forwardRef.current.set(0, 0, -1);
    }
    forwardRef.current.normalize();

    const right = tmpVec.current
      .set(0, 1, 0)
      .cross(forwardRef.current)
      .normalize();
    const movement = new THREE.Vector3();

    if (keys.current['w'] || keys.current['arrowup']) {
      movement.add(forwardRef.current);
    }
    if (keys.current['s'] || keys.current['arrowdown']) {
      movement.sub(forwardRef.current);
    }
    if (keys.current['a']) {
      movement.add(right);
    }
    if (keys.current['d']) {
      movement.sub(right);
    }

    if (movement.lengthSq() > 0) {
      movement.normalize().multiplyScalar(moveSpeed);
      positionRef.current.add(movement);
      camera.position.add(movement);
      focusRef.current = {
        x: focusRef.current.x + movement.x,
        y: focusRef.current.y + movement.z,
      };
    }

    if (controlsRef.current) {
      controlsRef.current.target.set(focusRef.current.x, 0, focusRef.current.y);
      controlsRef.current.update();
      positionRef.current.copy(camera.position);
    } else {
      const lookAt = tmpVec.current.set(
        focusRef.current.x,
        0,
        focusRef.current.y,
      );
      camera.lookAt(lookAt);
      positionRef.current.copy(camera.position);
    }
  });

  return null;
}
