'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import useStore from '../store';
import Ship from './Ship';
import { socketManager } from '../networking/socket';
import { deriveWaveState } from '../lib/waves';
import { OceanPatch } from './OceanPatch';
import { FarWater } from './FarWater';
import SeamarkSprites from './SeamarkSprites';
import { LandTiles } from './LandTiles';
import CameraHeadingIndicator from './CameraHeadingIndicator';
import { WaveClock } from './scene/WaveClock';
import { SpectatorController } from './scene/SpectatorController';
import {
  LightingController,
  useLightingConfig,
} from './scene/LightingController';
import { RendererPerfMonitor } from './scene/RendererPerfMonitor';
import { ReplayGhost } from './scene/ReplayGhost';
import { AdminDragLayer } from './scene/AdminDragLayer';
import { Seamarks } from './scene/Seamarks';
import { CameraHeadingTracker } from './scene/CameraHeadingTracker';
import { GeoDebugMarkers } from './scene/GeoDebugMarkers';
import { AdminVesselOverlay } from './scene/AdminVesselOverlay';
import {
  deriveSceneDragTargets,
  selectInSpaceVessels,
  selectSceneVesselSnapshot,
} from '../features/sim/selectors/vesselSelectors';

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
  const [selectedVesselId, setSelectedVesselId] = React.useState<string | null>(
    null,
  );
  const [isDragging, setIsDragging] = React.useState(false);
  const [cameraHeadingDeg, setCameraHeadingDeg] = React.useState(0);
  const [hudOffset, setHudOffset] = React.useState(0);
  const [dragPreviewPositions, setDragPreviewPositions] = React.useState<
    Record<string, { x: number; y: number }>
  >({});

  const directionalLightRef = React.useRef<THREE.DirectionalLight | null>(null);
  const perfLoggingEnabled =
    process.env.NEXT_PUBLIC_RENDERER_PERF_LOGS === 'true' ||
    process.env.NODE_ENV !== 'production';
  const debugGeo =
    process.env.NEXT_PUBLIC_DEBUG_GEO_HELPERS === 'true' &&
    process.env.NODE_ENV !== 'production';

  const focusRef = React.useRef<{ x: number; y: number }>({
    x: vesselPosition.x,
    y: vesselPosition.y,
  });
  const orbitRef = React.useRef<OrbitControlsImpl | null>(null);
  const waveTimeRef = React.useRef(0);
  const spectatorStartRef = React.useRef<{ x: number; y: number }>({
    x: vesselPosition.x,
    y: vesselPosition.y,
  });

  const handleSelectVessel = React.useCallback(
    (id: string) => {
      if (!isSpectator || isDragging) return;
      setSelectedVesselId(prev => (prev === id ? null : id));
    },
    [isDragging, isSpectator],
  );

  const inSpaceVessels = React.useMemo(
    () =>
      selectInSpaceVessels({
        otherVessels,
        excludeVesselId: currentVesselId,
      }),
    [currentVesselId, otherVessels],
  );

  const selectedSnapshot = React.useMemo(() => {
    return selectSceneVesselSnapshot({
      selectedVesselId,
      currentVesselId,
      vessel: vesselState,
      otherVessels,
    });
  }, [currentVesselId, otherVessels, selectedVesselId, vesselState]);

  React.useEffect(() => {
    if (selectedVesselId && !selectedSnapshot) {
      setSelectedVesselId(null);
    }
  }, [selectedSnapshot, selectedVesselId]);

  const lighting = useLightingConfig(envTime);

  const shouldRenderSelf = !isSpectator && !!currentVesselId;
  const shouldRenderSpectatorSelf =
    isSpectator && !!currentVesselId && !(currentVesselId in otherVessels);

  const waveState = React.useMemo(
    () => deriveWaveState(environment),
    [environment],
  );

  const dragTargets = React.useMemo(() => {
    return deriveSceneDragTargets({
      isAdmin,
      isSpectator,
      currentVesselId,
      vesselPosition: { x: vesselPosition.x, y: vesselPosition.y },
      vessels: inSpaceVessels,
    });
  }, [
    currentVesselId,
    inSpaceVessels,
    isAdmin,
    isSpectator,
    vesselPosition.x,
    vesselPosition.y,
  ]);

  const handleAdminMove = React.useCallback(
    (id: string, x: number, y: number) => {
      socketManager.sendAdminVesselMove(id, { x, y });
    },
    [],
  );

  const handleDragPreview = React.useCallback(
    (id: string, x: number, y: number) => {
      setDragPreviewPositions(prev => {
        const existing = prev[id];
        if (existing && Math.hypot(existing.x - x, existing.y - y) < 0.2) {
          return prev;
        }
        return { ...prev, [id]: { x, y } };
      });
    },
    [],
  );

  const handleDragPreviewEnd = React.useCallback((id: string) => {
    setDragPreviewPositions(prev => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleDragStateChange = React.useCallback((dragging: boolean) => {
    setIsDragging(dragging);
    if (orbitRef.current) {
      orbitRef.current.enabled = !dragging;
    }
  }, []);

  React.useEffect(() => {
    if (!isSpectator) {
      focusRef.current = { x: vesselPosition.x, y: vesselPosition.y };
    }
  }, [isSpectator, vesselPosition.x, vesselPosition.y]);

  React.useEffect(() => {
    if (mode === 'spectator') {
      spectatorStartRef.current = { ...focusRef.current };
    }
  }, [mode]);

  React.useEffect(() => {
    if (!isSpectator) return;

    const hudFooter = document.querySelector('[data-hud-footer]');
    if (!hudFooter) return;

    const updateOffset = () => {
      const rect = hudFooter.getBoundingClientRect();
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
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.5,
        }}
      >
        <color attach="background" args={['#091623']} />
        <WaveClock timeRef={waveTimeRef} />
        <LightingController
          directionalLightRef={directionalLightRef}
          focusRef={focusRef}
          lighting={lighting}
        />
        <RendererPerfMonitor enabled={perfLoggingEnabled} />

        <fog attach="fog" args={['#091623', 6000, 40000]} />
        {!isSpectator ? (
          <FarWater centerRef={focusRef} sunDirection={lighting.sunDirection} />
        ) : null}

        <OceanPatch
          centerRef={focusRef}
          size={12000}
          segments={512}
          wave={waveState}
          timeRef={waveTimeRef}
          sunDirection={lighting.sunDirection}
          yOffset={OCEAN_EPSILON_Y}
        />

        <LandTiles
          focusRef={focusRef}
          radius={2}
          landY={LAND_EPSILON_Y}
          heightScale={TERRAIN_HEIGHT_SCALE}
          seaLevel={TERRAIN_SEA_LEVEL}
          useTerrain={TERRAIN_ENABLED}
          flipX
        />

        {shouldRenderSelf ? (
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
            roll={vesselOrientation.roll}
            pitch={vesselOrientation.pitch}
            wave={waveState}
            waveTimeRef={waveTimeRef}
            onSelect={isSpectator ? handleSelectVessel : undefined}
          />
        ) : null}

        {shouldRenderSpectatorSelf ? (
          <Ship
            vesselId={currentVesselId || undefined}
            position={{
              x:
                dragPreviewPositions[currentVesselId || '']?.x ??
                vesselState.position.x ??
                0,
              y: vesselState.position.z ?? 0,
              z:
                dragPreviewPositions[currentVesselId || '']?.y ??
                vesselState.position.y ??
                0,
            }}
            heading={vesselState.orientation.heading}
            shipType={vesselProperties.type}
            modelPath={vesselProperties.modelPath}
            renderOptions={vesselState.render}
            ballast={vesselControls.ballast}
            draft={vesselProperties.draft}
            length={vesselProperties.length}
            roll={vesselOrientation.roll}
            pitch={vesselOrientation.pitch}
            wave={waveState}
            waveTimeRef={waveTimeRef}
            onSelect={handleSelectVessel}
          />
        ) : null}

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

        {inSpaceVessels.map(({ id, vessel }) => (
          <Ship
            key={id}
            vesselId={id}
            position={{
              x: dragPreviewPositions[id]?.x ?? vessel.position.x ?? 0,
              y: vessel.position.z ?? 0,
              z: dragPreviewPositions[id]?.y ?? vessel.position.y ?? 0,
            }}
            heading={vessel.orientation.heading}
            shipType={vessel.properties?.type ?? vesselProperties.type}
            modelPath={vessel.properties?.modelPath ?? null}
            renderOptions={vessel.render}
            ballast={vessel.controls?.ballast ?? 0.5}
            draft={vessel.properties?.draft ?? vesselProperties.draft}
            length={vessel.properties?.length ?? vesselProperties.length}
            roll={vessel.orientation.roll}
            pitch={vessel.orientation.pitch}
            wave={waveState}
            waveTimeRef={waveTimeRef}
            applyWaveHeave={vessel.mode !== 'ai'}
            horizonOcclusion={{ enabled: true }}
            showDebugMarkers={isSpectator && selectedVesselId === id}
            onSelect={isSpectator ? handleSelectVessel : undefined}
          />
        ))}

        <AdminVesselOverlay
          isSpectator={isSpectator}
          isAdmin={isAdmin}
          selectedVesselId={selectedVesselId}
          selectedSnapshot={selectedSnapshot}
          currentVesselId={currentVesselId}
          crewCount={crewIds.length}
          focusRef={focusRef}
          onDeselect={() => setSelectedVesselId(null)}
        />

        <AdminDragLayer
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

        <GeoDebugMarkers enabled={debugGeo} focusRef={focusRef} />

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
