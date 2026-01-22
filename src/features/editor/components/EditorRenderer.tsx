import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { LandTiles } from '../../../components/LandTiles';

type EditorRendererProps = {
  focusRef: React.MutableRefObject<{ x: number; y: number }>;
  cameraStateRef: React.MutableRefObject<{
    y: number;
    fov: number;
    aspect: number;
  }>;
};

const FocusSync: React.FC<{
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  focusRef: React.MutableRefObject<{ x: number; y: number }>;
}> = ({ controlsRef, focusRef }) => {
  useFrame(() => {
    const controls = controlsRef.current;
    if (controls?.target) {
      focusRef.current = {
        x: controls.target.x,
        y: controls.target.z,
      };
    }
  });
  return null;
};

const CameraStateSync: React.FC<{
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  cameraStateRef: React.MutableRefObject<{
    y: number;
    fov: number;
    aspect: number;
  }>;
}> = ({ controlsRef, cameraStateRef }) => {
  useFrame(() => {
    const controls = controlsRef.current;
    const camera = controls?.object;
    if (!camera) return;
    cameraStateRef.current = {
      y: camera.position.y,
      fov: (camera as THREE.PerspectiveCamera).fov ?? 55,
      aspect: (camera as THREE.PerspectiveCamera).aspect ?? 1.6,
    };
  });
  return null;
};

const EditorWASDControls: React.FC<{
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  focusRef: React.MutableRefObject<{ x: number; y: number }>;
}> = ({ controlsRef, focusRef }) => {
  const keys = React.useRef<Record<string, boolean>>({});
  const forward = React.useRef(new THREE.Vector3());
  const right = React.useRef(new THREE.Vector3());
  const up = React.useRef(new THREE.Vector3(0, 1, 0));

  React.useEffect(() => {
    const handleDown = (event: globalThis.KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active instanceof globalThis.HTMLInputElement ||
        active instanceof globalThis.HTMLTextAreaElement ||
        active instanceof globalThis.HTMLSelectElement ||
        active?.getAttribute?.('contenteditable') === 'true'
      ) {
        return;
      }
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
  }, []);

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    const target = controls?.target;
    const camera = controls?.object;
    if (!controls || !target || !camera) return;

    const speedBase = 220;
    const speed = (keys.current['shift'] ? 2.2 : 1) * speedBase * delta;

    state.camera.getWorldDirection(forward.current);
    forward.current.setY(0).normalize();
    right.current.copy(forward.current).cross(up.current).normalize();

    const movement = new THREE.Vector3();
    if (keys.current['w'] || keys.current['arrowup']) {
      movement.add(forward.current);
    }
    if (keys.current['s'] || keys.current['arrowdown']) {
      movement.sub(forward.current);
    }
    if (keys.current['a'] || keys.current['arrowleft']) {
      movement.sub(right.current);
    }
    if (keys.current['d'] || keys.current['arrowright']) {
      movement.add(right.current);
    }

    if (movement.lengthSq() === 0) return;
    movement.normalize().multiplyScalar(speed);
    camera.position.add(movement);
    target.add(movement);
    focusRef.current = { x: target.x, y: target.z };
    controls.update();
  });

  return null;
};

const EditorRenderer: React.FC<EditorRendererProps> = ({
  focusRef,
  cameraStateRef,
}) => {
  const controlsRef = React.useRef<OrbitControlsImpl | null>(null);

  return (
    <Canvas
      camera={{ position: [200, 220, 200], fov: 55, near: 0.1, far: 50000 }}
      className="h-full w-full"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[200, 300, 200]} intensity={0.6} />
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI / 2.1}
      />
      <FocusSync controlsRef={controlsRef} focusRef={focusRef} />
      <EditorWASDControls controlsRef={controlsRef} focusRef={focusRef} />
      <CameraStateSync
        controlsRef={controlsRef}
        cameraStateRef={cameraStateRef}
      />
      <LandTiles focusRef={focusRef} />
      <gridHelper args={[20000, 80, '#385062', '#1c2a34']} />
    </Canvas>
  );
};

export default EditorRenderer;
