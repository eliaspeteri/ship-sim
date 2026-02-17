import { bboxAroundLatLon } from '../../../lib/geo';

import type { EditorWorkArea } from '../types';

export type OverlayTileKey = {
  z: number;
  x: number;
  y: number;
};

export type OverlayTileRequest = {
  packId: string;
  key: OverlayTileKey;
  layers: string[];
  lod: number;
};

export type OverlayChunk = {
  key: OverlayTileKey;
  layerId: string;
  lod: number;
  bytes: ArrayBuffer;
};

export type OverlayVisibilityInput = {
  centerLat: number;
  centerLon: number;
  zoom: number;
  workAreas?: EditorWorkArea[];
  cameraHeight?: number;
  cameraFov?: number;
  cameraAspect?: number;
};

const clampLat = (lat: number) => Math.max(-85, Math.min(85, lat));
const clampZoom = (zoom: number) => Math.max(0, Math.min(22, zoom));

const overlayCache = new Map<
  string,
  { chunk: OverlayChunk; lastUsed: number }
>();
const CACHE_MAX = 200;

const latLonToTile = (lat: number, lon: number, z: number): OverlayTileKey => {
  const safeLat = clampLat(lat);
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (safeLat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return { z, x, y };
};

const tileToLatLon = (x: number, y: number, z: number) => {
  const n = 2 ** z;
  const lon = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lon };
};

const isPointInWorkAreas = (
  lat: number,
  lon: number,
  workAreas: EditorWorkArea[],
) => {
  if (workAreas.length === 0) return true;
  const pointInPolygon = (
    point: [number, number],
    polygon: Array<[number, number]>,
  ) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [latI, lonI] = polygon[i];
      const [latJ, lonJ] = polygon[j];
      const intersects =
        lonI > point[1] !== lonJ > point[1] &&
        point[0] <
          ((latJ - latI) * (point[1] - lonI)) / (lonJ - lonI + 0.000001) + latI;
      if (intersects) inside = !inside;
    }
    return inside;
  };

  return workAreas.some(area => {
    if (area.bounds.type === 'bbox') {
      return (
        lat >= area.bounds.minLat &&
        lat <= area.bounds.maxLat &&
        lon >= area.bounds.minLon &&
        lon <= area.bounds.maxLon
      );
    }
    return pointInPolygon([lat, lon], area.bounds.coordinates);
  });
};

export const getWorkAreaTiles = (
  workAreas: EditorWorkArea[],
): OverlayTileKey[] => {
  const keys = new Map<string, OverlayTileKey>();

  workAreas.forEach(area => {
    const zoom = Math.max(0, area.allowedZoom[0]);
    let centerLat = 0;
    let centerLon = 0;

    if (area.bounds.type === 'bbox') {
      centerLat = (area.bounds.minLat + area.bounds.maxLat) / 2;
      centerLon = (area.bounds.minLon + area.bounds.maxLon) / 2;
    } else {
      const coords = area.bounds.coordinates;
      if (coords.length > 0) {
        const sum = coords.reduce(
          (acc, [lat, lon]) => {
            acc.lat += lat;
            acc.lon += lon;
            return acc;
          },
          { lat: 0, lon: 0 },
        );
        centerLat = sum.lat / coords.length;
        centerLon = sum.lon / coords.length;
      }
    }

    const tile = latLonToTile(centerLat, centerLon, zoom);
    const key = `${tile.z}:${tile.x}:${tile.y}`;
    keys.set(key, tile);
  });

  return Array.from(keys.values());
};

export const getVisibleOverlayTiles = (
  input: OverlayVisibilityInput,
): OverlayTileKey[] => {
  const zoom = Math.floor(clampZoom(input.zoom));
  const cameraHeight = input.cameraHeight ?? 800;
  const cameraFov = input.cameraFov ?? 55;
  const cameraAspect = input.cameraAspect ?? 1.6;
  const halfFovRad = (cameraFov * Math.PI) / 180 / 2;
  const viewRadius = Math.tan(halfFovRad) * cameraHeight;
  const radiusMeters = viewRadius * cameraAspect;

  const bounds = bboxAroundLatLon({
    lat: input.centerLat,
    lon: input.centerLon,
    radiusMeters,
  });
  const nw = latLonToTile(bounds.north, bounds.west, zoom);
  const se = latLonToTile(bounds.south, bounds.east, zoom);

  const tiles: OverlayTileKey[] = [];
  for (let x = Math.min(nw.x, se.x); x <= Math.max(nw.x, se.x); x += 1) {
    for (let y = Math.min(nw.y, se.y); y <= Math.max(nw.y, se.y); y += 1) {
      const center = tileToLatLon(x + 0.5, y + 0.5, zoom);
      if (
        input.workAreas &&
        !isPointInWorkAreas(center.lat, center.lon, input.workAreas)
      ) {
        continue;
      }
      tiles.push({ z: zoom, x, y });
    }
  }

  if (tiles.length > 0) return tiles;
  return [latLonToTile(input.centerLat, input.centerLon, zoom)];
};

export const selectOverlayLod = (zoom: number) => {
  return Math.max(0, Math.floor(clampZoom(zoom)));
};

const overlayKey = (key: OverlayTileKey, layerId: string, lod: number) =>
  `${key.z}/${key.x}/${key.y}:${layerId}:${lod}`;

const evictCacheIfNeeded = () => {
  if (overlayCache.size <= CACHE_MAX) return;
  const entries = Array.from(overlayCache.entries());
  entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);
  const excess = entries.length - CACHE_MAX;
  for (let i = 0; i < excess; i += 1) {
    overlayCache.delete(entries[i][0]);
  }
};

export const clearOverlayCache = () => {
  overlayCache.clear();
};

const decodeBytes = (payload?: string) => {
  if (!payload || typeof globalThis.atob !== 'function') {
    return new ArrayBuffer(0);
  }
  const binary = globalThis.atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const fetchOverlayChunk = async (
  request: OverlayTileRequest,
  layerId: string,
  lod: number,
): Promise<OverlayChunk | null> => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const params = new URLSearchParams({
      packId: request.packId,
      z: request.key.z.toString(),
      x: request.key.x.toString(),
      y: request.key.y.toString(),
      lod: lod.toString(),
      layers: layerId,
    });
    const res = await fetch(`/api/editor/overlay?${params.toString()}`);
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as {
      chunks?: Array<{
        layerId: string;
        lod: number;
        bytesBase64?: string;
      }>;
    };
    const chunks = data.chunks ?? [];
    const matched = chunks.find(chunk => chunk.layerId === layerId);
    return {
      key: request.key,
      layerId,
      lod,
      bytes: decodeBytes(matched?.bytesBase64),
    };
  } catch (error) {
    console.warn('Overlay fetch failed', error);
    return null;
  }
};

export const loadOverlayChunks = async (
  requests: OverlayTileRequest[],
): Promise<OverlayChunk[]> => {
  const results: OverlayChunk[] = [];
  const now = Date.now();

  for (const request of requests) {
    for (const layerId of request.layers) {
      const lod = selectOverlayLod(request.lod);
      const key = overlayKey(request.key, layerId, lod);
      const cached = overlayCache.get(key);
      if (cached) {
        cached.lastUsed = now;
        results.push(cached.chunk);
        continue;
      }

      const fetched = await fetchOverlayChunk(request, layerId, lod);
      if (fetched) {
        overlayCache.set(key, { chunk: fetched, lastUsed: now });
        results.push(fetched);
        continue;
      }

      const chunk = {
        key: request.key,
        layerId,
        lod,
        bytes: new ArrayBuffer(0),
      };
      overlayCache.set(key, { chunk, lastUsed: now });
      results.push(chunk);
    }
  }

  evictCacheIfNeeded();
  return results;
};
