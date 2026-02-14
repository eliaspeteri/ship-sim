import React from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as GeoJSON from 'geojson';
import useStore from '../../store';
import { deriveWaveState, getGerstnerSample, WaveState } from '../../lib/waves';
import { latLonToXY } from '../../lib/geo';

export function getSeamarkModelPath(
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
    const category = props?.['seamark:buoy_lateral:category'] as
      | string
      | undefined;
    const colourProp = props?.['seamark:buoy_lateral:colour'] as
      | string
      | undefined;
    const shape = (props?.['seamark:buoy_lateral:shape'] as string) || 'spar';

    let colour = 'red';
    if (colourProp) {
      colour = colourProp;
    } else if (category === 'starboard') {
      colour = 'green';
    }

    const path = `/models/lateral_${shape}_${colour}.glb`;
    const dir = `${category ?? colour}`;
    return { path, dir };
  }

  return null;
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
  const meshRefs = React.useRef<(THREE.Object3D | null)[]>([]);

  useFrame(state => {
    meshRefs.current.forEach((mesh, posIndex) => {
      if (!mesh) return;

      const distance = camera.position.distanceTo(mesh.position);
      const baseScale = 10;
      const scale = Math.max(baseScale, distance / 1000);
      mesh.scale.set(scale, scale, scale);

      if (posIndex >= 0 && posIndex < positions.length) {
        const pos = positions[posIndex];
        const waveSample = getGerstnerSample(
          pos.x,
          pos.y,
          state.clock.elapsedTime,
          waveState,
        );

        mesh.position.y = waveSample.height - 0.05;
        const normal = waveSample.normal;
        mesh.rotation.x = Math.atan2(normal.x, normal.z) * 0.5;
        mesh.rotation.z = Math.atan2(normal.y, normal.z) * 0.5;
      }
    });
  });

  return (
    <>
      {positions.map((pos, index) => (
        <group
          key={index}
          ref={el => (meshRefs.current[index] = el)}
          position={[pos.x, 0, pos.y]}
        >
          <primitive object={gltf.scene.clone()} />
        </group>
      ))}
    </>
  );
}

export function Seamarks() {
  const seamarks = useStore(state => state.seamarks);
  const environment = useStore(state => state.environment);
  const waveState = React.useMemo(
    () => deriveWaveState(environment),
    [environment],
  );

  const models = React.useMemo(() => {
    const modelMap: Record<
      string,
      { path: string; dir: string; positions: { x: number; y: number }[] }
    > = {};

    seamarks.features?.forEach((feature: GeoJSON.Feature) => {
      if (feature.geometry.type !== 'Point') return;

      const props = feature.properties as GeoJSON.Feature['properties'];
      const model = getSeamarkModelPath(props);
      if (!model) return;

      if (!modelMap[model.path]) {
        modelMap[model.path] = {
          path: model.path,
          dir: model.dir,
          positions: [],
        };
      }

      const [lon, lat] = feature.geometry.coordinates as [number, number];
      const { x, y } = latLonToXY({ lat, lon });
      modelMap[model.path].positions.push({ x, y });
    });

    return Object.values(modelMap);
  }, [seamarks.features]);

  return (
    <>
      {models.map((model, index) => (
        <SeamarkGroup
          key={index}
          path={model.path}
          dir={model.dir}
          positions={model.positions}
          waveState={waveState}
        />
      ))}
    </>
  );
}
