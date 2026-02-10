import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { LandTiles } from '../../../components/LandTiles';
import { OceanPatch } from '../../../components/OceanPatch';
import { latLonToXY } from '../../../lib/geo';
import { EditorWorkArea, isBBoxBounds } from '../types';

type EditorRendererProps = {
  focusRef: React.MutableRefObject<{ x: number; y: number }>;
  cameraStateRef: React.MutableRefObject<{
    y: number;
    fov: number;
    aspect: number;
  }>;
  workAreas?: EditorWorkArea[];
  focusTarget?: {
    x: number;
    y: number;
    token: number;
    distanceMeters?: number;
  } | null;
  onHeadingChange?: (headingDeg: number) => void;
};

const EDITOR_SUN_DIRECTION = new THREE.Vector3(0.4, 0.8, 0.2).normalize();
const EDITOR_WAVELENGTH = 220;
const EDITOR_K = (2 * Math.PI) / EDITOR_WAVELENGTH;
const EDITOR_SPEED = Math.sqrt(9.81 / EDITOR_K);
const EDITOR_WAVE = {
  amplitude: 0.01,
  wavelength: EDITOR_WAVELENGTH,
  direction: Math.PI * 0.35,
  steepness: 0.01,
  speed: EDITOR_SPEED,
  k: EDITOR_K,
  omega: EDITOR_SPEED * EDITOR_K,
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
    const nextFar = THREE.MathUtils.clamp(maxDistance * 1.6, 12000, 120000);
    if (nextFar !== camera.far || camera.near !== 2) {
      camera.near = 2;
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
      .filter(area => isBBoxBounds(area.bounds))
      .map(area => {
        if (!isBBoxBounds(area.bounds)) {
          throw new Error('Expected bbox bounds');
        }

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
        return { id: area.id, points };
      });
  }, [workAreas]);

  if (lines.length === 0) return null;

  return (
    <group>
      {lines.map(line => (
        <Line
          key={line.id}
          points={line.points}
          color="#5fd3ff"
          transparent
          opacity={0.85}
          depthTest={false}
        />
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

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLon = Infinity;
    let maxLon = -Infinity;

    workAreas.forEach(area => {
      if (area.bounds.type === 'bbox') {
        minLat = Math.min(minLat, area.bounds.minLat);
        maxLat = Math.max(maxLat, area.bounds.maxLat);
        minLon = Math.min(minLon, area.bounds.minLon);
        maxLon = Math.max(maxLon, area.bounds.maxLon);
        return;
      }

      if (area.bounds.coordinates.length === 0) return;

      area.bounds.coordinates.forEach(([lat, lon]) => {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
      });
    });

    if (!Number.isFinite(minLat) || !Number.isFinite(minLon)) {
      return 12000;
    }

    const minXY = latLonToXY({ lat: minLat, lon: minLon });
    const maxXY = latLonToXY({ lat: maxLat, lon: maxLon });
    const width = Math.abs(maxXY.x - minXY.x);
    const height = Math.abs(maxXY.y - minXY.y);
    const maxSpan = Math.hypot(width, height);

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
    if (deltaX === 0 && deltaZ === 0 && !focusTarget.distanceMeters) return;
    target.set(focusTarget.x, target.y, focusTarget.y);
    if (focusTarget.distanceMeters && focusTarget.distanceMeters > 0) {
      const direction = camera.position.clone().sub(target);
      if (direction.lengthSq() === 0) {
        direction.set(1, 0.8, -1);
      }
      direction.normalize().multiplyScalar(focusTarget.distanceMeters);
      camera.position.copy(target).add(direction);
    } else {
      camera.position.add(new THREE.Vector3(deltaX, 0, deltaZ));
    }
    controls.update();
    focusRef.current = { x: focusTarget.x, y: focusTarget.y };
  }, [focusTarget, focusRef]);

  return (
    <Canvas
      camera={{ position: [200, 220, -200], fov: 55, near: 2, far: 30000 }}
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
      <OceanPatch
        centerRef={focusRef}
        wave={EDITOR_WAVE}
        sunDirection={EDITOR_SUN_DIRECTION}
        yOffset={-1.25}
        size={8000}
        maxScale={24}
      />
      <group scale={[-1, 1, 1]}>
        <LandTiles
          focusRef={focusRef}
          landY={0.75}
          dynamicRadius
          maxRadius={10}
        />
        <WorkAreaBounds workAreas={workAreas} />
      </group>
    </Canvas>
  );
};

export default EditorRenderer;
