import fs from 'fs/promises';
import path from 'path';

type LonLat = [number, number];

export type SeamarkFeature = {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: LonLat };
  properties: Record<string, unknown>;
};

type FeatureCollection = {
  type: 'FeatureCollection';
  features: SeamarkFeature[];
};

type SeamarkPoint = {
  lon: number;
  lat: number;
  properties: Record<string, unknown>;
};

const CELL_SIZE_DEG = 0.25; // tune: 0.1 smaller cells = more index keys, faster queries
let loaded = false;
let loading: Promise<void> | null = null;

let points: SeamarkPoint[] = [];
let cellIndex = new Map<string, number[]>();

const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;
const R = 6371000;

function destination(
  lat: number,
  lon: number,
  bearingDeg: number,
  distanceM: number,
) {
  const brng = deg2rad(bearingDeg);
  const φ1 = deg2rad(lat);
  const λ1 = deg2rad(lon);
  const δ = distanceM / R;

  const sinφ1 = Math.sin(φ1),
    cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ),
    cosδ = Math.cos(δ);

  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(brng);
  const φ2 = Math.asin(sinφ2);

  const y = Math.sin(brng) * sinδ * cosφ1;
  const x = cosδ - sinφ1 * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  let lon2 = rad2deg(λ2);
  lon2 = ((lon2 + 540) % 360) - 180; // normalize to [-180,180)
  return { lat: rad2deg(φ2), lon: lon2 };
}

export function bboxAroundLatLonGeodesic(opts: {
  lat: number;
  lon: number;
  radiusMeters: number;
  corner?: boolean;
}) {
  const corner = opts.corner ?? true;
  const edgeMeters = corner
    ? opts.radiusMeters / Math.SQRT2
    : opts.radiusMeters;

  const n = destination(opts.lat, opts.lon, 0, edgeMeters);
  const s = destination(opts.lat, opts.lon, 180, edgeMeters);
  const e = destination(opts.lat, opts.lon, 90, edgeMeters);
  const w = destination(opts.lat, opts.lon, 270, edgeMeters);

  return { south: s.lat, west: w.lon, north: n.lat, east: e.lon };
}

const toKey = (lat: number, lon: number) => {
  const latIdx = Math.floor((lat + 90) / CELL_SIZE_DEG);
  const lonIdx = Math.floor((lon + 180) / CELL_SIZE_DEG);
  return `${latIdx}:${lonIdx}`;
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

const normalizeLon = (lon: number) => {
  // Keep lon in [-180, 180)
  let x = lon % 360;
  if (x >= 180) x -= 360;
  if (x < -180) x += 360;
  return x;
};

const addToIndex = (idx: number, lat: number, lon: number) => {
  const key = toKey(lat, lon);
  const list = cellIndex.get(key) || [];
  list.push(idx);
  cellIndex.set(key, list);
};

export async function loadSeamarks() {
  if (loaded) return;
  if (loading) return loading;

  loading = (async () => {
    try {
      const filePath = path.resolve(process.cwd(), 'data', 'seamarks.geojson');
      const raw = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(raw) as FeatureCollection;

      points = [];
      cellIndex = new Map();

      for (const f of data.features || []) {
        if (!f?.geometry || f.geometry.type !== 'Point') continue;
        const [lonRaw, latRaw] = f.geometry.coordinates || [];
        const lat = Number(latRaw);
        const lon = normalizeLon(Number(lonRaw));
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        if (lat < -90 || lat > 90) continue;

        // Optional: keep only buoy/beacon/light nodes if your geojson contains more
        const t = String(f.properties?.['seamark:type'] || '');
        if (!/^(buoy|beacon|light)_/.test(t)) continue;

        const rec: SeamarkPoint = { lat, lon, properties: f.properties || {} };
        const idx = points.push(rec) - 1;
        addToIndex(idx, lat, lon);
      }

      loaded = true;
      console.info(
        `Loaded seamarks points: ${points.length} (cell size ${CELL_SIZE_DEG}°)`,
      );
    } catch (err) {
      console.warn('Failed to load seamarks geojson', err);
      loaded = false;
    } finally {
      loading = null;
    }
  })();

  return loading;
}

export function querySeamarksBBox(opts: {
  south: number;
  west: number;
  north: number;
  east: number;
  limit?: number;
}): SeamarkFeature[] {
  if (!loaded) return [];
  const south = clamp(opts.south, -90, 90);
  const north = clamp(opts.north, -90, 90);
  const west = normalizeLon(opts.west);
  const east = normalizeLon(opts.east);
  const limit = Math.max(1, Math.min(opts.limit ?? 5000, 50_000));

  // Handle dateline crossing (west > east) by splitting into 2 ranges.
  const ranges: Array<{ w: number; e: number }> =
    west <= east
      ? [{ w: west, e: east }]
      : [
          { w: west, e: 180 },
          { w: -180, e: east },
        ];

  const results: SeamarkFeature[] = [];
  const seen = new Set<string>();

  // Compute cell ranges
  const latMinIdx = Math.floor((south + 90) / CELL_SIZE_DEG);
  const latMaxIdx = Math.floor((north + 90) / CELL_SIZE_DEG);

  for (const r of ranges) {
    const lonMinIdx = Math.floor((r.w + 180) / CELL_SIZE_DEG);
    const lonMaxIdx = Math.floor((r.e + 180) / CELL_SIZE_DEG);

    for (let latIdx = latMinIdx; latIdx <= latMaxIdx; latIdx++) {
      for (let lonIdx = lonMinIdx; lonIdx <= lonMaxIdx; lonIdx++) {
        const key = `${latIdx}:${lonIdx}`;
        const candidates = cellIndex.get(key);
        if (!candidates) continue;

        for (const idx of candidates) {
          const p = points[idx];
          if (!p) continue;
          if (p.lat < south || p.lat > north) continue;
          if (p.lon < r.w || p.lon > r.e) continue;

          const osmId = p.properties?.['osm_id'];
          const dedupeKey = osmId ? `n:${String(osmId)}` : `${p.lat}:${p.lon}`;
          if (seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);

          results.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
            properties: p.properties,
          });

          if (results.length >= limit) return results;
        }
      }
    }
  }

  return results;
}
