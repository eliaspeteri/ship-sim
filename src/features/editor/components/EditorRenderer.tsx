import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { LandTiles } from '../../../components/LandTiles';
import { latLonToXY } from '../../../lib/geo';
import { EditorWorkArea } from '../types';

type EditorRendererProps = {
  focusRef: React.MutableRefObject<{ x: number; y: number }>;
  cameraStateRef: React.MutableRefObject<{
    y: number;
    fov: number;
    aspect: number;
  }>;
  workAreas?: EditorWorkArea[];
  focusTarget?: { x: number; y: number; token: number } | null;
  onHeadingChange?: (headingDeg: number) => void;
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
  const distanceVec = React.useRef(new THREE.Vector3());

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

    distanceVec.current.set(target.x, 0, target.z);
    const distance = camera.position.distanceTo(distanceVec.current);
    const speedScale = THREE.MathUtils.clamp(distance / 200, 0.3, 6);
    const speedBase = 330;
    const boostSpeed = 820;
    const speed =
      (keys.current['shift'] ? boostSpeed : speedBase) * delta * speedScale;

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

const CameraHeadingTracker: React.FC<{
  enabled: boolean;
  onHeadingChange: (headingDeg: number) => void;
}> = ({ enabled, onHeadingChange }) => {
  const { camera } = useThree();
  const lastUpdateRef = React.useRef({ heading: 0, timestamp: 0 });
  const directionRef = React.useRef(new THREE.Vector3());

  useFrame(() => {
    if (!enabled) return;
    camera.getWorldDirection(directionRef.current).setY(0);
    if (directionRef.current.lengthSq() === 0) return;
    directionRef.current.normalize();

    const headingRad = Math.atan2(
      -directionRef.current.x,
      directionRef.current.z,
    );
    const headingDeg = (THREE.MathUtils.radToDeg(headingRad) + 360) % 360;
    const now = performance.now();

    if (
      Math.abs(headingDeg - lastUpdateRef.current.heading) < 0.5 &&
      now - lastUpdateRef.current.timestamp < 120
    ) {
      return;
    }

    lastUpdateRef.current = { heading: headingDeg, timestamp: now };
    onHeadingChange(headingDeg);
  });

  return null;
};

const CameraClipLimits: React.FC<{ maxDistance: number }> = ({
  maxDistance,
}) => {
  const { camera } = useThree();

  React.useEffect(() => {
    if (!camera || !(camera instanceof THREE.PerspectiveCamera)) return;
    const nextFar = Math.max(camera.far, maxDistance * 3);
    if (nextFar !== camera.far) {
      camera.far = nextFar;
      camera.updateProjectionMatrix();
    }
  }, [camera, maxDistance]);

  return null;
};

const WorkAreaBounds: React.FC<{ workAreas: EditorWorkArea[] }> = ({
  workAreas,
}) => {
  const lines = React.useMemo(() => {
    return workAreas
      .filter(area => area.bounds.type === 'bbox')
      .map(area => {
        const { minLat, minLon, maxLat, maxLon } = area.bounds;
        const corners = [
          latLonToXY({ lat: minLat, lon: minLon }),
          latLonToXY({ lat: minLat, lon: maxLon }),
          latLonToXY({ lat: maxLat, lon: maxLon }),
          latLonToXY({ lat: maxLat, lon: minLon }),
          latLonToXY({ lat: minLat, lon: minLon }),
        ];
        const points = corners.map(
          point => new THREE.Vector3(point.x, 1, point.y),
        );
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return { id: area.id, geometry };
      });
  }, [workAreas]);

  React.useEffect(() => {
    return () => {
      lines.forEach(line => line.geometry.dispose());
    };
  }, [lines]);

  if (lines.length === 0) return null;

  return (
    <group>
      {lines.map(line => (
        <line key={line.id} geometry={line.geometry}>
          <lineBasicMaterial
            color="#5fd3ff"
            transparent
            opacity={0.85}
            depthTest={false}
          />
        </line>
      ))}
    </group>
  );
};

const EditorRenderer: React.FC<EditorRendererProps> = ({
  focusRef,
  cameraStateRef,
  workAreas = [],
  focusTarget,
  onHeadingChange,
}) => {
  const controlsRef = React.useRef<OrbitControlsImpl | null>(null);
  const maxDistance = React.useMemo(() => {
    if (workAreas.length === 0) return 12000;

    let maxSpan = 0;
    workAreas.forEach(area => {
      let minLat = 0;
      let minLon = 0;
      let maxLat = 0;
      let maxLon = 0;
      if (area.bounds.type === 'bbox') {
        ({ minLat, minLon, maxLat, maxLon } = area.bounds);
      } else if (area.bounds.coordinates.length > 0) {
        minLat = Math.min(...area.bounds.coordinates.map(p => p[0]));
        maxLat = Math.max(...area.bounds.coordinates.map(p => p[0]));
        minLon = Math.min(...area.bounds.coordinates.map(p => p[1]));
        maxLon = Math.max(...area.bounds.coordinates.map(p => p[1]));
      } else {
        return;
      }
      const minXY = latLonToXY({ lat: minLat, lon: minLon });
      const maxXY = latLonToXY({ lat: maxLat, lon: maxLon });
      const width = Math.abs(maxXY.x - minXY.x);
      const height = Math.abs(maxXY.y - minXY.y);
      maxSpan = Math.max(maxSpan, Math.hypot(width, height));
    });

    const padded = maxSpan * 1.6;
    return Math.max(2000, Math.min(80000, padded));
  }, [workAreas]);

  React.useEffect(() => {
    if (!focusTarget) return;
    const controls = controlsRef.current;
    const camera = controls?.object;
    if (!controls || !camera) return;
    const target = controls.target;
    const deltaX = focusTarget.x - target.x;
    const deltaZ = focusTarget.y - target.z;
    if (deltaX === 0 && deltaZ === 0) return;
    target.set(focusTarget.x, target.y, focusTarget.y);
    camera.position.add(new THREE.Vector3(deltaX, 0, deltaZ));
    controls.update();
    focusRef.current = { x: focusTarget.x, y: focusTarget.y };
  }, [focusTarget, focusRef]);

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
        maxDistance={maxDistance}
      />
      <FocusSync controlsRef={controlsRef} focusRef={focusRef} />
      <EditorWASDControls controlsRef={controlsRef} focusRef={focusRef} />
      <CameraStateSync
        controlsRef={controlsRef}
        cameraStateRef={cameraStateRef}
      />
      {onHeadingChange ? (
        <CameraHeadingTracker enabled onHeadingChange={onHeadingChange} />
      ) : null}
      <CameraClipLimits maxDistance={maxDistance} />
      <LandTiles focusRef={focusRef} />
      <WorkAreaBounds workAreas={workAreas} />
      <gridHelper args={[20000, 80, '#385062', '#1c2a34']} />
    </Canvas>
  );
};

export default EditorRenderer;
