// Minimal geo helpers for prototyping lat/lon alongside existing x/y meters.
// Uses an equirectangular approximation around a chosen origin.

export interface LatLon {
  lat: number;
  lon: number;
}

export interface XY {
  x: number;
  y: number;
}

const DEG_TO_RAD = Math.PI / 180;
const METERS_PER_DEG_LAT = 111_320; // approximate at equator
const R = 6371000;
const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;

// Tunable origin and scale; adjust as needed for your world.
let ORIGIN: LatLon = { lat: 0, lon: 0 };

export function setGeoOrigin(origin: LatLon) {
  ORIGIN = origin;
}

function metersPerDegLonAtLat(latDeg: number) {
  return METERS_PER_DEG_LAT * Math.cos(latDeg * DEG_TO_RAD);
}

export function xyToLatLon({ x, y }: XY): LatLon {
  const mPerDegLon = metersPerDegLonAtLat(ORIGIN.lat);
  return {
    lat: ORIGIN.lat + y / METERS_PER_DEG_LAT,
    lon: ORIGIN.lon + x / mPerDegLon,
  };
}

export function latLonToXY({ lat, lon }: LatLon): XY {
  const mPerDegLon = metersPerDegLonAtLat(ORIGIN.lat);
  return {
    x: (lon - ORIGIN.lon) * mPerDegLon,
    y: (lat - ORIGIN.lat) * METERS_PER_DEG_LAT,
  };
}

/**
 * Returns {south, west, north, east} around center.
 * If corner=true, radiusMeters is distance to CORNER; else to EDGE.
 */
export function bboxAroundLatLon(opts: {
  lat: number;
  lon: number;
  radiusMeters: number;
  corner?: boolean;
}) {
  const { lat, lon } = opts;
  const edgeMeters =
    (opts.corner ?? true) ? opts.radiusMeters / Math.SQRT2 : opts.radiusMeters;

  const dLat = rad2deg(edgeMeters / R);
  const cosLat = Math.cos(deg2rad(lat));
  const dLon = rad2deg(edgeMeters / (R * Math.max(1e-6, cosLat)));

  return {
    south: lat - dLat,
    west: lon - dLon,
    north: lat + dLat,
    east: lon + dLon,
  };
}
