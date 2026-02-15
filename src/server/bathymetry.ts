import fs from 'fs/promises';
import path from 'path';

type LonLat = [number, number];
type Ring = LonLat[];

type PolygonRecord = {
  depth: number;
  outer: Ring;
  holes: Ring[];
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

const CELL_SIZE_DEG = 5;
const DEFAULT_OPEN_OCEAN_DEPTH = 3000;

let loaded = false;
let loading: Promise<void> | null = null;
let polygons: PolygonRecord[] = [];
let cellIndex = new Map<string, number[]>();
const depthCache = new Map<string, number>();

const toKey = (lat: number, lon: number) => {
  const latIdx = Math.floor((lat + 90) / CELL_SIZE_DEG);
  const lonIdx = Math.floor((lon + 180) / CELL_SIZE_DEG);
  return `${latIdx}:${lonIdx}`;
};

const pointInRing = (lat: number, lon: number, ring: Ring): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

const pointInPolygon = (lat: number, lon: number, poly: PolygonRecord) => {
  if (
    lat < poly.minLat ||
    lat > poly.maxLat ||
    lon < poly.minLon ||
    lon > poly.maxLon
  ) {
    return false;
  }
  if (!pointInRing(lat, lon, poly.outer)) return false;
  if (poly.holes.length === 0) return true;
  return !poly.holes.some(hole => pointInRing(lat, lon, hole));
};

const addToIndex = (polyIndex: number, poly: PolygonRecord) => {
  const minLatIdx = Math.floor((poly.minLat + 90) / CELL_SIZE_DEG);
  const maxLatIdx = Math.floor((poly.maxLat + 90) / CELL_SIZE_DEG);
  const minLonIdx = Math.floor((poly.minLon + 180) / CELL_SIZE_DEG);
  const maxLonIdx = Math.floor((poly.maxLon + 180) / CELL_SIZE_DEG);

  for (let latIdx = minLatIdx; latIdx <= maxLatIdx; latIdx++) {
    for (let lonIdx = minLonIdx; lonIdx <= maxLonIdx; lonIdx++) {
      const key = `${latIdx}:${lonIdx}`;
      const list = cellIndex.get(key) || [];
      list.push(polyIndex);
      cellIndex.set(key, list);
    }
  }
};

const buildPolygon = (rings: Ring[], depth: number): PolygonRecord | null => {
  if (!rings.length) return null;
  const outer = rings[0];
  if (outer.length < 3) return null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  outer.forEach(([lon, lat]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
  });
  return {
    depth,
    outer,
    holes: rings.slice(1),
    minLat,
    maxLat,
    minLon,
    maxLon,
  };
};

export async function loadBathymetry() {
  if (loaded) return;
  if (loading) return loading;

  loading = (async () => {
    try {
      const filePath = path.resolve(
        process.cwd(),
        'data',
        'bathymetry_simple.geojson',
      );
      const raw = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(raw) as {
        features?: Array<{
          properties?: { depth?: number };
          geometry?: { type?: string; coordinates?: unknown };
        }>;
      };
      const features = data.features || [];
      polygons = [];
      cellIndex = new Map();
      features.forEach(feature => {
        const depth = Number(feature.properties?.depth ?? 0);
        if (!Number.isFinite(depth)) return;
        const geometry = feature.geometry;
        if (!geometry) return;
        if (geometry.type === 'Polygon') {
          const rings = geometry.coordinates as Ring[];
          const poly = buildPolygon(rings, depth);
          if (!poly) return;
          const idx = polygons.push(poly) - 1;
          addToIndex(idx, poly);
        } else if (geometry.type === 'MultiPolygon') {
          const multi = geometry.coordinates as Ring[][];
          multi.forEach(rings => {
            const poly = buildPolygon(rings, depth);
            if (!poly) return;
            const idx = polygons.push(poly) - 1;
            addToIndex(idx, poly);
          });
        }
      });
      loaded = true;
      console.info(
        `Loaded bathymetry polygons: ${polygons.length} (cell size ${CELL_SIZE_DEG}°)`,
      );
    } catch (error) {
      console.warn('Failed to load bathymetry data', error);
      loaded = false;
    } finally {
      loading = null;
    }
  })();

  return loading;
}

export function getBathymetryDepth(
  lat: number | undefined,
  lon: number | undefined,
): number | undefined {
  if (!loaded || lat === undefined || lon === undefined) return undefined;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;

  const cacheKey = `${lat.toFixed(2)}:${lon.toFixed(2)}`;
  const cached = depthCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const cellKey = toKey(lat, lon);
  const candidates = cellIndex.get(cellKey) || [];
  let depth = DEFAULT_OPEN_OCEAN_DEPTH;
  let matched = false;
  for (const idx of candidates) {
    const poly = polygons[idx];
    if (pointInPolygon(lat, lon, poly)) {
      matched = true;
      depth = Math.min(depth, poly.depth);
    }
  }

  const finalDepth = matched ? depth : DEFAULT_OPEN_OCEAN_DEPTH;
  depthCache.set(cacheKey, finalDepth);
  return finalDepth;
}
