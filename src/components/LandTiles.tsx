import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { xyToLatLon } from '../lib/geo'; // adjust alias if needed
import { fetchLandTileMesh } from '../lib/tiles/mvtLandMesh';

function lonLatToTileXY(lon: number, lat: number, z: number) {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return { x, y };
}

function zoomFromCameraY(camY: number) {
  if (camY < 150) return 13;
  if (camY < 300) return 12;
  if (camY < 700) return 11;
  if (camY < 1500) return 10;
  if (camY < 3500) return 9;
  return 8;
}

export function LandTiles(props: {
  focusRef: React.MutableRefObject<{ x: number; y: number }>;
  radius?: number; // 2 => 5x5
  landY?: number;
  heightScale?: number;
  seaLevel?: number;
  useTerrain?: boolean;
}) {
  const {
    focusRef,
    radius = 2,
    landY = 0.75,
    heightScale = 1,
    seaLevel = 0,
    useTerrain = true,
  } = props;
  const { camera } = useThree();

  // Cache of loaded meshes (key -> mesh)
  const cacheRef = useRef<Map<string, THREE.Mesh>>(new Map());
  // Track in-flight loads to avoid duplicate fetches
  const inFlightRef = useRef<Map<string, Promise<THREE.Mesh | null>>>(
    new Map(),
  );

  // What we actually render (keys). We will always filter by cache presence.
  const [renderKeys, setRenderKeys] = useState<string[]>([]);

  // “Query key” changes when camera target tile/zoom changes.
  // Using a small tick prevents effects from firing on every tiny camera move.
  const [queryTick, setQueryTick] = useState(0);
  const lastQueryKeyRef = useRef<string>('');

  // Compute wanted tile set based on focusRef (meters) and camera height
  const wanted = useMemo(() => {
    const z = zoomFromCameraY(camera.position.y);

    const focusXY = { x: focusRef.current.x, y: focusRef.current.y };
    const { lat, lon } = xyToLatLon(focusXY);

    const { x: cx, y: cy } = lonLatToTileXY(lon, lat, z);

    const keys: string[] = [];
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        keys.push(`${z}/${cx + dx}/${cy + dy}`);
      }
    }

    return { z, cx, cy, keys };
    // queryTick forces recalculation at a controlled cadence
  }, [camera.position.y, focusRef, radius, queryTick]);

  // Throttle updates: only bump queryTick when the (z,cx,cy) changes
  useEffect(() => {
    const z = zoomFromCameraY(camera.position.y);
    const { lat, lon } = xyToLatLon({
      x: focusRef.current.x,
      y: focusRef.current.y,
    });
    const { x: cx, y: cy } = lonLatToTileXY(lon, lat, z);
    const qk = `${z}/${cx}/${cy}`;

    if (qk !== lastQueryKeyRef.current) {
      lastQueryKeyRef.current = qk;
      setQueryTick(t => t + 1);
    }
    // Run this on a small interval rather than per-frame
    const id = window.setInterval(() => {
      const z2 = zoomFromCameraY(camera.position.y);
      const ll = xyToLatLon({ x: focusRef.current.x, y: focusRef.current.y });
      const txy = lonLatToTileXY(ll.lon, ll.lat, z2);
      const qk2 = `${z2}/${txy.x}/${txy.y}`;
      if (qk2 !== lastQueryKeyRef.current) {
        lastQueryKeyRef.current = qk2;
        setQueryTick(t => t + 1);
      }
    }, 250);

    return () => window.clearInterval(id);
  }, [camera, focusRef]);

  const evictNotWanted = useCallback((wantedSet: Set<string>) => {
    for (const [key, mesh] of cacheRef.current.entries()) {
      if (!wantedSet.has(key)) {
        // Dispose and remove
        mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material;
        if (mat?.dispose) mat.dispose();
        cacheRef.current.delete(key);
      }
    }
  }, []);

  const ensureLoaded = useCallback(
    async (key: string) => {
      if (cacheRef.current.has(key)) return;
      if (inFlightRef.current.has(key)) return;

      const [zStr, xStr, yStr] = key.split('/');
      const z = Number(zStr);
      const x = Number(xStr);
      const y = Number(yStr);

      const p = fetchLandTileMesh({
        z,
        x,
        y,
        landY,
        heightScale,
        seaLevel,
        useTerrain,
      });
      inFlightRef.current.set(key, p);

      try {
        const mesh = await p;
        if (mesh) cacheRef.current.set(key, mesh);
      } finally {
        inFlightRef.current.delete(key);
      }
    },
    [heightScale, landY, seaLevel, useTerrain],
  );

  useEffect(() => {
    let cancelled = false;

    const wantKeys = wanted.keys;
    const wantSet = new Set(wantKeys);

    // Evict anything not in current window
    evictNotWanted(wantSet);

    // Kick off loads for missing tiles
    (async () => {
      await Promise.all(wantKeys.map(k => ensureLoaded(k)));
      if (cancelled) return;

      // IMPORTANT: only render keys that actually exist in cache
      const present = wantKeys.filter(k => cacheRef.current.has(k));
      setRenderKeys(present);
    })();

    return () => {
      cancelled = true;
    };
  }, [wanted, ensureLoaded, evictNotWanted]);

  return (
    <group>
      {renderKeys.map(k => {
        const mesh = cacheRef.current.get(k);
        if (!mesh) return null; // <-- prevents “primitive without object”
        return <primitive key={k} object={mesh} />;
      })}
    </group>
  );
}
