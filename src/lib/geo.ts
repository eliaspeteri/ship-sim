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

// Tunable origin and scale; adjust as needed for your world.
const ORIGIN: LatLon = { lat: 0, lon: 0 };
const METERS_PER_DEG_LAT = 111_320; // approximate at equator
const METERS_PER_DEG_LON_AT_ORIGIN =
  METERS_PER_DEG_LAT * Math.cos(ORIGIN.lat * DEG_TO_RAD);

export function xyToLatLon({ x, y }: XY): LatLon {
  return {
    lat: ORIGIN.lat + y / METERS_PER_DEG_LAT,
    lon: ORIGIN.lon + x / METERS_PER_DEG_LON_AT_ORIGIN,
  };
}

export function latLonToXY({ lat, lon }: LatLon): XY {
  return {
    x: (lon - ORIGIN.lon) * METERS_PER_DEG_LON_AT_ORIGIN,
    y: (lat - ORIGIN.lat) * METERS_PER_DEG_LAT,
  };
}
