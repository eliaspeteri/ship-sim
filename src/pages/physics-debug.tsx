import fs from 'fs';
import path from 'path';

import { Environment, OrbitControls, Sky } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import React, { useRef } from 'react';
import * as THREE from 'three';

import { ControlLever } from '../components/ControlLever';
import { FarWater } from '../components/FarWater';
import { HelmControl } from '../components/HelmControl';
import { OceanPatch } from '../components/OceanPatch';
import Ship from '../components/Ship';
import { TelegraphLever } from '../components/TelegraphLever';
import { DEFAULT_HYDRO, RUDDER_MAX_ANGLE_RAD } from '../constants/vessel';
import {
  RUDDER_STEP,
  THROTTLE_MAX,
  THROTTLE_MIN,
  THROTTLE_STEP,
} from '../features/sim/constants';
import { xyToLatLon, latLonToXY } from '../lib/geo';
import { deriveWaveState } from '../lib/waves';
import {
  initializeSimulation,
  startSimulation,
  getSimulationLoop,
} from '../simulation';
import useStore from '../store';

import type { VesselPhysicsConfig } from '../types/physics.types';
import type { ShipType } from '../types/vessel.types';
import type { GetServerSideProps, NextPage } from 'next';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

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
  physics?: VesselPhysicsConfig;
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

const ui = {
  page: 'fixed inset-0 bg-[#070f18]',
  canvasWrap: 'absolute inset-0',
  panel:
    'absolute bottom-4 left-4 z-10 max-h-[calc(100vh-32px)] w-[min(420px,calc(100vw-32px))] overflow-auto rounded-[10px] border border-[rgba(138,168,203,0.3)] bg-[rgba(9,18,30,0.84)] p-3 text-[#d4e6fb] backdrop-blur-md',
  title: 'mb-2 text-sm uppercase tracking-[0.06em] text-[#8fc5ff]',
  hint: 'mb-2.5 text-xs leading-[1.4] text-[#a7bfd8]',
  status: 'mb-2.5 text-xs',
  statusReady: 'text-[#8ae0b6]',
  statusBusy: 'text-[#ffd58a]',
  label: 'mb-1.5 block text-xs text-[#a7bfd8]',
  select:
    'w-full rounded-lg border border-[rgba(138,168,203,0.45)] bg-[rgba(6,11,19,0.9)] p-2 text-sm text-[#e7f1ff] outline-none focus:border-[#6db4ff]',
  meta: 'mt-2.5 text-xs text-[#bed4ec]',
  controls: 'mt-3 grid gap-2.5',
  controlRow: 'grid gap-1.5',
  controlLabel: 'flex justify-between text-xs text-[#bed4ec]',
  range: 'w-full',
  button:
    'mt-2.5 w-full cursor-pointer rounded-lg border border-[rgba(138,168,203,0.45)] bg-[rgba(12,34,56,0.95)] px-2.5 py-2 text-[13px] text-[#e7f1ff] hover:border-[#6db4ff]',
  monitorSection: 'mt-3',
  sectionTitle: 'mb-2 text-xs uppercase tracking-[0.04em] text-[#8fc5ff]',
  monitorGrid: 'grid grid-cols-2 gap-2',
  monitorCard:
    'rounded-lg border border-[rgba(138,168,203,0.24)] bg-[rgba(6,11,19,0.55)] p-2',
  monitorLabel: 'text-[11px] text-[#9db7d1]',
  monitorValue: 'mt-1 text-[13px] font-semibold text-[#e7f1ff]',
  bridgeSection: 'mt-3.5 border-t border-[rgba(138,168,203,0.2)] pt-2.5',
  widgetWrap:
    'mb-2 rounded-lg border border-[rgba(138,168,203,0.16)] bg-[rgba(6,11,19,0.5)]',
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
  const applyVesselControls = useStore(state => state.applyVesselControls);
  const vessel = useStore(state => state.vessel);
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
  const rudderDeg = React.useMemo(
    () => ((vessel.controls.rudderAngle ?? 0) * 180) / Math.PI,
    [vessel.controls.rudderAngle],
  );
  const headingDeg = React.useMemo(
    () => (((vessel.orientation.heading ?? 0) * 180) / Math.PI + 360) % 360,
    [vessel.orientation.heading],
  );
  const speedMps = Math.hypot(
    vessel.velocity.surge ?? 0,
    vessel.velocity.sway ?? 0,
  );
  const speedKts = speedMps * 1.94384;
  const yawRateDeg = React.useMemo(
    () => ((vessel.angularVelocity.yaw ?? 0) * 180) / Math.PI,
    [vessel.angularVelocity.yaw],
  );
  const telegraphScale = React.useMemo(
    () => [
      { label: 'FULL AST', value: -1, major: true },
      { label: 'HALF AST', value: -0.5 },
      { label: 'STOP', value: 0, major: true },
      { label: 'HALF AHD', value: 0.5 },
      { label: 'FULL AHD', value: 1, major: true },
    ],
    [],
  );

  return (
    <div className={ui.page}>
      <div className={ui.canvasWrap}>
        <PhysicsDebugScene />
      </div>
      <aside className={ui.panel}>
        <h1 className={ui.title}>Physics Debug</h1>
        <p className={ui.hint}>
          Local-only physics harness. Ocean + one vessel, no server sync.
        </p>
        <p
          className={`${ui.status} ${initialized ? ui.statusReady : ui.statusBusy}`}
        >
          {initialized ? 'WASM Running' : 'Initializing WASM...'}
        </p>
        <label htmlFor="template-select" className={ui.label}>
          Vessel template
        </label>
        <select
          id="template-select"
          className={ui.select}
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
        <p className={ui.meta}>
          {selectedTemplate?.shipType || 'DEFAULT'}
          {selectedTemplate?.description
            ? ` - ${selectedTemplate.description}`
            : ''}
        </p>
        <div className={ui.controls}>
          <div className={ui.controlRow}>
            <div className={ui.controlLabel}>
              <span>Wind Speed</span>
              <span>{(environment.wind?.speed ?? 0).toFixed(1)} m/s</span>
            </div>
            <input
              className={ui.range}
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
          <div className={ui.controlRow}>
            <div className={ui.controlLabel}>
              <span>Wind Direction</span>
              <span>{windDirectionDeg.toFixed(0)} deg</span>
            </div>
            <input
              className={ui.range}
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
          <div className={ui.controlRow}>
            <div className={ui.controlLabel}>
              <span>Time of Day</span>
              <span>{(environment.timeOfDay ?? 12).toFixed(1)} h</span>
            </div>
            <input
              className={ui.range}
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
          className={ui.button}
          onClick={() => {
            setInitialized(false);
            initializeTemplateSimulation(true);
          }}
        >
          Reset Sim State
        </button>
        <div className={ui.monitorSection}>
          <div className={ui.sectionTitle}>Monitors</div>
          <div className={ui.monitorGrid}>
            <div className={ui.monitorCard}>
              <div className={ui.monitorLabel}>Speed</div>
              <div className={ui.monitorValue}>{speedKts.toFixed(2)} kts</div>
            </div>
            <div className={ui.monitorCard}>
              <div className={ui.monitorLabel}>Heading</div>
              <div className={ui.monitorValue}>{headingDeg.toFixed(1)} deg</div>
            </div>
            <div className={ui.monitorCard}>
              <div className={ui.monitorLabel}>Rudder</div>
              <div className={ui.monitorValue}>{rudderDeg.toFixed(1)} deg</div>
            </div>
            <div className={ui.monitorCard}>
              <div className={ui.monitorLabel}>Ballast</div>
              <div className={ui.monitorValue}>
                {((vessel.controls.ballast ?? 0.5) * 100).toFixed(0)}%
              </div>
            </div>
            <div className={ui.monitorCard}>
              <div className={ui.monitorLabel}>Roll</div>
              <div className={ui.monitorValue}>
                {(((vessel.orientation.roll ?? 0) * 180) / Math.PI).toFixed(1)}{' '}
                deg
              </div>
            </div>
            <div className={ui.monitorCard}>
              <div className={ui.monitorLabel}>Pitch</div>
              <div className={ui.monitorValue}>
                {(((vessel.orientation.pitch ?? 0) * 180) / Math.PI).toFixed(1)}{' '}
                deg
              </div>
            </div>
            <div className={ui.monitorCard}>
              <div className={ui.monitorLabel}>Yaw Rate</div>
              <div className={ui.monitorValue}>
                {yawRateDeg.toFixed(2)} deg/s
              </div>
            </div>
          </div>
        </div>
        <div className={ui.bridgeSection}>
          <div className={ui.sectionTitle}>Controls</div>
          <div className={ui.widgetWrap}>
            <TelegraphLever
              label="Engine Telegraph"
              value={vessel.controls.throttle ?? 0}
              min={THROTTLE_MIN}
              max={THROTTLE_MAX}
              scale={telegraphScale}
              onChange={value => {
                applyVesselControls({
                  throttle: Math.min(
                    Math.max(value, THROTTLE_MIN),
                    THROTTLE_MAX,
                  ),
                });
              }}
            />
          </div>
          <div className={ui.widgetWrap}>
            <HelmControl
              label="Helm"
              value={rudderDeg}
              minAngle={(-RUDDER_MAX_ANGLE_RAD * 180) / Math.PI}
              maxAngle={(RUDDER_MAX_ANGLE_RAD * 180) / Math.PI}
              onChange={value => {
                const rudderAngle = (value * Math.PI) / 180;
                applyVesselControls({
                  rudderAngle: Math.min(
                    Math.max(rudderAngle, -RUDDER_MAX_ANGLE_RAD),
                    RUDDER_MAX_ANGLE_RAD,
                  ),
                });
              }}
            />
          </div>
          <div className={ui.widgetWrap}>
            <ControlLever
              label="Ballast"
              vertical
              min={0}
              max={1}
              value={vessel.controls.ballast ?? 0.5}
              scale={[
                { label: '0%', value: 0 },
                { label: '50%', value: 0.5 },
                { label: '100%', value: 1 },
              ]}
              onChange={value => {
                applyVesselControls({
                  ballast: Math.min(Math.max(value, 0), 1),
                });
              }}
            />
          </div>
        </div>
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
