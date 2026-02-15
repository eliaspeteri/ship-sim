import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useThree } from '@react-three/fiber';
import type * as THREE from 'three';

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

function zoomFromCameraDistance(distance: number) {
  if (distance < 250) return 13;
  if (distance < 500) return 12;
  if (distance < 1000) return 11;
  if (distance < 2500) return 10;
  if (distance < 5000) return 9;
  return 8;
}

export function LandTiles(props: {
  focusRef: React.MutableRefObject<{ x: number; y: number }>;
  radius?: number; // 2 => 5x5
  dynamicRadius?: boolean;
  maxRadius?: number;
  landY?: number;
  heightScale?: number;
  seaLevel?: number;
  useTerrain?: boolean;
  flipX?: boolean;
}) {
  const {
    focusRef,
    radius = 2,
    dynamicRadius = false,
    maxRadius,
    landY = 0.75,
    heightScale = 1,
    seaLevel = 0,
    useTerrain = true,
    flipX = false,
  } = props;
  const { camera } = useThree();
  const maxCacheSize = 128;

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

  // Compute wanted tile set based on focusRef (meters) and camera distance
  const wanted = useMemo(() => {
    const dx = camera.position.x - focusRef.current.x;
    const dy = camera.position.y;
    const dz = camera.position.z - focusRef.current.y;
    const distance = Math.hypot(dx, dy, dz);
    const z = zoomFromCameraDistance(distance);
    const radiusCap = Math.max(radius, maxRadius ?? radius);
    const radiusForTiles = dynamicRadius
      ? Math.min(radiusCap, Math.max(radius, Math.ceil(distance / 4000)))
      : radius;

    const focusXY = { x: focusRef.current.x, y: focusRef.current.y };
    const { lat, lon } = xyToLatLon(focusXY);

    const { x: cx, y: cy } = lonLatToTileXY(lon, lat, z);

    const keys: string[] = [];
    for (let dx = -radiusForTiles; dx <= radiusForTiles; dx++) {
      for (let dy = -radiusForTiles; dy <= radiusForTiles; dy++) {
        keys.push(`${z}/${cx + dx}/${cy + dy}`);
      }
    }

    return { z, cx, cy, keys };
    // queryTick forces recalculation at a controlled cadence
  }, [camera, dynamicRadius, focusRef, maxRadius, queryTick, radius]);

  // Throttle updates: only bump queryTick when the (z,cx,cy) changes
  useEffect(() => {
    const dx = camera.position.x - focusRef.current.x;
    const dy = camera.position.y;
    const dz = camera.position.z - focusRef.current.y;
    const distance = Math.hypot(dx, dy, dz);
    const z = zoomFromCameraDistance(distance);
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
      const dx2 = camera.position.x - focusRef.current.x;
      const dy2 = camera.position.y;
      const dz2 = camera.position.z - focusRef.current.y;
      const distance2 = Math.hypot(dx2, dy2, dz2);
      const z2 = zoomFromCameraDistance(distance2);
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

  const touchCache = useCallback((key: string) => {
    const mesh = cacheRef.current.get(key);
    if (!mesh) return;
    cacheRef.current.delete(key);
    cacheRef.current.set(key, mesh);
  }, []);

  const evictOverflow = useCallback(
    (wantedSet: Set<string>) => {
      const cache = cacheRef.current;
      if (cache.size <= maxCacheSize) return;

      const disposeMesh = (mesh: THREE.Mesh) => {
        mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material;
        if (mat?.dispose) mat.dispose();
      };

      const keys = Array.from(cache.keys());
      for (const key of keys) {
        if (cache.size <= maxCacheSize) break;
        if (wantedSet.has(key)) continue;
        const mesh = cache.get(key);
        if (mesh) disposeMesh(mesh);
        cache.delete(key);
      }

      if (cache.size <= maxCacheSize) return;
      const remainingKeys = Array.from(cache.keys());
      for (const key of remainingKeys) {
        if (cache.size <= maxCacheSize) break;
        const mesh = cache.get(key);
        if (mesh) disposeMesh(mesh);
        cache.delete(key);
      }
    },
    [maxCacheSize],
  );

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

    // Kick off loads for missing tiles
    (async () => {
      await Promise.all(wantKeys.map(k => ensureLoaded(k)));
      if (cancelled) return;

      // IMPORTANT: only render keys that actually exist in cache
      const present = wantKeys.filter(k => cacheRef.current.has(k));
      present.forEach(k => touchCache(k));
      evictOverflow(wantSet);
      setRenderKeys(present);
    })();

    return () => {
      cancelled = true;
    };
  }, [wanted, ensureLoaded, evictOverflow, touchCache]);

  return (
    <group scale={flipX ? [-1, 1, 1] : [1, 1, 1]}>
      {renderKeys.map(k => {
        const mesh = cacheRef.current.get(k);
        if (!mesh) return null; // <-- prevents “primitive without object”
        return <primitive key={k} object={mesh} />;
      })}
    </group>
  );
}
