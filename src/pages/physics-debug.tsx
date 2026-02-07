import React, { useRef } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Sky } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import fs from 'fs';
import path from 'path';
import useStore from '../store';
import {
  initializeSimulation,
  startSimulation,
  getSimulationLoop,
} from '../simulation';
import { deriveWaveState } from '../lib/waves';
import { OceanPatch } from '../components/OceanPatch';
import { FarWater } from '../components/FarWater';
import Ship from '../components/Ship';
import { DEFAULT_HYDRO } from '../constants/vessel';
import { RUDDER_MAX_ANGLE_RAD } from '../constants/vessel';
import {
  RUDDER_STEP,
  THROTTLE_MAX,
  THROTTLE_MIN,
  THROTTLE_STEP,
} from '../features/sim/constants';
import { ShipType } from '../types/vessel.types';
import styles from './PhysicsDebug.module.css';
import { xyToLatLon, latLonToXY } from '../lib/geo';

type DebugTemplate = {
  id: string;
  name: string;
  shipType: 'CONTAINER' | 'TANKER' | 'CARGO' | 'DEFAULT';
  description?: string;
  modelPath?: string | null;
  properties: {
    mass: number;
    length: number;
    beam: number;
    draft: number;
    blockCoefficient: number;
    maxSpeed: number;
  };
  hydrodynamics?: Partial<typeof DEFAULT_HYDRO>;
  physics?: {
    model: string;
    schemaVersion: number;
    params?: Record<string, number>;
  };
  render?: {
    modelYawDeg?: number;
    sinkFactor?: number;
    heaveScale?: number;
  };
  modelYawDeg?: number;
};

type PhysicsDebugPageProps = {
  templates: DebugTemplate[];
};

const PHYSICS_DEBUG_SPACE_ID = 'physics-debug';
const DEFAULT_DEBUG_ENVIRONMENT = {
  wind: { speed: 5, direction: 0, gusting: false, gustFactor: 1.5 },
  current: { speed: 0.5, direction: Math.PI / 4, variability: 0 },
  seaState: 0,
  waterDepth: 100,
  waveHeight: 0,
  waveDirection: 0,
  waveLength: 50,
  visibility: 10,
  timeOfDay: 12,
  precipitation: 'rain' as const,
  precipitationIntensity: 0,
  tideHeight: 0,
  tideRange: 0,
  tidePhase: 0,
  tideTrend: 'rising' as const,
};

function getSunLighting(timeOfDay: number) {
  const normalized = ((timeOfDay % 24) + 24) / 24;
  const elevation = Math.sin((normalized - 0.25) * Math.PI * 2);
  const azimuth = normalized * Math.PI * 2;
  const horizontalMag = Math.max(0, Math.sqrt(Math.max(0, 1 - elevation ** 2)));
  const sunDirection = new THREE.Vector3(
    Math.cos(azimuth) * horizontalMag,
    elevation,
    Math.sin(azimuth) * horizontalMag,
  ).normalize();
  const daylight = Math.max(0, elevation);
  return {
    sunDirection,
    daylight,
    lightIntensity: {
      directional: daylight * 1.1,
      ambient: daylight * 0.25,
      hemi: daylight * 0.2,
    },
  };
}

function WaveClock({ timeRef }: { timeRef: React.MutableRefObject<number> }) {
  useFrame(state => {
    timeRef.current = state.clock.elapsedTime;
  });
  return null;
}

function CameraFollow({
  focusRef,
  controlsRef,
}: {
  focusRef: React.MutableRefObject<{ x: number; y: number }>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  useFrame(() => {
    const target = focusRef.current;
    if (controlsRef.current) {
      controlsRef.current.target.set(target.x, 0, target.y);
      controlsRef.current.update();
      return;
    }
    camera.lookAt(target.x, 0, target.y);
  });
  return null;
}

function GeoDebugMarkers({
  enabled,
  focusRef,
}: {
  enabled: boolean;
  focusRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const northRef = useRef<THREE.Mesh>(null);
  const eastRef = useRef<THREE.Mesh>(null);
  const tmpVec = useRef(new THREE.Vector3());
  const markerHeight = 6;
  const axesSize = 120;

  useFrame(() => {
    if (!enabled) return;
    if (!groupRef.current) return;
    groupRef.current.position.set(
      focusRef.current.x,
      markerHeight,
      focusRef.current.y,
    );

    const { lat, lon } = xyToLatLon({
      x: focusRef.current.x,
      y: focusRef.current.y,
    });
    const north = latLonToXY({ lat: lat + 0.01, lon });
    const east = latLonToXY({ lat, lon: lon + 0.01 });

    if (northRef.current) {
      northRef.current.position.copy(
        tmpVec.current.set(
          north.x - focusRef.current.x,
          0,
          north.y - focusRef.current.y,
        ),
      );
    }
    if (eastRef.current) {
      eastRef.current.position.copy(
        tmpVec.current.set(
          east.x - focusRef.current.x,
          0,
          east.y - focusRef.current.y,
        ),
      );
    }
  });

  if (!enabled) return null;

  return (
    <group ref={groupRef}>
      <axesHelper args={[axesSize]} />
      <mesh ref={northRef}>
        <sphereGeometry args={[10, 14, 14]} />
        <meshBasicMaterial color="#3da9ff" />
      </mesh>
      <mesh ref={eastRef}>
        <sphereGeometry args={[10, 14, 14]} />
        <meshBasicMaterial color="#ff6b6b" />
      </mesh>
    </group>
  );
}

function PhysicsDebugScene() {
  const vessel = useStore(state => state.vessel);
  const environment = useStore(state => state.environment);
  const vesselId = useStore(state => state.currentVesselId);
  const waveState = React.useMemo(
    () => deriveWaveState(environment),
    [environment],
  );
  const waveTimeRef = React.useRef(0);
  const focusRef = React.useRef({
    x: vessel.position.x ?? 0,
    y: vessel.position.y ?? 0,
  });
  const orbitRef = React.useRef<OrbitControlsImpl | null>(null);

  React.useEffect(() => {
    focusRef.current = {
      x: vessel.position.x ?? 0,
      y: vessel.position.y ?? 0,
    };
  }, [vessel.position.x, vessel.position.y]);

  const { sunDirection, daylight, lightIntensity } = React.useMemo(
    () => getSunLighting(environment.timeOfDay ?? 12),
    [environment.timeOfDay],
  );

  return (
    <Canvas
      camera={{
        position: [focusRef.current.x - 100, 55, focusRef.current.y - 100],
        fov: 55,
        near: 1,
        far: 60000,
      }}
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.5,
      }}
    >
      <color attach="background" args={['#08131f']} />
      <fog attach="fog" args={['#08131f', 8000, 42000]} />
      <WaveClock timeRef={waveTimeRef} />
      <Sky
        distance={45000}
        sunPosition={new THREE.Vector3(
          sunDirection.x,
          sunDirection.y,
          sunDirection.z,
        ).normalize()}
        turbidity={1}
        rayleigh={4}
        mieCoefficient={0.001}
        mieDirectionalG={0.8}
      />
      <Environment preset="sunset" environmentIntensity={daylight * 0.9} />
      <ambientLight intensity={lightIntensity.ambient} />
      <hemisphereLight args={['#6fa6ff', '#0b1e2d', lightIntensity.hemi]} />
      <directionalLight
        intensity={lightIntensity.directional}
        color={0xfff0dd}
        position={[300, 380, 220]}
      />

      <FarWater centerRef={focusRef} sunDirection={sunDirection} />
      <OceanPatch
        centerRef={focusRef}
        size={12000}
        segments={512}
        wave={waveState}
        timeRef={waveTimeRef}
        sunDirection={sunDirection}
        yOffset={-0.25}
      />
      <Ship
        vesselId={vesselId || undefined}
        position={{
          x: vessel.position.x ?? 0,
          y: vessel.position.z ?? 0,
          z: vessel.position.y ?? 0,
        }}
        heading={vessel.orientation.heading}
        shipType={vessel.properties.type}
        modelPath={vessel.properties.modelPath}
        renderOptions={vessel.render}
        ballast={vessel.controls.ballast}
        draft={vessel.properties.draft}
        roll={vessel.orientation.roll}
        pitch={vessel.orientation.pitch}
        wave={waveState}
        waveTimeRef={waveTimeRef}
      />
      <OrbitControls
        ref={orbitRef}
        enablePan={false}
        minDistance={20}
        maxDistance={1200}
      />
      <CameraFollow focusRef={focusRef} controlsRef={orbitRef} />
      <GeoDebugMarkers enabled focusRef={focusRef} />
    </Canvas>
  );
}

const PhysicsDebugPage: NextPage<PhysicsDebugPageProps> & {
  fullBleedLayout?: boolean;
} = ({ templates }) => {
  const setMode = useStore(state => state.setMode);
  const setSpaceId = useStore(state => state.setSpaceId);
  const setCurrentVesselId = useStore(state => state.setCurrentVesselId);
  const setOtherVessels = useStore(state => state.setOtherVessels);
  const updateVessel = useStore(state => state.updateVessel);
  const environment = useStore(state => state.environment);
  const updateEnvironment = useStore(state => state.updateEnvironment);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState(
    templates[0]?.id || 'starter-container',
  );
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    setMode('player');
    setSpaceId(PHYSICS_DEBUG_SPACE_ID);
    setOtherVessels({});
    getSimulationLoop().stop();
    setInitialized(false);

    return () => {
      getSimulationLoop().stop();
      setInitialized(false);
    };
  }, [setMode, setOtherVessels, setSpaceId]);

  const initializeTemplateSimulation = React.useCallback(
    (resetEnvironment = false) => {
      const template =
        templates.find(entry => entry.id === selectedTemplateId) ||
        templates[0];
      if (!template) return;

      const nextVesselId = `physics-debug-${template.id}-${Date.now()}`;
      const renderOptions = template.render || {};
      const modelYawDeg =
        renderOptions.modelYawDeg ?? template.modelYawDeg ?? undefined;

      if (resetEnvironment) {
        updateEnvironment(DEFAULT_DEBUG_ENVIRONMENT);
      }

      setCurrentVesselId(nextVesselId);
      updateVessel({
        position: { lat: 0, lon: 0, z: 0, x: 0, y: 0 },
        orientation: { heading: 0, roll: 0, pitch: 0 },
        velocity: { surge: 0, sway: 0, heave: 0 },
        controls: { throttle: 0, rudderAngle: 0, ballast: 0.5, bowThruster: 0 },
        properties: {
          name: template.name,
          type: template.shipType as ShipType,
          templateId: template.id,
          modelPath: template.modelPath ?? null,
          ...template.properties,
        },
        hydrodynamics: {
          ...DEFAULT_HYDRO,
          ...(template.hydrodynamics || {}),
        },
        physics: template.physics,
        render: {
          ...renderOptions,
          ...(modelYawDeg !== undefined ? { modelYawDeg } : {}),
        },
      });

      void (async () => {
        try {
          getSimulationLoop().stop();
          await initializeSimulation();
          startSimulation();
          setInitialized(true);
        } catch (error) {
          console.error(
            'Failed to initialize local physics debug simulation',
            error,
          );
          setInitialized(false);
        }
      })();
    },
    [
      selectedTemplateId,
      setCurrentVesselId,
      templates,
      updateEnvironment,
      updateVessel,
    ],
  );

  React.useEffect(() => {
    initializeTemplateSimulation(false);
  }, [initializeTemplateSimulation]);

  React.useEffect(() => {
    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const active = document.activeElement as globalThis.HTMLElement | null;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT')
      ) {
        return;
      }
      if (!initialized) return;

      const state = useStore.getState();
      const controls = state.vessel.controls;
      let throttle = controls.throttle ?? 0;
      let rudder = controls.rudderAngle ?? 0;
      let changed = false;

      if (event.key === 'w' || event.key === 'ArrowUp') {
        throttle = clamp(throttle + THROTTLE_STEP, THROTTLE_MIN, THROTTLE_MAX);
        changed = true;
      } else if (event.key === 's' || event.key === 'ArrowDown') {
        throttle = clamp(throttle - THROTTLE_STEP, THROTTLE_MIN, THROTTLE_MAX);
        changed = true;
      } else if (event.key === 'a' || event.key === 'ArrowLeft') {
        rudder = clamp(
          rudder + RUDDER_STEP,
          -RUDDER_MAX_ANGLE_RAD,
          RUDDER_MAX_ANGLE_RAD,
        );
        changed = true;
      } else if (event.key === 'd' || event.key === 'ArrowRight') {
        rudder = clamp(
          rudder - RUDDER_STEP,
          -RUDDER_MAX_ANGLE_RAD,
          RUDDER_MAX_ANGLE_RAD,
        );
        changed = true;
      }

      if (!changed) return;
      state.applyVesselControls({ throttle, rudderAngle: rudder });
      event.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [initialized]);

  const selectedTemplate = React.useMemo(
    () =>
      templates.find(template => template.id === selectedTemplateId) || null,
    [selectedTemplateId, templates],
  );
  const windDirectionDeg = React.useMemo(() => {
    const rad = environment.wind?.direction ?? 0;
    const deg = (rad * 180) / Math.PI;
    return ((deg % 360) + 360) % 360;
  }, [environment.wind?.direction]);

  return (
    <div className={styles.page}>
      <div className={styles.canvasWrap}>
        <PhysicsDebugScene />
      </div>
      <aside className={styles.panel}>
        <h1 className={styles.title}>Physics Debug</h1>
        <p className={styles.hint}>
          Local-only physics harness. Ocean + one vessel, no server sync.
        </p>
        <p
          className={`${styles.status} ${initialized ? styles.statusReady : styles.statusBusy}`}
        >
          {initialized ? 'WASM Running' : 'Initializing WASM...'}
        </p>
        <label htmlFor="template-select" className={styles.label}>
          Vessel template
        </label>
        <select
          id="template-select"
          className={styles.select}
          value={selectedTemplateId}
          onChange={event => {
            const nextTemplateId = event.target.value;
            setSelectedTemplateId(nextTemplateId);
          }}
        >
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <p className={styles.meta}>
          {selectedTemplate?.shipType || 'DEFAULT'}
          {selectedTemplate?.description
            ? ` - ${selectedTemplate.description}`
            : ''}
        </p>
        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <div className={styles.controlLabel}>
              <span>Wind Speed</span>
              <span>{(environment.wind?.speed ?? 0).toFixed(1)} m/s</span>
            </div>
            <input
              className={styles.range}
              type="range"
              min={0}
              max={40}
              step={0.5}
              value={environment.wind?.speed ?? 0}
              onChange={event => {
                const speed = Number(event.target.value);
                updateEnvironment({
                  wind: {
                    ...environment.wind,
                    speed,
                  },
                });
              }}
            />
          </div>
          <div className={styles.controlRow}>
            <div className={styles.controlLabel}>
              <span>Wind Direction</span>
              <span>{windDirectionDeg.toFixed(0)} deg</span>
            </div>
            <input
              className={styles.range}
              type="range"
              min={0}
              max={359}
              step={1}
              value={windDirectionDeg}
              onChange={event => {
                const deg = Number(event.target.value);
                updateEnvironment({
                  wind: {
                    ...environment.wind,
                    direction: (deg * Math.PI) / 180,
                  },
                });
              }}
            />
          </div>
          <div className={styles.controlRow}>
            <div className={styles.controlLabel}>
              <span>Time of Day</span>
              <span>{(environment.timeOfDay ?? 12).toFixed(1)} h</span>
            </div>
            <input
              className={styles.range}
              type="range"
              min={0}
              max={24}
              step={0.25}
              value={environment.timeOfDay ?? 12}
              onChange={event => {
                const timeOfDay = Number(event.target.value);
                updateEnvironment({ timeOfDay });
              }}
            />
          </div>
        </div>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            setInitialized(false);
            initializeTemplateSimulation(true);
          }}
        >
          Reset Sim State
        </button>
      </aside>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<
  PhysicsDebugPageProps
> = async () => {
  const catalogPath = path.join(
    process.cwd(),
    'data',
    'vessels',
    'catalog.json',
  );
  let templates: DebugTemplate[] = [];
  try {
    const raw = fs.readFileSync(catalogPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      templates = parsed
        .map(item => ({
          id: typeof item?.id === 'string' ? item.id : '',
          name: typeof item?.name === 'string' ? item.name : '',
          shipType:
            item?.shipType === 'CONTAINER' ||
            item?.shipType === 'TANKER' ||
            item?.shipType === 'CARGO'
              ? item.shipType
              : 'DEFAULT',
          description:
            typeof item?.description === 'string'
              ? item.description
              : undefined,
          modelPath:
            typeof item?.modelPath === 'string' ? item.modelPath : null,
          properties: {
            mass: Number(item?.properties?.mass) || 14950000,
            length: Number(item?.properties?.length) || 212,
            beam: Number(item?.properties?.beam) || 28,
            draft: Number(item?.properties?.draft) || 9.1,
            blockCoefficient: Number(item?.properties?.blockCoefficient) || 0.8,
            maxSpeed: Number(item?.properties?.maxSpeed) || 23,
          },
          hydrodynamics:
            item?.hydrodynamics && typeof item.hydrodynamics === 'object'
              ? item.hydrodynamics
              : null,
          physics:
            item?.physics &&
            typeof item.physics === 'object' &&
            typeof item.physics.model === 'string' &&
            typeof item.physics.schemaVersion === 'number'
              ? {
                  model: item.physics.model,
                  schemaVersion: item.physics.schemaVersion,
                  params:
                    item.physics.params &&
                    typeof item.physics.params === 'object'
                      ? item.physics.params
                      : null,
                }
              : undefined,
          render:
            item?.render && typeof item.render === 'object'
              ? item.render
              : null,
          modelYawDeg:
            typeof item?.modelYawDeg === 'number' ? item.modelYawDeg : null,
        }))
        .filter(item => item.id && item.name);
    }
  } catch (error) {
    console.error(
      'Failed to load vessel catalog for physics debug page',
      error,
    );
  }

  if (templates.length === 0) {
    templates = [
      {
        id: 'starter-container',
        name: 'Starter Container Ship',
        shipType: 'CONTAINER',
        properties: {
          mass: 14950000,
          length: 212,
          beam: 28,
          draft: 9.1,
          blockCoefficient: 0.8,
          maxSpeed: 23,
        },
      },
    ];
  }

  return {
    props: { templates },
  };
};

PhysicsDebugPage.fullBleedLayout = true;

export default PhysicsDebugPage;
