// Scene with orbit camera, Environment lighting, and a Water plane that follows the vessel.
'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Sky, useGLTF } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import useStore from '../store';
import Ship from './Ship';
import VesselCallout from './VesselCallout';
import socketManager from '../networking/socket';
import { deriveWaveState, getGerstnerSample } from '../lib/waves';
import type { WaveState } from '../lib/waves';
import {
  courseFromWorldVelocity,
  ensurePosition,
  speedFromWorldVelocity,
  worldVelocityFromBody,
} from '../lib/position';
import { OceanPatch } from './OceanPatch';
import { FarWater } from './FarWater';
import { latLonToXY } from '../lib/geo';
import * as GeoJSON from 'geojson';
import SeamarkSprites from './SeamarkSprites';
import { LandTiles } from './LandTiles';
import CameraHeadingIndicator from './CameraHeadingIndicator';

interface SceneProps {
  vesselPosition: {
    x: number;
    y: number;
    z: number;
    heading: number;
  };
  mode: 'player' | 'spectator';
}

const LAND_EPSILON_Y = 0.75;
const OCEAN_EPSILON_Y = -0.25;
const TERRAIN_HEIGHT_SCALE = 1;
const TERRAIN_SEA_LEVEL = 0;
const TERRAIN_ENABLED = true;

function SpectatorController({
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
  const keys = useRef<Record<string, boolean>>({});
  const positionRef = useRef(
    new THREE.Vector3(
      entryTargetRef.current.x - 200,
      220,
      entryTargetRef.current.y - 200,
    ),
  );
  const forwardRef = useRef(new THREE.Vector3(0, 0, -1).normalize());
  const tmpVec = useRef(new THREE.Vector3());
  const distanceVec = useRef(new THREE.Vector3());

  // Reset spectator pose when switching into spectator mode
  useEffect(() => {
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

  // Key handling
  useEffect(() => {
    if (mode !== 'spectator') return;
    const handleDown = (e: globalThis.KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const handleUp = (e: globalThis.KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
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
    // Scale speed based on zoom (camera distance to focus)
    distanceVec.current.set(focusRef.current.x, 0, focusRef.current.y);
    const distance = camera.position.distanceTo(distanceVec.current);
    const speedScale = THREE.MathUtils.clamp(distance / 200, 0.3, 6);
    const baseSpeed = 330;
    const boostSpeed = 820;
    const moveSpeed =
      (keys.current['shift'] ? boostSpeed : baseSpeed) * delta * speedScale;

    // Derive forward from camera orientation so mouse orbit still works
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

function LightTracker({
  lightRef,
  targetRef,
  sunDirection,
}: {
  lightRef: React.RefObject<THREE.DirectionalLight | null>;
  targetRef: React.MutableRefObject<{ x: number; y: number }>;
  sunDirection: THREE.Vector3;
}) {
  useFrame(() => {
    if (!lightRef.current) return;
    const light = lightRef.current;
    const scaled = sunDirection.clone().multiplyScalar(400);
    light.position.copy(scaled);
    light.target.position.set(targetRef.current.x, 0, targetRef.current.y);
    light.target.updateMatrixWorld();
  });
  return null;
}

function RendererPerfMonitor({ enabled }: { enabled: boolean }) {
  const frameCounter = useRef(0);
  const totalMs = useRef(0);
  const maxMs = useRef(0);
  const lastReportAt = useRef(0);
  const warnAvg = 18;
  const warnMax = 40;
  const reportInterval = 5000;

  useFrame((_, delta) => {
    if (!enabled) return;
    const now = performance.now();
    const ms = delta * 1000;
    frameCounter.current += 1;
    totalMs.current += ms;
    maxMs.current = Math.max(maxMs.current, ms);

    if (now - lastReportAt.current > reportInterval) {
      const avgMs =
        frameCounter.current > 0 ? totalMs.current / frameCounter.current : 0;
      if (avgMs > warnAvg || maxMs.current > warnMax) {
        socketManager.sendClientLog({
          level: 'warn',
          source: 'renderer',
          message: 'Renderer frame budget exceeded',
          meta: { avgMs, maxMs: maxMs.current },
        });
      }
      lastReportAt.current = now;
      frameCounter.current = 0;
      totalMs.current = 0;
      maxMs.current = 0;
    }
  });

  return null;
}

function ReplayGhost({
  frames,
  playing,
  size,
  onComplete,
}: {
  frames: Array<{
    timestamp: number;
    position: { x: number; y: number; z: number };
    orientation: { heading: number; roll: number; pitch: number };
  }>;
  playing: boolean;
  size: { length: number; beam: number; draft: number };
  onComplete: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const indexRef = useRef(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      indexRef.current = 0;
      startRef.current = null;
    }
  }, [playing]);

  useFrame(() => {
    if (!playing || frames.length === 0 || !meshRef.current) return;
    if (startRef.current === null) {
      startRef.current = performance.now();
      indexRef.current = 0;
    }
    const elapsed = performance.now() - startRef.current;
    const targetTime = frames[0].timestamp + elapsed;

    while (
      indexRef.current < frames.length - 1 &&
      frames[indexRef.current].timestamp < targetTime
    ) {
      indexRef.current += 1;
    }

    const frame = frames[indexRef.current];
    const sink = -size.draft * 0.35;
    meshRef.current.position.set(
      frame.position.x,
      frame.position.y + sink,
      frame.position.z,
    );
    meshRef.current.rotation.set(
      frame.orientation.pitch,
      -frame.orientation.heading - Math.PI / 2,
      frame.orientation.roll,
    );

    if (indexRef.current >= frames.length - 1) {
      onComplete();
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[size.length, size.draft * 1.2, size.beam]} />
      <meshStandardMaterial
        color="#8cc6ff"
        opacity={0.35}
        transparent
        roughness={0.2}
        metalness={0.1}
      />
    </mesh>
  );
}

function AdminDragHandles({
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
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    [],
  );
  const dragRef = useRef<{ id: string | null }>({ id: null });
  const hitPoint = useRef(new THREE.Vector3());
  const pointer = useRef(new THREE.Vector2());
  const raycaster = useRef(new THREE.Raycaster());
  const activePointerIdRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const moveListenerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const upListenerRef = useRef<((event: PointerEvent) => void) | null>(null);

  const updateDragPosition = useCallback(
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

  useEffect(() => {
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

  useEffect(() => {
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

  const handlePointerDown = useCallback(
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

function SkyFollowCamera(
  props: React.ComponentProps<typeof Sky> & { enabled?: boolean },
) {
  const { camera } = useThree();
  const ref = useRef<THREE.Object3D>(null);

  useFrame(() => {
    if (!props.enabled) return;
    if (!ref.current) return;
    ref.current.position.copy(camera.position);
  });

  return (
    <Sky
      // @ts-expect-error Sky forwards ref to an Object3D
      ref={ref}
      frustumCulled={false}
      {...props}
    />
  );
}

function getSeamarkModelPath(
  props: GeoJSON.Feature['properties'],
): { path: string; dir: string; system?: 'iala-a' | 'iala-b' } | null {
  const type = props?.['seamark:type'];
  if (type?.includes('cardinal')) {
    const dir = props?.['seamark:buoy_cardinal:category'] || 'north';
    const shape = props?.['seamark:buoy_cardinal:shape'] || 'spar';
    const path = `/models/cardinal_${shape}_${dir}.glb`;

    return { path, dir };
  }
  if (type?.includes('buoy_lateral')) {
    // Lateral buoys: map category/colour/shape to available model files.
    // OSM properties may include either a colour or a category (port/starboard).
    const category = props?.['seamark:buoy_lateral:category'] as
      | string
      | undefined;
    const colourProp = props?.['seamark:buoy_lateral:colour'] as
      | string
      | undefined;
    const shape = (props?.['seamark:buoy_lateral:shape'] as string) || 'spar';

    // Determine colour: prefer explicit colour, otherwise infer from category (IALA-A: port=red)
    let colour = 'red';
    if (colourProp) colour = colourProp;
    else if (category === 'starboard') colour = 'green';

    const path = `/models/lateral_${shape}_${colour}.glb`;
    const dir = `${category ?? colour}`;
    return { path, dir };
  }
  return null;
}

function Seamarks() {
  const seamarks = useStore(state => state.seamarks);
  const environment = useStore(state => state.environment);
  const waveState = useMemo(() => deriveWaveState(environment), [environment]);

  const models = useMemo(() => {
    const modelMap: Record<
      string,
      { path: string; dir: string; positions: { x: number; y: number }[] }
    > = {};
    seamarks.features?.forEach((f: GeoJSON.Feature) => {
      if (f.geometry.type !== 'Point') return;
      const props = f.properties as GeoJSON.Feature['properties'];
      const path = getSeamarkModelPath(props);
      if (path) {
        const dir = path.dir; // e.g., cardinal_con_north -> north
        if (!modelMap[path.path])
          modelMap[path.path] = { path: path.path, dir, positions: [] };
        const [lon, lat] = f.geometry.coordinates as [number, number];
        const { x, y } = latLonToXY({ lat, lon });
        modelMap[path.path].positions.push({ x, y });
      }
    });
    return Object.values(modelMap);
  }, [seamarks.features]);

  return (
    <>
      {models.map((model, i) => (
        <SeamarkGroup
          key={i}
          path={model.path}
          dir={model.dir}
          positions={model.positions}
          waveState={waveState}
        />
      ))}
    </>
  );
}

function SeamarkGroup({
  path,
  dir: _dir,
  positions,
  waveState,
}: {
  path: string;
  dir: string;
  positions: { x: number; y: number }[];
  waveState: WaveState;
}) {
  const gltf = useGLTF(path);
  const { camera } = useThree();
  const meshRefs = useRef<(THREE.Object3D | null)[]>([]);

  useFrame(state => {
    meshRefs.current.forEach(mesh => {
      if (!mesh) return;
      const distance = camera.position.distanceTo(mesh.position);
      const baseScale = 10; // visibility baseline
      const scale = Math.max(baseScale, distance / 1000);
      mesh.scale.set(scale, scale, scale);

      // Wave animation: bob vertically and tilt to wave slope
      const posIndex = meshRefs.current.indexOf(mesh);
      if (posIndex >= 0 && posIndex < positions.length) {
        const pos = positions[posIndex];
        const waveSample = getGerstnerSample(
          pos.x,
          pos.y,
          state.clock.elapsedTime,
          waveState,
        );
        // Set Y position to wave height, offset base ~5cm below surface
        mesh.position.y = waveSample.height - 0.05;
        // Tilt mesh to follow wave slope using rotations
        const normal = waveSample.normal;
        // Apply rotation angles based on wave slope (normal.x and normal.y are slopes)
        mesh.rotation.x = Math.atan2(normal.x, normal.z) * 0.5;
        mesh.rotation.z = Math.atan2(normal.y, normal.z) * 0.5;
      }
    });
  });

  return (
    <>
      {positions.map((pos, j) => (
        <group
          key={j}
          ref={el => (meshRefs.current[j] = el)}
          position={[pos.x, 0, pos.y]}
        >
          <primitive object={gltf.scene.clone()} />
        </group>
      ))}
    </>
  );
}

function CameraHeadingTracker({
  enabled,
  onHeadingChange,
}: {
  enabled: boolean;
  onHeadingChange: (headingDeg: number) => void;
}) {
  const { camera } = useThree();
  const lastUpdateRef = useRef({ heading: 0, timestamp: 0 });
  const directionRef = useRef(new THREE.Vector3());

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
}


export default function Scene({ vesselPosition, mode }: SceneProps) {
  const isSpectator = mode === 'spectator';
  const vesselState = useStore(state => state.vessel);
  const vesselProperties = useStore(state => state.vessel.properties);
  const vesselControls = useStore(state => state.vessel.controls);
  const vesselOrientation = useStore(state => state.vessel.orientation);
  const otherVessels = useStore(state => state.otherVessels);
  const crewIds = useStore(state => state.crewIds);
  const envTime = useStore(state => state.environment.timeOfDay);
  const environment = useStore(state => state.environment);
  const replay = useStore(state => state.replay);
  const stopReplayPlayback = useStore(state => state.stopReplayPlayback);
  const roles = useStore(state => state.roles);
  const currentVesselId = useStore(state => state.currentVesselId);
  const isAdmin = roles.includes('admin');
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const [calloutOffset, setCalloutOffset] = useState({ x: 24, y: -24 });
  const [isDragging, setIsDragging] = useState(false);
  const [cameraHeadingDeg, setCameraHeadingDeg] = useState(0);
  const [hudOffset, setHudOffset] = useState(0);
  const [dragPreviewPositions, setDragPreviewPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const perfLoggingEnabled =
    process.env.NEXT_PUBLIC_RENDERER_PERF_LOGS === 'true' ||
    process.env.NODE_ENV !== 'production';
  const focusRef = useRef<{ x: number; y: number }>({
    x: vesselPosition.x,
    y: vesselPosition.y,
  });
  const orbitRef = useRef<OrbitControlsImpl | null>(null);
  const spectatorStartRef = useRef<{ x: number; y: number }>({
    x: vesselPosition.x,
    y: vesselPosition.y,
  });
  const handleSelectVessel = useCallback(
    (id: string) => {
      if (!isSpectator || isDragging) return;
      setSelectedVesselId(prev => (prev === id ? null : id));
    },
    [isDragging, isSpectator],
  );

  const handleAdminMoveToFocus = useCallback(() => {
    if (!selectedVesselId) return;
    socketManager.sendAdminVesselMove(selectedVesselId, {
      x: focusRef.current.x,
      y: focusRef.current.y,
    });
  }, [selectedVesselId]);

  const handleAdminStopVessel = useCallback(() => {
    if (!selectedVesselId) return;
    socketManager.sendAdminVesselStop(selectedVesselId);
  }, [selectedVesselId]);

  const handleAdminForceAi = useCallback(() => {
    if (!selectedVesselId) return;
    socketManager.sendAdminVesselMode(selectedVesselId, 'ai');
  }, [selectedVesselId]);

  const handleAdminForcePlayer = useCallback(() => {
    if (!selectedVesselId) return;
    socketManager.sendAdminVesselMode(selectedVesselId, 'player');
  }, [selectedVesselId]);

  const handleAdminRemove = useCallback(() => {
    if (!selectedVesselId) return;
    socketManager.sendAdminVesselRemove(selectedVesselId);
    setSelectedVesselId(null);
  }, [selectedVesselId]);

  useEffect(() => {
    if (selectedVesselId) {
      setCalloutOffset({ x: 24, y: -24 });
    }
  }, [selectedVesselId]);

  const selectedSnapshot = useMemo(() => {
    if (!selectedVesselId) return null;
    if (selectedVesselId === currentVesselId) {
      return {
        id: selectedVesselId,
        position: vesselState.position,
        orientation: vesselState.orientation,
        velocity: vesselState.velocity,
        controls: vesselState.controls,
        waterDepth: vesselState.waterDepth,
        properties: vesselState.properties,
      };
    }
    return otherVessels[selectedVesselId] || null;
  }, [currentVesselId, otherVessels, selectedVesselId, vesselState]);

  useEffect(() => {
    if (selectedVesselId && !selectedSnapshot) {
      setSelectedVesselId(null);
    }
  }, [selectedSnapshot, selectedVesselId]);

  // Simple sun direction derived from time of day (0-24). Kept adaptable for future lat/season logic.
  const { sunDirection, lightIntensity, daylight } = useMemo(() => {
    const t = envTime ?? 12;
    const normalized = ((t % 24) + 24) / 24; // 0..1
    // Simple solar model: elevation crosses horizon at ~06:00/18:00, peaks at noon, negative at night.
    const elevation = Math.sin((normalized - 0.25) * Math.PI * 2);
    const azimuth = normalized * Math.PI * 2;
    const horizontalMag = Math.max(
      0,
      Math.sqrt(Math.max(0, 1 - elevation ** 2)),
    );
    const dir = new THREE.Vector3(
      Math.cos(azimuth) * horizontalMag,
      elevation,
      Math.sin(azimuth) * horizontalMag,
    ).normalize();
    const daylight = Math.max(0, elevation);
    const lightIntensity = {
      directional: daylight * 1.1,
      ambient: daylight * 0.25,
      hemi: daylight * 0.2,
    };
    return { sunDirection: dir, daylight, lightIntensity };
  }, [envTime]);

  const calloutData = useMemo(() => {
    if (!selectedSnapshot) return null;
    const position = ensurePosition(selectedSnapshot.position);
    const heading = selectedSnapshot.orientation?.heading ?? 0;
    const velocity = selectedSnapshot.velocity || { surge: 0, sway: 0 };
    const worldVelocity = worldVelocityFromBody(heading, velocity);
    const speedKts = speedFromWorldVelocity(worldVelocity) * 1.94384;
    const course = courseFromWorldVelocity(worldVelocity);
    const headingDeg = ((heading * 180) / Math.PI + 360) % 360;
    const depth = Number.isFinite(position.z) ? Math.abs(position.z) : 0;
    const length = selectedSnapshot.properties?.length;
    const beam = selectedSnapshot.properties?.beam;
    const draft = selectedSnapshot.properties?.draft;
    const crewCount =
      selectedSnapshot.crewCount ??
      selectedSnapshot.crewIds?.length ??
      (selectedVesselId === currentVesselId ? crewIds.length : 0);
    const rows = [
      { label: 'Speed', value: `${speedKts.toFixed(1)} kts` },
      { label: 'COG', value: `${course.toFixed(0)} deg` },
      { label: 'Heading', value: `${headingDeg.toFixed(0)} deg` },
      {
        label: 'Lat',
        value: Number.isFinite(position.lat) ? position.lat.toFixed(5) : 'n/a',
      },
      {
        label: 'Lon',
        value: Number.isFinite(position.lon) ? position.lon.toFixed(5) : 'n/a',
      },
      { label: 'Depth', value: `${depth.toFixed(1)} m` },
      {
        label: 'Length',
        value: Number.isFinite(length) ? `${length?.toFixed(1)} m` : 'n/a',
      },
      {
        label: 'Beam',
        value: Number.isFinite(beam) ? `${beam?.toFixed(1)} m` : 'n/a',
      },
      {
        label: 'Draft',
        value: Number.isFinite(draft) ? `${draft?.toFixed(1)} m` : 'n/a',
      },
      { label: 'Crew', value: crewCount.toString() },
      {
        label: 'Mode',
        value: selectedSnapshot.mode || selectedSnapshot.desiredMode || 'n/a',
      },
    ];
    return {
      position: {
        x: position.x ?? 0,
        y: (position.z ?? 0) + 6,
        z: position.y ?? 0,
      },
      rows,
    };
  }, [crewIds.length, currentVesselId, selectedSnapshot, selectedVesselId]);

  const calloutTitle = useMemo(() => {
    if (!selectedSnapshot || !selectedVesselId) return '';
    const name = selectedSnapshot.properties?.name;
    const displayId =
      selectedVesselId.length > 10
        ? `${selectedVesselId.slice(0, 10)}...`
        : selectedVesselId;
    return name ? name : `Vessel ${displayId}`;
  }, [selectedSnapshot, selectedVesselId]);

  const calloutActions = useMemo(() => {
    if (!isAdmin || !selectedVesselId) return [];
    return [
      {
        label: 'Stop',
        onClick: handleAdminStopVessel,
        variant: 'ghost' as const,
      },
      {
        label: 'Move to view',
        onClick: handleAdminMoveToFocus,
        variant: 'ghost' as const,
      },
      {
        label: 'Force AI',
        onClick: handleAdminForceAi,
        variant: 'ghost' as const,
      },
      {
        label: 'Force player',
        onClick: handleAdminForcePlayer,
        variant: 'ghost' as const,
      },
      {
        label: 'Remove',
        onClick: handleAdminRemove,
        variant: 'danger' as const,
      },
    ];
  }, [
    handleAdminForceAi,
    handleAdminForcePlayer,
    handleAdminMoveToFocus,
    handleAdminRemove,
    handleAdminStopVessel,
    isAdmin,
    selectedVesselId,
  ]);

  const showSelfDebug =
    isSpectator && (!selectedVesselId || selectedVesselId === currentVesselId);

  const waveState = useMemo(() => deriveWaveState(environment), [environment]);

  const dragTargets = useMemo(() => {
    if (!isAdmin || !isSpectator) return [];
    const targets: Array<{ id: string; x: number; y: number }> = [];
    if (currentVesselId) {
      targets.push({
        id: currentVesselId,
        x: vesselPosition.x,
        y: vesselPosition.y,
      });
    }
    Object.entries(otherVessels || {}).forEach(([id, vessel]) => {
      if (!vessel?.position) return;
      if (id === currentVesselId) return; // <-- prevents duplicate key
      targets.push({
        id,
        x: vessel.position.x ?? 0,
        y: vessel.position.y ?? 0,
      });
    });

    return targets;
  }, [
    currentVesselId,
    isAdmin,
    isSpectator,
    otherVessels,
    vesselPosition.x,
    vesselPosition.y,
  ]);

  const handleAdminMove = useCallback((id: string, x: number, y: number) => {
    socketManager.sendAdminVesselMove(id, { x, y });
  }, []);

  const handleDragPreview = useCallback((id: string, x: number, y: number) => {
    setDragPreviewPositions(prev => {
      const existing = prev[id];
      if (existing && Math.hypot(existing.x - x, existing.y - y) < 0.2) {
        return prev;
      }
      return { ...prev, [id]: { x, y } };
    });
  }, []);

  const handleDragPreviewEnd = useCallback((id: string) => {
    setDragPreviewPositions(prev => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleDragStateChange = useCallback((dragging: boolean) => {
    setIsDragging(dragging);
    if (orbitRef.current) {
      orbitRef.current.enabled = !dragging;
    }
  }, []);

  useEffect(() => {
    if (!isSpectator) {
      focusRef.current = { x: vesselPosition.x, y: vesselPosition.y };
    }
  }, [isSpectator, vesselPosition.x, vesselPosition.y]);

  useEffect(() => {
    if (mode === 'spectator') {
      spectatorStartRef.current = { ...focusRef.current };
    }
  }, [mode]);

  useEffect(() => {
    if (!isSpectator) return;
    const hudRoot = document.querySelector('[data-hud-root]');
    if (!hudRoot) return;

    const updateOffset = () => {
      const rect = hudRoot.getBoundingClientRect();
      setHudOffset(rect.height || 0);
    };

    updateOffset();
    const intervalId = window.setInterval(updateOffset, 500);
    window.addEventListener('resize', updateOffset);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('resize', updateOffset);
    };
  }, [isSpectator]);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        position: 'fixed',
        inset: 0,
        zIndex: 0,
      }}
    >
      <Canvas
        camera={{
          position: isSpectator
            ? [focusRef.current.x - 200, 220, focusRef.current.y - 200]
            : [vesselPosition.x - 50, 30, vesselPosition.y - 50],
          fov: isSpectator ? 70 : 60,
          near: 1,
          far: 50000,
        }}
      >
        <color attach="background" args={['#091623']} />
        <SkyFollowCamera
          enabled
          distance={45000}
          sunPosition={[
            sunDirection.x * 3000,
            sunDirection.y * 3000,
            sunDirection.z * 3000,
          ]}
          turbidity={6}
          rayleigh={2}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />

        <Environment preset="sunset" environmentIntensity={daylight * 0.9} />
        <ambientLight intensity={lightIntensity.ambient} />
        <hemisphereLight args={['#6fa6ff', '#0b1e2d', lightIntensity.hemi]} />
        <directionalLight
          ref={directionalLightRef}
          intensity={lightIntensity.directional}
          color={0xfff0dd}
        />
        <LightTracker
          lightRef={directionalLightRef}
          targetRef={focusRef}
          sunDirection={sunDirection}
        />
        <RendererPerfMonitor enabled={perfLoggingEnabled} />
        <fog attach="fog" args={['#091623', 6000, 40000]} />
        {!isSpectator ? (
          <FarWater centerRef={focusRef} sunDirection={sunDirection} />
        ) : null}
        <OceanPatch
          centerRef={focusRef}
          size={12000}
          segments={512}
          wave={waveState}
          sunDirection={sunDirection}
          yOffset={OCEAN_EPSILON_Y}
        />
        <LandTiles
          focusRef={focusRef}
          radius={2}
          landY={LAND_EPSILON_Y}
          heightScale={TERRAIN_HEIGHT_SCALE}
          seaLevel={TERRAIN_SEA_LEVEL}
          useTerrain={TERRAIN_ENABLED}
        />

        <Ship
          vesselId={currentVesselId || undefined}
          position={{
            x:
              dragPreviewPositions[currentVesselId || '']?.x ??
              vesselPosition.x,
            y: vesselPosition.z,
            z:
              dragPreviewPositions[currentVesselId || '']?.y ??
              vesselPosition.y,
          }}
          heading={vesselPosition.heading}
          shipType={vesselProperties.type}
          modelPath={vesselProperties.modelPath}
          renderOptions={vesselState.render}
          ballast={vesselControls.ballast}
          draft={vesselProperties.draft}
          length={vesselProperties.length}
          roll={vesselOrientation.roll}
          pitch={vesselOrientation.pitch}
          showDebugMarkers={showSelfDebug}
          onSelect={isSpectator ? handleSelectVessel : undefined}
        />
        {replay.playing && replay.frames.length > 1 ? (
          <ReplayGhost
            frames={replay.frames}
            playing={replay.playing}
            size={{
              length: vesselProperties.length,
              beam: vesselProperties.beam,
              draft: vesselProperties.draft,
            }}
            onComplete={stopReplayPlayback}
          />
        ) : null}
        {Object.entries(otherVessels || {}).map(([id, v]) => (
          <Ship
            key={id}
            vesselId={id}
            position={{
              x: dragPreviewPositions[id]?.x ?? v.position.x ?? 0,
              y: v.position.z ?? 0,
              z: dragPreviewPositions[id]?.y ?? v.position.y ?? 0,
            }}
            heading={v.orientation.heading}
            shipType={v.properties?.type ?? vesselProperties.type}
            modelPath={v.properties?.modelPath ?? null}
            renderOptions={v.render}
            ballast={v.controls?.ballast ?? 0.5}
            draft={v.properties?.draft ?? vesselProperties.draft}
            length={v.properties?.length ?? vesselProperties.length}
            horizonOcclusion={{ enabled: true }}
            showDebugMarkers={isSpectator && selectedVesselId === id}
            onSelect={isSpectator ? handleSelectVessel : undefined}
          />
        ))}
        {isSpectator && selectedVesselId && calloutData ? (
          <VesselCallout
            vesselId={selectedVesselId}
            title={calloutTitle}
            position={calloutData.position}
            rows={calloutData.rows}
            offset={calloutOffset}
            onOffsetChange={setCalloutOffset}
            onClose={() => setSelectedVesselId(null)}
            actions={calloutActions}
          />
        ) : null}
        <AdminDragHandles
          enabled={isSpectator && isAdmin}
          targets={dragTargets}
          previewPositions={dragPreviewPositions}
          onPreview={handleDragPreview}
          onPreviewEnd={handleDragPreviewEnd}
          onDrop={handleAdminMove}
          onDragStateChange={handleDragStateChange}
        />
        <Seamarks />
        <SeamarkSprites />
        <OrbitControls
          ref={orbitRef}
          target={
            isSpectator
              ? [focusRef.current.x, 0, focusRef.current.y]
              : [vesselPosition.x, 0, vesselPosition.y]
          }
          enabled={!isDragging}
          enablePan={false}
          enableDamping={false}
          minDistance={isSpectator ? 50 : vesselProperties.length}
          maxDistance={isSpectator ? 10000 : vesselProperties.length * 5}
          minPolarAngle={isSpectator ? Math.PI / 4 : Math.PI * 0.05}
          maxPolarAngle={isSpectator ? Math.PI / 4 : Math.PI * 0.5}
        />
        {isSpectator ? (
          <SpectatorController
            mode={mode}
            focusRef={focusRef}
            entryTargetRef={spectatorStartRef}
            controlsRef={orbitRef}
          />
        ) : null}
        <CameraHeadingTracker
          enabled={isSpectator}
          onHeadingChange={setCameraHeadingDeg}
        />
      </Canvas>
      <CameraHeadingIndicator
        enabled={isSpectator}
        headingDeg={cameraHeadingDeg}
        hudOffset={hudOffset}
      />
    </div>
  );
}
